import {
  CommandContext,
  CommandResult,
  CommandOutputLine,
  AutocompleteItem,
  SystemCommandDefinition
} from './types';
import { commandRegistry } from './CommandRegistry';
import { commandParser } from './CommandParser';
import { initializeSystemCommands } from './commands';
import { systemCommandLogger } from './SystemCommandLogger';
import { AppEventBus } from '../eventBus';
import { dbService } from '../../db';

export class SystemCommandEngine {
  private static instance: SystemCommandEngine;
  private isInitialized = false;
  private resultCache: Map<string, { timestamp: number; result: CommandResult }> = new Map();
  private cacheTtlMs = 1500; // 1.5s cache TTL for read status commands

  private constructor() {
    this.init();
  }

  public static getInstance(): SystemCommandEngine {
    if (!SystemCommandEngine.instance) {
      SystemCommandEngine.instance = new SystemCommandEngine();
    }
    return SystemCommandEngine.instance;
  }

  private init(): void {
    if (this.isInitialized) return;
    initializeSystemCommands();
    this.isInitialized = true;
  }

  /**
   * Main entry point to execute an administrative system command
   */
  public async executeCommand(
    rawCommand: string,
    context: CommandContext = {}
  ): Promise<CommandResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    const trimmed = rawCommand.trim();

    if (!trimmed) {
      const res: CommandResult = {
        command: '',
        timestamp,
        outputLines: [{ text: 'No command specified.', type: 'warning' }],
        executionMs: 0,
        success: false
      };
      systemCommandLogger.logExecution(res, context);
      return res;
    }

    // Special Handling for "help" or "?"
    const lower = trimmed.toLowerCase();
    if (lower === 'help' || lower === '?') {
      const helpLines = this.generateHelpDirectory(context.userRole);
      const executionMs = Math.round(performance.now() - startTime);
      const res: CommandResult = {
        command: trimmed,
        timestamp,
        outputLines: helpLines,
        executionMs,
        success: true
      };
      systemCommandLogger.logExecution(res, context);
      return res;
    }

    // Special Handling for "clear" or "cls"
    if (lower === 'clear' || lower === 'cls') {
      const res: CommandResult = {
        command: trimmed,
        timestamp,
        outputLines: [{ text: '[Terminal scrollback buffer cleared]', type: 'system' }],
        executionMs: 0,
        success: true,
        metadata: { action: 'clear' }
      };
      systemCommandLogger.logExecution(res, context);
      return res;
    }

    // Parse input string
    const parsed = commandParser.parse(trimmed);

    if (parsed.isExactMatch && parsed.matchedCommand) {
      const cmd = parsed.matchedCommand;

      // 1. Role-based Permission Check
      if (!commandRegistry.hasPermission(context.userRole, cmd.requiredRole)) {
        const executionMs = Math.round(performance.now() - startTime);
        const userRole = context.userRole || 'Administrator';
        const outputLines: CommandOutputLine[] = [
          {
            text: `[SECURITY] Access Denied: Command '${cmd.group} ${cmd.action}' requires '${cmd.requiredRole.toUpperCase()}' privilege.`,
            type: 'error'
          },
          {
            text: `• Your Current Role: ${userRole.toUpperCase()}`,
            type: 'warning'
          },
          {
            text: `• Action Required: Contact system administrator to upgrade permissions.`,
            type: 'info'
          }
        ];

        dbService.addLog(
          'error',
          'SECURITY',
          `Unauthorized system command attempt '${trimmed}' by user role '${userRole}'`
        );

        const res: CommandResult = {
          command: trimmed,
          group: cmd.group,
          action: cmd.action,
          timestamp,
          outputLines,
          executionMs,
          success: false,
          error: 'ACCESS_DENIED'
        };
        systemCommandLogger.logExecution(res, context);
        return res;
      }

      // 2. Command Execution & Read Cache Check
      const isReadOnlyAction = ['status', 'health', 'info', 'version', 'list', 'providers', 'memory', 'listeners', 'inspect-bus', 'audit'].includes(cmd.action.toLowerCase());
      const cacheKey = `${cmd.group}:${cmd.action}:${parsed.args.join(',')}:${context.userRole || 'Administrator'}`;
      const now = Date.now();

      if (isReadOnlyAction && this.resultCache.has(cacheKey)) {
        const cached = this.resultCache.get(cacheKey)!;
        if (now - cached.timestamp < this.cacheTtlMs) {
          const cachedResult: CommandResult = {
            ...cached.result,
            timestamp,
            executionMs: 0,
            metadata: { ...cached.result.metadata, cached: true }
          };
          systemCommandLogger.logExecution(cachedResult, context);
          return cachedResult;
        }
      }

      try {
        const outputLines = await cmd.execute(parsed.args, context);
        const executionMs = Math.round(performance.now() - startTime);

        // Attach execution duration to last line if appropriate
        if (outputLines.length > 0 && outputLines[outputLines.length - 1].durationMs === undefined) {
          outputLines[outputLines.length - 1].durationMs = executionMs;
        }

        // Publish event to AppEventBus
        try {
          AppEventBus.getInstance().publish(
            'SYSTEM_COMMAND_EXECUTED',
            {
              command: trimmed,
              group: cmd.group,
              action: cmd.action,
              userRole: context.userRole || 'Administrator',
              durationMs: executionMs,
              success: true
            },
            'NORMAL',
            'SystemCommandEngine'
          );
        } catch {
          // Event dispatch non-blocking
        }

        // Audit log in database
        dbService.addLog(
          'info',
          'SYSTEM_ENGINE',
          `Executed system command '${cmd.group} ${cmd.action}' (${executionMs}ms)`
        );

        const res: CommandResult = {
          command: trimmed,
          group: cmd.group,
          action: cmd.action,
          timestamp,
          outputLines,
          executionMs,
          success: true,
          metadata: {
            requiredRole: cmd.requiredRole,
            category: cmd.category
          }
        };

        if (isReadOnlyAction) {
          this.resultCache.set(cacheKey, { timestamp: now, result: res });
        } else {
          // Mutative command executed: clear read caches
          this.resultCache.clear();
        }

        systemCommandLogger.logExecution(res, context);
        return res;
      } catch (err: any) {
        const executionMs = Math.round(performance.now() - startTime);
        const outputLines: CommandOutputLine[] = [
          { text: `[COMMAND EXECUTION ERROR] Failed to execute '${trimmed}'`, type: 'error' },
          { text: `• Cause: ${err.message || String(err)}`, type: 'error' }
        ];

        const res: CommandResult = {
          command: trimmed,
          group: cmd.group,
          action: cmd.action,
          timestamp,
          outputLines,
          executionMs,
          success: false,
          error: err.message
        };
        systemCommandLogger.logExecution(res, context);
        return res;
      }
    }

    // 3. Command Unrecognized -> Intelligent Suggestions via Fuzzy Matching
    const executionMs = Math.round(performance.now() - startTime);
    const outputLines: CommandOutputLine[] = [
      {
        text: `Command not recognized: "${trimmed}".`,
        type: 'error'
      }
    ];

    if (parsed.fuzzySuggestions && parsed.fuzzySuggestions.length > 0) {
      outputLines.push({
        text: `Did you mean one of these system commands?`,
        type: 'warning'
      });

      parsed.fuzzySuggestions.forEach((sugg) => {
        outputLines.push({
          text: `  ▪ ${sugg.command.padEnd(24)} - ${sugg.description} (${sugg.score}% match)`,
          type: 'info'
        });
      });
    }

    outputLines.push({
      text: `Type 'help' or '?' to view the complete system command directory.`,
      type: 'system'
    });

    const res: CommandResult = {
      command: trimmed,
      timestamp,
      outputLines,
      executionMs,
      success: false,
      error: 'UNKNOWN_COMMAND',
      metadata: { suggestions: parsed.fuzzySuggestions }
    };
    systemCommandLogger.logExecution(res, context);
    return res;
  }

  /**
   * Get dynamic autocomplete suggestions for UI terminal
   */
  public getAutocompleteSuggestions(partial: string, userRole?: string): AutocompleteItem[] {
    return commandRegistry.getAutocomplete(partial, userRole);
  }

  /**
   * Perform batch update or registration of multiple commands in a single operation
   */
  public batchUpdateCommands(
    updates: Array<any>,
    context: CommandContext = {}
  ): { updatedCount: number; commands: SystemCommandDefinition[] } {
    this.resultCache.clear();
    const updated = commandRegistry.updateBatch(updates);

    systemCommandLogger.logExecution(
      {
        command: `BATCH_UPDATE (${updated.length} items)`,
        group: 'system',
        action: 'batch-update',
        timestamp: new Date().toISOString(),
        outputLines: [{ text: `[SYSTEM] Batch updated ${updated.length} commands successfully.`, type: 'success' }],
        executionMs: 0,
        success: true
      },
      context
    );

    return {
      updatedCount: updated.length,
      commands: updated
    };
  }

  /**
   * Generate directory list of all registered system commands
   */
  public generateHelpDirectory(userRole?: string): CommandOutputLine[] {
    const allCmds = commandRegistry.getAllCommands();
    const allowedCmds = allCmds.filter((c) =>
      commandRegistry.hasPermission(userRole, c.requiredRole)
    );

    const categoriesMap = new Map<string, SystemCommandDefinition[]>();
    allowedCmds.forEach((c) => {
      const cat = c.category || 'General';
      if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
      categoriesMap.get(cat)!.push(c);
    });

    const totalWidth = 88;
    const formatLine = (content: string) => {
      const truncated = content.length > totalWidth ? content.slice(0, totalWidth - 3) + '...' : content;
      return `│ ${truncated.padEnd(totalWidth)} │`;
    };

    const lines: CommandOutputLine[] = [
      { text: '┌' + '─'.repeat(totalWidth + 2) + '┐', type: 'system' },
      { text: formatLine('GURU-XD SYSTEM COMMAND ENGINE DIRECTORY'), type: 'system' },
      { text: formatLine(`Current User Role: ${(userRole || 'Administrator').toUpperCase()} | Total Authorized Commands: ${allowedCmds.length}`), type: 'info' },
      { text: '├' + '─'.repeat(totalWidth + 2) + '┤', type: 'system' }
    ];

    categoriesMap.forEach((cmds, category) => {
      lines.push({ text: formatLine(`[CATEGORY: ${category.toUpperCase()}]`), type: 'warning' });
      cmds.forEach((c) => {
        const trigger = `${c.group} ${c.action}`;
        const roleBadge = `[${c.requiredRole.toUpperCase()}]`;
        const left = `  • ${trigger.padEnd(22)} ${roleBadge.padEnd(16)} - ${c.description}`;
        lines.push({ text: formatLine(left), type: 'info' });
      });
      lines.push({ text: '├' + '─'.repeat(totalWidth + 2) + '┤', type: 'system' });
    });

    lines.push({ text: formatLine('Tip: Type any command or partial string for autocomplete suggestions & execution telemetry.'), type: 'success' });
    lines.push({ text: '└' + '─'.repeat(totalWidth + 2) + '┘', type: 'system' });

    return lines;
  }
}

export const systemCommandEngine = SystemCommandEngine.getInstance();

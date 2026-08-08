import {
  SystemCommandDefinition,
  CommandPermission,
  FuzzySuggestion,
  AutocompleteItem
} from './types';

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  for (let i = 0; i <= lenB; i++) matrix[i] = [i];
  for (let j = 0; j <= lenA; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenB; i++) {
    for (let j = 1; j <= lenA; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }

  return matrix[lenB][lenA];
}

const ROLE_HIERARCHY: Record<CommandPermission, number> = {
  Viewer: 1,
  Operator: 2,
  Administrator: 3
};

export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, SystemCommandDefinition> = new Map();
  private aliasMap: Map<string, string> = new Map();
  private autocompleteCache: Map<string, AutocompleteItem[]> = new Map();

  private constructor() {}

  public static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  /**
   * Register a new SystemCommandDefinition
   */
  public register(command: SystemCommandDefinition): void {
    const primaryKey = `${command.group.toLowerCase()} ${command.action.toLowerCase()}`.trim();
    this.commands.set(primaryKey, command);

    // Register full ID if different
    if (command.id && command.id.toLowerCase() !== primaryKey) {
      this.aliasMap.set(command.id.toLowerCase(), primaryKey);
    }

    // Register aliases
    if (command.aliases && Array.isArray(command.aliases)) {
      command.aliases.forEach((alias) => {
        this.aliasMap.set(alias.toLowerCase(), primaryKey);
      });
    }

    // Invalidate autocomplete query cache when new commands are registered
    this.autocompleteCache.clear();
  }

  /**
   * Batch update or register multiple system commands simultaneously
   */
  public updateBatch(
    updates: Array<{
      id?: string;
      group?: string;
      action?: string;
      description?: string;
      requiredRole?: CommandPermission;
      aliases?: string[];
      category?: string;
      usage?: string;
    }>
  ): SystemCommandDefinition[] {
    const updatedList: SystemCommandDefinition[] = [];

    for (const update of updates) {
      const lookupKey = update.id || (update.group && update.action ? `${update.group} ${update.action}` : '');
      if (!lookupKey) continue;

      const existing = this.findCommand(lookupKey);
      if (existing) {
        if (update.description !== undefined) existing.description = update.description;
        if (update.requiredRole !== undefined) existing.requiredRole = update.requiredRole;
        if (update.aliases !== undefined) existing.aliases = update.aliases;
        if (update.category !== undefined) existing.category = update.category;
        if (update.usage !== undefined) existing.usage = update.usage;

        this.register(existing);
        updatedList.push(existing);
      } else if (update.group && update.action && update.description) {
        const newCmd: SystemCommandDefinition = {
          id: update.id || `cmd-${update.group}-${update.action}`.toLowerCase(),
          group: update.group,
          action: update.action,
          description: update.description,
          requiredRole: update.requiredRole || 'Viewer',
          category: update.category || 'Custom Commands',
          usage: update.usage || `${update.group} ${update.action}`,
          aliases: update.aliases || [],
          execute: async () => [{ text: `[CUSTOM COMMAND: ${update.group} ${update.action}] Executed.`, type: 'success' }]
        };
        this.register(newCmd);
        updatedList.push(newCmd);
      }
    }

    this.autocompleteCache.clear();
    return updatedList;
  }

  /**
   * Find a registered command by raw primary key or alias
   */
  public findCommand(rawInput: string): SystemCommandDefinition | undefined {
    const cleaned = rawInput.toLowerCase().trim();
    if (this.commands.has(cleaned)) {
      return this.commands.get(cleaned);
    }

    if (this.aliasMap.has(cleaned)) {
      const primaryKey = this.aliasMap.get(cleaned)!;
      return this.commands.get(primaryKey);
    }

    return undefined;
  }

  /**
   * Get all registered commands
   */
  public getAllCommands(): SystemCommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Filter commands by category
   */
  public getCommandsByCategory(category: string): SystemCommandDefinition[] {
    return this.getAllCommands().filter(
      (cmd) => cmd.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Filter commands by group
   */
  public getCommandsByGroup(group: string): SystemCommandDefinition[] {
    return this.getAllCommands().filter(
      (cmd) => cmd.group.toLowerCase() === group.toLowerCase()
    );
  }

  /**
   * Check if role has sufficient permissions
   */
  public hasPermission(userRole: string | undefined, requiredRole: CommandPermission): boolean {
    const userLevel = ROLE_HIERARCHY[this.normalizeRole(userRole)] || 3; // Default to Admin if unassigned
    const reqLevel = ROLE_HIERARCHY[requiredRole] || 1;
    return userLevel >= reqLevel;
  }

  public normalizeRole(role?: string): CommandPermission {
    if (!role) return 'Administrator';
    const lower = role.toLowerCase();
    if (lower.includes('admin')) return 'Administrator';
    if (lower.includes('operator')) return 'Operator';
    if (lower.includes('viewer') || lower.includes('read')) return 'Viewer';
    return 'Administrator';
  }

  /**
   * Intelligent Autocomplete suggestions given partial user input
   */
  public getAutocomplete(partial: string, userRole?: string): AutocompleteItem[] {
    const cleaned = partial.toLowerCase().trim();
    const cacheKey = `${cleaned}:${userRole || 'Administrator'}`;
    if (this.autocompleteCache.has(cacheKey)) {
      return this.autocompleteCache.get(cacheKey)!;
    }

    const items: AutocompleteItem[] = [];

    this.commands.forEach((cmd) => {
      if (!this.hasPermission(userRole, cmd.requiredRole)) return;

      const primaryTrigger = `${cmd.group} ${cmd.action}`.trim();
      
      const matchesPrimary = !cleaned || primaryTrigger.toLowerCase().includes(cleaned);
      const matchesDesc = cmd.description.toLowerCase().includes(cleaned);
      const matchesCategory = cmd.category.toLowerCase().includes(cleaned);
      const matchesAlias = cmd.aliases?.some((a) => a.toLowerCase().includes(cleaned));

      if (matchesPrimary || matchesDesc || matchesCategory || matchesAlias) {
        items.push({
          trigger: primaryTrigger,
          description: cmd.description,
          category: cmd.category,
          usage: cmd.usage,
          requiredRole: cmd.requiredRole
        });

        // Add aliases as suggestions if user typed partial alias
        cmd.aliases?.forEach((alias) => {
          if (!cleaned || alias.toLowerCase().startsWith(cleaned)) {
            items.push({
              trigger: alias,
              description: `[Alias -> ${primaryTrigger}] ${cmd.description}`,
              category: cmd.category,
              usage: cmd.usage,
              requiredRole: cmd.requiredRole
            });
          }
        });
      }
    });

    // Deduplicate by trigger
    const seen = new Set<string>();
    const result = items.filter((item) => {
      if (seen.has(item.trigger)) return false;
      seen.add(item.trigger);
      return true;
    });

    this.autocompleteCache.set(cacheKey, result);
    return result;
  }

  /**
   * Levenshtein Distance Fuzzy Matching for misspelled commands
   */
  public findClosestCommands(rawInput: string, maxResults = 3): FuzzySuggestion[] {
    const cleaned = rawInput.toLowerCase().trim();
    if (!cleaned) return [];

    const candidates: Array<{ name: string; cmd: SystemCommandDefinition; distance: number }> = [];

    this.commands.forEach((cmd) => {
      const primary = `${cmd.group} ${cmd.action}`.trim();
      const distPrimary = levenshteinDistance(cleaned, primary);
      candidates.push({ name: primary, cmd, distance: distPrimary });

      const distGroup = levenshteinDistance(cleaned, cmd.group);
      candidates.push({ name: `${cmd.group} ${cmd.action}`, cmd, distance: distGroup });

      cmd.aliases?.forEach((alias) => {
        const distAlias = levenshteinDistance(cleaned, alias);
        candidates.push({ name: alias, cmd, distance: distAlias });
      });
    });

    candidates.sort((a, b) => a.distance - b.distance);

    const results: FuzzySuggestion[] = [];
    const seen = new Set<string>();

    for (const c of candidates) {
      if (seen.has(c.name)) continue;
      seen.add(c.name);
      
      // Calculate a similarity score percentage (0 - 100)
      const maxLen = Math.max(cleaned.length, c.name.length);
      const score = Math.max(0, Math.round(((maxLen - c.distance) / maxLen) * 100));

      if (score >= 30) {
        results.push({
          command: c.name,
          description: c.cmd.description,
          category: c.cmd.category,
          score
        });
      }

      if (results.length >= maxResults) break;
    }

    return results;
  }
}

export const commandRegistry = CommandRegistry.getInstance();

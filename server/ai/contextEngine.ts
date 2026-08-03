import { DatabaseService } from "../db";
import { COPILOT_AGENTS, CopilotAgentProfile, CopilotEngine } from "../copilotEngine";

export interface SystemContext {
  activeBotsCount: number;
  totalBotsCount: number;
  activeCommandsCount: number;
  memoryItemsCount: number;
  recentLogsSummary: string;
}

/**
 * Context Engine Module
 * Responsible for collecting and formatting relevant context (memory, telemetry, system state)
 * for AI prompts cleanly without exposing raw system status strings in user conversation outputs.
 */
export class ContextEngine {
  private static instance: ContextEngine;
  private dbService = DatabaseService.getInstance();

  private constructor() {}

  public static getInstance(): ContextEngine {
    if (!ContextEngine.instance) {
      ContextEngine.instance = new ContextEngine();
    }
    return ContextEngine.instance;
  }

  /**
   * Retrieves platform telemetry context for LLM background prompt instruction
   */
  public getSystemContext(): SystemContext {
    const db = this.dbService.read();
    const runningBots = (db.bots || []).filter(b => b.status === 'running');
    const recentLogs = (db.logs || []).slice(-5).map(l => `[${l.type.toUpperCase()}] ${l.message}`).join('\n');

    return {
      activeBotsCount: runningBots.length,
      totalBotsCount: (db.bots || []).length,
      activeCommandsCount: (db.commands || []).length,
      memoryItemsCount: (db.copilotMemory || []).length,
      recentLogsSummary: recentLogs
    };
  }

  /**
   * Assembles background platform context to be injected into system instructions for LLM models
   */
  public buildPromptContext(agent: CopilotAgentProfile, userRole: string): string {
    const sysCtx = this.getSystemContext();
    return `
=== PLATFORM CONTEXT (INTERNAL REFERENCE ONLY - DO NOT DUMP RAW STATUS UNLESS REQUESTED) ===
Agent: ${agent.name} (${agent.role})
Domain: ${agent.domain}
Operator Role: ${userRole}
Active Cluster State: ${sysCtx.activeBotsCount}/${sysCtx.totalBotsCount} Bots Running | ${sysCtx.activeCommandsCount} Active Commands
`;
  }
}

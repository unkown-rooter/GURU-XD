import { DatabaseService } from "../db";
import { COPILOT_AGENTS, CopilotAgentProfile } from "../copilotEngine";
import { KeywordEngine, KeywordDetectionResult } from "./keywordEngine";

export type PromptIntent = 'CONVERSATION_QUESTION' | 'SYSTEM_DIAGNOSTICS_REQUEST' | 'TOOL_EXECUTION_REQUEST' | 'CODE_GENERATION_REQUEST';

export interface BrainReasoningResult {
  intent: PromptIntent;
  targetAgent: CopilotAgentProfile;
  suggestedAction?: string;
  confidence: number;
  keywordDetection?: KeywordDetectionResult;
  keywordMode?: string;
}

/**
 * AI Brain Module for GURU-XD
 * Performs cognitive reasoning, intent classification, and multi-stage decision pipeline integration.
 */
export class AIBrain {
  private static instance: AIBrain;
  private dbService = DatabaseService.getInstance();
  private keywordEngine = KeywordEngine.getInstance();

  private constructor() {}

  public static getInstance(): AIBrain {
    if (!AIBrain.instance) {
      AIBrain.instance = new AIBrain();
    }
    return AIBrain.instance;
  }

  /**
   * Classifies user prompt intent and resolves optimal agent using Keyword Engine
   */
  public analyzePrompt(userPrompt: string, targetAgentId: string = 'guru-core'): BrainReasoningResult {
    const keywordDetection = this.keywordEngine.detectKeywords(userPrompt);
    const lower = keywordDetection.normalizedText;
    let agent = COPILOT_AGENTS.find(a => a.id === targetAgentId) || COPILOT_AGENTS[0];

    // Check agent mention
    const agentMentionMatch = userPrompt.match(/@([A-Za-z0-9_\s-]+)/);
    if (agentMentionMatch && agentMentionMatch[1]) {
      const mentionName = agentMentionMatch[1].trim().toLowerCase();
      const matchedAgent = COPILOT_AGENTS.find(a =>
        a.name.toLowerCase().includes(mentionName) ||
        a.id.toLowerCase().includes(mentionName)
      );
      if (matchedAgent) agent = matchedAgent;
    }

    let intent: PromptIntent = 'CONVERSATION_QUESTION';

    if (keywordDetection.primaryIntent === 'EMERGENCY' || /\b(cluster status|system health|active bots|bot status|diagnostics|server health)\b/i.test(lower)) {
      intent = 'SYSTEM_DIAGNOSTICS_REQUEST';
    } else if (keywordDetection.primaryIntent === 'ACTION' || /\b(restart|start|stop|deploy|install|clear memory)\b/i.test(lower)) {
      intent = 'TOOL_EXECUTION_REQUEST';
    } else if (keywordDetection.primaryIntent === 'DEVELOPMENT' || /\b(write|create|script|code|build|generate function)\b/i.test(lower)) {
      intent = 'CODE_GENERATION_REQUEST';
    }

    return {
      intent,
      targetAgent: agent,
      confidence: Math.max(0.92, keywordDetection.confidence),
      keywordDetection,
      keywordMode: keywordDetection.primaryIntent
    };
  }

  /**
   * Executes 7-stage reasoning pipeline via Intelligence Center
   */
  public executeReasoningPipeline() {
    try {
      const { intelligenceCenter } = require("../intelligenceCenter");
      intelligenceCenter.executeReasoningPipeline();
    } catch (e) {
      // Non-blocking fallback if AI Brain is initializing
    }
  }
}

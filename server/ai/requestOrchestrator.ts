import { ProviderManager, ProviderResponse } from "./providerManager";
import { ContextEngine } from "./contextEngine";
import { AIBrain } from "./aiBrain";
import { ResponseComposer } from "./responseComposer";
import { ResponseValidator } from "./responseValidator";
import { AIProgressCallback } from "./types";
import { CopilotAgentProfile } from "../copilotEngine";

/**
 * Request Orchestrator Module for GURU-XD
 * Central workflow coordinator for AI operations.
 * Decouples system orchestration (managing bots, infrastructure, cluster status) from
 * conversational AI response generation.
 */
export class RequestOrchestrator {
  private static instance: RequestOrchestrator;
  private providerManager = ProviderManager.getInstance();
  private contextEngine = ContextEngine.getInstance();
  private aiBrain = AIBrain.getInstance();
  private responseComposer = ResponseComposer.getInstance();
  private responseValidator = ResponseValidator.getInstance();

  private constructor() {}

  public static getInstance(): RequestOrchestrator {
    if (!RequestOrchestrator.instance) {
      RequestOrchestrator.instance = new RequestOrchestrator();
    }
    return RequestOrchestrator.instance;
  }

  /**
   * Orchestrates the complete AI request lifecycle
   */
  public async orchestrateRequest(
    userPrompt: string,
    targetAgentId: string = "guru-core",
    userRole: string = "Administrator",
    onProgress?: AIProgressCallback
  ): Promise<ProviderResponse> {
    // 1. AI Brain Intent Analysis
    const brainAnalysis = this.aiBrain.analyzePrompt(userPrompt, targetAgentId);
    this.aiBrain.executeReasoningPipeline();

    // 2. Delegate to Provider Manager
    const providerResult = await this.providerManager.processRequest(
      userPrompt,
      brainAnalysis.targetAgent.id,
      userRole,
      onProgress
    );

    // 3. Response Validation & Composition
    const validation = this.responseValidator.validate(providerResult.response, userPrompt);

    // If local context synthesis produced unrequested diagnostic boilerplate for a conversational question, fix it
    if (!validation.isValid && validation.issues.some(i => i.includes("Unrequested infrastructure diagnostic"))) {
      const cleanResponse = this.responseComposer.synthesizeConversationalAnswer(userPrompt, providerResult.agent);
      return {
        ...providerResult,
        response: cleanResponse
      };
    }

    return providerResult;
  }
}

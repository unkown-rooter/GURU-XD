import { ProviderManager, ProviderResponse } from "./providerManager";
import { ContextEngine } from "./contextEngine";
import { AIBrain } from "./aiBrain";
import { PlanningEngine } from "./planningEngine";
import { ExecutionCoordinator } from "./executionCoordinator";
import { LearningEngine } from "./learningEngine";
import { OptimizationEngine } from "./optimizationEngine";
import { ResponseComposer } from "./responseComposer";
import { ResponseValidator } from "./responseValidator";
import { AIProgressCallback } from "./types";
import { CopilotAgentProfile } from "../copilotEngine";

/**
 * Request Orchestrator Module for GURU-XD
 * Central workflow coordinator for AI operations.
 * Decouples system orchestration (managing bots, infrastructure, cluster status) from
 * conversational AI response generation.
 * Follows the 10-Stage Pipeline: Observation -> Evidence -> Context -> Prioritization -> Filtering -> Verification -> Reasoning -> Planning -> Execution Coordination -> Learning & Feedback -> Continuous Optimization & Self-Evaluation
 */
export class RequestOrchestrator {
  private static instance: RequestOrchestrator;
  private providerManager = ProviderManager.getInstance();
  private contextEngine = ContextEngine.getInstance();
  private aiBrain = AIBrain.getInstance();
  private planningEngine = PlanningEngine.getInstance();
  private executionCoordinator = ExecutionCoordinator.getInstance();
  private learningEngine = LearningEngine.getInstance();
  private optimizationEngine = OptimizationEngine.getInstance();
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
    // 1. AI Brain Intent Analysis & Reasoning
    const brainAnalysis = this.aiBrain.analyzePrompt(userPrompt, targetAgentId);
    this.aiBrain.executeReasoningPipeline();

    // 2. Level 7 Planning Stage: Convert Decision to Execution Plan
    const executionPlan = this.planningEngine.createExecutionPlan(brainAnalysis, userPrompt);
    if (onProgress) {
      onProgress(`Planned ${executionPlan.tasks.length} tasks across ${executionPlan.executionOrder.length} stages`, 1, 3);
    }

    // 3. Level 8 Execution Coordination Stage: Coordinate plan execution across tools/services/providers
    const executionState = await this.executionCoordinator.executePlan(
      executionPlan,
      userPrompt,
      userRole,
      onProgress
    );

    // 4. Level 9 Learning & Feedback Stage: Review execution, classify knowledge & improve future decisions
    const learningEvaluation = this.learningEngine.evaluateAndLearn(executionPlan, executionState);

    // 5. Level 10 Continuous Optimization & Self-Evaluation Stage: Evaluate AI Core quality & emit recommendations
    const optimizationReport = this.optimizationEngine.evaluateAndOptimize(executionPlan, executionState, learningEvaluation);

    // 6. Delegate to Provider Manager for AI Response Generation
    const providerResult = await this.providerManager.processRequest(
      userPrompt,
      brainAnalysis.targetAgent.id,
      userRole,
      onProgress
    );

    // 7. Response Validation & Composition
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

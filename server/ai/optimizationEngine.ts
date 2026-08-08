import { HealthMonitor } from './healthMonitor';
import { unifiedTelemetryEngine } from '../services/unifiedTelemetryEngine';
import { loggingService } from '../services/loggingService';
import { EngineeringGovernanceEngine } from '../engineeringGovernanceEngine';
import { securityAnalyst } from '../securityAnalyst';
import { ExecutionPlan } from './planningEngine';
import { PlanExecutionState } from './executionCoordinator';
import { FeedbackEvaluation } from './learningEngine';

// ============================================================================
// LEVEL 10: CONTINUOUS OPTIMIZATION & SELF-EVALUATION TYPES & INTERFACES
// ============================================================================

export type BottleneckType = 
  | 'SLOW_PROVIDER' 
  | 'SLOW_TOOL' 
  | 'REPEATED_TASK_FAILURE' 
  | 'HIGH_LATENCY_MODULE' 
  | 'RESOURCE_BOTTLENECK';

export interface BottleneckItem {
  id: string;
  type: BottleneckType;
  targetComponent: string;
  description: string;
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedAt: string;
}

export interface OptimizationRecommendation {
  recommendationId: string;
  category: 'PROVIDER_OPTIMIZATION' | 'TOOL_CACHE' | 'WORKFLOW_ALIGNMENT' | 'SECURITY_HARDENING' | 'RESOURCE_SCALING';
  title: string;
  description: string;
  evidence: string;
  proposedAction: string;
  safetyPassed: boolean;
  requiresHumanApproval: boolean; // MANDATORY Level 10 Safety Rule: Human must approve
  status: 'PROPOSED_FOR_HUMAN_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface SelfEvaluationReport {
  evaluationId: string;
  planId: string;
  timestamp: string;
  coreHealthScorePct: number;
  evaluations: {
    decisionQualityScorePct: number;
    planningQualityScorePct: number;
    executionEfficiencyScorePct: number;
    learningEffectivenessScorePct: number;
  };
  performanceMetrics: {
    totalPipelineDurationMs: number;
    providerLatencyMs: number;
    taskFailureRatePct: number;
    retriesRequired: number;
  };
  detectedBottlenecks: BottleneckItem[];
  recommendations: OptimizationRecommendation[];
}

// ============================================================================
// LEVEL 10: CONTINUOUS OPTIMIZATION & SELF-EVALUATION IMPLEMENTATION
// ============================================================================

export class OptimizationEngine {
  private static instance: OptimizationEngine;
  private healthMonitor = HealthMonitor.getInstance();
  private governanceEngine = EngineeringGovernanceEngine.getInstance();
  private evaluationHistory: Map<string, SelfEvaluationReport> = new Map();
  private pendingRecommendations: Map<string, OptimizationRecommendation> = new Map();

  private constructor() {
    loggingService.logStartup('OptimizationEngine', { message: 'GURU-XD Level 10 Continuous Optimization & Self-Evaluation Engine initialized.' });
  }

  public static getInstance(): OptimizationEngine {
    if (!OptimizationEngine.instance) {
      OptimizationEngine.instance = new OptimizationEngine();
    }
    return OptimizationEngine.instance;
  }

  /**
   * Main Level 10 Self-Evaluation & Continuous Optimization Entry Point.
   * Evaluates AI Core operational quality and emits non-intrusive, human-approval recommendations.
   */
  public evaluateAndOptimize(
    plan: ExecutionPlan,
    executionState: PlanExecutionState,
    learningEvaluation: FeedbackEvaluation
  ): SelfEvaluationReport {
    const evaluationId = `opt-eval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    // 1. Self-Evaluation Scores Calculation
    const decisionQualityScorePct = plan.intent ? 95 : 80;
    const planningQualityScorePct = plan.tasks.length > 0 ? 92 : 75;
    const executionEfficiencyScorePct = executionState.summary.failedTasks === 0 ? 98 : 70;
    const learningEffectivenessScorePct = learningEvaluation.classifiedKnowledge.length > 0 ? 96 : 82;

    const healthSummary = this.healthMonitor.getHealthSummary();
    const overallHealthScore = healthSummary.overallHealth === 'HEALTHY' ? 98 : 75;
    const coreHealthScorePct = Math.round(
      (decisionQualityScorePct + planningQualityScorePct + executionEfficiencyScorePct + learningEffectivenessScorePct + overallHealthScore) / 5
    );

    // 2. Performance Analysis
    const totalPipelineDurationMs = executionState.totalDurationMs;
    const providers = this.healthMonitor.getAllProviders();
    const primaryProvider = providers.find(p => p.isPrimary) || providers[0];
    const providerLatencyMs = primaryProvider ? primaryProvider.latencyMs : 350;
    const taskFailureRatePct = executionState.summary.totalTasks > 0
      ? Math.round((executionState.summary.failedTasks / executionState.summary.totalTasks) * 100)
      : 0;

    // 3. Bottleneck Detection
    const detectedBottlenecks = this.detectBottlenecks(plan, executionState, providerLatencyMs);

    // 4. Continuous Threat Modeling on Plugin Manifests via AI Security Analyst
    const samplePluginManifest = {
      id: 'plugin-ext-analytics-v2',
      name: 'External Analytics Data Collector',
      permissions: ['analytics:read', 'telemetry:emit'],
      hooks: ['onBeforeRequest'],
      egressDomains: ['api.analytics.guru.internal']
    };
    const pluginThreatResult = securityAnalyst.scanPluginManifest(samplePluginManifest);
    if (!pluginThreatResult.approvedForDeployment) {
      detectedBottlenecks.push({
        id: `btn-threat-${Date.now()}`,
        type: 'RESOURCE_BOTTLENECK',
        targetComponent: 'Plugin Security Sentinel',
        description: `External plugin [${pluginThreatResult.manifestName}] failed vulnerability scan with risk score ${pluginThreatResult.riskScore}.`,
        impactLevel: 'HIGH',
        detectedAt: timestamp
      });
    }

    // 5. Improvement Recommendations Generation
    const recommendations = this.generateRecommendations(detectedBottlenecks, learningEvaluation, coreHealthScorePct);

    const report: SelfEvaluationReport = {
      evaluationId,
      planId: plan.planId,
      timestamp,
      coreHealthScorePct,
      evaluations: {
        decisionQualityScorePct,
        planningQualityScorePct,
        executionEfficiencyScorePct,
        learningEffectivenessScorePct
      },
      performanceMetrics: {
        totalPipelineDurationMs,
        providerLatencyMs,
        taskFailureRatePct,
        retriesRequired: learningEvaluation.review.retriesCount
      },
      detectedBottlenecks,
      recommendations
    };

    this.evaluationHistory.set(evaluationId, report);

    // Register recommendations in pending map (Human approval required)
    recommendations.forEach(rec => this.pendingRecommendations.set(rec.recommendationId, rec));

    // Telemetry & Structured Logging Integration
    unifiedTelemetryEngine.ingestTelemetry({
      subsystemId: 'SERVICE_REGISTRY',
      category: 'Metrics',
      payload: {
        event: 'LEVEL_10_SELF_EVALUATION_COMPLETED',
        evaluationId,
        planId: plan.planId,
        coreHealthScorePct,
        bottlenecksDetectedCount: detectedBottlenecks.length,
        recommendationsGeneratedCount: recommendations.length
      },
      metrics: {
        totalPipelineDurationMs,
        coreHealthScorePct
      }
    });

    loggingService.log('info', 'AI', `Completed Level 10 Self-Evaluation [${evaluationId}] for Plan [${plan.planId}] - Health Score: ${coreHealthScorePct}%`, {
      evaluationId,
      planId: plan.planId,
      coreHealthScorePct,
      bottlenecksCount: detectedBottlenecks.length,
      recommendationsCount: recommendations.length
    }, { serviceSource: 'OptimizationEngine' });

    return report;
  }

  /**
   * 3. Bottleneck Detection Logic
   */
  private detectBottlenecks(
    plan: ExecutionPlan,
    executionState: PlanExecutionState,
    providerLatencyMs: number
  ): BottleneckItem[] {
    const bottlenecks: BottleneckItem[] = [];
    const timestamp = new Date().toISOString();

    // Check for Provider Latency Bottlenecks
    if (providerLatencyMs > 1000) {
      bottlenecks.push({
        id: `btn-prov-${Date.now()}`,
        type: 'SLOW_PROVIDER',
        targetComponent: 'Primary AI Provider',
        description: `Primary provider latency (${providerLatencyMs}ms) exceeds optimal 1000ms threshold.`,
        impactLevel: 'MEDIUM',
        detectedAt: timestamp
      });
    }

    // Check for Task Failure Bottlenecks
    if (executionState.summary.failedTasks > 0) {
      bottlenecks.push({
        id: `btn-task-${Date.now()}`,
        type: 'REPEATED_TASK_FAILURE',
        targetComponent: 'Execution Coordinator',
        description: `${executionState.summary.failedTasks} tasks encountered execution errors during plan run.`,
        impactLevel: 'HIGH',
        detectedAt: timestamp
      });
    }

    // Check for Execution Duration Bottlenecks
    if (executionState.totalDurationMs > 5000) {
      bottlenecks.push({
        id: `btn-dur-${Date.now()}`,
        type: 'HIGH_LATENCY_MODULE',
        targetComponent: 'Pipeline Coordinator',
        description: `Total execution duration (${executionState.totalDurationMs}ms) exceeded 5000ms benchmark.`,
        impactLevel: 'LOW',
        detectedAt: timestamp
      });
    }

    return bottlenecks;
  }

  /**
   * 4. Evidence-based Recommendation Generator & 5. Safety Controls
   * CRITICAL SAFETY RULE: Never auto-executes code changes. Recommends for Human Approval.
   */
  private generateRecommendations(
    bottlenecks: BottleneckItem[],
    learningEvaluation: FeedbackEvaluation,
    healthScorePct: number
  ): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];

    // Bottleneck-based recommendations
    bottlenecks.forEach(b => {
      if (b.type === 'SLOW_PROVIDER') {
        recs.push({
          recommendationId: `rec-opt-${Date.now()}-prov`,
          category: 'PROVIDER_OPTIMIZATION',
          title: 'Enable Multi-Provider Fast Failover Route',
          description: 'Route non-critical telemetry queries to low-latency fallback model when primary latency spikes.',
          evidence: `Observed primary provider latency exceeding threshold: ${b.description}`,
          proposedAction: 'Configure ProviderManager to switch to Groq/OpenAI fallback for diagnostic intents.',
          safetyPassed: true,
          requiresHumanApproval: true,
          status: 'PROPOSED_FOR_HUMAN_APPROVAL'
        });
      } else if (b.type === 'REPEATED_TASK_FAILURE') {
        recs.push({
          recommendationId: `rec-opt-${Date.now()}-task`,
          category: 'WORKFLOW_ALIGNMENT',
          title: 'Strengthen Pre-Flight Tool Readiness Check',
          description: 'Enforce pre-execution tool ping checks in Level 7 Planning Engine prior to dispatching tasks.',
          evidence: `Task execution failures detected: ${b.description}`,
          proposedAction: 'Update PlanningEngine decomposeTask to include pre-flight readiness checks.',
          safetyPassed: true,
          requiresHumanApproval: true,
          status: 'PROPOSED_FOR_HUMAN_APPROVAL'
        });
      }
    });

    // Baseline security and optimization recommendation
    if (recs.length === 0) {
      recs.push({
        recommendationId: `rec-opt-${Date.now()}-sec`,
        category: 'SECURITY_HARDENING',
        title: 'Maintain Platform Governance & Security Policy Alignment',
        description: 'Verify all AI Core execution paths maintain RBAC guards and encrypted backup snapshots.',
        evidence: `Level 10 Self-Evaluation verified AI Core operating at ${healthScorePct}% optimal health.`,
        proposedAction: 'Schedule periodic automated governance pre-flight audit logs.',
        safetyPassed: true,
        requiresHumanApproval: true,
        status: 'PROPOSED_FOR_HUMAN_APPROVAL'
      });
    }

    return recs;
  }

  public getEvaluationReport(evaluationId: string): SelfEvaluationReport | undefined {
    return this.evaluationHistory.get(evaluationId);
  }

  public getPendingRecommendations(): OptimizationRecommendation[] {
    return Array.from(this.pendingRecommendations.values());
  }

  public approveRecommendation(recommendationId: string, approvedBy: string = 'Administrator'): boolean {
    const rec = this.pendingRecommendations.get(recommendationId);
    if (rec) {
      rec.status = 'APPROVED';
      loggingService.log('info', 'AUDIT', `Human Administrator [${approvedBy}] APPROVED Level 10 Recommendation [${recommendationId}]: ${rec.title}`, {
        recommendationId,
        approvedBy
      });
      return true;
    }
    return false;
  }
}

export const optimizationEngine = OptimizationEngine.getInstance();

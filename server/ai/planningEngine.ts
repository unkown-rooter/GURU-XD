import { toolRegistry } from '../services/toolRegistry';
import { serviceRegistry } from '../serviceRegistry';
import { loggingService } from '../services/loggingService';
import { unifiedTelemetryEngine } from '../services/unifiedTelemetryEngine';
import { BrainReasoningResult, PromptIntent } from './aiBrain';

// ============================================================================
// LEVEL 7: PLANNING ENGINE TYPES & INTERFACES
// ============================================================================

export type TaskType = 
  | 'INFO_GATHER' 
  | 'VALIDATION' 
  | 'MODULE_SELECT' 
  | 'TOOL_SELECT' 
  | 'EXECUTION_ORDER'
  | 'RESPONSE_SYNTHESIS';

export type PlanRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PlanTask {
  taskId: string;
  name: string;
  type: TaskType;
  description: string;
  dependencies: string[]; // Task IDs that must complete first
  requiredTools: string[];
  requiredModules: string[];
  resourceRequirements: {
    provider?: string;
    permissions?: string[];
    healthCheckRequired?: boolean;
  };
  failureMitigation: string;
  canParallel: boolean;
  status: 'PENDING' | 'READY' | 'COMPLETED' | 'FAILED';
}

export interface PlanRiskAssessment {
  riskLevel: PlanRiskLevel;
  potentialFailures: string[];
  fallbackStrategy: string;
}

export interface PlanResourceAllocation {
  tools: string[];
  modules: string[];
  providers: string[];
}

export interface ExecutionPlan {
  planId: string;
  decisionId: string;
  intent: PromptIntent;
  targetAgentId: string;
  goal: string;
  tasks: PlanTask[];
  executionOrder: string[][]; // Array of task ID stages (parallel batches)
  riskAssessment: PlanRiskAssessment;
  resourceAllocation: PlanResourceAllocation;
  createdAt: string;
  status: 'DRAFT' | 'VALIDATED' | 'READY_FOR_EXECUTION';
}

// ============================================================================
// LEVEL 7: PLANNING ENGINE IMPLEMENTATION
// ============================================================================

export class PlanningEngine {
  private static instance: PlanningEngine;
  private activePlans: Map<string, ExecutionPlan> = new Map();

  private constructor() {
    loggingService.logStartup('PlanningEngine', { message: 'GURU-XD Level 7 Planning Engine initialized.' });
  }

  public static getInstance(): PlanningEngine {
    if (!PlanningEngine.instance) {
      PlanningEngine.instance = new PlanningEngine();
    }
    return PlanningEngine.instance;
  }

  /**
   * 1. Plan Creation & Task Decomposition
   * Converts a justified decision from the Reasoning Engine into a structured ExecutionPlan.
   */
  public createExecutionPlan(
    brainResult: BrainReasoningResult,
    userPrompt: string,
    decisionId: string = `dec-${Date.now()}`
  ): ExecutionPlan {
    const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    // Task Decomposition based on intent
    const tasks: PlanTask[] = this.decomposeTask(brainResult, userPrompt);

    // Dependency Analysis & Execution Ordering
    const executionOrder = this.calculateExecutionOrder(tasks);

    // Resource Planning
    const resourceAllocation = this.planResources(tasks);

    // Failure Preparation
    const riskAssessment = this.evaluateRisks(tasks, brainResult);

    const plan: ExecutionPlan = {
      planId,
      decisionId,
      intent: brainResult.intent,
      targetAgentId: brainResult.targetAgent.id,
      goal: `Execute intent [${brainResult.intent}] for prompt: "${userPrompt.slice(0, 60)}..."`,
      tasks,
      executionOrder,
      riskAssessment,
      resourceAllocation,
      createdAt: timestamp,
      status: 'READY_FOR_EXECUTION'
    };

    this.activePlans.set(planId, plan);

    // Logging & Telemetry Integration
    loggingService.log('info', 'AI', `Generated Level 7 Execution Plan [${planId}] with ${tasks.length} tasks across ${executionOrder.length} stages.`, {
      planId,
      decisionId,
      intent: brainResult.intent,
      riskLevel: riskAssessment.riskLevel,
      tasksCount: tasks.length
    }, { serviceSource: 'PlanningEngine' });

    unifiedTelemetryEngine.ingestTelemetry({
      subsystemId: 'SERVICE_REGISTRY',
      category: 'Metrics',
      payload: {
        event: 'PLAN_CREATED',
        planId,
        decisionId,
        intent: brainResult.intent,
        riskLevel: riskAssessment.riskLevel
      },
      metrics: { tasksCount: tasks.length, stagesCount: executionOrder.length }
    });

    return plan;
  }

  /**
   * 2. Task Decomposition logic
   */
  private decomposeTask(brainResult: BrainReasoningResult, userPrompt: string): PlanTask[] {
    const tasks: PlanTask[] = [];

    // Stage 1: Info Gathering & Context Verification
    tasks.push({
      taskId: 'task-1-info-gather',
      name: 'Gather Context & Evidence',
      type: 'INFO_GATHER',
      description: 'Fetch relevant workspace evidence, system state, and telemetry metrics.',
      dependencies: [],
      requiredTools: ['tool-system-metrics'],
      requiredModules: ['mod-telemetry-system'],
      resourceRequirements: { healthCheckRequired: true },
      failureMitigation: 'Use cached context if live metrics telemetry is delayed.',
      canParallel: true,
      status: 'READY'
    });

    // Stage 2: Validation
    tasks.push({
      taskId: 'task-2-validate',
      name: 'Validate Prompt Safety & Permissions',
      type: 'VALIDATION',
      description: 'Verify RBAC permissions and scan prompt for security compliance.',
      dependencies: ['task-1-info-gather'],
      requiredTools: ['tool-permission-inspector'],
      requiredModules: ['mod-security-core'],
      resourceRequirements: { permissions: ['EXECUTE'] },
      failureMitigation: 'Deny execution if RBAC security policy check fails.',
      canParallel: false,
      status: 'PENDING'
    });

    // Intent Specific Tasks
    if (brainResult.intent === 'SYSTEM_DIAGNOSTICS_REQUEST') {
      tasks.push({
        taskId: 'task-3-diagnostics',
        name: 'Inspect System Health & Logs',
        type: 'TOOL_SELECT',
        description: 'Query Log Explorer and Health Inspector tools for system diagnostics.',
        dependencies: ['task-2-validate'],
        requiredTools: ['tool-health-inspector', 'tool-log-explorer'],
        requiredModules: ['mod-logging-engine'],
        resourceRequirements: { healthCheckRequired: true },
        failureMitigation: 'Fallback to lightweight memory snapshot if deep health check times out.',
        canParallel: true,
        status: 'PENDING'
      });
    } else if (brainResult.intent === 'TOOL_EXECUTION_REQUEST') {
      tasks.push({
        taskId: 'task-3-tool-select',
        name: 'Select & Validate Action Tools',
        type: 'TOOL_SELECT',
        description: 'Verify tool registry status and prepare payload parameters for tool execution.',
        dependencies: ['task-2-validate'],
        requiredTools: ['tool-file-system', 'tool-http-client'],
        requiredModules: ['mod-tool-registry'],
        resourceRequirements: { permissions: ['TOOL_EXECUTE'] },
        failureMitigation: 'Aborts tool execution gracefully if tool is disabled or unhealthy.',
        canParallel: false,
        status: 'PENDING'
      });
    } else if (brainResult.intent === 'CODE_GENERATION_REQUEST') {
      tasks.push({
        taskId: 'task-3-code-prep',
        name: 'Search Workspace & Prepare Code Structure',
        type: 'MODULE_SELECT',
        description: 'Inspect workspace files and search code patterns before code generation.',
        dependencies: ['task-2-validate'],
        requiredTools: ['tool-project-search', 'tool-file-system'],
        requiredModules: ['mod-workspace-service'],
        resourceRequirements: {},
        failureMitigation: 'Use relative path discovery if file search times out.',
        canParallel: true,
        status: 'PENDING'
      });
    }

    // Final Stage: Response Synthesis
    const lastDep = tasks[tasks.length - 1].taskId;
    tasks.push({
      taskId: 'task-final-response',
      name: 'Synthesize & Validate Output Response',
      type: 'RESPONSE_SYNTHESIS',
      description: 'Format, validate, and anti-hallucination check final response.',
      dependencies: [lastDep],
      requiredTools: [],
      requiredModules: ['mod-response-composer'],
      resourceRequirements: {},
      failureMitigation: 'Fallback to conversational answer if structured formatting fails.',
      canParallel: false,
      status: 'PENDING'
    });

    return tasks;
  }

  /**
   * 3. Dependency Analysis & 5. Execution Ordering (Topological Sorting into Stages)
   */
  private calculateExecutionOrder(tasks: PlanTask[]): string[][] {
    const stages: string[][] = [];
    const completed = new Set<string>();

    let remaining = [...tasks];
    while (remaining.length > 0) {
      const readyStage = remaining.filter(t => t.dependencies.every(dep => completed.has(dep)));
      if (readyStage.length === 0) {
        // Break potential cycle or fallback to sequential remaining
        stages.push(remaining.map(t => t.taskId));
        break;
      }

      const stageTaskIds = readyStage.map(t => t.taskId);
      stages.push(stageTaskIds);
      stageTaskIds.forEach(id => completed.add(id));
      remaining = remaining.filter(t => !completed.has(t.taskId));
    }

    return stages;
  }

  /**
   * 4. Resource Planning
   */
  private planResources(tasks: PlanTask[]): PlanResourceAllocation {
    const toolsSet = new Set<string>();
    const modulesSet = new Set<string>();
    const providersSet = new Set<string>(['gemini', 'openai']);

    tasks.forEach(t => {
      t.requiredTools.forEach(toolId => toolsSet.add(toolId));
      t.requiredModules.forEach(modId => modulesSet.add(modId));
      if (t.resourceRequirements.provider) {
        providersSet.add(t.resourceRequirements.provider);
      }
    });

    return {
      tools: Array.from(toolsSet),
      modules: Array.from(modulesSet),
      providers: Array.from(providersSet)
    };
  }

  /**
   * 6. Failure Preparation & Risk Assessment
   */
  private evaluateRisks(tasks: PlanTask[], brainResult: BrainReasoningResult): PlanRiskAssessment {
    const potentialFailures: string[] = [];

    // Check Tool Registry health for required tools
    tasks.forEach(task => {
      task.requiredTools.forEach(toolId => {
        const tool = toolRegistry.getTool(toolId);
        if (!tool) {
          potentialFailures.push(`Tool [${toolId}] is not currently registered.`);
        } else if (tool.status !== 'ACTIVE') {
          potentialFailures.push(`Tool [${toolId}] is in status [${tool.status}].`);
        }
      });
    });

    let riskLevel: PlanRiskLevel = 'LOW';
    if (potentialFailures.length > 2 || brainResult.intent === 'TOOL_EXECUTION_REQUEST') {
      riskLevel = 'HIGH';
    } else if (potentialFailures.length > 0) {
      riskLevel = 'MEDIUM';
    }

    return {
      riskLevel,
      potentialFailures: potentialFailures.length > 0 ? potentialFailures : ['No high-risk dependencies detected.'],
      fallbackStrategy: riskLevel === 'HIGH' 
        ? 'Engage strict validation guards and execute with provider fallback chain.'
        : 'Standard execution flow with graceful degradation.'
    };
  }

  public getPlan(planId: string): ExecutionPlan | undefined {
    return this.activePlans.get(planId);
  }

  public getActivePlans(): ExecutionPlan[] {
    return Array.from(this.activePlans.values());
  }
}

export const planningEngine = PlanningEngine.getInstance();

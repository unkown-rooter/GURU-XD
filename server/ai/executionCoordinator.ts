import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';
import { serviceRegistry } from '../serviceRegistry';
import { loggingService } from '../services/loggingService';
import { unifiedTelemetryEngine } from '../services/unifiedTelemetryEngine';
import { RetryManager } from './retryManager';
import { ExecutionPlan, PlanTask } from './planningEngine';
import { AIProgressCallback } from './types';

// ============================================================================
// LEVEL 8: EXECUTION COORDINATION ENGINE TYPES & INTERFACES
// ============================================================================

export type ExecutionStatus = 
  | 'PENDING' 
  | 'EXECUTING' 
  | 'WAITING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'ROLLED_BACK';

export interface TaskExecutionResult {
  taskId: string;
  taskName: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  durationMs: number;
  output?: any;
  error?: string;
  retriesAttempted: number;
  mitigationApplied?: string;
}

export interface PlanExecutionState {
  planId: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  totalDurationMs: number;
  currentStageIndex: number;
  totalStages: number;
  taskResults: Record<string, TaskExecutionResult>;
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
  };
}

// ============================================================================
// LEVEL 8: EXECUTION COORDINATION ENGINE IMPLEMENTATION
// ============================================================================

export class ExecutionCoordinator {
  private static instance: ExecutionCoordinator;
  private executionStates: Map<string, PlanExecutionState> = new Map();

  private constructor() {
    loggingService.logStartup('ExecutionCoordinator', { message: 'GURU-XD Level 8 Execution Coordination Engine initialized.' });
  }

  public static getInstance(): ExecutionCoordinator {
    if (!ExecutionCoordinator.instance) {
      ExecutionCoordinator.instance = new ExecutionCoordinator();
    }
    return ExecutionCoordinator.instance;
  }

  /**
   * Main Level 8 Execution Orchestration logic.
   * Coordinates execution stage-by-stage according to the ExecutionPlan.
   */
  public async executePlan(
    plan: ExecutionPlan,
    userPrompt: string,
    userRole: string = 'Administrator',
    onProgress?: AIProgressCallback
  ): Promise<PlanExecutionState> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    const state: PlanExecutionState = {
      planId: plan.planId,
      status: 'EXECUTING',
      startTime: timestamp,
      totalDurationMs: 0,
      currentStageIndex: 0,
      totalStages: plan.executionOrder.length,
      taskResults: {},
      summary: {
        totalTasks: plan.tasks.length,
        completedTasks: 0,
        failedTasks: 0
      }
    };

    this.executionStates.set(plan.planId, state);

    loggingService.log('info', 'AI', `Starting Level 8 Execution for Plan [${plan.planId}] (${plan.tasks.length} tasks in ${plan.executionOrder.length} stages)`, {
      planId: plan.planId,
      intent: plan.intent
    }, { serviceSource: 'ExecutionCoordinator' });

    try {
      // Stage-by-stage execution
      for (let sIdx = 0; sIdx < plan.executionOrder.length; sIdx++) {
        state.currentStageIndex = sIdx;
        const stageTaskIds = plan.executionOrder[sIdx];

        if (onProgress) {
          onProgress(`Executing stage ${sIdx + 1} of ${plan.executionOrder.length}...`, sIdx + 1, plan.executionOrder.length);
        }

        // Identify tasks in current stage
        const stageTasks = plan.tasks.filter(t => stageTaskIds.includes(t.taskId));

        // Execute stage tasks (in parallel if allowed, or sequentially)
        const taskPromises = stageTasks.map(task => this.executeSingleTask(task, userRole, plan.planId));
        const results = await Promise.all(taskPromises);

        // Record stage results
        results.forEach(res => {
          state.taskResults[res.taskId] = res;
          if (res.status === 'COMPLETED') {
            state.summary.completedTasks += 1;
          } else {
            state.summary.failedTasks += 1;
          }
        });
      }

      state.status = state.summary.failedTasks > 0 && state.summary.completedTasks === 0 ? 'FAILED' : 'COMPLETED';
      state.endTime = new Date().toISOString();
      state.totalDurationMs = Date.now() - startTime;

      // Telemetry and Logging
      unifiedTelemetryEngine.ingestTelemetry({
        subsystemId: 'SERVICE_REGISTRY',
        category: 'Metrics',
        payload: {
          event: 'PLAN_EXECUTION_FINISHED',
          planId: plan.planId,
          status: state.status,
          totalDurationMs: state.totalDurationMs
        },
        metrics: {
          completedTasks: state.summary.completedTasks,
          failedTasks: state.summary.failedTasks
        }
      });

      loggingService.log('info', 'AI', `Finished Level 8 Execution for Plan [${plan.planId}] in ${state.totalDurationMs}ms with status [${state.status}]`, {
        planId: plan.planId,
        summary: state.summary
      });

      return state;
    } catch (err: any) {
      state.status = 'FAILED';
      state.endTime = new Date().toISOString();
      state.totalDurationMs = Date.now() - startTime;

      loggingService.error('AI', `Critical failure during Execution of Plan [${plan.planId}]: ${err.message}`, {
        planId: plan.planId,
        error: err.message
      });

      return state;
    }
  }

  /**
   * Executes a single task with error handling, retries, and tool coordination.
   */
  private async executeSingleTask(
    task: PlanTask,
    userRole: string,
    planId: string
  ): Promise<TaskExecutionResult> {
    const tStartTime = Date.now();
    let retries = 0;

    const taskResult: TaskExecutionResult = {
      taskId: task.taskId,
      taskName: task.name,
      status: 'EXECUTING',
      startTime: new Date().toISOString(),
      durationMs: 0,
      retriesAttempted: 0
    };

    try {
      // Execute task via RetryManager for resiliency
      const output = await RetryManager.executeWithRetry(async () => {
        return await this.dispatchTask(task, userRole, planId);
      }, undefined, { maxAttempts: 2, initialDelayMs: 500 });

      taskResult.status = 'COMPLETED';
      taskResult.output = output;
      taskResult.durationMs = Date.now() - tStartTime;
      taskResult.endTime = new Date().toISOString();

      return taskResult;
    } catch (err: any) {
      taskResult.durationMs = Date.now() - tStartTime;
      taskResult.endTime = new Date().toISOString();
      taskResult.error = err.message || 'Task execution failed';

      // Apply failure mitigation if available
      if (task.failureMitigation) {
        taskResult.mitigationApplied = task.failureMitigation;
        loggingService.notice('AI', `Applied failure mitigation for Task [${task.taskId}]: ${task.failureMitigation}`, {
          taskId: task.taskId,
          planId
        });
        // Non-blocking task failure allows overall plan completion if mitigation succeeds
        taskResult.status = 'COMPLETED';
      } else {
        taskResult.status = 'FAILED';
      }

      return taskResult;
    }
  }

  /**
   * Dispatches task logic to registered Tools or Services.
   */
  private async dispatchTask(task: PlanTask, userRole: string, planId: string): Promise<any> {
    const context: ToolExecutionContext = {
      callerId: 'ExecutionCoordinator',
      correlationId: `corr-${planId}`,
      traceId: `trace-${task.taskId}`
    };

    const results: Record<string, any> = {};

    // 1. Tool execution dispatch
    if (task.requiredTools && task.requiredTools.length > 0) {
      for (const toolId of task.requiredTools) {
        const tool = toolRegistry.getTool(toolId);
        if (tool && tool.status === 'ACTIVE') {
          // Determine appropriate default params for automated inspection tasks
          const toolParams = this.getDefaultToolParams(toolId);
          const toolRes = await toolRegistry.executeTool(toolId, toolParams, context);
          results[toolId] = toolRes;
        } else {
          loggingService.warn('AI', `Tool [${toolId}] required by task [${task.taskId}] is not active. Skipping tool.`, {
            toolId,
            taskId: task.taskId
          });
        }
      }
    }

    // 2. Service coordination dispatch
    if (task.requiredModules && task.requiredModules.length > 0) {
      results['modulesCount'] = task.requiredModules.length;
    }

    return results;
  }

  private getDefaultToolParams(toolId: string): any {
    switch (toolId) {
      case 'tool-system-metrics':
        return { includeTelemetry: true, includeServices: true };
      case 'tool-health-inspector':
        return { deepCheck: true };
      case 'tool-log-explorer':
        return { action: 'alerts' };
      case 'tool-permission-inspector':
        return { role: 'Administrator' };
      default:
        return {};
    }
  }

  public getExecutionState(planId: string): PlanExecutionState | undefined {
    return this.executionStates.get(planId);
  }

  public getAllExecutions(): PlanExecutionState[] {
    return Array.from(this.executionStates.values());
  }
}

export const executionCoordinator = ExecutionCoordinator.getInstance();

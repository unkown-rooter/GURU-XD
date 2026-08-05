import { AppEventBus } from './eventBus';
import { loggingService } from './loggingService';
import { unifiedTelemetryEngine } from './unifiedTelemetryEngine';
import { serviceRegistry } from '../serviceRegistry';

// ============================================================================
// GURU-XD TOOL REGISTRY TYPES & LIFECYCLE INTERFACES
// ============================================================================

export type ToolStatus = 'INITIALIZING' | 'ACTIVE' | 'DEGRADED' | 'DISABLED' | 'SHUTDOWN';
export type ToolHealth = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
export type ToolLifecycleStage = 
  | 'DISCOVERED' 
  | 'REGISTERED' 
  | 'INITIALIZED' 
  | 'VALIDATED' 
  | 'RUNNING' 
  | 'STOPPED' 
  | 'SHUTDOWN';

export interface ToolMetrics {
  executionCount: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  lastExecutedAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
}

export interface ToolDefinition {
  toolId: string;
  toolName: string;
  version: string;
  description: string;
  status: ToolStatus;
  health: ToolHealth;
  permissions: string[];
  capabilities: string[];
  dependencies: string[];
  owner: string;
  lifecycle: ToolLifecycleStage;
  metrics: ToolMetrics;
  executor: (params: any, context?: any) => Promise<any>;
}

export interface ToolExecutionContext {
  callerId?: string;
  correlationId?: string;
  traceId?: string;
  userId?: string;
}

export interface ToolExecutionResult<T = any> {
  success: boolean;
  toolId: string;
  executionId: string;
  durationMs: number;
  result?: T;
  error?: string;
  timestamp: string;
}

export interface ToolProgressItem {
  toolId: string;
  toolName: string;
  description: string;
  completed: boolean;
  stage: string;
}

export interface ToolProgressReport {
  timestamp: string;
  phase: 'Tooling Infrastructure';
  totalTools: number;
  completedToolsCount: number;
  progressPercentage: number;
  tools: ToolProgressItem[];
  overallStatus: 'IN_PROGRESS' | 'COMPLETED';
}

// ============================================================================
// GURU-XD TOOL REGISTRY ENGINE
// ============================================================================

export class ToolRegistry {
  private static instance: ToolRegistry;
  private toolsMap: Map<string, ToolDefinition> = new Map();
  private eventBus = AppEventBus.getInstance();

  private readonly STANDARD_TOOL_CATALOG: { id: string; name: string; desc: string }[] = [
    { id: 'tool-file-system', name: 'File System Tool', desc: 'Secure read/write/inspect operations for platform filesystem.' },
    { id: 'tool-log-explorer', name: 'Log Explorer Tool', desc: 'Structured query, filter, and trace analysis for Logging Module.' },
    { id: 'tool-system-metrics', name: 'System Metrics Tool', desc: 'Real-time CPU, RAM, Disk, Socket, and latency metrics inspector.' },
    { id: 'tool-http-client', name: 'HTTP Client Tool', desc: 'Secure outbound REST/JSON API execution with tracing headers.' },
    { id: 'tool-health-inspector', name: 'Health Inspector Tool', desc: 'Deep multi-node diagnostic and platform health evaluator.' },
    { id: 'tool-project-search', name: 'Project Search Tool', desc: 'Ast, code, and file pattern matching across GURU-XD project workspace.' },
    { id: 'tool-performance-analyzer', name: 'Performance Analyzer Tool', desc: 'Bottleneck detector, latency profiler, and throughput analyzer.' },
    { id: 'tool-knowledge-graph-query', name: 'Knowledge Graph Query Tool', desc: 'Graph node and edge relation explorer for AI Core.' },
    { id: 'tool-configuration-inspector', name: 'Configuration Inspector Tool', desc: 'Environment, system config, and feature flag validator.' },
    { id: 'tool-permission-inspector', name: 'Permission Inspector Tool', desc: 'RBAC, session token, and security policy verification tool.' }
  ];

  private constructor() {
    loggingService.logStartup('ToolRegistry', { message: 'GURU-XD Internal Tool Registry framework initialized.' });
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Register or Update a Tool in the Registry
   */
  public registerTool(tool: Omit<ToolDefinition, 'status' | 'health' | 'lifecycle' | 'metrics'> & {
    executor: (params: any, context?: any) => Promise<any>;
  }): ToolDefinition {
    const existing = this.toolsMap.get(tool.toolId);

    const fullTool: ToolDefinition = {
      ...tool,
      status: 'ACTIVE',
      health: 'HEALTHY',
      lifecycle: 'RUNNING',
      metrics: existing ? existing.metrics : {
        executionCount: 0,
        successCount: 0,
        errorCount: 0,
        avgLatencyMs: 0,
        lastExecutedAt: null,
        lastErrorAt: null,
        lastErrorMessage: null
      },
      executor: tool.executor
    };

    this.toolsMap.set(tool.toolId, fullTool);

    // Register service with ServiceRegistry
    serviceRegistry.registerService({
      serviceId: `srv-${tool.toolId}`,
      serviceName: tool.toolName,
      version: tool.version,
      description: tool.description,
      status: 'ACTIVE',
      lifecycleState: 'READY',
      health: 100,
      supportedEvents: ['tool.executed'],
      telemetryTypes: ['Plugin Activity', 'Metrics'],
      dependencies: tool.dependencies,
      capabilities: ['Plugins', 'Configuration'],
      registeredAt: new Date().toISOString()
    });

    // Logging & Telemetry
    loggingService.log('info', 'SYSTEM', `Registered tool [${tool.toolId}] (${tool.toolName} v${tool.version})`, {
      toolId: tool.toolId,
      capabilities: tool.capabilities,
      dependencies: tool.dependencies
    }, { serviceSource: 'ToolRegistry' });

    unifiedTelemetryEngine.ingestTelemetry({
      subsystemId: 'SERVICE_REGISTRY',
      category: 'Plugin Activity',
      payload: {
        event: 'TOOL_REGISTERED',
        toolId: tool.toolId,
        toolName: tool.toolName,
        version: tool.version
      },
      metrics: { registeredToolsCount: this.toolsMap.size }
    });

    this.eventBus.publish('TOOL_REGISTERED', { toolId: tool.toolId, toolName: tool.toolName }, undefined, 'ToolRegistry');

    return fullTool;
  }

  /**
   * Execute a Registered Tool
   */
  public async executeTool<T = any>(
    toolId: string,
    params: any,
    context?: ToolExecutionContext
  ): Promise<ToolExecutionResult<T>> {
    const startTime = Date.now();
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const tool = this.toolsMap.get(toolId);

    if (!tool) {
      const errMessage = `Tool [${toolId}] is not registered in Tool Registry.`;
      loggingService.error('SYSTEM', errMessage, { toolId, context });
      return {
        success: false,
        toolId,
        executionId,
        durationMs: Date.now() - startTime,
        error: errMessage,
        timestamp: new Date().toISOString()
      };
    }

    if (tool.status === 'DISABLED' || tool.status === 'SHUTDOWN') {
      const errMessage = `Tool [${toolId}] is currently [${tool.status}] and cannot be executed.`;
      return {
        success: false,
        toolId,
        executionId,
        durationMs: Date.now() - startTime,
        error: errMessage,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const result = await tool.executor(params, context);
      const durationMs = Date.now() - startTime;

      // Update Metrics
      tool.metrics.executionCount += 1;
      tool.metrics.successCount += 1;
      tool.metrics.lastExecutedAt = new Date().toISOString();
      tool.metrics.avgLatencyMs = Math.round(
        (tool.metrics.avgLatencyMs * (tool.metrics.successCount - 1) + durationMs) / tool.metrics.successCount
      );

      // Audit Log & Telemetry
      loggingService.log('info', 'SYSTEM', `Executed tool [${toolId}] successfully (${durationMs}ms)`, {
        toolId,
        executionId,
        durationMs
      }, {
        serviceSource: toolId,
        correlationId: context?.correlationId,
        traceId: context?.traceId,
        durationMs
      });

      unifiedTelemetryEngine.ingestTelemetry({
        subsystemId: 'SERVICE_REGISTRY',
        category: 'Metrics',
        payload: {
          event: 'TOOL_EXECUTED',
          toolId,
          executionId,
          durationMs,
          success: true
        },
        metrics: { latencyMs: durationMs }
      });

      return {
        success: true,
        toolId,
        executionId,
        durationMs,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errMessage = err?.message || 'Tool execution encountered an unknown error';

      tool.metrics.executionCount += 1;
      tool.metrics.errorCount += 1;
      tool.metrics.lastErrorAt = new Date().toISOString();
      tool.metrics.lastErrorMessage = errMessage;
      if (tool.metrics.errorCount > 3) {
        tool.health = 'DEGRADED';
      }

      loggingService.error('SYSTEM', `Failed executing tool [${toolId}]: ${errMessage}`, {
        toolId,
        executionId,
        durationMs,
        error: errMessage
      });

      unifiedTelemetryEngine.ingestTelemetry({
        subsystemId: 'SERVICE_REGISTRY',
        category: 'Errors',
        payload: {
          event: 'TOOL_EXECUTION_FAILED',
          toolId,
          executionId,
          error: errMessage
        },
        metrics: { errorCount: tool.metrics.errorCount }
      });

      return {
        success: false,
        toolId,
        executionId,
        durationMs,
        error: errMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Tool Lifecycle Control: Start, Stop, Disable, Health Check
   */
  public setToolStatus(toolId: string, status: ToolStatus): boolean {
    const tool = this.toolsMap.get(toolId);
    if (!tool) return false;

    tool.status = status;
    tool.lifecycle = status === 'ACTIVE' ? 'RUNNING' : status === 'DISABLED' ? 'STOPPED' : 'SHUTDOWN';
    
    loggingService.notice('SYSTEM', `Tool [${toolId}] status updated to [${status}].`, { toolId, status });
    this.eventBus.publish('TOOL_STATUS_CHANGED', { toolId, status }, undefined, 'ToolRegistry');
    return true;
  }

  public getTool(toolId: string): ToolDefinition | undefined {
    return this.toolsMap.get(toolId);
  }

  public getAllTools(): Omit<ToolDefinition, 'executor'>[] {
    return Array.from(this.toolsMap.values()).map(({ executor, ...rest }) => rest);
  }

  /**
   * Progress Tracking across standard tool infrastructure items
   */
  public getToolProgressReport(): ToolProgressReport {
    const timestamp = new Date().toISOString();
    const progressItems: ToolProgressItem[] = this.STANDARD_TOOL_CATALOG.map(cat => {
      const tool = this.toolsMap.get(cat.id);
      const isCompleted = !!tool && tool.status === 'ACTIVE';
      return {
        toolId: cat.id,
        toolName: cat.name,
        description: cat.desc,
        completed: isCompleted,
        stage: isCompleted ? 'COMPLETED' : 'PENDING'
      };
    });

    const completedCount = progressItems.filter(p => p.completed).length;
    const progressPercentage = Math.round((completedCount / this.STANDARD_TOOL_CATALOG.length) * 100);

    return {
      timestamp,
      phase: 'Tooling Infrastructure',
      totalTools: this.STANDARD_TOOL_CATALOG.length,
      completedToolsCount: completedCount,
      progressPercentage,
      tools: progressItems,
      overallStatus: completedCount === this.STANDARD_TOOL_CATALOG.length ? 'COMPLETED' : 'IN_PROGRESS'
    };
  }
}

export const toolRegistry = ToolRegistry.getInstance();

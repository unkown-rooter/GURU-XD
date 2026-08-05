import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';
import { loggingService, LogFilter, LogEntry, DiagnosticReport } from '../services/loggingService';

export interface LogExplorerParams {
  action: 'query' | 'diagnostics' | 'relationships' | 'alerts';
  filter?: LogFilter;
  limit?: number;
}

export interface LogExplorerResult {
  action: string;
  totalFound?: number;
  logs?: LogEntry[];
  diagnostics?: DiagnosticReport;
  relationships?: any[];
  alerts?: any[];
  timestamp: string;
}

export async function executeLogExplorerTool(
  params: LogExplorerParams,
  context?: ToolExecutionContext
): Promise<LogExplorerResult> {
  const { action, filter = {}, limit = 100 } = params;
  const timestamp = new Date().toISOString();

  switch (action) {
    case 'query': {
      const logs = loggingService.queryLogs(filter, limit);
      return {
        action,
        totalFound: logs.length,
        logs,
        timestamp
      };
    }

    case 'diagnostics': {
      const diagnostics = loggingService.runDiagnostics();
      return {
        action,
        diagnostics,
        timestamp
      };
    }

    case 'relationships': {
      const relationships = loggingService.getComponentRelationships();
      return {
        action,
        totalFound: relationships.length,
        relationships,
        timestamp
      };
    }

    case 'alerts': {
      const alerts = loggingService.getActiveAlerts();
      return {
        action,
        totalFound: alerts.length,
        alerts,
        timestamp
      };
    }

    default:
      throw new Error(`Unsupported LogExplorerTool action: [${action}]`);
  }
}

// Register Tool 2: Log Explorer Tool
toolRegistry.registerTool({
  toolId: 'tool-log-explorer',
  toolName: 'Log Explorer Tool',
  version: '1.0.0',
  description: 'Structured log query, diagnostic inspection, and relationship tracing tool.',
  permissions: ['LOGS_READ', 'DIAGNOSTICS_EXECUTE'],
  capabilities: ['LogQuery', 'Diagnostics', 'RelationshipTracing'],
  dependencies: ['loggingService'],
  owner: 'GURU-XD AI Core',
  executor: executeLogExplorerTool
});

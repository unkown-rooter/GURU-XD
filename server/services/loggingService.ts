import { AppEventBus } from './eventBus';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogCategory = 
  | 'HTTP' 
  | 'AI' 
  | 'DEPLOYMENT' 
  | 'AUDIT' 
  | 'SECURITY' 
  | 'PERFORMANCE' 
  | 'DATABASE' 
  | 'SYSTEM' 
  | 'EVENT_BUS';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  serviceSource: string;
  correlationId?: string;
  traceId?: string;
  metadata?: Record<string, any>;
}

export interface LogFilter {
  category?: LogCategory;
  level?: LogLevel;
  minLevel?: LogLevel;
  serviceSource?: string;
  searchQuery?: string;
  startTime?: string;
  endTime?: string;
  correlationId?: string;
}

export interface LogRotationChunk {
  chunkId: string;
  createdAt: string;
  logCount: number;
  oldestLogTimestamp: string;
  newestLogTimestamp: string;
  sizeBytes: number;
}

export class LoggingService {
  private static instance: LoggingService;
  private logs: LogEntry[] = [];
  private archivedChunks: LogRotationChunk[] = [];
  private archivedLogStore: Map<string, LogEntry[]> = new Map();
  private maxInMemoryLogs: number = 5000;
  private eventBus = AppEventBus.getInstance();
  private levelWeight: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    fatal: 50
  };

  private constructor() {
    this.logSystem('Logging Engine Initialized (Structured, Multi-Domain & Rotated Log System)');
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  // ----------------------------------------------------
  // CORE STRUCTURED LOGGING
  // ----------------------------------------------------

  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    options?: { serviceSource?: string; correlationId?: string; traceId?: string }
  ): LogEntry {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      serviceSource: options?.serviceSource || 'CoreSystem',
      correlationId: options?.correlationId || metadata?.correlationId,
      traceId: options?.traceId || metadata?.traceId,
      metadata
    };

    this.logs.unshift(entry);

    // Trigger log rotation if buffer reaches limit
    if (this.logs.length > this.maxInMemoryLogs) {
      this.rotateLogs();
    }

    // Trigger EventBus alert for high severity
    if (level === 'error' || level === 'fatal') {
      this.eventBus.publish('LOG_ALERT_TRIGGERED', {
        logId: entry.id,
        level: entry.level,
        category: entry.category,
        message: entry.message,
        source: entry.serviceSource
      }, undefined, 'LoggingService');
    }

    return entry;
  }

  // Helper log wrappers
  public debug(category: LogCategory, message: string, metadata?: Record<string, any>): LogEntry {
    return this.log('debug', category, message, metadata);
  }

  public info(category: LogCategory, message: string, metadata?: Record<string, any>): LogEntry {
    return this.log('info', category, message, metadata);
  }

  public warn(category: LogCategory, message: string, metadata?: Record<string, any>): LogEntry {
    return this.log('warn', category, message, metadata);
  }

  public error(category: LogCategory, message: string, metadata?: Record<string, any>): LogEntry {
    return this.log('error', category, message, metadata);
  }

  public fatal(category: LogCategory, message: string, metadata?: Record<string, any>): LogEntry {
    return this.log('fatal', category, message, metadata);
  }

  // ----------------------------------------------------
  // DOMAIN-SPECIFIC LOGGERS
  // ----------------------------------------------------

  public logRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    metadata?: Record<string, any>
  ): LogEntry {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    return this.log(level, 'HTTP', `${method} ${path} -> ${statusCode} (${durationMs}ms)`, {
      method,
      path,
      statusCode,
      durationMs,
      ...metadata
    }, { serviceSource: 'APIGateway' });
  }

  public logAIOperation(
    model: string,
    promptTokens: number,
    completionTokens: number,
    latencyMs: number,
    status: 'success' | 'failed',
    details?: Record<string, any>
  ): LogEntry {
    const level: LogLevel = status === 'failed' ? 'error' : 'info';
    return this.log(level, 'AI', `AI Operation [${model}] completed in ${latencyMs}ms (${promptTokens + completionTokens} tokens)`, {
      model,
      promptTokens,
      completionTokens,
      latencyMs,
      status,
      ...details
    }, { serviceSource: 'AIEngine' });
  }

  public logDeploymentEvent(
    deploymentId: string,
    phase: string,
    status: 'started' | 'completed' | 'failed' | 'rollback',
    message: string,
    details?: Record<string, any>
  ): LogEntry {
    const level: LogLevel = status === 'failed' ? 'error' : status === 'rollback' ? 'warn' : 'info';
    return this.log(level, 'DEPLOYMENT', `Deployment [${deploymentId}] phase [${phase}] - ${message}`, {
      deploymentId,
      phase,
      status,
      ...details
    }, { serviceSource: 'DeploymentPipeline' });
  }

  public logAuditEvent(
    actor: string,
    action: string,
    target: string,
    status: 'success' | 'failed' | 'blocked',
    metadata?: Record<string, any>
  ): LogEntry {
    const level: LogLevel = status === 'blocked' ? 'error' : status === 'failed' ? 'warn' : 'info';
    return this.log(level, 'AUDIT', `Audit Event: ${actor} -> ${action} on ${target} (${status})`, {
      actor,
      action,
      target,
      status,
      ...metadata
    }, { serviceSource: 'AuditService' });
  }

  public logError(err: Error | string, context: string, metadata?: Record<string, any>): LogEntry {
    const errMessage = typeof err === 'string' ? err : err.message;
    const stack = typeof err === 'string' ? undefined : err.stack;
    return this.log('error', 'SYSTEM', `Error in ${context}: ${errMessage}`, {
      context,
      errorStack: stack,
      ...metadata
    }, { serviceSource: context });
  }

  public logPerformanceMetric(
    metricName: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): LogEntry {
    return this.log('info', 'PERFORMANCE', `Metric [${metricName}]: ${value} ${unit}`, {
      metricName,
      value,
      unit,
      tags
    }, { serviceSource: 'PerformanceEngine' });
  }

  public logSystem(message: string, metadata?: Record<string, any>): LogEntry {
    return this.log('info', 'SYSTEM', message, metadata, { serviceSource: 'CoreSystem' });
  }

  // ----------------------------------------------------
  // SEARCH, FILTERING & RETENTION
  // ----------------------------------------------------

  public queryLogs(filter: LogFilter, limit: number = 200): LogEntry[] {
    const minWeight = filter.minLevel ? this.levelWeight[filter.minLevel] : 0;
    const query = filter.searchQuery?.toLowerCase();

    return this.logs
      .filter(l => {
        if (filter.category && l.category !== filter.category) return false;
        if (filter.level && l.level !== filter.level) return false;
        if (filter.minLevel && this.levelWeight[l.level] < minWeight) return false;
        if (filter.serviceSource && l.serviceSource.toLowerCase() !== filter.serviceSource.toLowerCase()) return false;
        if (filter.correlationId && l.correlationId !== filter.correlationId) return false;
        if (filter.startTime && new Date(l.timestamp).getTime() < new Date(filter.startTime).getTime()) return false;
        if (filter.endTime && new Date(l.timestamp).getTime() > new Date(filter.endTime).getTime()) return false;
        if (query && !l.message.toLowerCase().includes(query) && !JSON.stringify(l.metadata || {}).toLowerCase().includes(query)) return false;
        return true;
      })
      .slice(0, limit);
  }

  public enforceRetentionPolicy(daysToKeep: number = 14): { removedCount: number } {
    const cutoffMs = Date.now() - daysToKeep * 86400000;
    const initialCount = this.logs.length;

    this.logs = this.logs.filter(l => new Date(l.timestamp).getTime() >= cutoffMs);
    const removedCount = initialCount - this.logs.length;

    this.logSystem(`Log Retention Policy Enforced (${daysToKeep} days). Expired entries purged: ${removedCount}`);
    return { removedCount };
  }

  // ----------------------------------------------------
  // LOG ROTATION & EXPORT
  // ----------------------------------------------------

  public rotateLogs(): LogRotationChunk {
    const overflowCount = Math.floor(this.maxInMemoryLogs * 0.3); // rotate oldest 30%
    const logsToArchive = this.logs.splice(this.logs.length - overflowCount, overflowCount);

    const chunkId = `chunk-${Date.now()}`;
    const oldestLogTimestamp = logsToArchive[logsToArchive.length - 1]?.timestamp || new Date().toISOString();
    const newestLogTimestamp = logsToArchive[0]?.timestamp || new Date().toISOString();
    const rawJson = JSON.stringify(logsToArchive);

    const chunk: LogRotationChunk = {
      chunkId,
      createdAt: new Date().toISOString(),
      logCount: logsToArchive.length,
      oldestLogTimestamp,
      newestLogTimestamp,
      sizeBytes: rawJson.length * 2
    };

    this.archivedChunks.unshift(chunk);
    this.archivedLogStore.set(chunkId, logsToArchive);

    if (this.archivedChunks.length > 50) {
      const removed = this.archivedChunks.pop();
      if (removed) this.archivedLogStore.delete(removed.chunkId);
    }

    return chunk;
  }

  public getArchivedChunks(): LogRotationChunk[] {
    return [...this.archivedChunks];
  }

  public exportLogsJSON(filter?: LogFilter, limit: number = 1000): string {
    const result = this.queryLogs(filter || {}, limit);
    return JSON.stringify(result, null, 2);
  }

  public exportLogsCSV(filter?: LogFilter, limit: number = 1000): string {
    const result = this.queryLogs(filter || {}, limit);
    const header = 'ID,Timestamp,Level,Category,Source,Message,CorrelationID\n';
    const rows = result.map(l =>
      `"${l.id}","${l.timestamp}","${l.level}","${l.category}","${l.serviceSource}","${l.message.replace(/"/g, '""')}","${l.correlationId || ''}"`
    ).join('\n');
    return header + rows;
  }
}

export const loggingService = LoggingService.getInstance();

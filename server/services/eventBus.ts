import { EventEmitter } from 'events';

export type AppEventType = 
  | 'APP_CREATED'
  | 'APP_UPDATED'
  | 'APP_STARTED'
  | 'APP_STOPPED'
  | 'APP_RESTARTED'
  | 'APP_DELETED'
  | 'DEPLOYMENT_REQUESTED'
  | 'DEPLOYMENT_STARTED'
  | 'DEPLOYMENT_COMPLETED'
  | 'DEPLOYMENT_FAILED'
  | 'DEPLOYMENT_ROLLED_BACK'
  | 'HEALTH_CHANGED'
  | 'RESOURCE_USAGE_UPDATED'
  | 'CONFIGURATION_CHANGED'
  | 'SECRET_UPDATED'
  | 'ENVIRONMENT_CONFIG_CHANGED'
  | 'SSL_CERT_RENEWED'
  | 'SSL_CERT_EXPIRING'
  | 'DOMAIN_VERIFIED'
  | 'DOMAIN_HEALTH_ALERT'
  | 'HEALTH_CHECK_FAILED'
  | 'PERFORMANCE_BOTTLENECK_DETECTED'
  | 'LOG_ALERT_TRIGGERED'
  | 'USER_INTERACTION_RECORDED'
  | 'BACKUP_COMPLETED'
  | 'BACKUP_FAILED'
  | 'RECOVERY_STARTED'
  | 'RECOVERY_COMPLETED'
  | 'RECOVERY_FAILED'
  | 'STRATEGY_TRANSITION_STARTED'
  | 'STRATEGY_TRANSITION_COMPLETED'
  | 'PIPELINE_EXECUTED'
  | 'SECURITY_AUDIT_COMPLETED'
  | 'RELEASE_CREATED'
  | 'RELEASE_APPROVED'
  | 'NOTIFICATION_DISPATCHED'
  | 'ENVIRONMENT_PROMOTED'
  | 'DEPLOYMENT_VALIDATED'
  | 'DEPLOYMENT_VALIDATION_FAILED'
  | 'SECURITY_ALERT_GENERATED'
  | 'OBSERVATION_RECORDED'
  | 'AUTOMATION_TRIGGERED'
  | 'ADAPTATION_PROPOSED';

export type EventPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface AppEvent<T = any> {
  id: string;
  type: AppEventType | string;
  appId?: string;
  timestamp: string;
  payload: T;
  source: string;
  version?: string;
  priority?: EventPriority;
  correlationId?: string;
  traceId?: string;
  metadata?: Record<string, any>;
}

export type AppEventListener<T = any> = (event: AppEvent<T>) => void | Promise<void>;

export interface DeadLetterEntry {
  event: AppEvent;
  error: string;
  failedAt: string;
  retryCount: number;
}

export interface EventMetrics {
  totalPublished: number;
  totalDelivered: number;
  totalFailed: number;
  deadLetterCount: number;
  avgDeliveryDurationMs: number;
  eventsPerMinute: number;
}

export class AppEventBus {
  private static instance: AppEventBus;
  private emitter: EventEmitter;
  private eventHistory: AppEvent[] = [];
  private readonly maxHistorySize = 1000;

  // Version 2 Platform Extension Properties
  private deadLetterQueue: DeadLetterEntry[] = [];
  private aiLearningHooks: Set<(event: AppEvent) => void> = new Set();
  private metrics: EventMetrics = {
    totalPublished: 0,
    totalDelivered: 0,
    totalFailed: 0,
    deadLetterCount: 0,
    avgDeliveryDurationMs: 0.1,
    eventsPerMinute: 0
  };

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  public static getInstance(): AppEventBus {
    if (!AppEventBus.instance) {
      AppEventBus.instance = new AppEventBus();
    }
    return AppEventBus.instance;
  }

  public publish<T = any>(
    type: AppEventType | string,
    payload: T,
    appId?: string,
    source: string = 'system',
    options?: {
      priority?: EventPriority;
      correlationId?: string;
      traceId?: string;
      metadata?: Record<string, any>;
      version?: string;
    }
  ): AppEvent<T> {
    const start = Date.now();
    const event: AppEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      appId,
      timestamp: new Date().toISOString(),
      payload,
      source,
      version: options?.version || '2.0.0',
      priority: options?.priority || 'NORMAL',
      correlationId: options?.correlationId || `corr-${Date.now()}`,
      traceId: options?.traceId || `trace-${Math.random().toString(36).substr(2, 8)}`,
      metadata: options?.metadata
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    this.metrics.totalPublished += 1;

    // Dispatch to subscribers
    try {
      this.emitter.emit(type, event);
      this.emitter.emit('*', event);
      this.metrics.totalDelivered += 1;
    } catch (err: any) {
      this.metrics.totalFailed += 1;
      this.recordDeadLetter(event, err.message || 'Error executing event listener');
    }

    // Trigger AI Learning Hooks asynchronously
    this.triggerAILearningHooks(event);

    const duration = Date.now() - start;
    this.metrics.avgDeliveryDurationMs = (this.metrics.avgDeliveryDurationMs + duration) / 2;

    return event;
  }

  public subscribe<T = any>(type: AppEventType | string | '*', listener: AppEventListener<T>): () => void {
    const wrappedListener = async (event: AppEvent<T>) => {
      try {
        await listener(event);
      } catch (err: any) {
        this.metrics.totalFailed += 1;
        this.recordDeadLetter(event, err.message || 'Async listener failure');
      }
    };

    this.emitter.on(type, wrappedListener);
    return () => {
      this.emitter.off(type, wrappedListener);
    };
  }

  public getHistory(appId?: string, limit: number = 50): AppEvent[] {
    let filtered = this.eventHistory;
    if (appId) {
      filtered = filtered.filter(e => e.appId === appId);
    }
    return filtered.slice(-limit).reverse();
  }

  // ============================================================================
  // VERSION 2 EXTENDED ENGINE BUS CAPABILITIES
  // ============================================================================

  /**
   * Dead Letter Queue & Retry Management
   */
  private recordDeadLetter(event: AppEvent, error: string) {
    const entry: DeadLetterEntry = {
      event,
      error,
      failedAt: new Date().toISOString(),
      retryCount: 0
    };
    this.deadLetterQueue.push(entry);
    if (this.deadLetterQueue.length > 500) {
      this.deadLetterQueue.shift();
    }
    this.metrics.deadLetterCount = this.deadLetterQueue.length;
  }

  public getDeadLetterQueue(): DeadLetterEntry[] {
    return [...this.deadLetterQueue];
  }

  public retryDeadLetter(eventId: string): boolean {
    const idx = this.deadLetterQueue.findIndex(e => e.event.id === eventId);
    if (idx === -1) return false;
    const entry = this.deadLetterQueue[idx];
    entry.retryCount += 1;

    try {
      this.emitter.emit(entry.event.type, entry.event);
      this.emitter.emit('*', entry.event);
      this.deadLetterQueue.splice(idx, 1);
      this.metrics.deadLetterCount = this.deadLetterQueue.length;
      return true;
    } catch (err: any) {
      entry.error = `Retry failed: ${err.message}`;
      return false;
    }
  }

  public clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
    this.metrics.deadLetterCount = 0;
  }

  /**
   * Event Replay Operations
   */
  public replayEvents(options?: {
    appId?: string;
    eventTypes?: string[];
    startTime?: string;
    endTime?: string;
  }): AppEvent[] {
    let eventsToReplay = [...this.eventHistory];

    if (options?.appId) {
      eventsToReplay = eventsToReplay.filter(e => e.appId === options.appId);
    }
    if (options?.eventTypes && options.eventTypes.length > 0) {
      eventsToReplay = eventsToReplay.filter(e => options.eventTypes!.includes(e.type));
    }
    if (options?.startTime) {
      const startMs = new Date(options.startTime).getTime();
      eventsToReplay = eventsToReplay.filter(e => new Date(e.timestamp).getTime() >= startMs);
    }
    if (options?.endTime) {
      const endMs = new Date(options.endTime).getTime();
      eventsToReplay = eventsToReplay.filter(e => new Date(e.timestamp).getTime() <= endMs);
    }

    eventsToReplay.forEach(evt => {
      this.emitter.emit(evt.type, evt);
      this.emitter.emit('*', evt);
    });

    return eventsToReplay;
  }

  /**
   * AI Learning Hooks & Integrations
   */
  public registerAILearningHook(hook: (event: AppEvent) => void): () => void {
    this.aiLearningHooks.add(hook);
    return () => {
      this.aiLearningHooks.delete(hook);
    };
  }

  private triggerAILearningHooks(event: AppEvent) {
    this.aiLearningHooks.forEach(hook => {
      try {
        hook(event);
      } catch (err) {
        console.error('[EVENT BUS] AI Learning hook error:', err);
      }
    });
  }

  /**
   * Event Metrics & Distributed Protocol Readiness Helpers
   */
  public getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  public serializeEvent(event: AppEvent): string {
    return JSON.stringify(event);
  }

  public deserializeEvent(rawJson: string): AppEvent | null {
    try {
      return JSON.parse(rawJson);
    } catch (e) {
      return null;
    }
  }
}

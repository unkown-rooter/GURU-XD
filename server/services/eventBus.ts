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

export type ListenerStatus = 'active' | 'paused' | 'disabled' | 'error';
export type ListenerHealth = 'healthy' | 'degraded' | 'unhealthy';

export interface ListenerOptions {
  id?: string;
  name: string;
  module: string;
  version?: string;
  eventTypes: (AppEventType | string | '*')[];
  priority?: EventPriority;
  description?: string;
}

export interface RegisteredListener<T = any> {
  id: string;
  name: string;
  module: string;
  version: string;
  status: ListenerStatus;
  health: ListenerHealth;
  eventTypes: (AppEventType | string | '*')[];
  priority: EventPriority;
  description?: string;
  handler: AppEventListener<T>;
  registeredAt: string;
  lastExecutedAt?: string;
  metrics: {
    totalExecutions: number;
    totalErrors: number;
    avgExecutionDurationMs: number;
    lastExecutionDurationMs?: number;
    lastExecutedAt?: string;
    lastError?: string;
    lastErrorMsg?: string;
  };
}

export interface EventDefinition {
  type: AppEventType | string;
  category: string;
  version: string;
  priority: EventPriority;
  description?: string;
  schemaValidation?: (payload: any) => boolean;
}

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
  activeListenersCount: number;
  totalListenersCount: number;
}

export class AppEventBus {
  private static instance: AppEventBus;
  private emitter: EventEmitter;
  private eventHistory: AppEvent[] = [];
  private readonly maxHistorySize = 1000;

  // Managed Listener & Event Registries
  private listenerRegistry: Map<string, RegisteredListener> = new Map();
  private eventRegistry: Map<string, EventDefinition> = new Map();

  // Version 2 Platform Extension Properties
  private deadLetterQueue: DeadLetterEntry[] = [];
  private aiLearningHooks: Set<(event: AppEvent) => void> = new Set();
  private metrics: EventMetrics = {
    totalPublished: 0,
    totalDelivered: 0,
    totalFailed: 0,
    deadLetterCount: 0,
    avgDeliveryDurationMs: 0.1,
    eventsPerMinute: 0,
    activeListenersCount: 0,
    totalListenersCount: 0
  };

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(200);
    this.registerDefaultSystemEvents();
    this.registerDefaultSystemListeners();
  }

  public static getInstance(): AppEventBus {
    if (!AppEventBus.instance) {
      AppEventBus.instance = new AppEventBus();
    }
    return AppEventBus.instance;
  }

  private registerDefaultSystemEvents(): void {
    const defaults: EventDefinition[] = [
      { type: 'USER_LOGIN', category: 'Security', version: '1.0.0', priority: 'CRITICAL', description: 'User session authentication event' },
      { type: 'SECURITY_ALERT', category: 'Security', version: '1.0.0', priority: 'CRITICAL', description: 'Real-time threat detection alert' },
      { type: 'DEPLOYMENT_SUCCESS', category: 'Infrastructure', version: '1.0.0', priority: 'HIGH', description: 'Successful pipeline deployment trigger' },
      { type: 'DEPLOYMENT_FAILED', category: 'Infrastructure', version: '1.0.0', priority: 'HIGH', description: 'Pipeline execution failure alert' },
      { type: 'BOT_COMMAND', category: 'Core Platform', version: '1.0.0', priority: 'NORMAL', description: 'Inbound bot instruction command' },
      { type: 'TELEMETRY_RECORD', category: 'Diagnostics', version: '1.0.0', priority: 'LOW', description: 'System health telemetry heartbeat' }
    ];
    defaults.forEach(def => this.registerEvent(def));
  }

  private registerDefaultSystemListeners(): void {
    this.registerListener(
      {
        id: 'listener-audit-log-worker',
        name: 'AuditLogWorker',
        module: 'audit-service',
        version: '1.2.0',
        priority: 'HIGH',
        eventTypes: ['*'],
        description: 'Global audit stream recorder and persistence engine'
      },
      async (evt) => {
        // Simulated audit stream processing
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 8) + 2));
      }
    );

    this.registerListener(
      {
        id: 'listener-security-guard',
        name: 'SecurityAnalystGuard',
        module: 'security-analyst',
        version: '2.0.0',
        priority: 'CRITICAL',
        eventTypes: ['USER_LOGIN', 'SECURITY_ALERT', 'AUTH_FAILURE'],
        description: 'Monitors threat vectors and triggers security isolation policies'
      },
      async (evt) => {
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 12) + 4));
        if (evt.type === 'SECURITY_ALERT' && evt.payload?.triggerError) {
          throw new Error("Security Policy Exception: Inbound payload failed threat verification check.");
        }
      }
    );

    this.registerListener(
      {
        id: 'listener-behavior-engine',
        name: 'BehaviorLearningEngine',
        module: 'behavior-engine',
        version: '1.5.0',
        priority: 'NORMAL',
        eventTypes: ['BOT_COMMAND', 'API_REQUEST', 'USER_ACTION'],
        description: 'Analyzes behavioral spikes and updates dynamic execution baselines'
      },
      async (evt) => {
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 6) + 3));
      }
    );

    this.registerListener(
      {
        id: 'listener-notification-dispatcher',
        name: 'NotificationService',
        module: 'notification-service',
        version: '1.1.0',
        priority: 'HIGH',
        eventTypes: ['DEPLOYMENT_SUCCESS', 'DEPLOYMENT_FAILED', 'SECURITY_ALERT'],
        description: 'Dispatches alerts to configured webhooks and admin channels'
      },
      async (evt) => {
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 10) + 5));
      }
    );

    this.registerListener(
      {
        id: 'listener-telemetry-collector',
        name: 'TelemetryCollector',
        module: 'telemetry-collector',
        version: '1.0.0',
        priority: 'LOW',
        eventTypes: ['TELEMETRY_RECORD', 'METRIC_UPDATE'],
        description: 'Aggregates real-time execution statistics and resource metrics'
      },
      async (evt) => {
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 4) + 1));
      }
    );
  }

  // ============================================================================
  // EVENT REGISTRY & VALIDATION
  // ============================================================================

  public registerEvent(definition: EventDefinition): void {
    this.eventRegistry.set(definition.type, definition);
  }

  public getEventDefinition(type: string): EventDefinition | undefined {
    return this.eventRegistry.get(type);
  }

  public getEventDefinitions(): EventDefinition[] {
    return Array.from(this.eventRegistry.values());
  }

  public validateEvent(type: string, payload: any): { valid: boolean; reason?: string } {
    const def = this.eventRegistry.get(type);
    if (!def) {
      return { valid: true }; // Permissive for non-registered legacy events
    }
    if (def.schemaValidation) {
      try {
        const isValid = def.schemaValidation(payload);
        return { valid: isValid, reason: isValid ? undefined : 'Payload failed schema validation' };
      } catch (e: any) {
        return { valid: false, reason: e.message || 'Validation error' };
      }
    }
    return { valid: true };
  }

  // ============================================================================
  // LISTENER MANAGEMENT & REGISTRY
  // ============================================================================

  public registerListener<T = any>(
    options: ListenerOptions,
    handler: AppEventListener<T>
  ): () => void {
    const id = options.id || `listener-${options.module}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const listener: RegisteredListener<T> = {
      id,
      name: options.name,
      module: options.module,
      version: options.version || '1.0.0',
      status: 'active',
      health: 'healthy',
      eventTypes: options.eventTypes,
      priority: options.priority || 'NORMAL',
      description: options.description,
      handler,
      registeredAt: new Date().toISOString(),
      metrics: {
        totalExecutions: 0,
        totalErrors: 0,
        avgExecutionDurationMs: 0,
        lastExecutionDurationMs: 0
      }
    };

    this.listenerRegistry.set(id, listener);
    this.updateListenerCounts();

    return () => this.unregisterListener(id);
  }

  public unregisterListener(id: string): boolean {
    const existed = this.listenerRegistry.delete(id);
    if (existed) {
      this.updateListenerCounts();
    }
    return existed;
  }

  public pauseListener(id: string): boolean {
    const listener = this.listenerRegistry.get(id);
    if (listener) {
      listener.status = 'paused';
      this.updateListenerCounts();
      return true;
    }
    return false;
  }

  public resumeListener(id: string): boolean {
    const listener = this.listenerRegistry.get(id);
    if (listener) {
      listener.status = 'active';
      this.updateListenerCounts();
      return true;
    }
    return false;
  }

  public disableListener(id: string): boolean {
    const listener = this.listenerRegistry.get(id);
    if (listener) {
      listener.status = 'disabled';
      this.updateListenerCounts();
      return true;
    }
    return false;
  }

  public enableListener(id: string): boolean {
    return this.resumeListener(id);
  }

  public getListeners(): RegisteredListener[] {
    return Array.from(this.listenerRegistry.values()).map(l => ({
      ...l,
      status: (l.status || 'active').toUpperCase() as any,
      health: (l.health || 'healthy').toUpperCase() as any,
      handler: undefined as any // Omit handler in introspection queries
    }));
  }

  public getListenerById(id: string): RegisteredListener | undefined {
    const listener = this.listenerRegistry.get(id);
    if (!listener) return undefined;
    return {
      ...listener,
      status: (listener.status || 'active').toUpperCase() as any,
      health: (listener.health || 'healthy').toUpperCase() as any,
      handler: undefined as any
    };
  }

  private updateListenerCounts() {
    let active = 0;
    this.listenerRegistry.forEach(l => {
      if (l.status === 'active') active++;
    });
    this.metrics.totalListenersCount = this.listenerRegistry.size;
    this.metrics.activeListenersCount = active;
  }

  // ============================================================================
  // EVENT PUBLISHING & DISPATCHING
  // ============================================================================

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

    // Validate payload against Event Registry if configured
    const validation = this.validateEvent(type, payload);
    if (!validation.valid) {
      console.warn(`[EVENT BUS] Event validation failed for ${type}: ${validation.reason}`);
    }

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

    // 1. Dispatch through EventEmitter (for backward compatibility)
    try {
      this.emitter.emit(type, event);
      this.emitter.emit('*', event);
    } catch (err: any) {
      this.metrics.totalFailed += 1;
      this.recordDeadLetter(event, err.message || 'Error executing native event listener');
    }

    // 2. Dispatch through Managed Listener Registry (sorted by priority)
    this.dispatchToManagedListeners(event);

    // Trigger AI Learning Hooks asynchronously
    this.triggerAILearningHooks(event);

    const duration = Date.now() - start;
    this.metrics.avgDeliveryDurationMs = (this.metrics.avgDeliveryDurationMs + duration) / 2;

    return event;
  }

  private async dispatchToManagedListeners(event: AppEvent) {
    const priorityWeight: Record<EventPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1
    };

    const matchingListeners = Array.from(this.listenerRegistry.values())
      .filter(l => {
        const statusLower = (l.status || '').toLowerCase();
        return statusLower === 'active' && (l.eventTypes.includes(event.type) || l.eventTypes.includes('*'));
      })
      .sort((a, b) => (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2));

    for (const listener of matchingListeners) {
      const execStart = performance.now();
      const nowIso = new Date().toISOString();
      try {
        await listener.handler(event);
        const execDuration = Math.max(0.01, Math.round((performance.now() - execStart) * 100) / 100);
        
        listener.metrics.totalExecutions += 1;
        listener.lastExecutedAt = nowIso;
        listener.metrics.lastExecutedAt = nowIso;
        listener.metrics.lastExecutionDurationMs = execDuration;
        
        // Exact cumulative moving average
        const n = listener.metrics.totalExecutions;
        listener.metrics.avgExecutionDurationMs = 
          Math.round(((listener.metrics.avgExecutionDurationMs * (n - 1) + execDuration) / n) * 100) / 100;

        // Recalculate health based on error rate
        const errorRate = listener.metrics.totalErrors / Math.max(1, listener.metrics.totalExecutions);
        if (errorRate === 0) listener.health = 'healthy';
        else if (errorRate < 0.2) listener.health = 'degraded';
        else listener.health = 'unhealthy';

        this.metrics.totalDelivered += 1;
      } catch (err: any) {
        const execDuration = Math.max(0.01, Math.round((performance.now() - execStart) * 100) / 100);
        const errorMsg = err.message || 'Listener execution exception';
        
        listener.metrics.totalExecutions += 1;
        listener.metrics.totalErrors += 1;
        listener.lastExecutedAt = nowIso;
        listener.metrics.lastExecutedAt = nowIso;
        listener.metrics.lastExecutionDurationMs = execDuration;
        listener.metrics.lastError = errorMsg;
        listener.metrics.lastErrorMsg = errorMsg;

        const n = listener.metrics.totalExecutions;
        listener.metrics.avgExecutionDurationMs = 
          Math.round(((listener.metrics.avgExecutionDurationMs * (n - 1) + execDuration) / n) * 100) / 100;

        const errorRate = listener.metrics.totalErrors / Math.max(1, listener.metrics.totalExecutions);
        if (errorRate < 0.2) listener.health = 'degraded';
        else listener.health = 'unhealthy';

        this.metrics.totalFailed += 1;
        this.recordDeadLetter(event, `[Listener: ${listener.name}] ${errorMsg}`);
      }
    }
  }

  public subscribe<T = any>(type: AppEventType | string | '*', listener: AppEventListener<T>): () => void {
    // Wrap subscriber in Managed Listener Registry for 100% backward compatibility & full visibility
    return this.registerListener(
      {
        name: `legacy-subscriber-${type}`,
        module: 'legacy-adapter',
        eventTypes: [type],
        priority: 'NORMAL'
      },
      listener
    );
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
      this.dispatchToManagedListeners(entry.event);
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
      this.dispatchToManagedListeners(evt);
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


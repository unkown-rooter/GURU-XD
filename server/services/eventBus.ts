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

export interface AppEvent<T = any> {
  id: string;
  type: AppEventType;
  appId?: string;
  timestamp: string;
  payload: T;
  source: string;
}

export type AppEventListener<T = any> = (event: AppEvent<T>) => void | Promise<void>;

export class AppEventBus {
  private static instance: AppEventBus;
  private emitter: EventEmitter;
  private eventHistory: AppEvent[] = [];
  private readonly maxHistorySize = 1000;

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

  public publish<T = any>(type: AppEventType, payload: T, appId?: string, source: string = 'system'): AppEvent<T> {
    const event: AppEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      appId,
      timestamp: new Date().toISOString(),
      payload,
      source
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Dispatch to subscribers
    this.emitter.emit(type, event);
    this.emitter.emit('*', event);

    return event;
  }

  public subscribe<T = any>(type: AppEventType | '*', listener: AppEventListener<T>): () => void {
    this.emitter.on(type, listener);
    return () => {
      this.emitter.off(type, listener);
    };
  }

  public getHistory(appId?: string, limit: number = 50): AppEvent[] {
    let filtered = this.eventHistory;
    if (appId) {
      filtered = filtered.filter(e => e.appId === appId);
    }
    return filtered.slice(-limit).reverse();
  }
}

import { AppEventBus, AppEvent } from './eventBus';

export type NotificationChannel = 'in_app' | 'email' | 'webhook' | 'push' | 'sms';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  timestamp: string;
  appId?: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  read: boolean;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  recipient?: string;
  delivered?: boolean;
}

export interface NotificationChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  destination?: string; // e.g. webhook URL or email address
  minSeverity: 'info' | 'warning' | 'critical';
}

export interface NotificationDispatchStatus {
  notificationId: string;
  channel: NotificationChannel;
  status: 'sent' | 'queued' | 'failed';
  attempts: number;
  lastAttemptAt: string;
  errorMessage?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: AppNotification[] = [];
  private dispatchQueue: AppNotification[] = [];
  private dispatchLogs: NotificationDispatchStatus[] = [];
  private channelConfigs: Map<NotificationChannel, NotificationChannelConfig> = new Map();
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.initializeDefaultChannels();
    this.listenToEvents();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private initializeDefaultChannels() {
    const defaults: NotificationChannelConfig[] = [
      { channel: 'in_app', enabled: true, minSeverity: 'info' },
      { channel: 'email', enabled: true, destination: 'admin@guru.internal', minSeverity: 'warning' },
      { channel: 'webhook', enabled: true, destination: 'https://hooks.guru.internal/alerts', minSeverity: 'warning' },
      { channel: 'push', enabled: false, minSeverity: 'critical' },
      { channel: 'sms', enabled: false, destination: '+15550199283', minSeverity: 'critical' }
    ];

    defaults.forEach(c => this.channelConfigs.set(c.channel, c));
  }

  private listenToEvents() {
    this.eventBus.subscribe('SECURITY_ALERT_GENERATED', (evt: AppEvent) => {
      this.notify({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: evt.timestamp || new Date().toISOString(),
        appId: evt.appId,
        severity: 'critical',
        title: 'Security Alert',
        message: evt.payload?.details || evt.payload?.alert?.message || 'Security vulnerability detected.',
        read: false,
        priority: 'urgent',
        channel: 'in_app'
      });
    });

    this.eventBus.subscribe('DEPLOYMENT_FAILED', (evt: AppEvent) => {
      this.notify({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: evt.timestamp || new Date().toISOString(),
        appId: evt.appId,
        severity: 'warning',
        title: 'Deployment Failure',
        message: `Deployment failed for app ${evt.appId || 'unknown'}`,
        read: false,
        priority: 'high',
        channel: 'in_app'
      });
    });
  }

  public notify(notif: AppNotification): void {
    const fullNotif: AppNotification = {
      ...notif,
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: notif.timestamp || new Date().toISOString(),
      channel: notif.channel || 'in_app',
      priority: notif.priority || (notif.severity === 'critical' ? 'urgent' : notif.severity === 'warning' ? 'high' : 'medium'),
      delivered: true
    };

    this.notifications.unshift(fullNotif);
    if (this.notifications.length > 500) {
      this.notifications.pop();
    }

    // Queue for multi-channel async dispatch if high/urgent priority
    if (fullNotif.priority === 'urgent' || fullNotif.priority === 'high') {
      this.enqueueMultiChannelDispatch(fullNotif);
    }
  }

  private enqueueMultiChannelDispatch(notif: AppNotification) {
    this.dispatchQueue.push(notif);
    this.processDispatchQueue();
  }

  private async processDispatchQueue() {
    while (this.dispatchQueue.length > 0) {
      const item = this.dispatchQueue.shift();
      if (!item) break;

      this.channelConfigs.forEach(cfg => {
        if (!cfg.enabled) return;

        // Check severity thresholds
        if (item.severity === 'info' && cfg.minSeverity !== 'info') return;
        if (item.severity === 'warning' && cfg.minSeverity === 'critical') return;

        this.dispatchLogs.unshift({
          notificationId: item.id,
          channel: cfg.channel,
          status: 'sent',
          attempts: 1,
          lastAttemptAt: new Date().toISOString()
        });
      });
    }

    if (this.dispatchLogs.length > 500) {
      this.dispatchLogs = this.dispatchLogs.slice(0, 500);
    }
  }

  public getNotifications(appId?: string): AppNotification[] {
    if (appId) {
      return this.notifications.filter(n => n.appId === appId);
    }
    return this.notifications;
  }

  public markAsRead(notificationId: string): boolean {
    const target = this.notifications.find(n => n.id === notificationId);
    if (!target) return false;
    target.read = true;
    return true;
  }

  public markAllAsRead(appId?: string): number {
    let count = 0;
    this.notifications.forEach(n => {
      if (!appId || n.appId === appId) {
        if (!n.read) {
          n.read = true;
          count++;
        }
      }
    });
    return count;
  }

  public configureChannel(config: NotificationChannelConfig): void {
    this.channelConfigs.set(config.channel, config);
  }

  public getChannelConfigs(): NotificationChannelConfig[] {
    return Array.from(this.channelConfigs.values());
  }

  public getDispatchLogs(): NotificationDispatchStatus[] {
    return this.dispatchLogs;
  }
}

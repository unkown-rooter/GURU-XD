import { AppEventBus, AppEvent } from './eventBus';

export interface AppNotification {
  id: string;
  timestamp: string;
  appId?: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  read: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: AppNotification[] = [];
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.listenToEvents();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private listenToEvents() {
    this.eventBus.subscribe('SECURITY_ALERT_GENERATED', (evt: AppEvent) => {
      this.notify({
        id: `notif-${Date.now()}`,
        timestamp: evt.timestamp,
        appId: evt.appId,
        severity: 'critical',
        title: 'Security Alert',
        message: evt.payload?.details || 'Security vulnerability detected.',
        read: false
      });
    });

    this.eventBus.subscribe('DEPLOYMENT_FAILED', (evt: AppEvent) => {
      this.notify({
        id: `notif-${Date.now()}`,
        timestamp: evt.timestamp,
        appId: evt.appId,
        severity: 'warning',
        title: 'Deployment Failure',
        message: `Deployment failed for app ${evt.appId}`,
        read: false
      });
    });
  }

  public notify(notif: AppNotification): void {
    this.notifications.unshift(notif);
    if (this.notifications.length > 200) {
      this.notifications.pop();
    }
  }

  public getNotifications(appId?: string): AppNotification[] {
    if (appId) {
      return this.notifications.filter(n => n.appId === appId);
    }
    return this.notifications;
  }
}

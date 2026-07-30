import { AppEventBus, AppEvent } from './eventBus';

export interface AuditRecord {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  appId?: string;
  target: string;
  details: any;
  status: 'success' | 'failed' | 'rejected';
}

export class AuditService {
  private static instance: AuditService;
  private auditLog: AuditRecord[] = [];
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.listenToEvents();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  private listenToEvents() {
    this.eventBus.subscribe('*', (evt: AppEvent) => {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: evt.timestamp,
        action: evt.type,
        actor: evt.source,
        appId: evt.appId,
        target: evt.appId || 'system',
        details: evt.payload,
        status: 'success'
      });
    });
  }

  public recordAudit(record: AuditRecord): void {
    this.auditLog.unshift(record);
    if (this.auditLog.length > 1000) {
      this.auditLog.pop();
    }
  }

  public getAuditTrail(appId?: string, limit: number = 50): AuditRecord[] {
    let list = this.auditLog;
    if (appId) {
      list = list.filter(a => a.appId === appId);
    }
    return list.slice(0, limit);
  }
}

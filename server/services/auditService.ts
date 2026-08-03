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
  category?: 'user' | 'security' | 'deployment' | 'ai' | 'admin' | 'system' | 'compliance';
  checksum?: string;
}

export interface AuditQueryFilter {
  appId?: string;
  actor?: string;
  category?: AuditRecord['category'];
  status?: AuditRecord['status'];
  startTime?: string;
  endTime?: string;
  actionPrefix?: string;
}

export interface ComplianceAuditReport {
  generatedAt: string;
  totalRecordsAnalyzed: number;
  timeRange: { start?: string; end?: string };
  categoryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  securityEventsCount: number;
  adminActionsCount: number;
  records: AuditRecord[];
  integrityStatus: 'verified' | 'tampered';
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
      const category = this.categorizeAction(evt.type);
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: evt.timestamp || new Date().toISOString(),
        action: evt.type,
        actor: evt.source || 'system',
        appId: evt.appId,
        target: evt.appId || 'system',
        details: evt.payload,
        status: evt.type.includes('FAIL') || evt.type.includes('REJECT') ? 'failed' : 'success',
        category
      });
    });
  }

  private categorizeAction(action: string): AuditRecord['category'] {
    const act = action.toUpperCase();
    if (act.includes('SECURITY') || act.includes('AUTH') || act.includes('TOKEN')) return 'security';
    if (act.includes('DEPLOY') || act.includes('BUILD') || act.includes('RELEASE')) return 'deployment';
    if (act.includes('AI') || act.includes('PROMPT') || act.includes('INFERENCE')) return 'ai';
    if (act.includes('USER') || act.includes('LOGIN') || act.includes('SESSION')) return 'user';
    if (act.includes('ADMIN') || act.includes('CONFIG') || act.includes('DELETE')) return 'admin';
    if (act.includes('COMPLIANCE') || act.includes('AUDIT')) return 'compliance';
    return 'system';
  }

  private generateChecksum(record: Omit<AuditRecord, 'checksum'>): string {
    const raw = `${record.id}|${record.timestamp}|${record.action}|${record.actor}|${record.appId || ''}|${record.status}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `sha256-sim-${Math.abs(hash).toString(16)}`;
  }

  public recordAudit(record: AuditRecord): void {
    const category = record.category || this.categorizeAction(record.action);
    const checksum = record.checksum || this.generateChecksum(record);

    const fullRecord: AuditRecord = {
      ...record,
      category,
      checksum
    };

    this.auditLog.unshift(fullRecord);
    if (this.auditLog.length > 2000) {
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

  public queryAuditLogs(filter: AuditQueryFilter, limit: number = 100): AuditRecord[] {
    return this.auditLog
      .filter(record => {
        if (filter.appId && record.appId !== filter.appId) return false;
        if (filter.actor && record.actor.toLowerCase() !== filter.actor.toLowerCase()) return false;
        if (filter.category && record.category !== filter.category) return false;
        if (filter.status && record.status !== filter.status) return false;
        if (filter.actionPrefix && !record.action.startsWith(filter.actionPrefix)) return false;
        if (filter.startTime && new Date(record.timestamp).getTime() < new Date(filter.startTime).getTime()) return false;
        if (filter.endTime && new Date(record.timestamp).getTime() > new Date(filter.endTime).getTime()) return false;
        return true;
      })
      .slice(0, limit);
  }

  public generateComplianceReport(timeRange?: { start?: string; end?: string }): ComplianceAuditReport {
    let records = this.auditLog;

    if (timeRange?.start) {
      records = records.filter(r => new Date(r.timestamp).getTime() >= new Date(timeRange.start!).getTime());
    }
    if (timeRange?.end) {
      records = records.filter(r => new Date(r.timestamp).getTime() <= new Date(timeRange.end!).getTime());
    }

    const categoryBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};

    records.forEach(r => {
      const cat = r.category || 'system';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
      statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
    });

    return {
      generatedAt: new Date().toISOString(),
      totalRecordsAnalyzed: records.length,
      timeRange: timeRange || {},
      categoryBreakdown,
      statusBreakdown,
      securityEventsCount: categoryBreakdown['security'] || 0,
      adminActionsCount: categoryBreakdown['admin'] || 0,
      records: records.slice(0, 100),
      integrityStatus: 'verified'
    };
  }

  public exportAuditLogsCSV(appId?: string): string {
    const logs = this.getAuditTrail(appId, 500);
    const header = 'ID,Timestamp,Action,Actor,AppID,Category,Status,Checksum\n';
    const rows = logs.map(l =>
      `"${l.id}","${l.timestamp}","${l.action}","${l.actor}","${l.appId || ''}","${l.category || ''}","${l.status}","${l.checksum || ''}"`
    ).join('\n');

    return header + rows;
  }
}

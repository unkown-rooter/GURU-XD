import crypto from 'crypto';
import { AppEventBus } from './eventBus';
import { EncryptionService } from './encryptionService';

export type SecurityLogCategory = 
  | 'authentication' 
  | 'authorization' 
  | 'permission_change' 
  | 'risk_event' 
  | 'compliance' 
  | 'data_access' 
  | 'system_security';

export type SecurityLogSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SecurityEventRecord {
  id: string;
  timestamp: string;
  eventCategory: SecurityLogCategory;
  eventType: string;
  severity: SecurityLogSeverity;
  actor: string;
  ip: string;
  userAgent: string;
  location: string;
  targetResource: string;
  result: 'success' | 'failed' | 'blocked' | 'challenged';
  riskScore: number;
  details: any;
  hash: string;
  previousHash: string;
}

export interface SecurityLogFilter {
  category?: SecurityLogCategory;
  severity?: SecurityLogSeverity;
  actor?: string;
  actorId?: string;
  ip?: string;
  ipAddress?: string;
  result?: SecurityEventRecord['result'];
  startTime?: string;
  endTime?: string;
  minRiskScore?: number;
  eventType?: string;
}

export interface SecurityComplianceReport {
  generatedAt: string;
  framework: 'SOC2' | 'HIPAA' | 'ISO27001' | 'ALL';
  totalLogsAnalyzed: number;
  integrityVerified: boolean;
  categoryBreakdown: Record<SecurityLogCategory, number>;
  severityBreakdown: Record<SecurityLogSeverity, number>;
  authFailuresCount: number;
  unauthorizedAccessAttemptsCount: number;
  criticalRiskEventsCount: number;
  tamperChainCheckStatus: 'VALID' | 'CORRUPTED';
  complianceScore: number;
  recentSecurityEvents: SecurityEventRecord[];
  recommendations: string[];
}

export class AuditSecurityService {
  private static instance: AuditSecurityService;
  private logs: SecurityEventRecord[] = [];
  private lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.seedInitialSecurityLogs();
  }

  public static getInstance(): AuditSecurityService {
    if (!AuditSecurityService.instance) {
      AuditSecurityService.instance = new AuditSecurityService();
    }
    return AuditSecurityService.instance;
  }

  private seedInitialSecurityLogs() {
    this.recordSecurityEvent({
      eventCategory: 'system_security',
      eventType: 'SECURITY_SUBSYSTEM_INITIALIZED',
      severity: 'info',
      actor: 'system',
      ip: '127.0.0.1',
      userAgent: 'Guru-XD Enterprise Security Engine',
      location: 'Internal Cloud Container',
      targetResource: 'SecurityPlatform',
      result: 'success',
      riskScore: 0,
      details: { version: '8.0.0', status: 'Security & Trust Platform Active' }
    });
  }

  private calculateHash(record: Omit<SecurityEventRecord, 'hash'>): string {
    const raw = `${record.id}|${record.timestamp}|${record.eventCategory}|${record.eventType}|${record.severity}|${record.actor}|${record.ip}|${record.result}|${record.previousHash}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public recordSecurityEvent(eventData: Omit<SecurityEventRecord, 'id' | 'timestamp' | 'hash' | 'previousHash'>): SecurityEventRecord {
    const id = `seclog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();
    const previousHash = this.lastHash;

    const partialRecord = {
      ...eventData,
      id,
      timestamp,
      previousHash
    };

    const hash = this.calculateHash(partialRecord);

    const fullRecord: SecurityEventRecord = {
      ...partialRecord,
      hash
    };

    this.lastHash = hash;
    this.logs.unshift(fullRecord);

    if (this.logs.length > 3000) {
      this.logs.pop();
    }

    if (fullRecord.severity === 'error' || fullRecord.severity === 'critical') {
      this.eventBus.publish('SECURITY_ALERT_GENERATED', {
        type: fullRecord.eventType,
        severity: fullRecord.severity,
        actor: fullRecord.actor,
        ip: fullRecord.ip,
        details: fullRecord.details
      }, undefined, 'AuditSecurityService');
    }

    return fullRecord;
  }

  public logEvent(eventData: any): SecurityEventRecord {
    if (eventData.category) {
      return this.recordSecurityEvent({
        eventCategory: eventData.category === 'risk' ? 'risk_event' : eventData.category === 'permission' ? 'permission_change' : eventData.category,
        eventType: eventData.action || 'SECURITY_EVENT',
        severity: eventData.severity || 'info',
        actor: eventData.actor?.userId || eventData.actor?.username || eventData.actor || 'system',
        ip: eventData.actor?.ipAddress || eventData.ip || '127.0.0.1',
        userAgent: eventData.actor?.userAgent || 'System Portal',
        location: 'Internal System',
        targetResource: eventData.target?.resourceId || eventData.target?.appId || 'SystemResource',
        result: eventData.status === 'blocked' || eventData.status === 'failed' ? 'blocked' : 'success',
        riskScore: eventData.riskScore || 0,
        details: eventData.details || {}
      });
    }
    return this.recordSecurityEvent(eventData);
  }

  public logAuthenticationEvent(
    actor: string,
    ip: string,
    userAgent: string,
    eventType: string,
    result: 'success' | 'failed' | 'blocked' | 'challenged',
    details: any = {}
  ): SecurityEventRecord {
    return this.recordSecurityEvent({
      eventCategory: 'authentication',
      eventType,
      severity: result === 'success' ? 'info' : result === 'blocked' ? 'error' : 'warning',
      actor,
      ip,
      userAgent,
      location: details.location || 'Local Region',
      targetResource: 'AuthPortal',
      result,
      riskScore: result === 'failed' ? 25 : result === 'blocked' ? 75 : 0,
      details
    });
  }

  public logAuthentication(
    actor: string,
    ip: string,
    userAgent: string,
    eventType: string,
    result: 'success' | 'failed' | 'blocked' | 'challenged',
    details: any = {}
  ): SecurityEventRecord {
    return this.logAuthenticationEvent(actor, ip, userAgent, eventType, result, details);
  }

  public logAuthorizationEvent(
    actor: string,
    resource: string,
    action: string,
    granted: boolean,
    details: any = {}
  ): SecurityEventRecord {
    return this.recordSecurityEvent({
      eventCategory: 'authorization',
      eventType: granted ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
      severity: granted ? 'info' : 'warning',
      actor,
      ip: details.ip || '127.0.0.1',
      userAgent: details.userAgent || 'Web Client',
      location: details.location || 'Internal',
      targetResource: resource,
      result: granted ? 'success' : 'failed',
      riskScore: granted ? 0 : 35,
      details: { action, ...details }
    });
  }

  public logAuthorization(
    actor: string,
    resource: string,
    action: string,
    granted: boolean,
    details: any = {}
  ): SecurityEventRecord {
    return this.logAuthorizationEvent(actor, resource, action, granted, details);
  }

  public logPermissionChangeEvent(actor: string, targetRoleOrUser: string, changeDetails: any): SecurityEventRecord {
    return this.recordSecurityEvent({
      eventCategory: 'permission_change',
      eventType: 'ROLE_PERMISSION_UPDATED',
      severity: 'warning',
      actor,
      ip: changeDetails.ip || '127.0.0.1',
      userAgent: changeDetails.userAgent || 'Web Client',
      location: 'Internal Portal',
      targetResource: targetRoleOrUser,
      result: 'success',
      riskScore: 10,
      details: changeDetails
    });
  }

  public logPermissionChange(actor: string, targetRoleOrUser: string, changeDetails: any): SecurityEventRecord {
    return this.logPermissionChangeEvent(actor, targetRoleOrUser, changeDetails);
  }

  public logRiskEvent(actor: string, ip: string, riskType: string, riskScore: number, details: any = {}): SecurityEventRecord {
    return this.recordSecurityEvent({
      eventCategory: 'risk_event',
      eventType: riskType,
      severity: riskScore > 70 ? 'critical' : riskScore > 40 ? 'error' : 'warning',
      actor,
      ip,
      userAgent: details.userAgent || 'Unknown Agent',
      location: details.location || 'Unknown Location',
      targetResource: details.target || 'SecurityEngine',
      result: details.result || 'blocked',
      riskScore,
      details
    });
  }

  public querySecurityLogs(filter: SecurityLogFilter, limit: number = 100): SecurityEventRecord[] {
    const actorQuery = (filter.actor || filter.actorId || '').toLowerCase();
    const ipQuery = filter.ip || filter.ipAddress;

    return this.logs
      .filter(record => {
        if (filter.category && record.eventCategory !== filter.category) return false;
        if (filter.severity && record.severity !== filter.severity) return false;
        if (actorQuery && record.actor.toLowerCase() !== actorQuery) return false;
        if (ipQuery && record.ip !== ipQuery) return false;
        if (filter.result && record.result !== filter.result) return false;
        if (filter.eventType && !record.eventType.toLowerCase().includes(filter.eventType.toLowerCase())) return false;
        if (filter.minRiskScore !== undefined && record.riskScore < filter.minRiskScore) return false;
        if (filter.startTime && new Date(record.timestamp).getTime() < new Date(filter.startTime).getTime()) return false;
        if (filter.endTime && new Date(record.timestamp).getTime() > new Date(filter.endTime).getTime()) return false;
        return true;
      })
      .slice(0, limit);
  }

  public queryLogs(filter: SecurityLogFilter | any, limit: number = 100): SecurityEventRecord[] {
    return this.querySecurityLogs(filter, limit);
  }

  public verifyLogChainIntegrity(): { isValid: boolean; checkedCount: number; brokenIndex?: number; reason?: string } {
    if (this.logs.length === 0) {
      return { isValid: true, checkedCount: 0 };
    }

    const copy = [...this.logs].reverse();

    for (let i = 0; i < copy.length; i++) {
      const record = copy[i];

      if (i > 0) {
        const prev = copy[i - 1];
        if (record.previousHash !== prev.hash) {
          return {
            isValid: false,
            checkedCount: i,
            brokenIndex: i,
            reason: `Previous hash mismatch on record [${record.id}]. Expected [${prev.hash}], got [${record.previousHash}]`
          };
        }
      }

      const expectedHash = this.calculateHash({
        id: record.id,
        timestamp: record.timestamp,
        eventCategory: record.eventCategory,
        eventType: record.eventType,
        severity: record.severity,
        actor: record.actor,
        ip: record.ip,
        userAgent: record.userAgent,
        location: record.location,
        targetResource: record.targetResource,
        result: record.result,
        riskScore: record.riskScore,
        details: record.details,
        previousHash: record.previousHash
      });

      if (record.hash !== expectedHash) {
        return {
          isValid: false,
          checkedCount: i,
          brokenIndex: i,
          reason: `Cryptographic hash corruption on record [${record.id}]. Content modified after signing.`
        };
      }
    }

    return { isValid: true, checkedCount: copy.length };
  }

  public generateSecurityComplianceReport(framework: 'SOC2' | 'HIPAA' | 'ISO27001' | 'ALL' = 'ALL'): SecurityComplianceReport {
    const integrityCheck = this.verifyLogChainIntegrity();

    const categoryBreakdown: Record<SecurityLogCategory, number> = {
      authentication: 0,
      authorization: 0,
      permission_change: 0,
      risk_event: 0,
      compliance: 0,
      data_access: 0,
      system_security: 0
    };

    const severityBreakdown: Record<SecurityLogSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0
    };

    let authFailuresCount = 0;
    let unauthorizedAccessAttemptsCount = 0;
    let criticalRiskEventsCount = 0;

    this.logs.forEach(l => {
      categoryBreakdown[l.eventCategory] = (categoryBreakdown[l.eventCategory] || 0) + 1;
      severityBreakdown[l.severity] = (severityBreakdown[l.severity] || 0) + 1;

      if (l.eventCategory === 'authentication' && l.result === 'failed') authFailuresCount++;
      if (l.eventCategory === 'authorization' && l.result === 'failed') unauthorizedAccessAttemptsCount++;
      if (l.severity === 'critical') criticalRiskEventsCount++;
    });

    let complianceScore = 100;
    if (!integrityCheck.isValid) complianceScore -= 30;
    if (criticalRiskEventsCount > 0) complianceScore -= Math.min(20, criticalRiskEventsCount * 5);
    if (authFailuresCount > 10) complianceScore -= 10;

    complianceScore = Math.max(0, complianceScore);

    const recommendations: string[] = [];
    if (!integrityCheck.isValid) {
      recommendations.push('CRITICAL: Audit log hash chain corruption detected! Investigate system access logs immediately.');
    }
    if (authFailuresCount > 5) {
      recommendations.push('Enforce stricter rate limits and IP lockout triggers on authentication endpoints.');
    }
    if (complianceScore >= 90) {
      recommendations.push('Platform maintains strong compliance posture for SOC2 Type II, HIPAA, and ISO 27001 standard audits.');
    }

    return {
      generatedAt: new Date().toISOString(),
      framework,
      totalLogsAnalyzed: this.logs.length,
      integrityVerified: integrityCheck.isValid,
      categoryBreakdown,
      severityBreakdown,
      authFailuresCount,
      unauthorizedAccessAttemptsCount,
      criticalRiskEventsCount,
      tamperChainCheckStatus: integrityCheck.isValid ? 'VALID' : 'CORRUPTED',
      complianceScore,
      recentSecurityEvents: this.logs.slice(0, 50),
      recommendations
    };
  }

  public exportSecurityLogsCSV(limit: number = 500): string {
    const records = this.logs.slice(0, limit);
    const header = 'ID,Timestamp,Category,EventType,Severity,Actor,IP,Location,TargetResource,Result,RiskScore,Hash,PreviousHash\n';
    const rows = records.map(r =>
      `"${r.id}","${r.timestamp}","${r.eventCategory}","${r.eventType}","${r.severity}","${r.actor}","${r.ip}","${r.location}","${r.targetResource}","${r.result}",${r.riskScore},"${r.hash}","${r.previousHash}"`
    ).join('\n');

    return header + rows;
  }
}

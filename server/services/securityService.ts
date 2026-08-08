import { AppEventBus } from './eventBus';
import { AuditSecurityService } from './auditSecurityService';
import { TrustService } from './trustService';
import { EncryptionService } from './encryptionService';

export interface RateLimitStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds?: number;
}

export interface BruteForceStatus {
  isLocked: boolean;
  attemptsCount: number;
  lockUntil: number;
  remainingSeconds: number;
}

export interface ThreatScanResult {
  isClean: boolean;
  threatsDetected: string[];
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  details: string[];
}

export interface EnterpriseSecurityPolicy {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuseCount: number;
    maxAgeDays: number;
  };
  sessionPolicy: {
    inactivityTimeoutMinutes: number;
    maxConcurrentSessionsPerUser: number;
    forceLogoutOnPasswordReset: boolean;
    refreshTokensRevokeOnLogout: boolean;
  };
  ipPolicy: {
    whitelistOnly: boolean;
    allowedCidrs: string[];
    blockedIps: string[];
  };
  twoFactorPolicy: {
    requiredForAdmins: boolean;
    requiredForAllUsers: boolean;
    enforcementGracePeriodDays: number;
  };
}

export interface SecurityIncident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIp: string;
  targetUser?: string;
  description: string;
  status: 'active' | 'investigating' | 'mitigated' | 'resolved';
  detectedAt: string;
  mitigationAction?: string;
}

export class SecurityService {
  private static instance: SecurityService;

  // Brute force tracking maps
  private failedLoginAttempts: Map<string, { count: number; firstAttempt: number; lockUntil: number }> = new Map();
  
  // Sliding window rate limiter map
  private rateLimitWindowMap: Map<string, number[]> = new Map();

  // Blocked IPs set
  private blockedIPs: Set<string> = new Set();
  private allowedIPs: Set<string> = new Set();

  // Login locations memory for velocity checks
  private userLastLogins: Map<string, { ip: string; timestamp: number; location: string; lat?: number; lon?: number }> = new Map();

  // Active Security Incidents
  private activeIncidents: Map<string, SecurityIncident> = new Map();

  // Policy
  private securityPolicy: EnterpriseSecurityPolicy;

  private eventBus = AppEventBus.getInstance();
  private auditSecurityService = AuditSecurityService.getInstance();
  private get trustService() {
    return TrustService.getInstance();
  }

  private constructor() {
    this.securityPolicy = {
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuseCount: 5,
        maxAgeDays: 90
      },
      sessionPolicy: {
        inactivityTimeoutMinutes: 30,
        maxConcurrentSessionsPerUser: 5,
        forceLogoutOnPasswordReset: true,
        refreshTokensRevokeOnLogout: true
      },
      ipPolicy: {
        whitelistOnly: false,
        allowedCidrs: [],
        blockedIps: []
      },
      twoFactorPolicy: {
        requiredForAdmins: true,
        requiredForAllUsers: false,
        enforcementGracePeriodDays: 7
      }
    };

    this.seedBaselineIncidents();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private seedBaselineIncidents() {
    // Seed baseline clean state
  }

  /**
   * Sliding window Rate Limiter
   */
  public checkRateLimit(key: string, limit: number = 60, windowMs: number = 60000): RateLimitStatus {
    const now = Date.now();
    const timestamps = this.rateLimitWindowMap.get(key) || [];

    // Filter out expired timestamps
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= limit) {
      const oldest = validTimestamps[0];
      const resetMs = windowMs - (now - oldest);
      const retryAfterSeconds = Math.ceil(resetMs / 1000);

      this.rateLimitWindowMap.set(key, validTimestamps);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetMs,
        retryAfterSeconds
      };
    }

    validTimestamps.push(now);
    this.rateLimitWindowMap.set(key, validTimestamps);

    return {
      allowed: true,
      limit,
      remaining: limit - validTimestamps.length,
      resetMs: windowMs
    };
  }

  /**
   * Brute-Force Lockout Tracker
   */
  public recordFailedAttempt(identifier: string, maxAttempts: number = 5, lockDurationMs: number = 15 * 60 * 1000): BruteForceStatus {
    const now = Date.now();
    const record = this.failedLoginAttempts.get(identifier) || { count: 0, firstAttempt: now, lockUntil: 0 };

    if (record.lockUntil > now) {
      const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
      return {
        isLocked: true,
        attemptsCount: record.count,
        lockUntil: record.lockUntil,
        remainingSeconds
      };
    }

    // Reset counter if previous lockout expired or window reset
    if (now - record.firstAttempt > lockDurationMs && record.lockUntil < now) {
      record.count = 0;
      record.firstAttempt = now;
    }

    record.count += 1;

    if (record.count >= maxAttempts) {
      record.lockUntil = now + lockDurationMs;

      // Trigger Audit & Risk log
      this.auditSecurityService.logRiskEvent(
        identifier,
        identifier,
        'BRUTE_FORCE_LOCKOUT_TRIGGERED',
        85,
        { attemptsCount: record.count, lockDurationMs }
      );

      // Trigger Security Incident
      this.triggerIncident({
        type: 'BRUTE_FORCE_ATTACK',
        severity: 'high',
        sourceIp: identifier,
        description: `Multiple failed attempts (${record.count}) triggered 15-min lockout for [${identifier}]`
      });
    }

    this.failedLoginAttempts.set(identifier, record);

    const isLocked = record.count >= maxAttempts;
    const remainingSeconds = isLocked ? Math.ceil((record.lockUntil - now) / 1000) : 0;

    return {
      isLocked,
      attemptsCount: record.count,
      lockUntil: record.lockUntil,
      remainingSeconds
    };
  }

  public resetFailedAttempts(identifier: string): void {
    this.failedLoginAttempts.delete(identifier);
  }

  public checkBruteForceStatus(identifier: string): BruteForceStatus {
    const now = Date.now();
    const record = this.failedLoginAttempts.get(identifier);

    if (!record || record.lockUntil <= now) {
      return { isLocked: false, attemptsCount: record?.count || 0, lockUntil: 0, remainingSeconds: 0 };
    }

    return {
      isLocked: true,
      attemptsCount: record.count,
      lockUntil: record.lockUntil,
      remainingSeconds: Math.ceil((record.lockUntil - now) / 1000)
    };
  }

  /**
   * IP Whitelist / Blacklist Governance
   */
  public blockIP(ip: string, reason: string = 'Administrative Security Block'): void {
    this.blockedIPs.add(ip);
    this.securityPolicy.ipPolicy.blockedIps = Array.from(this.blockedIPs);

    this.auditSecurityService.logRiskEvent('admin', ip, 'IP_BLOCKED', 90, { reason });
  }

  public unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.securityPolicy.ipPolicy.blockedIps = Array.from(this.blockedIPs);

    this.auditSecurityService.recordSecurityEvent({
      eventCategory: 'system_security',
      eventType: 'IP_UNBLOCKED',
      severity: 'info',
      actor: 'admin',
      ip,
      userAgent: 'Security Admin',
      location: 'Internal',
      targetResource: 'IPPolicy',
      result: 'success',
      riskScore: 0,
      details: { unblockedIp: ip }
    });
  }

  public isIPBlocked(ip: string): boolean {
    if (this.blockedIPs.has(ip)) return true;
    if (this.securityPolicy.ipPolicy.whitelistOnly && !this.allowedIPs.has(ip)) return true;
    return false;
  }

  /**
   * Travel Velocity & Login Anomaly Detection
   */
  public checkLoginAnomaly(userId: string, currentIp: string, currentLocation: string = 'Unknown'): { isAnomaly: boolean; reason?: string; anomalyScore: number } {
    const now = Date.now();
    const lastLogin = this.userLastLogins.get(userId);

    // Record new login location
    this.userLastLogins.set(userId, {
      ip: currentIp,
      timestamp: now,
      location: currentLocation
    });

    if (!lastLogin) {
      return { isAnomaly: false, anomalyScore: 0 };
    }

    const timeDiffMins = (now - lastLogin.timestamp) / (1000 * 60);

    // Impossible travel check: IP or Location changed within 10 minutes
    if (lastLogin.ip !== currentIp && lastLogin.location !== currentLocation && timeDiffMins < 10) {
      const reason = `Impossible travel anomaly detected: User [${userId}] moved from [${lastLogin.location} (${lastLogin.ip})] to [${currentLocation} (${currentIp})] in ${Math.round(timeDiffMins)} mins.`;

      this.auditSecurityService.logRiskEvent(userId, currentIp, 'IMPOSSIBLE_TRAVEL_ANOMALY', 80, {
        previousIp: lastLogin.ip,
        previousLocation: lastLogin.location,
        timeDiffMins,
        currentLocation
      });

      this.trustService.recordTrustImpactEvent(userId, 'TRAVEL_VELOCITY_ANOMALY', -25, reason);

      return { isAnomaly: true, reason, anomalyScore: 80 };
    }

    return { isAnomaly: false, anomalyScore: 0 };
  }

  /**
   * Request Payload Threat Scanner (SQLi, XSS, Path Traversal, Command Injection)
   */
  public scanPayloadForThreats(payload: any): ThreatScanResult {
    const stringified = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
    const threatsDetected: string[] = [];
    const details: string[] = [];

    // SQL Injection patterns
    const sqliRegex = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|TRUNCATE)\b|' OR '1'='1'|;--|--\s)/i;
    if (sqliRegex.test(stringified)) {
      threatsDetected.push('SQL_INJECTION');
      details.push('Detected SQL Injection syntax pattern in request payload');
    }

    // XSS patterns
    const xssRegex = /(<script\b[^>]*>|javascript:|onerror\s*=|onload\s*=|eval\(|document\.cookie)/i;
    if (xssRegex.test(stringified)) {
      threatsDetected.push('CROSS_SITE_SCRIPTING_XSS');
      details.push('Detected dangerous HTML/JavaScript script injection tag in payload');
    }

    // Path Traversal patterns
    const pathTraversalRegex = /(\.\.\/|\.\.\\|\/etc\/passwd|c:\\windows)/i;
    if (pathTraversalRegex.test(stringified)) {
      threatsDetected.push('PATH_TRAVERSAL');
      details.push('Detected directory path traversal attempt (../)');
    }

    // Command Injection patterns
    const cmdRegex = /(;|\|\||&&|`|\$\([^)]+\))/i;
    if (cmdRegex.test(stringified)) {
      threatsDetected.push('COMMAND_INJECTION');
      details.push('Detected shell command execution operator in payload');
    }

    const isClean = threatsDetected.length === 0;
    let threatLevel: ThreatScanResult['threatLevel'] = 'none';

    if (threatsDetected.includes('SQL_INJECTION') || threatsDetected.includes('COMMAND_INJECTION')) {
      threatLevel = 'critical';
    } else if (threatsDetected.includes('CROSS_SITE_SCRIPTING_XSS')) {
      threatLevel = 'high';
    } else if (threatsDetected.length > 0) {
      threatLevel = 'medium';
    }

    return {
      isClean,
      threatsDetected,
      threatLevel,
      details
    };
  }

  /**
   * Incident Management
   */
  public triggerIncident(incidentData: Omit<SecurityIncident, 'id' | 'detectedAt' | 'status'>): SecurityIncident {
    const id = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const incident: SecurityIncident = {
      ...incidentData,
      id,
      status: 'active',
      detectedAt: new Date().toISOString()
    };

    this.activeIncidents.set(id, incident);

    this.eventBus.publish('SECURITY_ALERT_GENERATED', {
      type: 'SECURITY_INCIDENT_TRIGGERED',
      incidentId: id,
      incidentType: incident.type,
      severity: incident.severity,
      sourceIp: incident.sourceIp
    }, undefined, 'SecurityService');

    return incident;
  }

  public getActiveIncidents(): SecurityIncident[] {
    return Array.from(this.activeIncidents.values());
  }

  public resolveIncident(id: string, mitigationAction: string): boolean {
    const inc = this.activeIncidents.get(id);
    if (!inc) return false;

    inc.status = 'resolved';
    inc.mitigationAction = mitigationAction;
    this.activeIncidents.set(id, inc);
    return true;
  }

  /**
   * Enterprise Policy Getter & Setter
   */
  public getSecurityPolicy(): EnterpriseSecurityPolicy {
    return this.securityPolicy;
  }

  public updateSecurityPolicy(updates: Partial<EnterpriseSecurityPolicy>): EnterpriseSecurityPolicy {
    this.securityPolicy = {
      ...this.securityPolicy,
      ...updates
    };

    this.auditSecurityService.recordSecurityEvent({
      eventCategory: 'system_security',
      eventType: 'SECURITY_POLICY_UPDATED',
      severity: 'warning',
      actor: 'admin',
      ip: '127.0.0.1',
      userAgent: 'Security Admin',
      location: 'Internal',
      targetResource: 'SecurityPolicy',
      result: 'success',
      riskScore: 0,
      details: updates
    });

    return this.securityPolicy;
  }
}

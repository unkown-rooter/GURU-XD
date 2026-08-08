import { SecurityService } from './securityService';
import { AuditSecurityService } from './auditSecurityService';
import { AuthService } from './authService';
import { AppEventBus } from './eventBus';

export type TrustLevel = 'CRITICAL_RISK' | 'LOW_TRUST' | 'MODERATE_TRUST' | 'HIGH_TRUST' | 'VERIFIED_ROOT';

export interface UserTrustEvaluation {
  userId: string;
  trustScorePct: number; // 0 to 100
  trustLevel: TrustLevel;
  factors: {
    mfaBonus: number;
    accountAgeBonus: number;
    failedAuthPenalty: number;
    recentRiskPenalty: number;
  };
  evaluatedAt: string;
}

export interface DeviceTrustEvaluation {
  deviceId: string;
  deviceTrustScorePct: number;
  trusted: boolean;
  ipConsistency: boolean;
  evaluatedAt: string;
}

export interface ApiTrustEvaluation {
  apiKeyPrefix: string;
  trustGrade: 'A+' | 'A' | 'B' | 'C' | 'F';
  riskScorePct: number;
  rateLimitAdherencePct: number;
}

export interface AiTrustEvaluationRequest {
  agentId: string;
  prompt: string;
  proposedAction?: string;
  proposedToolCall?: { toolName: string; args: Record<string, any> };
  userRole?: string;
}

export interface AiTrustEvaluationResult {
  allowed: boolean;
  trustScorePct: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScorePct: number;
  reason: string;
  guardrailFlags: string[];
}

export class TrustService {
  private static instance: TrustService;
  private get auditSecurityService() { return AuditSecurityService.getInstance(); }
  private get authService() { return AuthService.getInstance(); }
  private eventBus = AppEventBus.getInstance();

  private constructor() {}

  public static getInstance(): TrustService {
    if (!TrustService.instance) {
      TrustService.instance = new TrustService();
    }
    return TrustService.instance;
  }

  // ----------------------------------------------------
  // USER TRUST EVALUATION
  // ----------------------------------------------------

  public evaluateUserTrust(userId: string, currentSessionId?: string): UserTrustEvaluation {
    let score = 60; // Base score
    let mfaBonus = 0;
    let accountAgeBonus = 15;
    let failedAuthPenalty = 0;
    let recentRiskPenalty = 0;

    if (currentSessionId) {
      const session = this.authService.getSession(currentSessionId);
      if (session) {
        mfaBonus = 20;
        score += mfaBonus;
      }
    }

    // Check recent failed attempts or risk events
    const recentLogs = this.auditSecurityService.queryLogs({ actor: userId, category: 'risk_event' as any }, 10);
    if (recentLogs.length > 0) {
      recentRiskPenalty = recentLogs.length * 10;
      score -= recentRiskPenalty;
    }

    score = Math.max(0, Math.min(100, score));

    let trustLevel: TrustLevel = 'MODERATE_TRUST';
    if (score >= 90) trustLevel = 'VERIFIED_ROOT';
    else if (score >= 75) trustLevel = 'HIGH_TRUST';
    else if (score >= 50) trustLevel = 'MODERATE_TRUST';
    else if (score >= 25) trustLevel = 'LOW_TRUST';
    else trustLevel = 'CRITICAL_RISK';

    return {
      userId,
      trustScorePct: score,
      trustLevel,
      factors: {
        mfaBonus,
        accountAgeBonus,
        failedAuthPenalty,
        recentRiskPenalty
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  // ----------------------------------------------------
  // DEVICE TRUST EVALUATION
  // ----------------------------------------------------

  public evaluateDeviceTrust(userId: string, deviceId: string, currentIp: string): DeviceTrustEvaluation {
    const userDevices = this.authService.getUserDevices(userId);
    const matched = userDevices.find(d => d.fingerprint === deviceId);

    if (!matched) {
      return {
        deviceId,
        deviceTrustScorePct: 30, // Unknown device
        trusted: false,
        ipConsistency: false,
        evaluatedAt: new Date().toISOString()
      };
    }

    const ipConsistency = matched.ip === currentIp;
    let score = matched.isTrusted ? 80 : 40;
    if (ipConsistency) score += 15;

    return {
      deviceId,
      deviceTrustScorePct: Math.min(100, score),
      trusted: matched.isTrusted,
      ipConsistency,
      evaluatedAt: new Date().toISOString()
    };
  }

  // ----------------------------------------------------
  // AI TRUST & SAFETY EVALUATION
  // ----------------------------------------------------

  public evaluateAiExecutionTrust(request: AiTrustEvaluationRequest): AiTrustEvaluationResult {
    const flags: string[] = [];
    let riskScore = 10;

    const lowerPrompt = request.prompt.toLowerCase();

    // High risk tool or action inspection
    if (request.proposedToolCall) {
      const tool = request.proposedToolCall.toolName.toLowerCase();
      if (['delete_database', 'drop_table', 'deploy_production', 'execute_shell', 'rm_rf'].includes(tool)) {
        riskScore += 70;
        flags.push(`Destructive or administrative tool call requested: [${tool}]`);
      }
    }

    // Prompt injection or unsafe intent checks
    if (lowerPrompt.includes('ignore previous instructions') || lowerPrompt.includes('system prompt override')) {
      riskScore += 80;
      flags.push('Prompt injection pattern detected');
    }

    if (lowerPrompt.includes('rm -rf') || lowerPrompt.includes('drop database') || lowerPrompt.includes('eval(')) {
      riskScore += 60;
      flags.push('Harmful code or command pattern detected');
    }

    // Role verification
    if (request.userRole === 'Viewer' && request.proposedAction === 'modify') {
      riskScore += 50;
      flags.push('Role mismatch: Viewer attempting modification action');
    }

    const trustScorePct = Math.max(0, 100 - riskScore);
    const allowed = trustScorePct >= 40;

    let riskLevel: AiTrustEvaluationResult['riskLevel'] = 'LOW';
    if (riskScore >= 80) riskLevel = 'CRITICAL';
    else if (riskScore >= 50) riskLevel = 'HIGH';
    else if (riskScore >= 25) riskLevel = 'MEDIUM';

    if (!allowed) {
      this.auditSecurityService.logRiskEvent(
        request.userRole || 'anon',
        '127.0.0.1',
        'AI_TRUST_GUARDRAIL_BLOCKED',
        riskScore,
        { agentId: request.agentId, flags, promptSample: request.prompt.substring(0, 100) }
      );
    }

    return {
      allowed,
      trustScorePct,
      riskLevel,
      confidenceScorePct: 95,
      reason: allowed 
        ? 'AI execution passed security and trust evaluation guardrails.'
        : `AI execution blocked: High security risk (${flags.join('; ')})`,
      guardrailFlags: flags
    };
  }

  public recordTrustImpactEvent(userId: string, eventType: string, scoreImpact: number, reason: string, details: any = {}): void {
    this.auditSecurityService.logRiskEvent(
      userId,
      details.ip || '127.0.0.1',
      `TRUST_IMPACT:${eventType}`,
      Math.abs(scoreImpact),
      { scoreImpact, reason, ...details }
    );
  }
}

import crypto from 'crypto';
import { AppEventBus } from './eventBus';
import { EncryptionService } from './encryptionService';
import { RBACService } from './rbacService';
import { SecurityService } from './securityService';
import { AuditSecurityService } from './auditSecurityService';
import { TrustService } from './trustService';

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  tenantId?: string;
  orgId?: string;
  sessionId: string;
  iat: number;
  exp: number;
  iss?: string;
}

export interface RefreshTokenRecord {
  token: string;
  userId: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
  replacedByToken?: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  deviceFingerprint: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown';
  browser: string;
  os: string;
  ip: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface DeviceDetails {
  fingerprint: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown';
  browser: string;
  os: string;
  ip: string;
  location: string;
  isTrusted: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 - 100
  strengthRating: 'weak' | 'fair' | 'good' | 'strong' | 'enterprise';
  errors: string[];
}

export interface TwoFactorSetup {
  userId: string;
  secret: string;
  qrUri: string;
  backupCodes: string[];
  enabledAt?: string;
}

export interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  isRevoked: boolean;
}

export class AuthService {
  private static instance: AuthService;

  // Jwt Secret
  private jwtSecret: string;
  private jwtIssuer = 'guru-xd-security-authority';
  private accessTokenTtlMs = 60 * 60 * 1000; // 1 hour
  private refreshTokenTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Session & Token Stores
  private sessions: Map<string, SessionInfo> = new Map();
  private refreshTokens: Map<string, RefreshTokenRecord> = new Map();
  private userDevices: Map<string, DeviceDetails[]> = new Map();

  // Password History Map (userId -> hashedPassword[])
  private passwordHistoryMap: Map<string, string[]> = new Map();

  // Password Reset Tokens
  private resetTokensMap: Map<string, { userId: string; expiresAt: number; used: boolean }> = new Map();

  // 2FA Map (userId -> TwoFactorSetup)
  private twoFactorMap: Map<string, TwoFactorSetup> = new Map();

  // API Keys Store
  private apiKeysMap: Map<string, ApiKeyRecord> = new Map();

  // Injected Services
  private encryptionService = EncryptionService.getInstance();
  private rbacService = RBACService.getInstance();
  private securityService = SecurityService.getInstance();
  private auditSecurityService = AuditSecurityService.getInstance();
  private trustService = TrustService.getInstance();
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'guru-xd-enterprise-jwt-signing-secret-key-32bytes!';
    this.seedDefaultSessions();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private seedDefaultSessions() {
    // Default seed session for admin user
    const adminSessionId = 'sess-admin-initial';
    const now = Date.now();

    const payload: JwtPayload = {
      userId: 'admin',
      username: 'admin',
      email: 'admin@guru-xd.io',
      role: 'super_admin',
      sessionId: adminSessionId,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + this.accessTokenTtlMs) / 1000),
      iss: this.jwtIssuer
    };

    const token = this.generateJwt(payload);
    const refreshToken = this.encryptionService.generateSecureToken(32);

    const session: SessionInfo = {
      id: adminSessionId,
      userId: 'admin',
      token,
      refreshToken,
      deviceFingerprint: 'fp-admin-desktop-chrome',
      deviceType: 'Desktop',
      browser: 'Chrome 126.0',
      os: 'macOS Sonoma',
      ip: '127.0.0.1',
      location: 'United States',
      createdAt: new Date(now).toISOString(),
      lastActiveAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.refreshTokenTtlMs).toISOString(),
      status: 'active'
    };

    this.sessions.set(adminSessionId, session);
    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      userId: 'admin',
      sessionId: adminSessionId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.refreshTokenTtlMs).toISOString(),
      isRevoked: false
    });
  }

  /**
   * JWT Generation & Verification (HMAC-SHA256 signature)
   */
  public generateJwt(payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss'>, expiresInMs: number = this.accessTokenTtlMs): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + Math.floor(expiresInMs / 1000);

    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp,
      iss: this.jwtIssuer
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

    const signature = this.encryptionService.signHmac(`${encodedHeader}.${encodedPayload}`, this.jwtSecret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  public verifyJwt(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      const expectedSignature = this.encryptionService.signHmac(`${encodedHeader}.${encodedPayload}`, this.jwtSecret);

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }

      const payload: JwtPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        return null; // Expired token
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Create Active Session & Issue Tokens
   */
  public createSession(
    userId: string,
    username: string,
    email: string,
    role: string,
    reqContext: { ip: string; userAgent: string; tenantId?: string; orgId?: string }
  ): { session: SessionInfo; accessToken: string; refreshToken: string } {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    const device = this.parseUserAgent(reqContext.userAgent);
    const fingerprint = crypto.createHash('sha256').update(`${userId}-${reqContext.ip}-${reqContext.userAgent}`).digest('hex').substring(0, 16);

    const accessToken = this.generateJwt({
      userId,
      username,
      email,
      role,
      tenantId: reqContext.tenantId,
      orgId: reqContext.orgId,
      sessionId
    });

    const refreshToken = this.encryptionService.generateSecureToken(32);

    const session: SessionInfo = {
      id: sessionId,
      userId,
      token: accessToken,
      refreshToken,
      deviceFingerprint: fingerprint,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      ip: reqContext.ip,
      location: 'United States',
      createdAt: new Date(now).toISOString(),
      lastActiveAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.refreshTokenTtlMs).toISOString(),
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      userId,
      sessionId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.refreshTokenTtlMs).toISOString(),
      isRevoked: false
    });

    // Register user device
    this.registerDevice(userId, {
      fingerprint,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      ip: reqContext.ip,
      location: 'United States'
    });

    // Audit Login
    this.auditSecurityService.logAuthenticationEvent(userId, reqContext.ip, reqContext.userAgent, 'AUTH_LOGIN_SUCCESS', 'success', {
      sessionId,
      device
    });

    // Evaluate Trust
    this.trustService.evaluateUserTrust(userId, sessionId);

    return { session, accessToken, refreshToken };
  }

  public getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Refresh Token Rotation
   */
  public refreshAccessToken(oldRefreshToken: string, ip: string, userAgent: string): { accessToken: string; refreshToken: string; session: SessionInfo } | null {
    const record = this.refreshTokens.get(oldRefreshToken);
    if (!record || record.isRevoked || new Date(record.expiresAt).getTime() < Date.now()) {
      return null;
    }

    const session = this.sessions.get(record.sessionId);
    if (!session || session.status !== 'active') {
      return null;
    }

    // Revoke old refresh token (Token Rotation)
    record.isRevoked = true;
    const newRefreshToken = this.encryptionService.generateSecureToken(32);
    record.replacedByToken = newRefreshToken;

    const userRoles = this.rbacService.getUserRoles(record.userId);
    const primaryRole = userRoles[0]?.id || 'developer';

    const newAccessToken = this.generateJwt({
      userId: record.userId,
      username: session.userId,
      email: `${session.userId}@guru-xd.io`,
      role: primaryRole,
      sessionId: session.id
    });

    session.token = newAccessToken;
    session.refreshToken = newRefreshToken;
    session.lastActiveAt = new Date().toISOString();

    this.sessions.set(session.id, session);
    this.refreshTokens.set(newRefreshToken, {
      token: newRefreshToken,
      userId: record.userId,
      sessionId: session.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.refreshTokenTtlMs).toISOString(),
      isRevoked: false
    });

    this.auditSecurityService.logAuthenticationEvent(record.userId, ip, userAgent, 'AUTH_TOKEN_REFRESHED', 'success', { sessionId: session.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      session
    };
  }

  /**
   * Session Management & Revocation
   */
  public getUserSessions(userId: string): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.status === 'active')
      .map(s => ({
        ...s,
        token: this.encryptionService.maskSecret(s.token, 6)
      }));
  }

  public revokeSession(sessionId: string, actor: string = 'user'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'revoked';
    this.sessions.set(sessionId, session);

    // Revoke matching refresh token
    const refreshRecord = Array.from(this.refreshTokens.values()).find(r => r.sessionId === sessionId);
    if (refreshRecord) {
      refreshRecord.isRevoked = true;
    }

    this.auditSecurityService.logAuthenticationEvent(session.userId, session.ip, 'UserAgent', 'AUTH_SESSION_REVOKED', 'success', { sessionId, revokedBy: actor });
    return true;
  }

  public revokeAllUserSessions(userId: string, exceptSessionId?: string): number {
    let count = 0;
    this.sessions.forEach(session => {
      if (session.userId === userId && session.status === 'active' && session.id !== exceptSessionId) {
        session.status = 'revoked';
        count++;

        const refreshRecord = Array.from(this.refreshTokens.values()).find(r => r.sessionId === session.id);
        if (refreshRecord) refreshRecord.isRevoked = true;
      }
    });

    this.auditSecurityService.logAuthenticationEvent(userId, '127.0.0.1', 'System', 'AUTH_ALL_SESSIONS_REVOKED', 'success', { revokedCount: count, exceptSessionId });
    return count;
  }

  /**
   * Device Management
   */
  public parseUserAgent(uaString: string): { deviceType: DeviceDetails['deviceType']; browser: string; os: string } {
    let deviceType: DeviceDetails['deviceType'] = 'Desktop';
    if (/Mobile|Android|iPhone|iPad/i.test(uaString)) {
      deviceType = /iPad|Tablet/i.test(uaString) ? 'Tablet' : 'Mobile';
    }

    let browser = 'Web Browser';
    if (uaString.includes('Chrome')) browser = 'Chrome';
    else if (uaString.includes('Firefox')) browser = 'Firefox';
    else if (uaString.includes('Safari')) browser = 'Safari';
    else if (uaString.includes('Edge')) browser = 'Edge';

    let os = 'Desktop OS';
    if (uaString.includes('Macintosh') || uaString.includes('Mac OS')) os = 'macOS';
    else if (uaString.includes('Windows')) os = 'Windows';
    else if (uaString.includes('Linux')) os = 'Linux';
    else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';
    else if (uaString.includes('Android')) os = 'Android';

    return { deviceType, browser, os };
  }

  public registerDevice(userId: string, details: Omit<DeviceDetails, 'isTrusted' | 'firstSeenAt' | 'lastSeenAt'>): DeviceDetails {
    const list = this.userDevices.get(userId) || [];
    const existingIndex = list.findIndex(d => d.fingerprint === details.fingerprint);

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      list[existingIndex].lastSeenAt = now;
      list[existingIndex].ip = details.ip;
      this.userDevices.set(userId, list);
      return list[existingIndex];
    }

    const newDevice: DeviceDetails = {
      ...details,
      isTrusted: list.length === 0, // First device trusted automatically
      firstSeenAt: now,
      lastSeenAt: now
    };

    list.push(newDevice);
    this.userDevices.set(userId, list);
    return newDevice;
  }

  public getUserDevices(userId: string): DeviceDetails[] {
    return this.userDevices.get(userId) || [];
  }

  /**
   * Password Policy & Complexity Validation
   */
  public validatePasswordPolicy(password: string): PasswordValidationResult {
    const policy = this.securityService.getSecurityPolicy().passwordPolicy;
    const errors: string[] = [];
    let score = 0;

    if (!password || password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters in length.`);
    } else {
      score += 25;
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z).');
    } else if (/[A-Z]/.test(password)) {
      score += 25;
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z).');
    } else if (/[a-z]/.test(password)) {
      score += 15;
    }

    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one numeric digit (0-9).');
    } else if (/[0-9]/.test(password)) {
      score += 15;
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character (e.g. !@#$%^&*).');
    } else if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      score += 20;
    }

    const isValid = errors.length === 0;
    let strengthRating: PasswordValidationResult['strengthRating'] = 'weak';
    if (score >= 95) strengthRating = 'enterprise';
    else if (score >= 80) strengthRating = 'strong';
    else if (score >= 60) strengthRating = 'good';
    else if (score >= 40) strengthRating = 'fair';

    return {
      isValid,
      score,
      strengthRating,
      errors
    };
  }

  public recordPasswordInHistory(userId: string, hashedPassword: string): void {
    const history = this.passwordHistoryMap.get(userId) || [];
    history.unshift(hashedPassword);

    const maxHistory = this.securityService.getSecurityPolicy().passwordPolicy.preventReuseCount;
    if (history.length > maxHistory) {
      history.pop();
    }

    this.passwordHistoryMap.set(userId, history);
  }

  /**
   * Secure Password Reset Tokens
   */
  public generatePasswordResetToken(userId: string): { resetToken: string; expiresAt: string } {
    const resetToken = this.encryptionService.generateSecureToken(32);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins TTL

    this.resetTokensMap.set(resetToken, {
      userId,
      expiresAt,
      used: false
    });

    this.auditSecurityService.recordSecurityEvent({
      eventCategory: 'authentication',
      eventType: 'PASSWORD_RESET_TOKEN_GENERATED',
      severity: 'info',
      actor: userId,
      ip: '127.0.0.1',
      userAgent: 'AuthPortal',
      location: 'Internal',
      targetResource: 'PasswordReset',
      result: 'success',
      riskScore: 5,
      details: { expiresAt: new Date(expiresAt).toISOString() }
    });

    return {
      resetToken,
      expiresAt: new Date(expiresAt).toISOString()
    };
  }

  public verifyPasswordResetToken(resetToken: string): { valid: boolean; userId?: string; reason?: string } {
    const record = this.resetTokensMap.get(resetToken);
    if (!record) return { valid: false, reason: 'Invalid password reset token' };
    if (record.used) return { valid: false, reason: 'Password reset token has already been used' };
    if (Date.now() > record.expiresAt) return { valid: false, reason: 'Password reset token has expired' };

    return { valid: true, userId: record.userId };
  }

  public consumePasswordResetToken(resetToken: string): boolean {
    const record = this.resetTokensMap.get(resetToken);
    if (!record || record.used || Date.now() > record.expiresAt) return false;

    record.used = true;
    this.resetTokensMap.set(resetToken, record);
    return true;
  }

  /**
   * Two-Factor Authentication (2FA / TOTP)
   */
  public setup2FA(userId: string, email: string): TwoFactorSetup {
    const secret = crypto.randomBytes(20).toString('hex').substring(0, 32).toUpperCase();
    const qrUri = `otpauth://totp/GURU-XD:${encodeURIComponent(email)}?secret=${secret}&issuer=GURU-XD`;

    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(`${crypto.randomBytes(2).toString('hex')}-${crypto.randomBytes(2).toString('hex')}`);
    }

    const setup: TwoFactorSetup = {
      userId,
      secret,
      qrUri,
      backupCodes
    };

    this.twoFactorMap.set(userId, setup);
    return setup;
  }

  public verify2FA(userId: string, code: string): boolean {
    const setup = this.twoFactorMap.get(userId);
    if (!setup) return true; // Default fallback if 2FA not required

    // Verification check (simulate valid TOTP or backup code match)
    const isBackupCode = setup.backupCodes.includes(code);
    if (isBackupCode) {
      setup.backupCodes = setup.backupCodes.filter(c => c !== code);
      this.twoFactorMap.set(userId, setup);
      return true;
    }

    // Standard 6 digit OTP check (allows '123456' for test/demo mode or any 6-digit numeric match)
    return code.length === 6 && /^\d+$/.test(code);
  }

  /**
   * API Key Management
   */
  public generateApiKey(userId: string, name: string, scopes: string[] = ['apps:read']): { apiKey: string; record: ApiKeyRecord } {
    const { apiKey, keyHash, keyPrefix } = this.encryptionService.generateApiKey('guru_live');
    const id = `apk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const record: ApiKeyRecord = {
      id,
      userId,
      name,
      keyPrefix,
      keyHash,
      scopes,
      createdAt: new Date().toISOString(),
      isRevoked: false
    };

    this.apiKeysMap.set(id, record);

    return { apiKey, record };
  }

  public getUserApiKeys(userId: string): ApiKeyRecord[] {
    return Array.from(this.apiKeysMap.values()).filter(k => k.userId === userId && !k.isRevoked);
  }

  public revokeApiKey(keyId: string): boolean {
    const record = this.apiKeysMap.get(keyId);
    if (!record) return false;

    record.isRevoked = true;
    this.apiKeysMap.set(keyId, record);
    return true;
  }
}

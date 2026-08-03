import crypto from 'crypto';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag?: string;
  keyVersion: string;
  algorithm: string;
}

export interface KeyMetadata {
  version: string;
  createdAt: string;
  active: boolean;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private activeKeyVersion: string = 'v1';
  private keys: Map<string, Buffer> = new Map();
  private defaultSaltRounds: number = 100000;

  private constructor() {
    this.initializeKeys();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  private initializeKeys() {
    const masterSecret = process.env.ENCRYPTION_MASTER_KEY || process.env.JWT_SECRET || 'guru-xd-master-security-key-2026-production';
    const primaryKey = crypto.createHash('sha256').update(masterSecret).digest();
    this.keys.set('v1', primaryKey);
  }

  public addKeyVersion(version: string, keySecret: string, setAsActive: boolean = false): void {
    const derivedKey = crypto.createHash('sha256').update(keySecret).digest();
    this.keys.set(version, derivedKey);
    if (setAsActive) {
      this.activeKeyVersion = version;
    }
  }

  public getKeyVersions(): KeyMetadata[] {
    return Array.from(this.keys.keys()).map(version => ({
      version,
      createdAt: new Date().toISOString(),
      active: version === this.activeKeyVersion
    }));
  }

  // ----------------------------------------------------
  // SYMMETRIC ENCRYPTION (AES-256-GCM)
  // ----------------------------------------------------

  public encrypt(plainText: string, keyVersion?: string): EncryptedPayload {
    const targetVersion = keyVersion || this.activeKeyVersion;
    const key = this.keys.get(targetVersion);
    if (!key) {
      throw new Error(`Encryption key version [${targetVersion}] not found.`);
    }

    const iv = crypto.randomBytes(12); // Recommended IV size for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let ciphertext = cipher.update(plainText, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');

    return {
      ciphertext,
      iv: iv.toString('base64'),
      authTag,
      keyVersion: targetVersion,
      algorithm: 'aes-256-gcm'
    };
  }

  public decrypt(payload: EncryptedPayload): string {
    const key = this.keys.get(payload.keyVersion);
    if (!key) {
      throw new Error(`Decryption key version [${payload.keyVersion}] not found.`);
    }

    const iv = Buffer.from(payload.iv, 'base64');

    if (payload.algorithm === 'aes-256-gcm' && payload.authTag) {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

      let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } else {
      // Fallback for AES-256-CBC
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
  }

  public reEncrypt(payload: EncryptedPayload, targetKeyVersion: string): EncryptedPayload {
    const decrypted = this.decrypt(payload);
    return this.encrypt(decrypted, targetKeyVersion);
  }

  // ----------------------------------------------------
  // PASSWORD HASHING (PBKDF2 SHA-512)
  // ----------------------------------------------------

  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = this.defaultSaltRounds;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return `pbkdf2:sha512:${iterations}:${salt}:${hash}`;
  }

  public verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.startsWith('pbkdf2:sha512:')) {
      return false;
    }

    const parts = storedHash.split(':');
    if (parts.length !== 5) return false;

    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const expectedHash = parts[4];

    const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return this.safeCompare(computedHash, expectedHash);
  }

  // ----------------------------------------------------
  // HMAC SIGNING & TOKEN ENCRYPTION
  // ----------------------------------------------------

  public signHmac(data: string, secret?: string): string {
    const key = secret || process.env.HMAC_SECRET || 'guru-xd-hmac-secret-signature';
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  public verifyHmac(data: string, signature: string, secret?: string): boolean {
    const expected = this.signHmac(data, secret);
    return this.safeCompare(expected, signature);
  }

  public encryptToken(token: string): string {
    const payload = this.encrypt(token);
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  public decryptToken(encryptedToken: string): string {
    try {
      const jsonStr = Buffer.from(encryptedToken, 'base64url').toString('utf8');
      const payload: EncryptedPayload = JSON.parse(jsonStr);
      return this.decrypt(payload);
    } catch (err: any) {
      throw new Error(`Invalid or corrupt encrypted token: ${err.message}`);
    }
  }

  // ----------------------------------------------------
  // SECRET MASKING & SANITIZATION
  // ----------------------------------------------------

  public maskSecret(secret: string, visibleChars: number = 4): string {
    if (!secret) return '****';
    if (secret.length <= visibleChars * 2) {
      return '****';
    }
    const prefix = secret.substring(0, visibleChars);
    const suffix = secret.substring(secret.length - visibleChars);
    return `${prefix}****${suffix}`;
  }

  public sanitizeObject<T = any>(obj: T, sensitiveKeys: string[] = []): T {
    if (!obj || typeof obj !== 'object') return obj;

    const defaultKeys = [
      'password', 'secret', 'token', 'refreshToken', 'accessToken',
      'apiKey', 'privateKey', 'authorization', 'bearer', 'ssn', 'creditCard'
    ];
    const keysToRedact = new Set([...defaultKeys, ...sensitiveKeys.map(k => k.toLowerCase())]);

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, sensitiveKeys)) as unknown as T;
    }

    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (keysToRedact.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
      } else if (val && typeof val === 'object') {
        sanitized[key] = this.sanitizeObject(val, sensitiveKeys);
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized as T;
  }

  public generateSecureToken(lengthBytes: number = 32): string {
    return crypto.randomBytes(lengthBytes).toString('hex');
  }

  public generateApiKey(prefix: string = 'guru_live'): { apiKey: string; keyHash: string; keyPrefix: string } {
    const randomPart = crypto.randomBytes(24).toString('hex');
    const apiKey = `${prefix}_${randomPart}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 12);

    return {
      apiKey,
      keyHash,
      keyPrefix
    };
  }

  public hashSecret(secret: string, salt?: string, iterations: number = 10000): { hash: string; salt: string; iterations: number } {
    const activeSalt = salt || crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.pbkdf2Sync(secret, activeSalt, iterations, 64, 'sha512');
    return {
      hash: derivedKey.toString('hex'),
      salt: activeSalt,
      iterations
    };
  }

  public verifySecretHash(secret: string, expectedHash: string, salt: string, iterations: number = 10000): boolean {
    const { hash } = this.hashSecret(secret, salt, iterations);
    return this.safeCompare(hash, expectedHash);
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------

  public generateBlindIndex(data: string): string {
    return crypto.createHash('sha256').update(`blind-index:${data.toLowerCase().trim()}`).digest('hex');
  }

  public safeCompare(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }
}

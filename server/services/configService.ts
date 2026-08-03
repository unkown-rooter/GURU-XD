import { AppEventBus } from './eventBus';

export type EnvironmentProfile = 'development' | 'staging' | 'production' | 'test';

export interface ConfigItem<T = any> {
  key: string;
  value: T;
  namespace: string;
  description: string;
  isSecret: boolean;
  environmentOverride?: EnvironmentProfile;
  updatedAt: string;
  updatedBy: string;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number; // 0 - 100
  allowedEnvironments: EnvironmentProfile[];
  targetingUsers?: string[];
  updatedAt: string;
}

export interface ConfigRevision {
  revision: number;
  timestamp: string;
  changedKey: string;
  previousValue: any;
  newValue: any;
  updatedBy: string;
  description?: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  missingRequiredKeys: string[];
  invalidFormats: string[];
  warnings: string[];
}

export class ConfigService {
  private static instance: ConfigService;
  private currentEnvironment: EnvironmentProfile = 'production';
  private configs: Map<string, ConfigItem> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private revisions: ConfigRevision[] = [];
  private currentRevisionNumber: number = 0;
  private changeListeners: Set<(key: string, value: any) => void> = new Set();
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.detectEnvironment();
    this.seedDefaultConfigurations();
    this.seedDefaultFeatureFlags();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // ----------------------------------------------------
  // ENVIRONMENT PROFILE & DETECTION
  // ----------------------------------------------------

  private detectEnvironment() {
    const env = process.env.NODE_ENV?.toLowerCase();
    if (env === 'development' || env === 'dev') {
      this.currentEnvironment = 'development';
    } else if (env === 'staging') {
      this.currentEnvironment = 'staging';
    } else if (env === 'test') {
      this.currentEnvironment = 'test';
    } else {
      this.currentEnvironment = 'production';
    }
  }

  public getEnvironment(): EnvironmentProfile {
    return this.currentEnvironment;
  }

  public setEnvironment(profile: EnvironmentProfile): void {
    const oldProfile = this.currentEnvironment;
    this.currentEnvironment = profile;

    this.eventBus.publish('CONFIGURATION_CHANGED', {
      action: 'ENVIRONMENT_SWITCH',
      oldProfile,
      newProfile: profile
    }, undefined, 'ConfigService');
  }

  // ----------------------------------------------------
  // CONFIGURATION GET / SET / NAMESPACE
  // ----------------------------------------------------

  public get<T = any>(key: string, defaultValue?: T, namespace: string = 'default'): T {
    const fullKey = `${namespace}:${key}`;
    const item = this.configs.get(fullKey);

    if (!item) {
      // Try process.env fallback
      const envVal = process.env[key];
      if (envVal !== undefined) return envVal as any;
      return defaultValue as T;
    }

    return item.value as T;
  }

  public set<T = any>(
    key: string,
    value: T,
    options?: { namespace?: string; description?: string; isSecret?: boolean; updatedBy?: string }
  ): ConfigRevision {
    const namespace = options?.namespace || 'default';
    const fullKey = `${namespace}:${key}`;
    const now = new Date().toISOString();
    const updatedBy = options?.updatedBy || 'system';

    const existing = this.configs.get(fullKey);
    const prevValue = existing ? existing.value : undefined;

    const item: ConfigItem<T> = {
      key,
      value,
      namespace,
      description: options?.description || existing?.description || '',
      isSecret: options?.isSecret ?? existing?.isSecret ?? false,
      updatedAt: now,
      updatedBy
    };

    this.configs.set(fullKey, item);

    // Record Revision
    this.currentRevisionNumber++;
    const rev: ConfigRevision = {
      revision: this.currentRevisionNumber,
      timestamp: now,
      changedKey: fullKey,
      previousValue: prevValue,
      newValue: value,
      updatedBy,
      description: options?.description
    };

    this.revisions.unshift(rev);
    if (this.revisions.length > 200) this.revisions.pop();

    // Trigger Listeners
    this.notifyListeners(fullKey, value);

    // Trigger EventBus
    this.eventBus.publish('CONFIGURATION_CHANGED', {
      key: fullKey,
      revision: rev.revision,
      updatedBy
    }, undefined, 'ConfigService');

    return rev;
  }

  public getNamespace(namespace: string): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [k, item] of this.configs) {
      if (item.namespace === namespace) {
        result[item.key] = item.isSecret ? '******' : item.value;
      }
    }
    return result;
  }

  // ----------------------------------------------------
  // FEATURE FLAGS
  // ----------------------------------------------------

  public getFeatureFlag(flagKey: string, userId?: string): boolean {
    const flag = this.featureFlags.get(flagKey);
    if (!flag) return false;

    // Environment restriction check
    if (!flag.allowedEnvironments.includes(this.currentEnvironment)) {
      return false;
    }

    if (!flag.enabled) return false;

    // Targeting check
    if (userId && flag.targetingUsers && flag.targetingUsers.includes(userId)) {
      return true;
    }

    // Rollout percentage check
    if (flag.rolloutPercentage < 100) {
      if (!userId) return flag.rolloutPercentage >= 50;
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        hash = (hash << 5) - hash + userId.charCodeAt(i);
        hash |= 0;
      }
      const score = Math.abs(hash) % 100;
      return score < flag.rolloutPercentage;
    }

    return true;
  }

  public setFeatureFlag(
    key: string,
    enabled: boolean,
    options?: { rolloutPercentage?: number; allowedEnvironments?: EnvironmentProfile[]; description?: string }
  ): FeatureFlag {
    const flag: FeatureFlag = {
      key,
      enabled,
      description: options?.description || '',
      rolloutPercentage: options?.rolloutPercentage ?? 100,
      allowedEnvironments: options?.allowedEnvironments || ['development', 'staging', 'production', 'test'],
      updatedAt: new Date().toISOString()
    };

    this.featureFlags.set(key, flag);

    this.eventBus.publish('CONFIGURATION_CHANGED', {
      action: 'FEATURE_FLAG_UPDATED',
      flagKey: key,
      enabled
    }, undefined, 'ConfigService');

    return flag;
  }

  public getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  // ----------------------------------------------------
  // VALIDATION & REVISION ROLLBACK
  // ----------------------------------------------------

  public validateConfiguration(): ConfigValidationResult {
    const requiredKeys = [
      'default:PORT',
      'system:LOG_LEVEL',
      'security:JWT_SECRET'
    ];

    const missingRequiredKeys: string[] = [];
    const invalidFormats: string[] = [];
    const warnings: string[] = [];

    for (const reqKey of requiredKeys) {
      if (!this.configs.has(reqKey) && !process.env[reqKey.split(':')[1]]) {
        missingRequiredKeys.push(reqKey);
      }
    }

    return {
      valid: missingRequiredKeys.length === 0 && invalidFormats.length === 0,
      missingRequiredKeys,
      invalidFormats,
      warnings
    };
  }

  public rollbackToRevision(revisionNumber: number): boolean {
    const revIndex = this.revisions.findIndex(r => r.revision === revisionNumber);
    if (revIndex === -1) return false;

    const rev = this.revisions[revIndex];
    const [ns, key] = rev.changedKey.split(':');

    this.set(key, rev.previousValue, { namespace: ns, updatedBy: `ROLLBACK_TO_REV_${revisionNumber}` });
    return true;
  }

  public getRevisions(): ConfigRevision[] {
    return [...this.revisions];
  }

  public subscribeToChanges(fn: (key: string, value: any) => void): () => void {
    this.changeListeners.add(fn);
    return () => this.changeListeners.delete(fn);
  }

  // ----------------------------------------------------
  // PRIVATE SEED HELPERS
  // ----------------------------------------------------

  private notifyListeners(key: string, value: any) {
    this.changeListeners.forEach(fn => {
      try {
        fn(key, value);
      } catch (err) {
        console.error('[CONFIG LISTENERS] Error notifying listener:', err);
      }
    });
  }

  private seedDefaultConfigurations() {
    this.set('PORT', 3000, { namespace: 'default', description: 'Server listening port' });
    this.set('LOG_LEVEL', 'info', { namespace: 'system', description: 'Global logging level' });
    this.set('JWT_SECRET', 'guru_xd_secret_production_key_v9', { namespace: 'security', isSecret: true, description: 'JWT signature key' });
    this.set('CACHE_TTL_MS', 300000, { namespace: 'cache', description: 'Default L1 cache TTL in milliseconds' });
  }

  private seedDefaultFeatureFlags() {
    this.setFeatureFlag('ENABLE_AI_SECURITY_ANALYST', true, {
      description: 'Enables AI security analysis features',
      rolloutPercentage: 100
    });
    this.setFeatureFlag('ENABLE_REDIS_L2_CACHE', true, {
      description: 'Enables Redis L2 distributed caching tier',
      rolloutPercentage: 100
    });
    this.setFeatureFlag('ENABLE_AUTOMATED_DISASTER_RECOVERY', true, {
      description: 'Enables automated disaster recovery health monitoring',
      rolloutPercentage: 100
    });
  }
}

export const configService = ConfigService.getInstance();

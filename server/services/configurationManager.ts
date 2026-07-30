export interface AppConfigSpec {
  appId: string;
  name: string;
  type: string;
  repository?: string;
  region: string;
  replicaCount: number;
  envVars: Record<string, string>;
  secretsMasked: string[];
  updatedAt: string;
}

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private configs: Map<string, AppConfigSpec> = new Map();

  private constructor() {}

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public setConfig(spec: AppConfigSpec): void {
    const maskedKeys: string[] = [];
    const sanitizedEnv: Record<string, string> = {};

    for (const [k, v] of Object.entries(spec.envVars || {})) {
      if (k.includes('SECRET') || k.includes('KEY') || k.includes('TOKEN') || k.includes('PASSWORD')) {
        maskedKeys.push(k);
        sanitizedEnv[k] = v ? `${v.substring(0, 3)}••••••••` : '••••••••';
      } else {
        sanitizedEnv[k] = v;
      }
    }

    this.configs.set(spec.appId, {
      ...spec,
      envVars: sanitizedEnv,
      secretsMasked: maskedKeys,
      updatedAt: new Date().toISOString()
    });
  }

  public getConfig(appId: string): AppConfigSpec | undefined {
    return this.configs.get(appId);
  }

  public getAllConfigs(): AppConfigSpec[] {
    return Array.from(this.configs.values());
  }
}

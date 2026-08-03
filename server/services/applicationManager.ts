import { AppEventBus } from './eventBus';
import { ConfigurationManager } from './configurationManager';

export type AppCriticality = 'Business Critical' | 'High' | 'Standard' | 'Low';
export type AppEnvironment = 'development' | 'testing' | 'staging' | 'production';

export interface AppScalingPolicy {
  minReplicas: number;
  maxReplicas: number;
  targetCpuUtilization: number;
  autoScalingEnabled: boolean;
}

export interface AppResourceQuota {
  cpuLimit: string;
  memoryLimit: string;
  storageLimit: string;
  networkBandwidth: string;
}

export interface AppTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  defaultEnvVars: Record<string, string>;
  defaultPorts: number[];
  recommendedResources: AppResourceQuota;
}

export interface AppVersionRecord {
  version: string;
  releaseNotes: string;
  createdAt: string;
  createdBy: string;
  commitHash: string;
  artifactUrl?: string;
}

export interface AppDependency {
  appId: string;
  name: string;
  minVersion?: string;
  required: boolean;
  status: 'satisfied' | 'missing' | 'incompatible';
}

export interface ExtendedApplicationMetadata {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  owner: string;
  tenantId: string;
  environment: AppEnvironment;
  repository?: string;
  branch: string;
  region: string;
  replicaCount: number;
  criticality: AppCriticality;
  createdAt: string;
  updatedAt: string;
  status: 'running' | 'stopped' | 'failed' | 'deploying' | 'suspended' | 'installed';
  currentVersion: string;
  tags: string[];
  scalingPolicy: AppScalingPolicy;
  resourceQuota: AppResourceQuota;
  ports: number[];
  healthScore: number;
  dependencies: AppDependency[];
  versionHistory: AppVersionRecord[];
  metadata: Record<string, any>;
}

export class ApplicationManager {
  private static instance: ApplicationManager;
  private apps: Map<string, ExtendedApplicationMetadata> = new Map();
  private templates: Map<string, AppTemplate> = new Map();
  private appConfigurations: Map<string, { envVars: Record<string, string>; secretsMasked: string[] }> = new Map();
  private eventBus = AppEventBus.getInstance();
  private configManager = ConfigurationManager.getInstance();

  private constructor() {
    this.seedDefaultTemplates();
    this.seedDefaultApps();
  }

  public static getInstance(): ApplicationManager {
    if (!ApplicationManager.instance) {
      ApplicationManager.instance = new ApplicationManager();
    }
    return ApplicationManager.instance;
  }

  private seedDefaultTemplates() {
    const defaultTemplates: AppTemplate[] = [
      {
        id: 'tmpl-whatsapp-bot',
        name: 'WhatsApp Bot Service',
        type: 'WhatsApp Bot',
        category: 'Messaging',
        description: 'Multi-device WhatsApp gateway service with QR auth and automated message handlers.',
        defaultEnvVars: {
          NODE_ENV: 'production',
          WHATSAPP_SESSION_NAME: 'guru-session',
          MAX_RETRIES: '5'
        },
        defaultPorts: [3000],
        recommendedResources: { cpuLimit: '1000m', memoryLimit: '1024Mi', storageLimit: '5Gi', networkBandwidth: '100Mbps' }
      },
      {
        id: 'tmpl-telegram-bot',
        name: 'Telegram Sentinel Bot',
        type: 'Telegram Bot',
        category: 'Messaging',
        description: 'Async polling and webhook Telegram bot sentinel with rate limiting and command routing.',
        defaultEnvVars: {
          NODE_ENV: 'production',
          TELEGRAM_POLLING: 'true',
          BOT_MODE: 'sentinel'
        },
        defaultPorts: [3001],
        recommendedResources: { cpuLimit: '500m', memoryLimit: '512Mi', storageLimit: '2Gi', networkBandwidth: '50Mbps' }
      },
      {
        id: 'tmpl-ai-agent',
        name: 'Autonomous AI Copilot Agent',
        type: 'AI Agent',
        category: 'AI & Machine Learning',
        description: 'High-throughput LLM copilot agent powered by Gemini API and vector storage.',
        defaultEnvVars: {
          NODE_ENV: 'production',
          AI_MODEL: 'gemini-2.5-flash',
          EMBEDDING_PROVIDER: 'internal'
        },
        defaultPorts: [8080],
        recommendedResources: { cpuLimit: '2000m', memoryLimit: '2048Mi', storageLimit: '10Gi', networkBandwidth: '500Mbps' }
      },
      {
        id: 'tmpl-express-api',
        name: 'Express Microservice API',
        type: 'Express API',
        category: 'Backend Services',
        description: 'Production-ready REST API service with OpenAPI routing, CORS, and auth middleware.',
        defaultEnvVars: {
          NODE_ENV: 'production',
          PORT: '3000',
          LOG_LEVEL: 'info'
        },
        defaultPorts: [3000],
        recommendedResources: { cpuLimit: '1000m', memoryLimit: '1024Mi', storageLimit: '5Gi', networkBandwidth: '100Mbps' }
      }
    ];

    defaultTemplates.forEach(t => this.templates.set(t.id, t));
  }

  private seedDefaultApps() {
    const now = new Date().toISOString();
    const defaultApps: ExtendedApplicationMetadata[] = [
      {
        id: 'app-1',
        name: 'guru-whatsapp-master',
        type: 'WhatsApp Bot',
        category: 'Messaging',
        description: 'Master WhatsApp automation cluster handling customer notifications and bot routing.',
        owner: 'admin@guru.internal',
        tenantId: 'tenant-default',
        environment: 'production',
        repository: 'https://github.com/guru-xd/whatsapp-bot.git',
        branch: 'main',
        region: 'us-east-1 (N. Virginia)',
        replicaCount: 2,
        criticality: 'Business Critical',
        createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 30).toISOString(),
        updatedAt: now,
        status: 'running',
        currentVersion: 'v2.4.1',
        tags: ['messaging', 'whatsapp', 'customer-service', 'production'],
        scalingPolicy: { minReplicas: 2, maxReplicas: 10, targetCpuUtilization: 75, autoScalingEnabled: true },
        resourceQuota: { cpuLimit: '1000m', memoryLimit: '1024Mi', storageLimit: '5Gi', networkBandwidth: '100Mbps' },
        ports: [3000],
        healthScore: 98,
        dependencies: [],
        versionHistory: [
          { version: 'v2.4.1', releaseNotes: 'Security hardening & socket keepalive patches', createdAt: now, createdBy: 'CI/CD Pipeline', commitHash: 'a1b2c3d' },
          { version: 'v2.4.0', releaseNotes: 'Added multi-device auth support', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), createdBy: 'lead-dev', commitHash: 'f9e8d7c' }
        ],
        metadata: { engineVersion: 'v6.0.0', clusterNode: 'node-us-east-1a' }
      },
      {
        id: 'app-2',
        name: 'guru-telegram-sentinel',
        type: 'Telegram Bot',
        category: 'Messaging',
        description: 'High-availability Telegram moderation and system telemetry bot.',
        owner: 'security@guru.internal',
        tenantId: 'tenant-default',
        environment: 'production',
        repository: 'https://github.com/guru-xd/telegram-bot.git',
        branch: 'main',
        region: 'eu-west-2 (London)',
        replicaCount: 1,
        criticality: 'High',
        createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 20).toISOString(),
        updatedAt: now,
        status: 'running',
        currentVersion: 'v1.8.0',
        tags: ['messaging', 'telegram', 'security'],
        scalingPolicy: { minReplicas: 1, maxReplicas: 4, targetCpuUtilization: 80, autoScalingEnabled: false },
        resourceQuota: { cpuLimit: '500m', memoryLimit: '512Mi', storageLimit: '2Gi', networkBandwidth: '50Mbps' },
        ports: [3001],
        healthScore: 96,
        dependencies: [{ appId: 'app-1', name: 'guru-whatsapp-master', required: false, status: 'satisfied' }],
        versionHistory: [
          { version: 'v1.8.0', releaseNotes: 'Updated telegram bot API wrappers to v6.2', createdAt: now, createdBy: 'CI/CD Pipeline', commitHash: 'c3d4e5f' }
        ],
        metadata: { engineVersion: 'v6.0.0', clusterNode: 'node-eu-west-2b' }
      },
      {
        id: 'app-3',
        name: 'ai-copilot-agent-service',
        type: 'AI Agent',
        category: 'AI & Machine Learning',
        description: 'Autonomous reasoning engine supplying intelligence to the GURU-XD platform.',
        owner: 'ai-team@guru.internal',
        tenantId: 'tenant-default',
        environment: 'production',
        repository: 'https://github.com/guru-xd/copilot-service.git',
        branch: 'main',
        region: 'us-east-1 (N. Virginia)',
        replicaCount: 4,
        criticality: 'Business Critical',
        createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 15).toISOString(),
        updatedAt: now,
        status: 'running',
        currentVersion: 'v3.2.0',
        tags: ['ai', 'copilot', 'gemini', 'core'],
        scalingPolicy: { minReplicas: 2, maxReplicas: 16, targetCpuUtilization: 70, autoScalingEnabled: true },
        resourceQuota: { cpuLimit: '2000m', memoryLimit: '2048Mi', storageLimit: '10Gi', networkBandwidth: '500Mbps' },
        ports: [8080],
        healthScore: 99,
        dependencies: [],
        versionHistory: [
          { version: 'v3.2.0', releaseNotes: 'Gemini 2.5 integration & enhanced context cache', createdAt: now, createdBy: 'AI Release Manager', commitHash: 'e5f6a7b' }
        ],
        metadata: { engineVersion: 'v6.0.0', clusterNode: 'node-us-east-1c' }
      },
      {
        id: 'app-4',
        name: 'express-auth-microservice',
        type: 'Express API',
        category: 'Backend Services',
        description: 'Central OAuth2, JWT token validation, and multi-tenant identity microservice.',
        owner: 'sec-ops@guru.internal',
        tenantId: 'tenant-default',
        environment: 'production',
        repository: 'https://github.com/guru-xd/express-auth.git',
        branch: 'main',
        region: 'ap-south-1 (Mumbai)',
        replicaCount: 2,
        criticality: 'High',
        createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString(),
        updatedAt: now,
        status: 'running',
        currentVersion: 'v2.1.0',
        tags: ['auth', 'express', 'security', 'identity'],
        scalingPolicy: { minReplicas: 2, maxReplicas: 8, targetCpuUtilization: 75, autoScalingEnabled: true },
        resourceQuota: { cpuLimit: '1000m', memoryLimit: '1024Mi', storageLimit: '5Gi', networkBandwidth: '100Mbps' },
        ports: [3000],
        healthScore: 100,
        dependencies: [],
        versionHistory: [
          { version: 'v2.1.0', releaseNotes: 'RS256 key rotation support & rate limit protection', createdAt: now, createdBy: 'CI/CD Pipeline', commitHash: 'b7c8d9e' }
        ],
        metadata: { engineVersion: 'v6.0.0', clusterNode: 'node-ap-south-1a' }
      }
    ];

    defaultApps.forEach(app => {
      this.apps.set(app.id, app);
      this.appConfigurations.set(app.id, {
        envVars: {
          NODE_ENV: app.environment,
          PORT: String(app.ports[0] || 3000),
          DATABASE_URL: 'postgres://admin:•••••@db.internal:5432/app',
          APP_NAME: app.name
        },
        secretsMasked: ['DATABASE_URL']
      });

      this.configManager.setConfig({
        appId: app.id,
        name: app.name,
        type: app.type,
        region: app.region,
        replicaCount: app.replicaCount,
        envVars: {
          NODE_ENV: app.environment,
          PORT: String(app.ports[0] || 3000),
          DATABASE_URL: 'postgres://admin:•••••@db.internal:5432/app'
        },
        secretsMasked: ['DATABASE_URL'],
        updatedAt: app.createdAt
      });
    });
  }

  public registerApplication(appData: Partial<ExtendedApplicationMetadata> & { name: string; type: string }): ExtendedApplicationMetadata {
    const id = appData.id || `app-${Date.now()}`;
    const now = new Date().toISOString();

    const newApp: ExtendedApplicationMetadata = {
      id,
      name: appData.name,
      type: appData.type,
      category: appData.category || 'General Services',
      description: appData.description || `Application ${appData.name} registered on Version 6 Application Platform.`,
      owner: appData.owner || 'operator@guru.internal',
      tenantId: appData.tenantId || 'tenant-default',
      environment: appData.environment || 'production',
      repository: appData.repository || `https://github.com/guru-xd/${appData.name}.git`,
      branch: appData.branch || 'main',
      region: appData.region || 'us-east-1 (N. Virginia)',
      replicaCount: appData.replicaCount || 1,
      criticality: appData.criticality || 'Standard',
      createdAt: now,
      updatedAt: now,
      status: appData.status || 'running',
      currentVersion: appData.currentVersion || 'v1.0.0',
      tags: appData.tags || ['custom', appData.type.toLowerCase().replace(/\s+/g, '-')],
      scalingPolicy: appData.scalingPolicy || { minReplicas: 1, maxReplicas: 5, targetCpuUtilization: 80, autoScalingEnabled: true },
      resourceQuota: appData.resourceQuota || { cpuLimit: '1000m', memoryLimit: '1024Mi', storageLimit: '5Gi', networkBandwidth: '100Mbps' },
      ports: appData.ports || [3000],
      healthScore: appData.healthScore || 100,
      dependencies: appData.dependencies || [],
      versionHistory: appData.versionHistory || [
        { version: appData.currentVersion || 'v1.0.0', releaseNotes: 'Initial registration', createdAt: now, createdBy: appData.owner || 'system', commitHash: 'init' }
      ],
      metadata: appData.metadata || { engineVersion: 'v6.0.0' }
    };

    this.apps.set(id, newApp);
    this.appConfigurations.set(id, {
      envVars: {
        NODE_ENV: newApp.environment,
        PORT: String(newApp.ports[0] || 3000),
        APP_NAME: newApp.name
      },
      secretsMasked: []
    });

    this.eventBus.publish('APP_CREATED', newApp, id, 'ApplicationManager');
    return newApp;
  }

  public updateApplication(id: string, updates: Partial<ExtendedApplicationMetadata>): ExtendedApplicationMetadata | null {
    const existing = this.apps.get(id);
    if (!existing) return null;

    const updated: ExtendedApplicationMetadata = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.apps.set(id, updated);
    this.eventBus.publish('APP_UPDATED', updated, id, 'ApplicationManager');
    return updated;
  }

  public deleteApplication(id: string): boolean {
    const existing = this.apps.get(id);
    if (!existing) return false;

    this.apps.delete(id);
    this.appConfigurations.delete(id);
    this.eventBus.publish('APP_DELETED', { id, name: existing.name }, id, 'ApplicationManager');
    return true;
  }

  public getApplication(id: string): ExtendedApplicationMetadata | undefined {
    return this.apps.get(id);
  }

  public getAllApplications(): ExtendedApplicationMetadata[] {
    return Array.from(this.apps.values());
  }

  public discoverApplications(filter: {
    category?: string;
    tag?: string;
    environment?: AppEnvironment;
    status?: string;
    tenantId?: string;
    search?: string;
  }): ExtendedApplicationMetadata[] {
    return this.getAllApplications().filter(app => {
      if (filter.category && app.category.toLowerCase() !== filter.category.toLowerCase()) return false;
      if (filter.tag && !app.tags.some(t => t.toLowerCase() === filter.tag!.toLowerCase())) return false;
      if (filter.environment && app.environment !== filter.environment) return false;
      if (filter.status && app.status !== filter.status) return false;
      if (filter.tenantId && app.tenantId !== filter.tenantId) return false;
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const matchesName = app.name.toLowerCase().includes(query);
        const matchesDesc = app.description.toLowerCase().includes(query);
        const matchesType = app.type.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesType) return false;
      }
      return true;
    });
  }

  public getTemplates(): AppTemplate[] {
    return Array.from(this.templates.values());
  }

  public createFromTemplate(templateId: string, name: string, owner: string, overrides?: Partial<ExtendedApplicationMetadata>): ExtendedApplicationMetadata {
    const tmpl = this.templates.get(templateId);
    if (!tmpl) {
      throw new Error(`Template ${templateId} not found`);
    }

    const newApp = this.registerApplication({
      name,
      type: tmpl.type,
      category: tmpl.category,
      description: tmpl.description,
      owner,
      ports: tmpl.defaultPorts,
      resourceQuota: tmpl.recommendedResources,
      ...overrides
    });

    // Set default env vars
    const config = this.appConfigurations.get(newApp.id);
    if (config) {
      config.envVars = { ...tmpl.defaultEnvVars, ...config.envVars };
    }

    return newApp;
  }

  public registerVersion(id: string, versionRecord: Omit<AppVersionRecord, 'createdAt'>): ExtendedApplicationMetadata | null {
    const app = this.apps.get(id);
    if (!app) return null;

    const fullRecord: AppVersionRecord = {
      ...versionRecord,
      createdAt: new Date().toISOString()
    };

    const versionHistory = [fullRecord, ...app.versionHistory];
    return this.updateApplication(id, {
      currentVersion: versionRecord.version,
      versionHistory
    });
  }

  public rollbackToVersion(id: string, targetVersion: string): ExtendedApplicationMetadata | null {
    const app = this.apps.get(id);
    if (!app) return null;

    const targetRecord = app.versionHistory.find(v => v.version === targetVersion);
    if (!targetRecord) {
      throw new Error(`Target version ${targetVersion} not found in history for application ${id}`);
    }

    return this.updateApplication(id, {
      currentVersion: targetVersion,
      updatedAt: new Date().toISOString()
    });
  }

  public updateConfiguration(id: string, envVars: Record<string, string>, secretsMasked: string[] = []): boolean {
    const app = this.apps.get(id);
    if (!app) return false;

    const currentConfig = this.appConfigurations.get(id) || { envVars: {}, secretsMasked: [] };
    const mergedEnvVars = { ...currentConfig.envVars, ...envVars };
    const mergedSecrets = Array.from(new Set([...currentConfig.secretsMasked, ...secretsMasked]));

    this.appConfigurations.set(id, { envVars: mergedEnvVars, secretsMasked: mergedSecrets });

    // Sync with system ConfigurationManager
    this.configManager.setConfig({
      appId: id,
      name: app.name,
      type: app.type,
      region: app.region,
      replicaCount: app.replicaCount,
      envVars: mergedEnvVars,
      secretsMasked: mergedSecrets,
      updatedAt: new Date().toISOString()
    });

    this.eventBus.publish('CONFIGURATION_CHANGED', { appId: id, envVarsKeys: Object.keys(envVars) }, id, 'ApplicationManager');
    return true;
  }

  public getConfiguration(id: string): { envVars: Record<string, string>; secretsMasked: string[] } | null {
    return this.appConfigurations.get(id) || null;
  }

  public addDependency(id: string, dependency: AppDependency): boolean {
    const app = this.apps.get(id);
    if (!app) return false;

    const existingIndex = app.dependencies.findIndex(d => d.appId === dependency.appId);
    let updatedDeps = [...app.dependencies];

    if (existingIndex >= 0) {
      updatedDeps[existingIndex] = dependency;
    } else {
      updatedDeps.push(dependency);
    }

    this.updateApplication(id, { dependencies: updatedDeps });
    return true;
  }

  public removeDependency(id: string, depAppId: string): boolean {
    const app = this.apps.get(id);
    if (!app) return false;

    const updatedDeps = app.dependencies.filter(d => d.appId !== depAppId);
    this.updateApplication(id, { dependencies: updatedDeps });
    return true;
  }

  public resolveDependencyGraph(id: string): { resolved: boolean; graph: AppDependency[]; missing: string[]; cyclic: boolean } {
    const app = this.apps.get(id);
    if (!app) {
      return { resolved: false, graph: [], missing: ['APP_NOT_FOUND'], cyclic: false };
    }

    const missing: string[] = [];
    const graph: AppDependency[] = [];
    const visited = new Set<string>();
    let cyclic = false;

    const checkApp = (currentId: string, path: string[]) => {
      if (path.includes(currentId)) {
        cyclic = true;
        return;
      }
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const target = this.apps.get(currentId);
      if (!target) return;

      for (const dep of target.dependencies) {
        const depApp = this.apps.get(dep.appId);
        if (!depApp) {
          if (dep.required) {
            missing.push(dep.appId);
          }
          graph.push({ ...dep, status: 'missing' });
        } else {
          graph.push({ ...dep, status: 'satisfied' });
          checkApp(dep.appId, [...path, currentId]);
        }
      }
    };

    checkApp(id, []);

    return {
      resolved: missing.length === 0 && !cyclic,
      graph,
      missing,
      cyclic
    };
  }
}

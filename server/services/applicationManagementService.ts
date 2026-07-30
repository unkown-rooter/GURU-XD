import { AppEventBus } from './eventBus';
import { ConfigurationManager, AppConfigSpec } from './configurationManager';

export interface ApplicationMetadata {
  id: string;
  name: string;
  type: string;
  repository?: string;
  region: string;
  replicaCount: number;
  criticality: 'Business Critical' | 'High' | 'Standard' | 'Low';
  createdAt: string;
  status: 'running' | 'stopped' | 'failed' | 'deploying';
}

export class ApplicationManagementService {
  private static instance: ApplicationManagementService;
  private apps: Map<string, ApplicationMetadata> = new Map();
  private eventBus = AppEventBus.getInstance();
  private configManager = ConfigurationManager.getInstance();

  private constructor() {
    this.seedDefaultApps();
  }

  public static getInstance(): ApplicationManagementService {
    if (!ApplicationManagementService.instance) {
      ApplicationManagementService.instance = new ApplicationManagementService();
    }
    return ApplicationManagementService.instance;
  }

  private seedDefaultApps() {
    const defaults: ApplicationMetadata[] = [
      {
        id: 'app-1',
        name: 'guru-whatsapp-master',
        type: 'WhatsApp Bot',
        repository: 'https://github.com/guru-xd/whatsapp-bot.git',
        region: 'us-east-1 (N. Virginia)',
        replicaCount: 2,
        criticality: 'Business Critical',
        createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 30).toISOString(),
        status: 'running'
      },
      {
        id: 'app-2',
        name: 'guru-telegram-sentinel',
        type: 'Telegram Bot',
        repository: 'https://github.com/guru-xd/telegram-bot.git',
        region: 'eu-west-2 (London)',
        replicaCount: 1,
        criticality: 'High',
        createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 20).toISOString(),
        status: 'running'
      },
      {
        id: 'app-3',
        name: 'ai-copilot-agent-service',
        type: 'AI Agent',
        repository: 'https://github.com/guru-xd/copilot-service.git',
        region: 'us-east-1 (N. Virginia)',
        replicaCount: 4,
        criticality: 'Business Critical',
        createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 15).toISOString(),
        status: 'running'
      },
      {
        id: 'app-4',
        name: 'express-auth-microservice',
        type: 'Express API',
        repository: 'https://github.com/guru-xd/express-auth.git',
        region: 'ap-south-1 (Mumbai)',
        replicaCount: 2,
        criticality: 'High',
        createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString(),
        status: 'running'
      }
    ];

    defaults.forEach(app => {
      this.apps.set(app.id, app);
      this.configManager.setConfig({
        appId: app.id,
        name: app.name,
        type: app.type,
        region: app.region,
        replicaCount: app.replicaCount,
        envVars: {
          NODE_ENV: 'production',
          PORT: '3000',
          DATABASE_URL: 'postgres://admin:•••••@db.internal:5432/app'
        },
        secretsMasked: ['DATABASE_URL'],
        updatedAt: app.createdAt
      });
    });
  }

  public registerApplication(app: Partial<ApplicationMetadata> & { name: string; type: string }): ApplicationMetadata {
    const id = app.id || `app-${Date.now()}`;
    const newApp: ApplicationMetadata = {
      id,
      name: app.name,
      type: app.type,
      repository: app.repository || `https://github.com/guru-xd/${app.name}.git`,
      region: app.region || 'us-east-1 (N. Virginia)',
      replicaCount: app.replicaCount || 1,
      criticality: app.criticality || 'Standard',
      createdAt: new Date().toISOString(),
      status: 'running'
    };

    this.apps.set(id, newApp);
    this.eventBus.publish('APP_CREATED', newApp, id, 'ApplicationManagementService');

    return newApp;
  }

  public updateApplication(id: string, updates: Partial<ApplicationMetadata>): ApplicationMetadata | null {
    const app = this.apps.get(id);
    if (!app) return null;

    const updated = { ...app, ...updates };
    this.apps.set(id, updated);

    this.eventBus.publish('APP_UPDATED', updated, id, 'ApplicationManagementService');
    return updated;
  }

  public deleteApplication(id: string): boolean {
    const app = this.apps.get(id);
    if (!app) return false;

    this.apps.delete(id);
    this.eventBus.publish('APP_DELETED', { id, name: app.name }, id, 'ApplicationManagementService');
    return true;
  }

  public getApplication(id: string): ApplicationMetadata | undefined {
    return this.apps.get(id);
  }

  public getAllApplications(): ApplicationMetadata[] {
    return Array.from(this.apps.values());
  }
}

import { AppEventBus } from './eventBus';
import { ApplicationManagementService } from './applicationManagementService';

export interface DeploymentRecord {
  id: string;
  appId: string;
  version: string;
  status: 'deploying' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  commitHash: string;
  deployedBy: string;
}

export class ApplicationRuntimeService {
  private static instance: ApplicationRuntimeService;
  private eventBus = AppEventBus.getInstance();
  private appManager = ApplicationManagementService.getInstance();
  private deployments: Map<string, DeploymentRecord[]> = new Map();

  private constructor() {}

  public static getInstance(): ApplicationRuntimeService {
    if (!ApplicationRuntimeService.instance) {
      ApplicationRuntimeService.instance = new ApplicationRuntimeService();
    }
    return ApplicationRuntimeService.instance;
  }

  public startApp(appId: string, user: string = 'operator'): boolean {
    const app = this.appManager.getApplication(appId);
    if (!app) return false;

    this.appManager.updateApplication(appId, { status: 'running' });
    this.eventBus.publish('APP_STARTED', { appId, name: app.name, user }, appId, 'ApplicationRuntimeService');
    return true;
  }

  public stopApp(appId: string, user: string = 'operator'): boolean {
    const app = this.appManager.getApplication(appId);
    if (!app) return false;

    this.appManager.updateApplication(appId, { status: 'stopped' });
    this.eventBus.publish('APP_STOPPED', { appId, name: app.name, user }, appId, 'ApplicationRuntimeService');
    return true;
  }

  public restartApp(appId: string, user: string = 'operator'): boolean {
    const app = this.appManager.getApplication(appId);
    if (!app) return false;

    this.appManager.updateApplication(appId, { status: 'running' });
    this.eventBus.publish('APP_RESTARTED', { appId, name: app.name, user }, appId, 'ApplicationRuntimeService');
    return true;
  }

  public triggerDeployment(appId: string, version: string, deployedBy: string = 'CI/CD Pipeline'): DeploymentRecord {
    const app = this.appManager.getApplication(appId);
    const deployId = `dep-${Date.now()}`;
    const record: DeploymentRecord = {
      id: deployId,
      appId,
      version,
      status: 'deploying',
      startedAt: new Date().toISOString(),
      commitHash: Math.random().toString(16).substring(2, 9),
      deployedBy
    };

    const records = this.deployments.get(appId) || [];
    records.push(record);
    this.deployments.set(appId, records);

    this.eventBus.publish('DEPLOYMENT_STARTED', record, appId, 'ApplicationRuntimeService');

    // Simulate async deployment completion
    setTimeout(() => {
      record.status = 'completed';
      record.completedAt = new Date().toISOString();
      this.eventBus.publish('DEPLOYMENT_COMPLETED', record, appId, 'ApplicationRuntimeService');
    }, 1500);

    return record;
  }

  public getDeployments(appId: string): DeploymentRecord[] {
    return this.deployments.get(appId) || [];
  }
}

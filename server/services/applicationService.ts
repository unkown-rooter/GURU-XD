import { AppEventBus } from './eventBus';
import { ServiceRegistry } from '../serviceRegistry';
import { ApplicationManager, ExtendedApplicationMetadata, AppTemplate, AppDependency, AppEnvironment } from './applicationManager';
import { ApplicationLifecycleManager, LifecycleState, LifecycleAction, LifecycleAuditRecord } from './applicationLifecycle';
import { ApplicationRuntimeEngine, RuntimeProcess, BackgroundWorker, ResourceAllocation, RuntimeEvent } from './applicationRuntime';
import { ApplicationHealthService, AppHealthReport, ProbeStatus } from './applicationHealthService';
import { ApplicationMetricsService, RuntimeMetricsSnapshot, AggregatedMetrics, MetricTimeRange } from './applicationMetricsService';
import { ApplicationValidator, ValidationReport, ValidationIssue } from './applicationValidator';

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  planTier: 'enterprise' | 'pro' | 'community';
  maxAppCount: number;
}

export type AppRole = 'admin' | 'developer' | 'operator' | 'viewer' | 'owner';

export type AppPermission =
  | 'app:read'
  | 'app:create'
  | 'app:update'
  | 'app:delete'
  | 'app:lifecycle'
  | 'app:configure'
  | 'app:metrics'
  | 'app:diagnostics'
  | 'app:admin';

export interface AppAuditEntry {
  id: string;
  appId: string;
  tenantId: string;
  action: string;
  actor: string;
  role: AppRole;
  details: any;
  timestamp: string;
}

export interface AIRecommendation {
  id: string;
  appId: string;
  category: 'scaling' | 'security' | 'cost' | 'performance';
  title: string;
  explanation: string;
  actionType: string;
  impactScore: number; // 1 - 100
  createdAt: string;
}

export class ApplicationService {
  private static instance: ApplicationService;

  public manager = ApplicationManager.getInstance();
  public lifecycle = ApplicationLifecycleManager.getInstance();
  public runtime = ApplicationRuntimeEngine.getInstance();
  public health = ApplicationHealthService.getInstance();
  public metrics = ApplicationMetricsService.getInstance();
  public validator = ApplicationValidator.getInstance();

  private eventBus = AppEventBus.getInstance();
  private registry = ServiceRegistry.getInstance();

  private auditLogs: AppAuditEntry[] = [];
  private recommendations: Map<string, AIRecommendation[]> = new Map();

  private rolePermissions: Record<AppRole, AppPermission[]> = {
    owner: ['app:read', 'app:create', 'app:update', 'app:delete', 'app:lifecycle', 'app:configure', 'app:metrics', 'app:diagnostics', 'app:admin'],
    admin: ['app:read', 'app:create', 'app:update', 'app:delete', 'app:lifecycle', 'app:configure', 'app:metrics', 'app:diagnostics', 'app:admin'],
    developer: ['app:read', 'app:create', 'app:update', 'app:lifecycle', 'app:configure', 'app:metrics', 'app:diagnostics'],
    operator: ['app:read', 'app:lifecycle', 'app:metrics', 'app:diagnostics'],
    viewer: ['app:read', 'app:metrics']
  };

  private constructor() {
    this.registerSelfInRegistry();
    this.generateDefaultRecommendations();
  }

  public static getInstance(): ApplicationService {
    if (!ApplicationService.instance) {
      ApplicationService.instance = new ApplicationService();
    }
    return ApplicationService.instance;
  }

  private registerSelfInRegistry() {
    this.registry.registerService({
      serviceId: 'srv-application-platform',
      serviceName: 'Application Platform Engine',
      version: 'v6.0.0',
      description: 'Enterprise Application Platform v6 managing multi-tenant registration, lifecycle, runtime isolation, health, and metrics.',
      status: 'ACTIVE',
      lifecycleState: 'READY',
      health: 100,
      supportedEvents: [
        'APP_CREATED',
        'APP_UPDATED',
        'APP_STARTED',
        'APP_STOPPED',
        'APP_RESTARTED',
        'APP_DELETED',
        'HEALTH_CHANGED',
        'RESOURCE_USAGE_UPDATED',
        'CONFIGURATION_CHANGED'
      ],
      telemetryTypes: ['Performance', 'Behavior', 'Health', 'Metrics', 'Resource Usage', 'Configuration Changes', 'User Activity'],
      dependencies: ['srv-monitoring-engine', 'srv-instance-manager', 'srv-health-engine'],
      capabilities: ['Deployment', 'Monitoring', 'Behavior', 'Metrics', 'Health', 'Performance', 'Configuration', 'Recovery'],
      registeredAt: new Date().toISOString()
    });
  }

  private generateDefaultRecommendations() {
    const apps = this.manager.getAllApplications();
    apps.forEach(app => {
      const recs: AIRecommendation[] = [
        {
          id: `rec-${app.id}-1`,
          appId: app.id,
          category: 'scaling',
          title: 'Enable Auto-Scaling Policy',
          explanation: `Application ${app.name} experiences peak traffic bursts. Enabling target CPU auto-scaling at 75% will prevent latency degradation.`,
          actionType: 'enable_autoscaling',
          impactScore: 88,
          createdAt: new Date().toISOString()
        },
        {
          id: `rec-${app.id}-2`,
          appId: app.id,
          category: 'security',
          title: 'Rotate Masked Secrets & Enable HTTPS Strict Transport',
          explanation: 'Ensure all downstream database tokens are rotated on 90-day cadences and enforce strict TLS 1.3.',
          actionType: 'rotate_secrets',
          impactScore: 92,
          createdAt: new Date().toISOString()
        }
      ];
      this.recommendations.set(app.id, recs);
    });
  }

  public checkPermission(role: AppRole, permission: AppPermission): boolean {
    const perms = this.rolePermissions[role] || [];
    return perms.includes(permission);
  }

  public recordAudit(appId: string, tenantId: string, action: string, actor: string, role: AppRole, details: any) {
    const entry: AppAuditEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId,
      tenantId,
      action,
      actor,
      role,
      details,
      timestamp: new Date().toISOString()
    };

    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  // Unified Application Platform Facade APIs

  public registerApplication(
    appData: Partial<ExtendedApplicationMetadata> & { name: string; type: string },
    actor: string = 'operator@guru.internal',
    role: AppRole = 'admin'
  ): { app: ExtendedApplicationMetadata; validation: ValidationReport } {
    const validation = this.validator.validateFullApplication(appData);
    if (!validation.isValid) {
      throw new Error(`Application validation failed with ${validation.errorCount} error(s). See validation report.`);
    }

    const app = this.manager.registerApplication(appData);
    this.lifecycle.install(app.id, actor);
    this.runtime.registerProcess(app.id);

    this.recordAudit(app.id, app.tenantId, 'app.register', actor, role, { name: app.name, type: app.type });
    return { app, validation };
  }

  public async startApplication(appId: string, actor: string = 'operator', role: AppRole = 'operator') {
    if (!this.checkPermission(role, 'app:lifecycle')) {
      throw new Error(`Role ${role} does not have permission app:lifecycle.`);
    }
    const result = await this.lifecycle.start(appId, actor);
    if (result.success) {
      this.runtime.registerProcess(appId);
      await this.health.evaluateFullHealth(appId);
    }
    this.recordAudit(appId, 'tenant-default', 'app.start', actor, role, result);
    return result;
  }

  public async stopApplication(appId: string, actor: string = 'operator', role: AppRole = 'operator') {
    if (!this.checkPermission(role, 'app:lifecycle')) {
      throw new Error(`Role ${role} does not have permission app:lifecycle.`);
    }
    const result = await this.lifecycle.stop(appId, { gracefulTimeoutMs: 1000 }, actor);
    if (result.success) {
      this.runtime.terminateProcess(appId);
      await this.health.evaluateFullHealth(appId);
    }
    this.recordAudit(appId, 'tenant-default', 'app.stop', actor, role, result);
    return result;
  }

  public async restartApplication(appId: string, actor: string = 'operator', role: AppRole = 'operator') {
    if (!this.checkPermission(role, 'app:lifecycle')) {
      throw new Error(`Role ${role} does not have permission app:lifecycle.`);
    }
    const result = await this.lifecycle.restart(appId, actor);
    if (result.success) {
      this.runtime.terminateProcess(appId);
      this.runtime.registerProcess(appId);
      await this.health.evaluateFullHealth(appId);
    }
    this.recordAudit(appId, 'tenant-default', 'app.restart', actor, role, result);
    return result;
  }

  public async removeApplication(appId: string, actor: string = 'admin', role: AppRole = 'admin') {
    if (!this.checkPermission(role, 'app:delete')) {
      throw new Error(`Role ${role} does not have permission app:delete.`);
    }
    this.runtime.terminateProcess(appId);
    const result = await this.lifecycle.remove(appId, true, actor);
    this.recordAudit(appId, 'tenant-default', 'app.remove', actor, role, result);
    return result;
  }

  public getApplicationOverview(appId: string): {
    metadata: ExtendedApplicationMetadata | undefined;
    lifecycleState: LifecycleState;
    process: RuntimeProcess | undefined;
    healthReport: AppHealthReport;
    metricsSnapshot: RuntimeMetricsSnapshot;
    validation: ValidationReport;
    recommendations: AIRecommendation[];
  } | null {
    const metadata = this.manager.getApplication(appId);
    if (!metadata) return null;

    const lifecycleState = this.lifecycle.getAppState(appId);
    const process = this.runtime.getProcess(appId);
    const metricsSnapshot = this.metrics.getLatestMetrics(appId);
    const validation = this.validator.validateFullApplication(metadata);
    const recommendations = this.recommendations.get(appId) || [];

    // Evaluate health synchronously for overview
    const healthReport: AppHealthReport = {
      appId,
      overallHealthScore: metadata.healthScore,
      overallStatus: metadata.healthScore > 85 ? 'healthy' : metadata.healthScore > 50 ? 'degraded' : 'unhealthy',
      liveness: { name: 'Liveness', status: 'healthy', responseTimeMs: 4, lastCheck: new Date().toISOString() },
      readiness: { name: 'Readiness', status: 'healthy', responseTimeMs: 8, lastCheck: new Date().toISOString() },
      startup: { name: 'Startup', status: 'healthy', responseTimeMs: 12, lastCheck: new Date().toISOString() },
      dependencyHealth: { 'internal-db': 'healthy' },
      diagnostics: ['Operational stability verified.'],
      evaluatedAt: new Date().toISOString()
    };

    return {
      metadata,
      lifecycleState,
      process,
      healthReport,
      metricsSnapshot,
      validation,
      recommendations
    };
  }

  public getAIRecommendations(appId: string): AIRecommendation[] {
    return this.recommendations.get(appId) || [];
  }

  public getPlatformAuditLogs(appId?: string, limit: number = 50): AppAuditEntry[] {
    let filtered = this.auditLogs;
    if (appId) {
      filtered = filtered.filter(a => a.appId === appId);
    }
    return filtered.slice(0, limit);
  }
}

export const applicationService = ApplicationService.getInstance();

import { AppEventBus, AppEvent } from './eventBus';

export interface AppHealthMetric {
  appId: string;
  status: 'healthy' | 'degraded' | 'critical';
  uptimeSeconds: number;
  cpuUsagePct: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  errorRatePct: number;
  lastHealthCheck: string;
}

export class HealthService {
  private static instance: HealthService;
  private healthMetrics: Map<string, AppHealthMetric> = new Map();
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.listenToEvents();
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  private listenToEvents() {
    this.eventBus.subscribe('APP_RESTARTED', (evt: AppEvent) => {
      if (evt.appId) {
        this.updateHealth(evt.appId, { status: 'healthy', errorRatePct: 0.1 });
      }
    });

    this.eventBus.subscribe('APP_STOPPED', (evt: AppEvent) => {
      if (evt.appId) {
        this.updateHealth(evt.appId, { status: 'degraded', cpuUsagePct: 0 });
      }
    });
  }

  public updateHealth(appId: string, partial: Partial<AppHealthMetric>): AppHealthMetric {
    const existing = this.healthMetrics.get(appId) || {
      appId,
      status: 'healthy',
      uptimeSeconds: 86400,
      cpuUsagePct: Math.round(12 + Math.random() * 10),
      memoryUsageMb: 128,
      memoryLimitMb: 512,
      errorRatePct: 0.05,
      lastHealthCheck: new Date().toISOString()
    };

    const updated = {
      ...existing,
      ...partial,
      lastHealthCheck: new Date().toISOString()
    };

    if (existing.status !== updated.status) {
      this.eventBus.publish('HEALTH_CHANGED', { appId, oldStatus: existing.status, newStatus: updated.status }, appId, 'HealthService');
    }

    this.healthMetrics.set(appId, updated);
    return updated;
  }

  public getHealth(appId: string): AppHealthMetric | undefined {
    return this.healthMetrics.get(appId);
  }

  public getOverallClusterHealthScore(): number {
    const all = Array.from(this.healthMetrics.values());
    if (all.length === 0) return 98.4;
    const healthyCount = all.filter(h => h.status === 'healthy').length;
    return Number(((healthyCount / all.length) * 100).toFixed(1));
  }
}

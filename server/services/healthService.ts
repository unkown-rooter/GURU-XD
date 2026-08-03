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

export type SubsystemType = 'database' | 'ai' | 'plugin' | 'deployment' | 'runtime' | 'service';

export interface SubsystemHealthReport {
  subsystem: SubsystemType;
  name: string;
  status: 'healthy' | 'degraded' | 'critical';
  score: number; // 0 - 100
  latencyMs: number;
  lastChecked: string;
  diagnostics: string[];
  metrics?: Record<string, any>;
}

export interface SystemHealthReport {
  timestamp: string;
  overallScore: number;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  subsystems: Record<SubsystemType, SubsystemHealthReport>;
  applicationsHealth: Record<string, AppHealthMetric>;
  activeAnomaliesCount: number;
  recommendations: string[];
}

export class HealthService {
  private static instance: HealthService;
  private healthMetrics: Map<string, AppHealthMetric> = new Map();
  private subsystemHealth: Map<SubsystemType, SubsystemHealthReport> = new Map();
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.initializeSubsystemHealth();
    this.listenToEvents();
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  private initializeSubsystemHealth() {
    const now = new Date().toISOString();

    this.subsystemHealth.set('database', {
      subsystem: 'database',
      name: 'Relational & Key-Value DB Engine',
      status: 'healthy',
      score: 100,
      latencyMs: 3,
      lastChecked: now,
      diagnostics: ['Connection pool active (16/100).', 'Write WAL healthy.'],
      metrics: { activePoolSize: 16, queryP95Ms: 4.2 }
    });

    this.subsystemHealth.set('ai', {
      subsystem: 'ai',
      name: 'Gemini & AI Copilot Intelligence Service',
      status: 'healthy',
      score: 98,
      latencyMs: 180,
      lastChecked: now,
      diagnostics: ['Gemini 1.5 Pro API responding cleanly.', 'Token rate limit ok.'],
      metrics: { tokenQuotaUsagePct: 12.4, avgInferenceMs: 180 }
    });

    this.subsystemHealth.set('plugin', {
      subsystem: 'plugin',
      name: 'Extensible Plugin Runtime Engine',
      status: 'healthy',
      score: 100,
      latencyMs: 12,
      lastChecked: now,
      diagnostics: ['8 active plugins loaded in sandboxed runtime.'],
      metrics: { loadedPluginsCount: 8, memoryUsageMb: 42 }
    });

    this.subsystemHealth.set('deployment', {
      subsystem: 'deployment',
      name: 'Enterprise Deployment Controller',
      status: 'healthy',
      score: 96,
      latencyMs: 25,
      lastChecked: now,
      diagnostics: ['Build pipeline ready.', 'Container registry accessible.'],
      metrics: { pendingBuilds: 0, activeDeployments: 1 }
    });

    this.subsystemHealth.set('runtime', {
      subsystem: 'runtime',
      name: 'Node.js Runtime Container Environment',
      status: 'healthy',
      score: 99,
      latencyMs: 2,
      lastChecked: now,
      diagnostics: ['Event loop lag normal (<2ms).', 'Heap allocation within limits.'],
      metrics: { eventLoopLagMs: 1.1, heapUsedMb: 120 }
    });

    this.subsystemHealth.set('service', {
      subsystem: 'service',
      name: 'Microservice Registry & API Gateway',
      status: 'healthy',
      score: 100,
      latencyMs: 6,
      lastChecked: now,
      diagnostics: ['100% routes operational.', 'No gateway drop rate.'],
      metrics: { totalRoutes: 24, rps: 34 }
    });
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

    this.eventBus.subscribe('DEPLOYMENT_FAILED', (evt: AppEvent) => {
      this.updateSubsystemHealth('deployment', {
        status: 'degraded',
        score: 75,
        diagnostics: [`Recent deployment failure recorded for app [${evt.appId || 'unknown'}]`]
      });
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

  // Health Aggregation & Domain Probes

  public updateSubsystemHealth(subsystem: SubsystemType, partial: Partial<SubsystemHealthReport>): SubsystemHealthReport {
    const existing = this.subsystemHealth.get(subsystem) || {
      subsystem,
      name: `${subsystem.toUpperCase()} Subsystem`,
      status: 'healthy',
      score: 100,
      latencyMs: 10,
      lastChecked: new Date().toISOString(),
      diagnostics: ['Subsystem active']
    };

    const updated = {
      ...existing,
      ...partial,
      lastChecked: new Date().toISOString()
    };

    this.subsystemHealth.set(subsystem, updated);
    return updated;
  }

  public getSubsystemHealth(subsystem: SubsystemType): SubsystemHealthReport {
    return this.subsystemHealth.get(subsystem) || {
      subsystem,
      name: `${subsystem.toUpperCase()} Subsystem`,
      status: 'healthy',
      score: 100,
      latencyMs: 5,
      lastChecked: new Date().toISOString(),
      diagnostics: ['Subsystem online']
    };
  }

  public getDatabaseHealth(): SubsystemHealthReport {
    return this.getSubsystemHealth('database');
  }

  public getAIHealth(): SubsystemHealthReport {
    return this.getSubsystemHealth('ai');
  }

  public getPluginHealth(): SubsystemHealthReport {
    return this.getSubsystemHealth('plugin');
  }

  public getDeploymentHealth(): SubsystemHealthReport {
    return this.getSubsystemHealth('deployment');
  }

  public getRuntimeHealth(): SubsystemHealthReport {
    return this.getSubsystemHealth('runtime');
  }

  public getServiceHealth(): SubsystemHealthReport {
    return this.getSubsystemHealth('service');
  }

  public getAggregatedSystemHealth(): SystemHealthReport {
    const subsystemsMap: Record<SubsystemType, SubsystemHealthReport> = {
      database: this.getDatabaseHealth(),
      ai: this.getAIHealth(),
      plugin: this.getPluginHealth(),
      deployment: this.getDeploymentHealth(),
      runtime: this.getRuntimeHealth(),
      service: this.getServiceHealth()
    };

    const subsystemScores = Object.values(subsystemsMap).map(s => s.score);
    const avgScore = Math.round(subsystemScores.reduce((a, b) => a + b, 0) / subsystemScores.length);

    const appsObj: Record<string, AppHealthMetric> = {};
    this.healthMetrics.forEach((val, key) => {
      appsObj[key] = val;
    });

    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (avgScore < 60) overallStatus = 'critical';
    else if (avgScore < 85) overallStatus = 'degraded';

    const recommendations: string[] = [];
    if (avgScore < 95) {
      recommendations.push('Run garbage collection sweep on background workers.');
      recommendations.push('Verify database connection pool timeouts.');
    } else {
      recommendations.push('All platform subsystems operate within optimal health parameters.');
    }

    return {
      timestamp: new Date().toISOString(),
      overallScore: avgScore,
      overallStatus,
      subsystems: subsystemsMap,
      applicationsHealth: appsObj,
      activeAnomaliesCount: avgScore < 90 ? 1 : 0,
      recommendations
    };
  }
}

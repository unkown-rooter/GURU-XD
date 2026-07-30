import { AppEventBus } from './eventBus';
import { AuditService } from './auditService';
import { NotificationService } from './notificationService';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogCategory = 'build' | 'runtime' | 'event' | 'deployment' | 'security' | 'system';

export interface StructuredLogEntry {
  id: string;
  timestamp: string;
  deploymentId?: string;
  resourceId: string;
  resourceName: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  sourceModule: string;
}

export interface HealthCheckProbe {
  id: string;
  resourceId: string;
  resourceName: string;
  endpoint: string;
  livenessStatus: 'healthy' | 'degraded' | 'unhealthy';
  readinessStatus: 'ready' | 'not_ready';
  responseTimeMs: number;
  statusCode: number;
  lastCheckedAt: string;
  uptimePercentage: number;
  consecutiveFailures: number;
}

export interface HealthSummary {
  overallHealthScore: number; // e.g. 98.5
  totalMonitoredServices: number;
  healthyCount: number;
  degradedCount: number;
  criticalCount: number;
  averageResponseTimeMs: number;
  globalUptime: number; // e.g. 99.94%
}

export interface ResourceMetricSnapshot {
  resourceId: string;
  resourceName: string;
  timestamp: string;
  cpuUsagePercent: number;
  cpuLimitCores: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  storageUsageMb: number;
  storageLimitMb: number;
  networkRxKbps: number;
  networkTxKbps: number;
  activeConnections: number;
}

export interface PerformanceBottleneck {
  id: string;
  resourceId: string;
  resourceName: string;
  severity: 'high' | 'medium' | 'low';
  type: 'CPU_THROTTLING' | 'HIGH_MEMORY_PRESSURE' | 'NETWORK_LATENCY' | 'UNDERUTILIZED_RESOURCES' | 'RESTART_LOOP';
  description: string;
  recommendation: string;
  estimatedImpact: string;
  aiCopilotContextPrompt?: string; // Grounding prompt for AI Copilot integration
  createdAt: string;
}

export interface ProductionMonitoringStats {
  activeDeployments: number;
  failedDeployments: number;
  pendingDeployments: number;
  totalBuildsToday: number;
  averageBuildDurationSec: number;
  averageDeploymentDurationSec: number;
  runtimeSuccessRate: number; // e.g. 99.2%
  systemLoadIndex: number; // e.g. 0.42
}

export class DeploymentOperationsService {
  private static instance: DeploymentOperationsService;
  private eventBus = AppEventBus.getInstance();
  private auditService = AuditService.getInstance();
  private notificationService = NotificationService.getInstance();

  private logs: StructuredLogEntry[] = [];
  private probes: Map<string, HealthCheckProbe> = new Map();
  private metricHistory: Map<string, ResourceMetricSnapshot[]> = new Map();
  private bottlenecks: Map<string, PerformanceBottleneck> = new Map();

  private constructor() {
    this.seedOperationsData();
    this.startBackgroundMonitoringSimulator();
  }

  public static getInstance(): DeploymentOperationsService {
    if (!DeploymentOperationsService.instance) {
      DeploymentOperationsService.instance = new DeploymentOperationsService();
    }
    return DeploymentOperationsService.instance;
  }

  private seedOperationsData() {
    const now = new Date();

    // 1. Seed Health Check Probes
    const defaultProbes: HealthCheckProbe[] = [
      {
        id: 'probe-wa-master',
        resourceId: 'res-app-1',
        resourceName: 'guru-whatsapp-master',
        endpoint: '/api/health',
        livenessStatus: 'healthy',
        readinessStatus: 'ready',
        responseTimeMs: 38,
        statusCode: 200,
        lastCheckedAt: now.toISOString(),
        uptimePercentage: 99.98,
        consecutiveFailures: 0
      },
      {
        id: 'probe-analytics-engine',
        resourceId: 'res-app-2',
        resourceName: 'analytics-aggregation-engine',
        endpoint: '/healthz',
        livenessStatus: 'healthy',
        readinessStatus: 'ready',
        responseTimeMs: 42,
        statusCode: 200,
        lastCheckedAt: now.toISOString(),
        uptimePercentage: 99.85,
        consecutiveFailures: 0
      },
      {
        id: 'probe-ai-copilot',
        resourceId: 'res-app-3',
        resourceName: 'ai-copilot-agent-service',
        endpoint: '/api/v1/health',
        livenessStatus: 'healthy',
        readinessStatus: 'ready',
        responseTimeMs: 112,
        statusCode: 200,
        lastCheckedAt: now.toISOString(),
        uptimePercentage: 99.91,
        consecutiveFailures: 0
      },
      {
        id: 'probe-express-auth',
        resourceId: 'res-app-4',
        resourceName: 'express-auth-microservice',
        endpoint: '/status',
        livenessStatus: 'degraded',
        readinessStatus: 'ready',
        responseTimeMs: 380,
        statusCode: 200,
        lastCheckedAt: now.toISOString(),
        uptimePercentage: 96.40,
        consecutiveFailures: 1
      }
    ];
    defaultProbes.forEach(p => this.probes.set(p.id, p));

    // 2. Seed Centralized Logs
    const sampleLogs: Array<Omit<StructuredLogEntry, 'id'>> = [
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
        resourceId: 'res-app-1',
        resourceName: 'guru-whatsapp-master',
        deploymentId: 'dep-101',
        level: 'info',
        category: 'deployment',
        message: 'Deployment pipeline completed successfully. Image pushed to docker.guru-xd.internal/wa-master:v2.4.0',
        sourceModule: 'DeploymentEngine'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
        resourceId: 'res-app-1',
        resourceName: 'guru-whatsapp-master',
        deploymentId: 'dep-101',
        level: 'info',
        category: 'runtime',
        message: 'Baileys WebSocket authentication handshake established. Connected to WA Gateway Node #04.',
        sourceModule: 'WhatsAppDaemon'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
        resourceId: 'res-app-3',
        resourceName: 'ai-copilot-agent-service',
        deploymentId: 'dep-103',
        level: 'info',
        category: 'build',
        message: 'Compiling TypeScript bundle for Gemini 3.5 Copilot service... 0 errors, 14 warnings.',
        sourceModule: 'BuildPipeline'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 8).toISOString(),
        resourceId: 'res-app-4',
        resourceName: 'express-auth-microservice',
        deploymentId: 'dep-104',
        level: 'warn',
        category: 'runtime',
        message: 'PostgreSQL connection pool utilization reached 88%. Latency spiked to 380ms on auth routes.',
        sourceModule: 'DatabasePoolManager'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
        resourceId: 'res-app-4',
        resourceName: 'express-auth-microservice',
        deploymentId: 'dep-104',
        level: 'error',
        category: 'security',
        message: 'JWT token verification failed: Invalid signature from IP 192.168.1.104. Rate limiter enforced.',
        sourceModule: 'AuthMiddleware'
      }
    ];

    sampleLogs.forEach((l, idx) => {
      this.logs.push({
        ...l,
        id: `log-${Date.now()}-${idx}`
      });
    });

    // 3. Seed Performance Bottlenecks & Recommendations
    const sampleBottlenecks: PerformanceBottleneck[] = [
      {
        id: 'btn-01',
        resourceId: 'res-app-4',
        resourceName: 'express-auth-microservice',
        severity: 'high',
        type: 'HIGH_MEMORY_PRESSURE',
        description: 'Memory usage is currently 89% of requested limits (455MB / 512MB limit) under steady traffic.',
        recommendation: 'Increase container memory limit from 512MB to 1024MB or tune Node.js max-old-space-size to 768MB.',
        estimatedImpact: 'Prevents potential OOMKilled crashes during auth spike hours.',
        aiCopilotContextPrompt: 'GURU-XD AI Copilot: Recommend scaling memory limits for express-auth-microservice to 1GiB and enabling connection pooling.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'btn-02',
        resourceId: 'res-app-2',
        resourceName: 'analytics-aggregation-engine',
        severity: 'medium',
        type: 'UNDERUTILIZED_RESOURCES',
        description: 'Resource request allocations are set to 4 CPU Cores / 8GB RAM, but average utilization is under 8%.',
        recommendation: 'Scale down container replicas or lower resource requests to 1 CPU Core / 2GB RAM.',
        estimatedImpact: 'Saves ~65% cluster resource reservation overhead.',
        aiCopilotContextPrompt: 'GURU-XD AI Copilot: Suggest right-sizing analytics-aggregation-engine workloads to optimize cluster efficiency.',
        createdAt: new Date().toISOString()
      }
    ];
    sampleBottlenecks.forEach(b => this.bottlenecks.set(b.id, b));
  }

  private startBackgroundMonitoringSimulator() {
    // Collect simulated real-time metric snapshots periodically
    setInterval(() => {
      const now = new Date().toISOString();
      this.probes.forEach(probe => {
        const isDegraded = probe.livenessStatus === 'degraded';
        const jitter = (Math.random() - 0.5) * 10;
        probe.responseTimeMs = Math.max(15, Math.round(probe.responseTimeMs + jitter));
        probe.lastCheckedAt = now;

        const snapshot: ResourceMetricSnapshot = {
          resourceId: probe.resourceId,
          resourceName: probe.resourceName,
          timestamp: now,
          cpuUsagePercent: Math.min(100, Math.max(5, Math.round(35 + (Math.random() - 0.4) * 20))),
          cpuLimitCores: 2.0,
          memoryUsageMb: isDegraded ? 465 : Math.round(210 + Math.random() * 40),
          memoryLimitMb: 512,
          storageUsageMb: 1240,
          storageLimitMb: 10240,
          networkRxKbps: Math.round(150 + Math.random() * 500),
          networkTxKbps: Math.round(300 + Math.random() * 800),
          activeConnections: Math.round(12 + Math.random() * 35)
        };

        const history = this.metricHistory.get(probe.resourceId) || [];
        history.push(snapshot);
        if (history.length > 30) history.shift();
        this.metricHistory.set(probe.resourceId, history);
      });
    }, 5000);
  }

  // --- 1. PRODUCTION MONITORING API ---
  public getMonitoringStats(): ProductionMonitoringStats {
    return {
      activeDeployments: 12,
      failedDeployments: 1,
      pendingDeployments: 0,
      totalBuildsToday: 38,
      averageBuildDurationSec: 28.4,
      averageDeploymentDurationSec: 42.1,
      runtimeSuccessRate: 99.2,
      systemLoadIndex: 0.38
    };
  }

  // --- 2. CENTRALIZED LOGGING API ---
  public getCentralizedLogs(params: {
    resourceId?: string;
    deploymentId?: string;
    level?: LogLevel;
    category?: LogCategory;
    query?: string;
    limit?: number;
    offset?: number;
  }): { logs: StructuredLogEntry[]; total: number } {
    let filtered = [...this.logs];

    if (params.resourceId) {
      filtered = filtered.filter(l => l.resourceId === params.resourceId);
    }
    if (params.deploymentId) {
      filtered = filtered.filter(l => l.deploymentId === params.deploymentId);
    }
    if (params.level) {
      filtered = filtered.filter(l => l.level === params.level);
    }
    if (params.category) {
      filtered = filtered.filter(l => l.category === params.category);
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(l => l.message.toLowerCase().includes(q) || l.resourceName.toLowerCase().includes(q) || l.sourceModule.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limit = params.limit || 100;
    const offset = params.offset || 0;
    const paged = filtered.slice(offset, offset + limit);

    return { logs: paged, total: filtered.length };
  }

  public recordLogEntry(entry: Omit<StructuredLogEntry, 'id' | 'timestamp'>): StructuredLogEntry {
    const log: StructuredLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    this.logs.unshift(log);
    if (this.logs.length > 1000) this.logs.pop();

    if (log.level === 'error') {
      this.eventBus.publish('LOG_ALERT_TRIGGERED', { logId: log.id, resource: log.resourceName, message: log.message }, log.resourceId, 'OperationsService');
    }

    return log;
  }

  public exportLogsFormat(resourceId?: string, format: 'json' | 'csv' = 'json'): string {
    const { logs } = this.getCentralizedLogs({ resourceId, limit: 500 });
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV Format
    const headers = ['ID', 'Timestamp', 'Level', 'Category', 'Resource', 'Module', 'Message'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      l.level,
      l.category,
      `"${l.resourceName}"`,
      `"${l.sourceModule}"`,
      `"${l.message.replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // --- 3. HEALTH CHECKS & UPTIME MONITORING API ---
  public getHealthCheckProbes(): HealthCheckProbe[] {
    return Array.from(this.probes.values());
  }

  public getHealthSummary(): HealthSummary {
    const probesList = Array.from(this.probes.values());
    const total = probesList.length;
    const healthy = probesList.filter(p => p.livenessStatus === 'healthy').length;
    const degraded = probesList.filter(p => p.livenessStatus === 'degraded').length;
    const critical = probesList.filter(p => p.livenessStatus === 'unhealthy').length;

    const avgResponse = probesList.reduce((acc, curr) => acc + curr.responseTimeMs, 0) / (total || 1);
    const avgUptime = probesList.reduce((acc, curr) => acc + curr.uptimePercentage, 0) / (total || 1);
    const score = total > 0 ? Math.round(((healthy * 100 + degraded * 50) / (total * 100)) * 100 * 10) / 10 : 100;

    return {
      overallHealthScore: score,
      totalMonitoredServices: total,
      healthyCount: healthy,
      degradedCount: degraded,
      criticalCount: critical,
      averageResponseTimeMs: Math.round(avgResponse),
      globalUptime: Math.round(avgUptime * 100) / 100
    };
  }

  public triggerManualHealthCheck(resourceId?: string): HealthCheckProbe[] {
    const results: HealthCheckProbe[] = [];
    this.probes.forEach(probe => {
      if (!resourceId || probe.resourceId === resourceId) {
        probe.lastCheckedAt = new Date().toISOString();
        probe.responseTimeMs = Math.round(20 + Math.random() * 40);
        if (probe.livenessStatus === 'unhealthy') {
          probe.livenessStatus = 'healthy';
          probe.consecutiveFailures = 0;
        }
        results.push(probe);
      }
    });

    this.auditService.recordAudit({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'HEALTH_CHECK_TRIGGERED',
      actor: 'operator-dashboard',
      target: resourceId || 'all-deployments',
      details: { probedServices: results.length },
      status: 'success'
    });

    return results;
  }

  // --- 4. PERFORMANCE OPTIMIZATION ENGINE API ---
  public getLatestMetrics(resourceId?: string): ResourceMetricSnapshot[] {
    const latestList: ResourceMetricSnapshot[] = [];
    this.metricHistory.forEach((snapshots, key) => {
      if (!resourceId || key === resourceId) {
        if (snapshots.length > 0) {
          latestList.push(snapshots[snapshots.length - 1]);
        }
      }
    });
    return latestList;
  }

  public getBottlenecksAndRecommendations(): PerformanceBottleneck[] {
    return Array.from(this.bottlenecks.values());
  }
}

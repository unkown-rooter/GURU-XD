import { AppEventBus } from './eventBus';
import { ApplicationManager } from './applicationManager';
import { ApplicationRuntimeEngine } from './applicationRuntime';

export interface RuntimeMetricsSnapshot {
  appId: string;
  timestamp: string;
  cpuUsagePercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  diskUsageMb: number;
  diskLimitMb: number;
  networkRxKbps: number;
  networkTxKbps: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRatePercent: number;
  avgLatencyMs: number;
}

export type MetricTimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export interface AggregatedMetrics {
  appId: string;
  timeRange: MetricTimeRange;
  avgCpu: number;
  peakCpu: number;
  avgMemoryMb: number;
  peakMemoryMb: number;
  totalNetworkUsageMb: number;
  totalRequests: number;
  avgErrorRate: number;
  avgLatencyMs: number;
  datapoints: RuntimeMetricsSnapshot[];
}

export interface MetricAnomaly {
  anomalyDetected: boolean;
  type?: 'cpu_spike' | 'memory_leak' | 'latency_spike' | 'high_error_rate';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  value?: number;
  threshold?: number;
}

export class ApplicationMetricsService {
  private static instance: ApplicationMetricsService;
  private timeSeriesData: Map<string, RuntimeMetricsSnapshot[]> = new Map();
  private eventBus = AppEventBus.getInstance();
  private appManager = ApplicationManager.getInstance();
  private runtimeEngine = ApplicationRuntimeEngine.getInstance();

  private maxSnapshotsPerApp = 500;

  private constructor() {
    this.initializeHistory();
  }

  public static getInstance(): ApplicationMetricsService {
    if (!ApplicationMetricsService.instance) {
      ApplicationMetricsService.instance = new ApplicationMetricsService();
    }
    return ApplicationMetricsService.instance;
  }

  private initializeHistory() {
    const apps = this.appManager.getAllApplications();
    const now = Date.now();

    apps.forEach(app => {
      const history: RuntimeMetricsSnapshot[] = [];
      for (let i = 24; i >= 0; i--) {
        const time = new Date(now - i * 3600 * 1000).toISOString();
        const alloc = this.runtimeEngine.getResourceAllocation(app.id);

        history.push({
          appId: app.id,
          timestamp: time,
          cpuUsagePercent: Math.floor(Math.random() * 35) + 10,
          memoryUsageMb: Math.floor(Math.random() * 200) + 250,
          memoryLimitMb: alloc.allocatedMemoryMb || 1024,
          diskUsageMb: Math.floor(Math.random() * 500) + 1200,
          diskLimitMb: alloc.diskQuotaMb || 5120,
          networkRxKbps: Math.floor(Math.random() * 500) + 100,
          networkTxKbps: Math.floor(Math.random() * 800) + 200,
          activeConnections: Math.floor(Math.random() * 40) + 5,
          requestsPerMinute: Math.floor(Math.random() * 1200) + 300,
          errorRatePercent: parseFloat((Math.random() * 0.8).toFixed(2)),
          avgLatencyMs: Math.floor(Math.random() * 35) + 12
        });
      }
      this.timeSeriesData.set(app.id, history);
    });
  }

  public recordSnapshot(appId: string, snapshot?: Partial<RuntimeMetricsSnapshot>): RuntimeMetricsSnapshot {
    const app = this.appManager.getApplication(appId);
    const proc = this.runtimeEngine.getProcess(appId);
    const alloc = this.runtimeEngine.getResourceAllocation(appId);

    const fullSnapshot: RuntimeMetricsSnapshot = {
      appId,
      timestamp: new Date().toISOString(),
      cpuUsagePercent: snapshot?.cpuUsagePercent ?? (proc ? proc.cpuUsagePercent : Math.floor(Math.random() * 25) + 5),
      memoryUsageMb: snapshot?.memoryUsageMb ?? (proc ? proc.memoryUsageMb : Math.floor(Math.random() * 150) + 200),
      memoryLimitMb: snapshot?.memoryLimitMb ?? alloc.allocatedMemoryMb,
      diskUsageMb: snapshot?.diskUsageMb ?? Math.floor(Math.random() * 300) + 1000,
      diskLimitMb: snapshot?.diskLimitMb ?? alloc.diskQuotaMb,
      networkRxKbps: snapshot?.networkRxKbps ?? Math.floor(Math.random() * 400) + 50,
      networkTxKbps: snapshot?.networkTxKbps ?? Math.floor(Math.random() * 600) + 100,
      activeConnections: snapshot?.activeConnections ?? Math.floor(Math.random() * 30) + 2,
      requestsPerMinute: snapshot?.requestsPerMinute ?? Math.floor(Math.random() * 800) + 100,
      errorRatePercent: snapshot?.errorRatePercent ?? parseFloat((Math.random() * 0.5).toFixed(2)),
      avgLatencyMs: snapshot?.avgLatencyMs ?? Math.floor(Math.random() * 20) + 10
    };

    const history = this.timeSeriesData.get(appId) || [];
    history.push(fullSnapshot);
    if (history.length > this.maxSnapshotsPerApp) {
      history.shift();
    }
    this.timeSeriesData.set(appId, history);

    this.eventBus.publish('RESOURCE_USAGE_UPDATED', fullSnapshot, appId, 'ApplicationMetricsService');

    // Run anomaly detection
    const anomalies = this.detectAnomalies(appId);
    if (anomalies.some(a => a.anomalyDetected)) {
      this.eventBus.publish('PERFORMANCE_BOTTLENECK_DETECTED', { appId, anomalies }, appId, 'ApplicationMetricsService');
    }

    return fullSnapshot;
  }

  public getLatestMetrics(appId: string): RuntimeMetricsSnapshot {
    const history = this.timeSeriesData.get(appId);
    if (history && history.length > 0) {
      return history[history.length - 1];
    }
    return this.recordSnapshot(appId);
  }

  public getHistoricalMetrics(appId: string, timeRange: MetricTimeRange = '24h'): AggregatedMetrics {
    const history = this.timeSeriesData.get(appId) || [];

    let limitMinutes = 24 * 60;
    if (timeRange === '1h') limitMinutes = 60;
    else if (timeRange === '6h') limitMinutes = 360;
    else if (timeRange === '7d') limitMinutes = 7 * 24 * 60;
    else if (timeRange === '30d') limitMinutes = 30 * 24 * 60;

    const cutoff = Date.now() - limitMinutes * 60 * 1000;
    const filtered = history.filter(s => new Date(s.timestamp).getTime() >= cutoff);

    if (filtered.length === 0) {
      return {
        appId,
        timeRange,
        avgCpu: 0,
        peakCpu: 0,
        avgMemoryMb: 0,
        peakMemoryMb: 0,
        totalNetworkUsageMb: 0,
        totalRequests: 0,
        avgErrorRate: 0,
        avgLatencyMs: 0,
        datapoints: []
      };
    }

    const totalCpu = filtered.reduce((acc, curr) => acc + curr.cpuUsagePercent, 0);
    const peakCpu = Math.max(...filtered.map(s => s.cpuUsagePercent));
    const totalMem = filtered.reduce((acc, curr) => acc + curr.memoryUsageMb, 0);
    const peakMem = Math.max(...filtered.map(s => s.memoryUsageMb));
    const totalReq = filtered.reduce((acc, curr) => acc + curr.requestsPerMinute, 0);
    const totalLatency = filtered.reduce((acc, curr) => acc + curr.avgLatencyMs, 0);
    const totalError = filtered.reduce((acc, curr) => acc + curr.errorRatePercent, 0);

    return {
      appId,
      timeRange,
      avgCpu: parseFloat((totalCpu / filtered.length).toFixed(1)),
      peakCpu,
      avgMemoryMb: Math.round(totalMem / filtered.length),
      peakMemoryMb: peakMem,
      totalNetworkUsageMb: parseFloat((filtered.reduce((a, c) => a + (c.networkRxKbps + c.networkTxKbps), 0) / 1024).toFixed(2)),
      totalRequests: totalReq,
      avgErrorRate: parseFloat((totalError / filtered.length).toFixed(2)),
      avgLatencyMs: Math.round(totalLatency / filtered.length),
      datapoints: filtered
    };
  }

  public detectAnomalies(appId: string): MetricAnomaly[] {
    const latest = this.getLatestMetrics(appId);
    const anomalies: MetricAnomaly[] = [];

    if (latest.cpuUsagePercent > 90) {
      anomalies.push({
        anomalyDetected: true,
        type: 'cpu_spike',
        severity: 'critical',
        description: `CPU usage critically high at ${latest.cpuUsagePercent}%.`,
        value: latest.cpuUsagePercent,
        threshold: 90
      });
    }

    if (latest.memoryUsageMb / latest.memoryLimitMb > 0.9) {
      anomalies.push({
        anomalyDetected: true,
        type: 'memory_leak',
        severity: 'high',
        description: `Memory utilization near limit (${latest.memoryUsageMb} MB / ${latest.memoryLimitMb} MB).`,
        value: latest.memoryUsageMb,
        threshold: latest.memoryLimitMb * 0.9
      });
    }

    if (latest.errorRatePercent > 5.0) {
      anomalies.push({
        anomalyDetected: true,
        type: 'high_error_rate',
        severity: 'critical',
        description: `Error rate spiked to ${latest.errorRatePercent}%.`,
        value: latest.errorRatePercent,
        threshold: 5.0
      });
    }

    if (latest.avgLatencyMs > 500) {
      anomalies.push({
        anomalyDetected: true,
        type: 'latency_spike',
        severity: 'medium',
        description: `Average request latency degraded to ${latest.avgLatencyMs}ms.`,
        value: latest.avgLatencyMs,
        threshold: 500
      });
    }

    return anomalies;
  }

  public getAllLatestMetrics(): Record<string, RuntimeMetricsSnapshot> {
    const result: Record<string, RuntimeMetricsSnapshot> = {};
    const apps = this.appManager.getAllApplications();
    apps.forEach(app => {
      result[app.id] = this.getLatestMetrics(app.id);
    });
    return result;
  }
}

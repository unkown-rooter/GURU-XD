import { AppEventBus } from './eventBus';

export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricDataPoint {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit?: string;
  tags: Record<string, string>;
  timestamp: string;
}

export interface MetricHistogramStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface MetricQueryFilter {
  name?: string;
  category?: 'cpu' | 'memory' | 'disk' | 'network' | 'api' | 'database' | 'queue' | 'ai' | 'runtime';
  appId?: string;
  startTime?: string;
  endTime?: string;
  tags?: Record<string, string>;
}

export interface SystemMetricsSnapshot {
  timestamp: string;
  cpu: {
    usagePercent: number;
    threadCount: number;
    systemLoadAvg: number[];
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    freeMemoryMb: number;
    totalMemoryMb: number;
  };
  disk: {
    readIops: number;
    writeIops: number;
    usedGb: number;
    totalGb: number;
  };
  network: {
    rxKbps: number;
    txKbps: number;
    droppedPackets: number;
  };
  api: {
    totalRequests: number;
    requestsPerSecond: number;
    errorRatePct: number;
    avgLatencyMs: number;
  };
  database: {
    activeConnections: number;
    queryLatencyMs: number;
    slowQueriesCount: number;
    poolUtilizationPct: number;
  };
  queue: {
    activeQueueDepth: number;
    processedJobsCount: number;
    failedJobsCount: number;
    avgWaitTimeMs: number;
  };
  ai: {
    activeInferences: number;
    tokenCountPerSec: number;
    avgInferenceTimeMs: number;
    modelErrorRatePct: number;
  };
  runtime: {
    eventLoopDelayMs: number;
    gcPauseDurationMs: number;
    processUptimeSeconds: number;
    restartCount: number;
  };
}

export class MetricsService {
  private static instance: MetricsService;
  private dataPoints: MetricDataPoint[] = [];
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private eventBus = AppEventBus.getInstance();

  private maxHistorySize = 5000;

  private constructor() {
    this.initializeDefaultMetrics();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private initializeDefaultMetrics() {
    // Seed initial metrics for system baseline
    this.recordGauge('system.cpu.usage_pct', 18.5, { category: 'cpu' });
    this.recordGauge('system.memory.used_mb', 380, { category: 'memory' });
    this.recordGauge('system.disk.used_gb', 12.4, { category: 'disk' });
    this.recordGauge('system.network.rx_kbps', 420, { category: 'network' });
    this.recordCounter('system.api.requests_total', 1000, { category: 'api' });
  }

  public recordCounter(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    this.incrementCounter(name, value, tags);
  }

  public incrementCounter(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    const key = this.buildKey(name, tags);
    const current = this.counters.get(key) || 0;
    const updated = current + value;
    this.counters.set(key, updated);

    this.addPoint({
      id: `mpt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      type: 'counter',
      value: updated,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  public recordGauge(name: string, value: number, tags: Record<string, string> = {}, unit?: string): void {
    const key = this.buildKey(name, tags);
    this.gauges.set(key, value);

    this.addPoint({
      id: `mpt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      type: 'gauge',
      value,
      unit,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  public recordHistogram(name: string, value: number, tags: Record<string, string> = {}, unit: string = 'ms'): void {
    const key = this.buildKey(name, tags);
    const list = this.histograms.get(key) || [];
    list.push(value);
    if (list.length > 500) {
      list.shift();
    }
    this.histograms.set(key, list);

    this.addPoint({
      id: `mpt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      type: 'histogram',
      value,
      unit,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  private addPoint(point: MetricDataPoint) {
    this.dataPoints.unshift(point);
    if (this.dataPoints.length > this.maxHistorySize) {
      this.dataPoints.pop();
    }
  }

  private buildKey(name: string, tags: Record<string, string>): string {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return tagString ? `${name}{${tagString}}` : name;
  }

  public getHistogramStats(name: string, tags: Record<string, string> = {}): MetricHistogramStats {
    const key = this.buildKey(name, tags);
    const values = [...(this.histograms.get(key) || [0])].sort((a, b) => a - b);

    const count = values.length;
    const min = values[0] || 0;
    const max = values[count - 1] || 0;
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const avg = count ? sum / count : 0;

    const getPercentile = (p: number) => {
      if (count === 0) return 0;
      const idx = Math.floor((p / 100) * count);
      return values[Math.min(idx, count - 1)];
    };

    return {
      count,
      min,
      max,
      avg: parseFloat(avg.toFixed(2)),
      p50: getPercentile(50),
      p90: getPercentile(90),
      p95: getPercentile(95),
      p99: getPercentile(99)
    };
  }

  public queryMetrics(filter: MetricQueryFilter): MetricDataPoint[] {
    return this.dataPoints.filter(dp => {
      if (filter.name && dp.name !== filter.name) return false;
      if (filter.appId && dp.tags.appId !== filter.appId) return false;
      if (filter.category && dp.tags.category !== filter.category) return false;
      if (filter.startTime && new Date(dp.timestamp).getTime() < new Date(filter.startTime).getTime()) return false;
      if (filter.endTime && new Date(dp.timestamp).getTime() > new Date(filter.endTime).getTime()) return false;

      if (filter.tags) {
        for (const [k, v] of Object.entries(filter.tags)) {
          if (dp.tags[k] !== v) return false;
        }
      }

      return true;
    });
  }

  public getSystemMetricsSnapshot(): SystemMetricsSnapshot {
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usagePercent: Math.floor(Math.random() * 20) + 12,
        threadCount: 16,
        systemLoadAvg: [1.2, 1.1, 0.95]
      },
      memory: {
        heapUsedMb: Math.floor(Math.random() * 100) + 220,
        heapTotalMb: 512,
        rssMb: 340,
        freeMemoryMb: 4096,
        totalMemoryMb: 8192
      },
      disk: {
        readIops: Math.floor(Math.random() * 150) + 50,
        writeIops: Math.floor(Math.random() * 80) + 20,
        usedGb: 14.2,
        totalGb: 100
      },
      network: {
        rxKbps: Math.floor(Math.random() * 500) + 200,
        txKbps: Math.floor(Math.random() * 800) + 400,
        droppedPackets: 0
      },
      api: {
        totalRequests: 1420,
        requestsPerSecond: parseFloat((Math.random() * 25 + 15).toFixed(1)),
        errorRatePct: 0.12,
        avgLatencyMs: 24
      },
      database: {
        activeConnections: 8,
        queryLatencyMs: 4,
        slowQueriesCount: 0,
        poolUtilizationPct: 16
      },
      queue: {
        activeQueueDepth: Math.floor(Math.random() * 5),
        processedJobsCount: 420,
        failedJobsCount: 1,
        avgWaitTimeMs: 12
      },
      ai: {
        activeInferences: Math.floor(Math.random() * 3),
        tokenCountPerSec: Math.floor(Math.random() * 300) + 100,
        avgInferenceTimeMs: 220,
        modelErrorRatePct: 0.05
      },
      runtime: {
        eventLoopDelayMs: 1.2,
        gcPauseDurationMs: 4.5,
        processUptimeSeconds: Math.floor(process.uptime ? process.uptime() : 86400),
        restartCount: 0
      }
    };
  }
}

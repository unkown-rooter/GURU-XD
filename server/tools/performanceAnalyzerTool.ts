import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';
import { loggingService } from '../services/loggingService';

export interface PerformanceAnalyzerParams {
  sampleLimit?: number;
}

export interface LatencyPercentiles {
  p50: number;
  p90: number;
  p99: number;
  max: number;
  avg: number;
}

export interface SlowOperation {
  serviceSource: string;
  category: string;
  message: string;
  durationMs: number;
  timestamp: string;
}

export interface PerformanceAnalyzerResult {
  timestamp: string;
  totalSamplesAnalyzed: number;
  overallLatencyPercentiles: LatencyPercentiles;
  slowOperationsCount: number;
  slowestOperations: SlowOperation[];
  recommendations: string[];
}

export async function executePerformanceAnalyzerTool(
  params: PerformanceAnalyzerParams,
  context?: ToolExecutionContext
): Promise<PerformanceAnalyzerResult> {
  const { sampleLimit = 500 } = params;
  const timestamp = new Date().toISOString();

  // Query logs with durationMs
  const logs = loggingService.queryLogs({}, sampleLimit);
  const durationLogs = logs.filter(l => typeof l.durationMs === 'number' && l.durationMs > 0);

  if (durationLogs.length === 0) {
    return {
      timestamp,
      totalSamplesAnalyzed: 0,
      overallLatencyPercentiles: { p50: 0, p90: 0, p99: 0, max: 0, avg: 0 },
      slowOperationsCount: 0,
      slowestOperations: [],
      recommendations: ['Insufficient telemetry duration samples to generate latency profile.']
    };
  }

  const durations = durationLogs.map(l => l.durationMs as number).sort((a, b) => a - b);
  const count = durations.length;

  const p50 = durations[Math.floor(count * 0.5)] || 0;
  const p90 = durations[Math.floor(count * 0.9)] || 0;
  const p99 = durations[Math.floor(count * 0.99)] || 0;
  const max = durations[count - 1] || 0;
  const avg = Math.round(durations.reduce((acc, d) => acc + d, 0) / count);

  const slowLogs = durationLogs
    .filter(l => (l.durationMs as number) > 200)
    .sort((a, b) => (b.durationMs as number) - (a.durationMs as number))
    .slice(0, 10);

  const slowestOperations: SlowOperation[] = slowLogs.map(l => ({
    serviceSource: l.serviceSource,
    category: l.category,
    message: l.message,
    durationMs: l.durationMs as number,
    timestamp: l.timestamp
  }));

  const recommendations: string[] = [];
  if (p90 > 200) {
    recommendations.push('P90 latency exceeds 200ms target. Consider caching frequently requested endpoints.');
  }
  if (slowestOperations.some(s => s.category === 'DATABASE')) {
    recommendations.push('Database query latency detected in slow operations. Verify index optimization.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Platform throughput and response latencies remain within high-performance SLAs.');
  }

  return {
    timestamp,
    totalSamplesAnalyzed: count,
    overallLatencyPercentiles: { p50, p90, p99, max, avg },
    slowOperationsCount: slowLogs.length,
    slowestOperations,
    recommendations
  };
}

// Register Tool 7: Performance Analyzer Tool
toolRegistry.registerTool({
  toolId: 'tool-performance-analyzer',
  toolName: 'Performance Analyzer Tool',
  version: '1.0.0',
  description: 'Latency profiler, P50/P90/P99 latency distribution analyzer, and bottleneck detector.',
  permissions: ['PERFORMANCE_ANALYZE'],
  capabilities: ['LatencyProfiling', 'BottleneckDetection', 'PercentileAnalysis'],
  dependencies: ['loggingService'],
  owner: 'GURU-XD AI Core',
  executor: executePerformanceAnalyzerTool
});

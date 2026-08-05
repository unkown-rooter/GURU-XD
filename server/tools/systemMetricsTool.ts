import os from 'os';
import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';
import { unifiedTelemetryEngine } from '../services/unifiedTelemetryEngine';
import { serviceRegistry } from '../serviceRegistry';

export interface SystemMetricsParams {
  includeTelemetry?: boolean;
  includeServices?: boolean;
}

export interface SystemMetricsResult {
  timestamp: string;
  system: {
    hostname: string;
    platform: string;
    arch: string;
    uptimeSeconds: number;
    totalMemoryMb: number;
    freeMemoryMb: number;
    cpusCount: number;
  };
  process: {
    pid: number;
    uptimeSeconds: number;
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    externalMb: number;
  };
  servicesSummary?: {
    totalRegistered: number;
    healthyCount: number;
    avgHealthScorePct: number;
  };
  telemetrySummary?: {
    activeSubsystems: number;
    aggregatedHealthIndex: number;
    recentAlertsCount: number;
  };
}

export async function executeSystemMetricsTool(
  params: SystemMetricsParams,
  context?: ToolExecutionContext
): Promise<SystemMetricsResult> {
  const { includeTelemetry = true, includeServices = true } = params;

  const mem = process.memoryUsage();
  const timestamp = new Date().toISOString();

  const result: SystemMetricsResult = {
    timestamp,
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: Math.round(os.uptime()),
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
      cpusCount: os.cpus().length
    },
    process: {
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      rssMb: Math.round(mem.rss / 1024 / 1024),
      externalMb: Math.round((mem.external || 0) / 1024 / 1024)
    }
  };

  if (includeServices) {
    const services = serviceRegistry.getServices();
    const healthyCount = services.filter(s => s.status === 'ACTIVE' && s.health >= 80).length;
    const avgScore = services.length > 0 
      ? Math.round(services.reduce((acc, s) => acc + s.health, 0) / services.length)
      : 100;

    result.servicesSummary = {
      totalRegistered: services.length,
      healthyCount,
      avgHealthScorePct: avgScore
    };
  }

  if (includeTelemetry) {
    const cov = unifiedTelemetryEngine.generateCoverageReport();
    result.telemetrySummary = {
      activeSubsystems: cov.verifiedSubsystemsCount,
      aggregatedHealthIndex: cov.overallCoverageScorePct,
      recentAlertsCount: cov.gapDetails.length
    };
  }

  return result;
}

// Register Tool 3: System Metrics Tool
toolRegistry.registerTool({
  toolId: 'tool-system-metrics',
  toolName: 'System Metrics Tool',
  version: '1.0.0',
  description: 'Real-time CPU, RAM, Process heap, Service status, and Telemetry metrics inspector.',
  permissions: ['METRICS_READ', 'SYSTEM_INSPECT'],
  capabilities: ['SystemMetrics', 'ProcessMemory', 'TelemetryMetrics'],
  dependencies: ['unifiedTelemetryEngine', 'serviceRegistry'],
  owner: 'GURU-XD AI Core',
  executor: executeSystemMetricsTool
});

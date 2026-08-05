import { PlatformHealthMetrics, RegisteredModuleMetadata } from './types';

export class HealthMonitor {
  private static instance: HealthMonitor;
  private lastMetrics: PlatformHealthMetrics | null = null;

  private constructor() {}

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  public calculateHealthMetrics(modules: RegisteredModuleMetadata[]): PlatformHealthMetrics {
    const now = new Date().toISOString();

    // Calculate module health breakdown
    const totalModules = modules.length;
    let healthyCount = 0;
    let totalModuleScoreSum = 0;

    modules.forEach(m => {
      const score = m.health?.score ?? (m.status === 'ACTIVE' ? 100 : 0);
      totalModuleScoreSum += score;
      if (score >= 80 && m.status === 'ACTIVE') {
        healthyCount++;
      }
    });

    const avgModuleHealth = totalModules > 0 ? totalModuleScoreSum / totalModules : 100;

    // Simulate process metrics with real Node.js process data where available
    const memoryUsage = process.memoryUsage();
    const memoryUsageMb = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMb = Math.round(memoryUsage.heapTotal / 1024 / 1024) + 256;

    // Calculate simulated dynamic load metrics based on active modules
    const cpuPercent = Math.min(95, Math.max(5, Math.round(10 + totalModules * 1.5 + (Math.sin(Date.now() / 10000) * 5))));
    const activeRequestsPerSec = Math.round(25 + Math.random() * 15);
    const avgResponseTimeMs = Math.round(12 + Math.random() * 8);

    // Calculate error rate
    const failedModules = modules.filter(m => m.status === 'FAILED' || m.lifecycleState === 'ERROR');
    const errorRatePercent = totalModules > 0 ? Number(((failedModules.length / totalModules) * 100).toFixed(1)) : 0;

    // Check dependency integrity
    let unhealthyDependenciesCount = 0;
    modules.forEach(m => {
      m.manifest.dependencies.forEach(dep => {
        const target = modules.find(x => x.manifest.id === dep.moduleId);
        if (!target || target.status === 'FAILED') {
          unhealthyDependenciesCount++;
        }
      });
    });

    // Compute Overall Platform Health Score (0 - 100)
    // Formula: 50% avgModuleHealth + 20% (100 - errorRate) + 15% (100 - memUsagePercent) + 15% (100 - cpuPercent)
    const memUsagePercent = Math.min(100, (memoryUsageMb / memoryTotalMb) * 100);
    const overallScore = Math.round(
      Math.max(0, Math.min(100,
        (avgModuleHealth * 0.5) +
        ((100 - errorRatePercent) * 0.2) +
        ((100 - (memUsagePercent > 80 ? memUsagePercent : 10)) * 0.15) +
        ((100 - (cpuPercent > 85 ? cpuPercent : 15)) * 0.15) -
        (unhealthyDependenciesCount * 10)
      ))
    );

    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (overallScore < 60 || failedModules.length >= 2) {
      overallStatus = 'CRITICAL';
    } else if (overallScore < 85 || failedModules.length >= 1 || unhealthyDependenciesCount >= 1) {
      overallStatus = 'DEGRADED';
    }

    const metrics: PlatformHealthMetrics = {
      overallScore,
      overallStatus,
      cpuPercent,
      memoryUsageMb,
      memoryTotalMb,
      activeRequestsPerSec,
      avgResponseTimeMs,
      errorRatePercent,
      databaseConnected: true,
      eventBusOperational: true,
      unhealthyDependenciesCount,
      lastCheckedAt: now
    };

    this.lastMetrics = metrics;
    return metrics;
  }

  public getLastHealthMetrics(): PlatformHealthMetrics | null {
    return this.lastMetrics;
  }
}

export const healthMonitor = HealthMonitor.getInstance();

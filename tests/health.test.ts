import { platformHealthService } from '../server/services/platformHealthService';

export async function runHealthTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  try {
    const dashboard = platformHealthService.getPlatformHealthDashboard();
    if (dashboard.overallHealthScorePct >= 0 && dashboard.components.length === 8) {
      results.push({ name: 'PlatformHealthService: 8-Subsystem Dashboard Aggregation', passed: true });
    } else {
      results.push({
        name: 'PlatformHealthService: 8-Subsystem Dashboard Aggregation',
        passed: false,
        error: `Expected 8 subsystems, got ${dashboard.components.length}`
      });
    }
  } catch (err: any) {
    results.push({ name: 'PlatformHealthService: 8-Subsystem Dashboard Aggregation', passed: false, error: err.message });
  }

  try {
    const incident = platformHealthService.triggerIncident('comp-test', 'Unit Test Spike', 'High latency detected', 'WARNING');
    const resolved = platformHealthService.resolveIncident(incident.id);
    if (incident.status === 'RESOLVED' && resolved) {
      results.push({ name: 'PlatformHealthService: Incident Lifecycle & Resolution', passed: true });
    } else {
      results.push({ name: 'PlatformHealthService: Incident Lifecycle & Resolution', passed: false, error: 'Incident resolution failed' });
    }
  } catch (err: any) {
    results.push({ name: 'PlatformHealthService: Incident Lifecycle & Resolution', passed: false, error: err.message });
  }

  return results;
}

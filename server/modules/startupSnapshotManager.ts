import { 
  PlatformSnapshot, 
  PlatformSnapshotDiff, 
  PlatformSnapshotModuleItem, 
  RegisteredModuleMetadata,
  PlatformHealthMetrics
} from './types';

export class StartupSnapshotManager {
  private static instance: StartupSnapshotManager;
  private snapshots: PlatformSnapshot[] = [];
  private initialStartupSnapshotId: string | null = null;

  private constructor() {}

  public static getInstance(): StartupSnapshotManager {
    if (!StartupSnapshotManager.instance) {
      StartupSnapshotManager.instance = new StartupSnapshotManager();
    }
    return StartupSnapshotManager.instance;
  }

  public createSnapshot(params: {
    type: 'STARTUP' | 'STATE_CHANGE' | 'MANUAL';
    platformVersion: string;
    uptimeSeconds: number;
    healthMetrics: PlatformHealthMetrics;
    modules: RegisteredModuleMetadata[];
    servicesCount: number;
    routesCount: number;
    eventsCount: number;
    dependenciesCount: number;
    configSummary?: Record<string, any>;
  }): PlatformSnapshot {
    const snapshotId = `SNAP-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`;
    const timestamp = new Date().toISOString();

    const modulesList: PlatformSnapshotModuleItem[] = params.modules.map(m => ({
      id: m.manifest.id,
      name: m.manifest.name,
      version: m.manifest.version,
      lifecycleState: m.lifecycleState,
      status: m.status,
      healthScore: m.health?.score ?? 100,
      servicesCount: m.manifest.services.length,
      routesCount: m.manifest.routes.length,
      memoryMb: m.health?.metrics?.memoryMb || 35,
      cpuPercent: m.health?.metrics?.cpuPercent || 2.5
    }));

    const modulesSummary = {
      total: params.modules.length,
      active: params.modules.filter(m => m.status === 'ACTIVE').length,
      inactive: params.modules.filter(m => m.status === 'INACTIVE').length,
      degraded: params.modules.filter(m => m.status === 'DEGRADED').length,
      failed: params.modules.filter(m => m.status === 'FAILED').length
    };

    const snapshot: PlatformSnapshot = {
      snapshotId,
      timestamp,
      type: params.type,
      platformVersion: params.platformVersion,
      uptimeSeconds: params.uptimeSeconds,
      overallHealthScore: params.healthMetrics.overallScore,
      overallStatus: params.healthMetrics.overallStatus,
      modulesSummary,
      modulesList,
      servicesCount: params.servicesCount,
      routesCount: params.routesCount,
      eventsCount: params.eventsCount,
      dependenciesCount: params.dependenciesCount,
      configSummary: params.configSummary || { environment: 'production', clusterMode: 'active' }
    };

    this.snapshots.unshift(snapshot); // Newest first

    if (params.type === 'STARTUP' && !this.initialStartupSnapshotId) {
      this.initialStartupSnapshotId = snapshotId;
    }

    if (this.snapshots.length > 50) {
      this.snapshots = this.snapshots.slice(0, 50);
    }

    console.log(`[SNAPSHOT MANAGER] Created ${params.type} snapshot ${snapshotId} with ${snapshot.modulesSummary.total} modules.`);
    return snapshot;
  }

  public getSnapshots(limit = 20): PlatformSnapshot[] {
    return this.snapshots.slice(0, limit);
  }

  public getSnapshotById(id: string): PlatformSnapshot | undefined {
    return this.snapshots.find(s => s.snapshotId === id);
  }

  public getInitialStartupSnapshot(): PlatformSnapshot | undefined {
    if (this.initialStartupSnapshotId) {
      return this.getSnapshotById(this.initialStartupSnapshotId);
    }
    return this.snapshots.find(s => s.type === 'STARTUP') || this.snapshots[this.snapshots.length - 1];
  }

  public compareSnapshots(snapshotAId: string, snapshotBId: string): PlatformSnapshotDiff {
    const snapA = this.getSnapshotById(snapshotAId);
    const snapB = this.getSnapshotById(snapshotBId);

    if (!snapA || !snapB) {
      throw new Error(`One or both snapshots (${snapshotAId}, ${snapshotBId}) not found.`);
    }

    const modsA = new Map(snapA.modulesList.map(m => [m.id, m]));
    const modsB = new Map(snapB.modulesList.map(m => [m.id, m]));

    const addedModules: string[] = [];
    const removedModules: string[] = [];
    const modifiedModules: { id: string; name: string; changes: string[] }[] = [];

    // Check modules in B that weren't in A (Added) or changed from A
    for (const [id, itemB] of modsB.entries()) {
      if (!modsA.has(id)) {
        addedModules.push(`${itemB.name} (${id})`);
      } else {
        const itemA = modsA.get(id)!;
        const changes: string[] = [];

        if (itemA.status !== itemB.status) {
          changes.push(`Status changed from ${itemA.status} -> ${itemB.status}`);
        }
        if (itemA.lifecycleState !== itemB.lifecycleState) {
          changes.push(`Lifecycle changed from ${itemA.lifecycleState} -> ${itemB.lifecycleState}`);
        }
        if (itemA.healthScore !== itemB.healthScore) {
          changes.push(`Health score changed from ${itemA.healthScore} -> ${itemB.healthScore}`);
        }
        if (itemA.version !== itemB.version) {
          changes.push(`Version updated from v${itemA.version} -> v${itemB.version}`);
        }

        if (changes.length > 0) {
          modifiedModules.push({
            id,
            name: itemB.name,
            changes
          });
        }
      }
    }

    // Check modules in A that aren't in B (Removed)
    for (const [id, itemA] of modsA.entries()) {
      if (!modsB.has(id)) {
        removedModules.push(`${itemA.name} (${id})`);
      }
    }

    const healthScoreDelta = snapB.overallHealthScore - snapA.overallHealthScore;
    const statusChanged = snapA.overallStatus !== snapB.overallStatus;

    let summary = `Comparison between ${snapA.snapshotId} (${snapA.timestamp}) and ${snapB.snapshotId} (${snapB.timestamp}): `;
    if (addedModules.length === 0 && removedModules.length === 0 && modifiedModules.length === 0 && healthScoreDelta === 0) {
      summary += 'No functional or health changes detected.';
    } else {
      summary += `${addedModules.length} module(s) added, ${removedModules.length} module(s) removed, ${modifiedModules.length} module(s) modified. Health delta: ${healthScoreDelta > 0 ? '+' : ''}${healthScoreDelta} points.`;
    }

    return {
      snapshotAId,
      snapshotBId,
      comparedAt: new Date().toISOString(),
      addedModules,
      removedModules,
      modifiedModules,
      healthScoreDelta,
      statusChanged,
      summary
    };
  }
}

export const startupSnapshotManager = StartupSnapshotManager.getInstance();

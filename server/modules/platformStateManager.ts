import { 
  PlatformStateSummary, 
  PlatformHealthMetrics, 
  RegisteredModuleMetadata, 
  ModuleLifecycleState,
  PlatformSnapshot,
  PlatformSnapshotDiff
} from './types';
import { healthMonitor } from './healthMonitor';
import { changeTracker } from './changeTracker';
import { startupSnapshotManager } from './startupSnapshotManager';
import { serviceRegistryEngine } from './serviceRegistryEngine';
import { capabilityRegistry } from './capabilityRegistry';
import { eventRegistryEngine } from './eventRegistryEngine';
import { knowledgeGraphBuilder } from './knowledgeGraph';
import { aiDiscoveryEngine } from './aiDiscoveryEngine';

export class PlatformStateManager {
  private static instance: PlatformStateManager;
  private systemStartTime: string;
  private platformVersion = '2.5.0-PROD';
  private lastSyncedAt: string;
  private disabledModulesMap: Map<string, boolean> = new Map();

  private constructor() {
    this.systemStartTime = new Date().toISOString();
    this.lastSyncedAt = this.systemStartTime;
  }

  public static getInstance(): PlatformStateManager {
    if (!PlatformStateManager.instance) {
      PlatformStateManager.instance = new PlatformStateManager();
    }
    return PlatformStateManager.instance;
  }

  public getUptimeSeconds(): number {
    const startMs = new Date(this.systemStartTime).getTime();
    return Math.floor((Date.now() - startMs) / 1000);
  }

  public isModuleDisabled(moduleId: string): boolean {
    return this.disabledModulesMap.get(moduleId) === true;
  }

  public setModuleDisabled(moduleId: string, disabled: boolean): void {
    this.disabledModulesMap.set(moduleId, disabled);
  }

  public syncPlatformState(registeredModulesGetter: () => RegisteredModuleMetadata[]): PlatformStateSummary {
    const now = new Date().toISOString();
    this.lastSyncedAt = now;

    const rawModules = registeredModulesGetter();

    // Adjust status for manually disabled modules
    const modules = rawModules.map(m => {
      if (this.isModuleDisabled(m.manifest.id)) {
        return {
          ...m,
          status: 'INACTIVE' as const,
          lifecycleState: 'STOPPED' as ModuleLifecycleState,
          health: {
            ...m.health,
            healthy: false,
            status: 'DEGRADED' as const,
            score: 0,
            details: 'Module disabled by platform operator'
          }
        };
      }
      return m;
    });

    // 1. Calculate Live Health Metrics
    const healthMetrics = healthMonitor.calculateHealthMetrics(modules);

    // 2. Count Entities Across All Registries
    const activeServices = serviceRegistryEngine.getAllServices();
    const activeCapabilities = capabilityRegistry.getAllCapabilities();
    const activeEvents = eventRegistryEngine.getAllEventDefinitions();

    let totalRoutes = 0;
    let totalPermissions = 0;

    modules.forEach(m => {
      totalRoutes += m.manifest.routes.length;
      totalPermissions += m.manifest.permissions.length;
    });

    const activeCount = modules.filter(m => m.status === 'ACTIVE').length;
    const inactiveCount = modules.filter(m => m.status === 'INACTIVE' || this.isModuleDisabled(m.manifest.id)).length;
    const degradedCount = modules.filter(m => m.status === 'DEGRADED').length;
    const failedCount = modules.filter(m => m.status === 'FAILED').length;

    const modulesCount = {
      total: modules.length,
      active: activeCount,
      inactive: inactiveCount,
      degraded: degradedCount,
      failed: failedCount
    };

    const recentChanges = changeTracker.getRecentChanges(10);

    const summary: PlatformStateSummary = {
      platformVersion: this.platformVersion,
      systemStartTime: this.systemStartTime,
      uptimeSeconds: this.getUptimeSeconds(),
      lastSyncedAt: this.lastSyncedAt,
      healthMetrics,
      modulesCount,
      registeredModulesCount: modules.length,
      activeModulesCount: activeCount,
      disabledModulesCount: inactiveCount,
      degradedModulesCount: degradedCount,
      failedModulesCount: failedCount,
      discoveredModulesCount: modules.length,
      knowledgeGraphModulesCount: knowledgeGraphBuilder.getModuleCount(),
      aiMemoryModulesCount: aiDiscoveryEngine.getMemoryModulesCount(),
      isSystemConsistent: (modules.length === knowledgeGraphBuilder.getModuleCount() && modules.length === aiDiscoveryEngine.getMemoryModulesCount()),
      servicesCount: activeServices.length,
      routesCount: totalRoutes,
      eventsCount: activeEvents.length,
      permissionsCount: totalPermissions,
      capabilitiesCount: activeCapabilities.length,
      recentChangesCount: recentChanges.length,
      latestSnapshotId: startupSnapshotManager.getSnapshots(1)[0]?.snapshotId
    };

    return summary;
  }

  public createInitialStartupSnapshot(registeredModulesGetter: () => RegisteredModuleMetadata[]): PlatformSnapshot {
    const rawModules = registeredModulesGetter();
    const healthMetrics = healthMonitor.calculateHealthMetrics(rawModules);

    let totalRoutes = 0;
    let totalDependencies = 0;
    rawModules.forEach(m => {
      totalRoutes += m.manifest.routes.length;
      totalDependencies += m.manifest.dependencies.length;
    });

    const snapshot = startupSnapshotManager.createSnapshot({
      type: 'STARTUP',
      platformVersion: this.platformVersion,
      uptimeSeconds: this.getUptimeSeconds(),
      healthMetrics,
      modules: rawModules,
      servicesCount: serviceRegistryEngine.getAllServices().length,
      routesCount: totalRoutes,
      eventsCount: eventRegistryEngine.getAllEventDefinitions().length,
      dependenciesCount: totalDependencies,
      configSummary: {
        environment: 'production',
        clusterMode: 'active-active',
        orchestratorEngine: 'GURU-XD AI Core v2.5'
      }
    });

    changeTracker.recordChange({
      category: 'SNAPSHOT_CREATED',
      severity: 'INFO',
      eventType: 'startup.snapshot.created',
      description: `Initial startup snapshot created (${snapshot.snapshotId}) with ${rawModules.length} modules.`
    });

    return snapshot;
  }

  public recordStateChange(params: {
    category: any;
    severity: any;
    eventType: string;
    description: string;
    sourceModuleId?: string;
    oldValue?: any;
    newValue?: any;
    registeredModulesGetter?: () => RegisteredModuleMetadata[];
  }): void {
    changeTracker.recordChange({
      category: params.category,
      severity: params.severity,
      eventType: params.eventType,
      description: params.description,
      sourceModuleId: params.sourceModuleId,
      oldValue: params.oldValue,
      newValue: params.newValue
    });

    if (params.registeredModulesGetter) {
      const allMods = params.registeredModulesGetter();
      knowledgeGraphBuilder.rebuildGraph(allMods);
      healthMonitor.calculateHealthMetrics(allMods);
    }
  }
}

export const platformStateManager = PlatformStateManager.getInstance();

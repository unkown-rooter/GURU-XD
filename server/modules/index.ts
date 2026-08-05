import { moduleRegistry } from './moduleRegistry';
import { platformStateManager } from './platformStateManager';
import { 
  DashboardModule, 
  AnalyticsModule, 
  DeploymentModule, 
  BotManagerModule, 
  SecurityModule,
  LoggingTelemetryModule,
  PluginMarketplaceModule,
  EnvConfigModule,
  ArchitectureVersionsModule,
  KnowledgeGraphModule,
  AiCoreOrchestratorModule,
  ApiGatewayModule,
  DatabaseStorageModule
} from './builtinModules';

export * from './types';
export * from './standardModule';
export * from './manifestValidator';
export * from './moduleRegistry';
export * from './serviceRegistryEngine';
export * from './capabilityRegistry';
export * from './eventRegistryEngine';
export * from './knowledgeGraph';
export * from './auditEngine';
export * from './securityValidator';
export * from './versionChecker';
export * from './projectDiscoveryEngine';
export * from './aiDiscoveryEngine';
export * from './aiLearningPipeline';
export * from './changeTracker';
export * from './healthMonitor';
export * from './startupSnapshotManager';
export * from './platformStateManager';
export * from './aiCoreReasoning';
export * from './pluginManager';
export * from './builtinModules';

import { projectDiscoveryEngine } from './projectDiscoveryEngine';
import { pluginManager } from './pluginManager';
import { aiDiscoveryEngine } from './aiDiscoveryEngine';

let initialized = false;

export async function bootstrapModuleSystem() {
  if (initialized) return;
  initialized = true;

  console.log('[MODULE REGISTRY] Bootstrapping GURU-XD Production-Grade Module & Platform State Intelligence System...');

  try {
    // Stage 5 Step 1: Discovery
    const modulesToBoot = [
      new DashboardModule(),
      new AnalyticsModule(),
      new DeploymentModule(),
      new BotManagerModule(),
      new SecurityModule(),
      new LoggingTelemetryModule(),
      new PluginMarketplaceModule(),
      new EnvConfigModule(),
      new ArchitectureVersionsModule(),
      new KnowledgeGraphModule(),
      new AiCoreOrchestratorModule(),
      new ApiGatewayModule(),
      new DatabaseStorageModule()
    ];

    for (const mod of modulesToBoot) {
      projectDiscoveryEngine.registerDiscoveredInstance(mod);
    }
    const discoveryScan = projectDiscoveryEngine.scanProjectModules();
    moduleRegistry.recordStartupStep(1, 'Discovery', 'PASSED', `Discovered ${discoveryScan.totalDiscovered} valid platform modules.`);

    // Stage 5 Step 2: Validation
    if (discoveryScan.invalidModules.length > 0) {
      moduleRegistry.recordStartupStep(2, 'Validation', 'FAILED', `Validation failed for ${discoveryScan.invalidModules.length} module(s).`, discoveryScan.invalidModules.map(i => i.errors.join('; ')).join(' | '));
      throw new Error(`Module validation failed for ${discoveryScan.invalidModules.length} modules.`);
    } else {
      moduleRegistry.recordStartupStep(2, 'Validation', 'PASSED', `All ${discoveryScan.totalDiscovered} module manifests and security policies validated.`);
    }

    // Stage 5 Step 3: Registration
    for (const mod of modulesToBoot) {
      await moduleRegistry.registerModule(mod);
    }
    const registeredCount = moduleRegistry.getAllRegisteredModules().length;
    moduleRegistry.recordStartupStep(3, 'Registration', 'PASSED', `Successfully registered ${registeredCount} modules in Module Registry.`);

    // Discover and register production plugins
    const catalog = pluginManager.discoverPlugins();
    console.log(`[PLUGIN MANAGER] Discovered ${catalog.length} production plugins from catalog.`);

    // Stage 5 Step 4: Synchronization Audit
    const syncAudit = moduleRegistry.generateStage4Report();
    if (!syncAudit.isConsistent && !syncAudit.postRepairConsistent) {
      moduleRegistry.recordStartupStep(4, 'Synchronization', 'FAILED', 'Component module count mismatch detected.', syncAudit.mismatches.map(m => m.explanation).join(' | '));
      throw new Error('Synchronization audit failed across platform components.');
    } else {
      moduleRegistry.recordStartupStep(4, 'Synchronization', 'PASSED', `5-component synchronization audit passed for all ${registeredCount} modules.`);
    }

    // Stage 5 Step 5: Knowledge Graph Update
    await moduleRegistry.runFullHealthAudit();
    moduleRegistry.recordStartupStep(5, 'Knowledge Graph update', 'PASSED', `Knowledge Graph updated with ${registeredCount} module nodes.`);

    // Stage 5 Step 6: AI Memory Update
    for (const mod of modulesToBoot) {
      aiDiscoveryEngine.registerModuleToMemory(mod.manifest.id);
    }
    moduleRegistry.recordStartupStep(6, 'AI Memory update', 'PASSED', `AI Memory synchronized with ${registeredCount} active modules.`);

    // Stage 5 Step 7: Platform State Update
    platformStateManager.createInitialStartupSnapshot(() => moduleRegistry.getAllRegisteredModules());
    moduleRegistry.recordStartupStep(7, 'Platform State update', 'PASSED', `Initial startup snapshot created. Uptime tracker online.`);

    console.log(`[MODULE REGISTRY] Successfully completed 7-stage startup pipeline! Registered ${registeredCount} standard modules and ${pluginManager.getAllPlugins().length} plugins.`);
  } catch (err: any) {
    console.error(`[MODULE REGISTRY FATAL STARTUP ERROR] Startup pipeline failed: ${err.message}`);
    moduleRegistry.recordStartupStep(5, 'Startup Pipeline', 'FAILED', 'Startup pipeline stopped due to critical exception.', err.message);
  }
}


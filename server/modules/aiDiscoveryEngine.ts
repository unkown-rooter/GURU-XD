import { RegisteredModuleMetadata, AIDiscoveryQueryResult } from './types';
import { serviceRegistryEngine } from './serviceRegistryEngine';
import { capabilityRegistry } from './capabilityRegistry';
import { eventRegistryEngine } from './eventRegistryEngine';

export class AIDiscoveryEngine {
  private static instance: AIDiscoveryEngine;
  private knownModuleIds: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): AIDiscoveryEngine {
    if (!AIDiscoveryEngine.instance) {
      AIDiscoveryEngine.instance = new AIDiscoveryEngine();
    }
    return AIDiscoveryEngine.instance;
  }

  public registerModuleToMemory(moduleId: string): void {
    this.knownModuleIds.add(moduleId);
  }

  public unregisterModuleFromMemory(moduleId: string): void {
    this.knownModuleIds.delete(moduleId);
  }

  public getKnownModuleIds(): string[] {
    return Array.from(this.knownModuleIds);
  }

  public getMemoryModulesCount(): number {
    return this.knownModuleIds.size;
  }

  public query(queryText: string, modules: RegisteredModuleMetadata[]): AIDiscoveryQueryResult {
    const q = queryText.toLowerCase().trim();
    const timestamp = new Date().toISOString();

    // 1. LIST_ALL
    if (q.includes('all modules') || q.includes('what modules exist') || q === 'list') {
      return {
        query: queryText,
        queryType: 'LIST_ALL',
        matchedModules: modules,
        matchedServices: serviceRegistryEngine.getAllServices().map(s => ({
          serviceKey: s.serviceKey,
          name: s.name,
          description: s.description
        })),
        matchedCapabilities: capabilityRegistry.getAllCapabilities().map(c => c.capability),
        explanation: `Discovered ${modules.length} active registered modules in live inventory.`,
        timestamp
      };
    }

    // 2. FIND_FAILED
    if (q.includes('fail') || q.includes('degraded') || q.includes('unhealthy')) {
      const failed = modules.filter(m => m.status === 'FAILED' || m.status === 'DEGRADED' || m.health.score < 80);
      return {
        query: queryText,
        queryType: 'FIND_FAILED',
        matchedModules: failed,
        matchedServices: [],
        matchedCapabilities: [],
        explanation: failed.length > 0 
          ? `Found ${failed.length} module(s) currently degraded or reporting health warnings.`
          : `All ${modules.length} registered modules are operating with 100% health.`,
        timestamp
      };
    }

    // 3. FIND_USER_MANAGERS
    if (q.includes('user') || q.includes('account') || q.includes('permission')) {
      const userMods = modules.filter(m => 
        m.manifest.id.includes('user') || 
        m.manifest.name.toLowerCase().includes('user') ||
        m.manifest.capabilities.some(c => c.name.toLowerCase().includes('user') || c.id.includes('user'))
      );
      return {
        query: queryText,
        queryType: 'FIND_USER_MANAGERS',
        matchedModules: userMods,
        matchedServices: serviceRegistryEngine.getAllServices().filter(s => s.serviceKey.includes('user')),
        matchedCapabilities: capabilityRegistry.getAllCapabilities().filter(c => c.capability.name.toLowerCase().includes('user')).map(c => c.capability),
        explanation: `Discovered ${userMods.length} module(s) providing user and security access controls.`,
        timestamp
      };
    }

    // 4. FIND_BY_CAPABILITY (Deploy, Rollback, Restart, Stats, Reports, etc.)
    const capMatches = capabilityRegistry.findModulesWithCapability(q);
    if (capMatches.length > 0) {
      const matchedMods = modules.filter(m => capMatches.includes(m.manifest.id));
      return {
        query: queryText,
        queryType: 'FIND_BY_CAPABILITY',
        matchedModules: matchedMods,
        matchedServices: serviceRegistryEngine.getAllServices().filter(s => capMatches.includes(s.moduleId)),
        matchedCapabilities: capabilityRegistry.getAllCapabilities().filter(c => capMatches.includes(c.moduleId)).map(c => c.capability),
        explanation: `Discovered ${matchedMods.length} module(s) satisfying capability query "${queryText}".`,
        timestamp
      };
    }

    // 5. FIND_BY_SERVICE
    const matchedServices = serviceRegistryEngine.getAllServices().filter(s => 
      s.serviceKey.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
    if (matchedServices.length > 0) {
      const modIds = Array.from(new Set(matchedServices.map(s => s.moduleId)));
      const matchedMods = modules.filter(m => modIds.includes(m.manifest.id));
      return {
        query: queryText,
        queryType: 'FIND_BY_SERVICE',
        matchedModules: matchedMods,
        matchedServices,
        matchedCapabilities: [],
        explanation: `Found ${matchedServices.length} registered service(s) matching "${queryText}".`,
        timestamp
      };
    }

    // 6. Generic Fallback Search over manifests
    const genericMatched = modules.filter(m => 
      m.manifest.id.toLowerCase().includes(q) ||
      m.manifest.name.toLowerCase().includes(q) ||
      m.manifest.description.toLowerCase().includes(q) ||
      m.manifest.capabilities.some(c => c.name.toLowerCase().includes(q))
    );

    return {
      query: queryText,
      queryType: 'CUSTOM',
      matchedModules: genericMatched,
      matchedServices: [],
      matchedCapabilities: [],
      explanation: genericMatched.length > 0 
        ? `Discovered ${genericMatched.length} module(s) matching keyword search.` 
        : `No registered modules matched query "${queryText}".`,
      timestamp
    };
  }
}

export const aiDiscoveryEngine = AIDiscoveryEngine.getInstance();

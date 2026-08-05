import { ModuleCapability } from './types';

export class CapabilityRegistry {
  private static instance: CapabilityRegistry;
  private capabilities: Map<string, { capability: ModuleCapability; moduleId: string }> = new Map();

  private constructor() {}

  public static getInstance(): CapabilityRegistry {
    if (!CapabilityRegistry.instance) {
      CapabilityRegistry.instance = new CapabilityRegistry();
    }
    return CapabilityRegistry.instance;
  }

  public registerCapability(moduleId: string, capability: ModuleCapability): void {
    const key = `${moduleId}:${capability.id}`;
    this.capabilities.set(key, { capability, moduleId });
  }

  public unregisterModuleCapabilities(moduleId: string): void {
    for (const [key, val] of this.capabilities.entries()) {
      if (val.moduleId === moduleId) {
        this.capabilities.delete(key);
      }
    }
  }

  public getAllCapabilities(): { capability: ModuleCapability; moduleId: string }[] {
    return Array.from(this.capabilities.values());
  }

  public findModulesWithCapability(capabilityIdOrCategory: string): string[] {
    const query = capabilityIdOrCategory.toLowerCase();
    const matchedModuleIds = new Set<string>();

    for (const { capability, moduleId } of this.capabilities.values()) {
      if (
        capability.id.toLowerCase().includes(query) ||
        capability.name.toLowerCase().includes(query) ||
        capability.category.toLowerCase().includes(query) ||
        capability.description.toLowerCase().includes(query)
      ) {
        matchedModuleIds.add(moduleId);
      }
    }

    return Array.from(matchedModuleIds);
  }
}

export const capabilityRegistry = CapabilityRegistry.getInstance();

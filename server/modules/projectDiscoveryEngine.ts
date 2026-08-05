import { StandardGuruModule } from './standardModule';
import { ModuleManifest, Stage1DiscoveryReport } from './types';
import { ManifestValidator } from './manifestValidator';
import { SecurityValidator } from './securityValidator';

export class ProjectDiscoveryEngine {
  private static instance: ProjectDiscoveryEngine;
  private registeredConstructors: Map<string, new () => StandardGuruModule> = new Map();
  private discoveredInstances: Map<string, StandardGuruModule> = new Map();
  private ignoredModuleIds: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): ProjectDiscoveryEngine {
    if (!ProjectDiscoveryEngine.instance) {
      ProjectDiscoveryEngine.instance = new ProjectDiscoveryEngine();
    }
    return ProjectDiscoveryEngine.instance;
  }

  /**
   * Registers a module class constructor into the project scanner
   */
  public registerModuleClass(id: string, moduleConstructor: new () => StandardGuruModule): void {
    this.registeredConstructors.set(id, moduleConstructor);
  }

  /**
   * Registers a live discovered module instance directly
   */
  public registerDiscoveredInstance(instance: StandardGuruModule): void {
    const manifest = instance.manifest;
    if (manifest && manifest.id) {
      this.discoveredInstances.set(manifest.id, instance);
    }
  }

  /**
   * Unregisters a discovered module instance
   */
  public unregisterDiscoveredInstance(moduleId: string): void {
    this.discoveredInstances.delete(moduleId);
    this.registeredConstructors.delete(moduleId);
  }

  /**
   * Marks a module ID as ignored with a reason
   */
  public ignoreModule(moduleId: string, reason: string): void {
    this.ignoredModuleIds.set(moduleId, reason);
  }

  /**
   * Executes full project module discovery scan
   */
  public scanProjectModules(): {
    validModules: StandardGuruModule[];
    invalidModules: { moduleId: string; errors: string[] }[];
    totalDiscovered: number;
  } {
    const validModules: StandardGuruModule[] = [];
    const invalidModules: { moduleId: string; errors: string[] }[] = [];

    // 1. Process explicit instances
    for (const [id, instance] of this.discoveredInstances.entries()) {
      if (this.ignoredModuleIds.has(id)) continue;
      const manifest = instance.manifest;
      const manifestVal = ManifestValidator.validateManifest(manifest);
      const securityVal = SecurityValidator.validateModuleSecurity(manifest);

      if (manifestVal.valid && securityVal.valid) {
        if (!validModules.some(m => m.manifest.id === manifest.id)) {
          validModules.push(instance);
        }
      } else {
        const errors = [...manifestVal.errors, ...securityVal.errors];
        invalidModules.push({ moduleId: id, errors });
      }
    }

    // 2. Instantiate constructors
    for (const [id, ConstructorClass] of this.registeredConstructors.entries()) {
      if (this.ignoredModuleIds.has(id)) continue;
      try {
        const instance = new ConstructorClass();
        const manifest = instance.manifest;
        const manifestVal = ManifestValidator.validateManifest(manifest);
        const securityVal = SecurityValidator.validateModuleSecurity(manifest);

        if (manifestVal.valid && securityVal.valid) {
          if (!validModules.some(m => m.manifest.id === manifest.id)) {
            validModules.push(instance);
            this.discoveredInstances.set(manifest.id, instance);
          }
        } else {
          const errors = [...manifestVal.errors, ...securityVal.errors];
          invalidModules.push({ moduleId: id, errors });
        }
      } catch (err: any) {
        invalidModules.push({ moduleId: id, errors: [`Failed to instantiate module constructor: ${err.message}`] });
      }
    }

    return {
      validModules,
      invalidModules,
      totalDiscovered: validModules.length
    };
  }

  /**
   * Generates Stage 1 Project Discovery Audit Report
   */
  public generateStage1Report(): Stage1DiscoveryReport {
    const scan = this.scanProjectModules();
    const discoveredMods = scan.validModules;
    const invalidMods = scan.invalidModules;

    const expectedCount = this.discoveredInstances.size + this.registeredConstructors.size;
    const discoveredCount = discoveredMods.length;
    const invalidCount = invalidMods.length;
    const ignoredCount = this.ignoredModuleIds.size;
    const missingCount = Math.max(0, expectedCount - discoveredCount - invalidCount - ignoredCount);

    const discoveredModules = discoveredMods.map(m => ({
      id: m.manifest.id,
      name: m.manifest.name,
      version: m.manifest.version
    }));

    const invalidModules = invalidMods.map(i => ({
      moduleId: i.moduleId,
      errors: i.errors,
      reason: `Validation failed: ${i.errors.join('; ')}`
    }));

    const ignoredModules = Array.from(this.ignoredModuleIds.entries()).map(([id, reason]) => ({
      id,
      reason
    }));

    const missingModules: { id: string; reason: string }[] = [];

    return {
      expectedCount,
      discoveredCount,
      missingCount,
      ignoredCount,
      invalidCount,
      discoveredModules,
      missingModules,
      ignoredModules,
      invalidModules
    };
  }

  public getDiscoveredModulesCount(): number {
    return this.scanProjectModules().totalDiscovered;
  }

  public getAllDiscoveredModules(): StandardGuruModule[] {
    return this.scanProjectModules().validModules;
  }
}

export const projectDiscoveryEngine = ProjectDiscoveryEngine.getInstance();


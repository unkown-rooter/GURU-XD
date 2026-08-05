import { ModuleServiceDefinition, ServiceExecutionResult } from './types';
import { StandardGuruModule } from './standardModule';

export class ServiceRegistryEngine {
  private static instance: ServiceRegistryEngine;
  private services: Map<string, { definition: ModuleServiceDefinition; moduleId: string; module: StandardGuruModule }> = new Map();

  private constructor() {}

  public static getInstance(): ServiceRegistryEngine {
    if (!ServiceRegistryEngine.instance) {
      ServiceRegistryEngine.instance = new ServiceRegistryEngine();
    }
    return ServiceRegistryEngine.instance;
  }

  public registerService(moduleId: string, serviceDef: ModuleServiceDefinition, module: StandardGuruModule): void {
    this.services.set(serviceDef.serviceKey, {
      definition: serviceDef,
      moduleId,
      module
    });
  }

  public unregisterModuleServices(moduleId: string): void {
    for (const [key, val] of this.services.entries()) {
      if (val.moduleId === moduleId) {
        this.services.delete(key);
      }
    }
  }

  public getService(serviceKey: string) {
    return this.services.get(serviceKey);
  }

  public getAllServices(): { serviceKey: string; name: string; description: string; moduleId: string }[] {
    return Array.from(this.services.entries()).map(([key, val]) => ({
      serviceKey: key,
      name: val.definition.name,
      description: val.definition.description,
      moduleId: val.moduleId
    }));
  }

  public async invokeService(serviceKey: string, params?: any): Promise<ServiceExecutionResult> {
    const start = Date.now();
    const serviceEntry = this.services.get(serviceKey);

    if (!serviceEntry) {
      return {
        success: false,
        serviceKey,
        moduleId: 'UNKNOWN',
        error: `Service "${serviceKey}" was not found in the Service Registry.`,
        executionTimeMs: Date.now() - start
      };
    }

    try {
      const result = await serviceEntry.module.executeService(serviceKey, params);
      return result;
    } catch (err: any) {
      return {
        success: false,
        serviceKey,
        moduleId: serviceEntry.moduleId,
        error: `Service execution failed: ${err.message}`,
        executionTimeMs: Date.now() - start
      };
    }
  }
}

export const serviceRegistryEngine = ServiceRegistryEngine.getInstance();

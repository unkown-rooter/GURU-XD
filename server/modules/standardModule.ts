import { 
  ModuleManifest, 
  ModuleLifecycleState, 
  ModuleHealthReport,
  ServiceExecutionResult
} from './types';

export abstract class StandardGuruModule {
  public abstract readonly manifest: ModuleManifest;
  protected lifecycleState: ModuleLifecycleState = 'UNINITIALIZED';
  protected healthReport: ModuleHealthReport = {
    healthy: true,
    status: 'HEALTHY',
    score: 100,
    details: 'Module initialized successfully'
  };

  public getLifecycleState(): ModuleLifecycleState {
    return this.lifecycleState;
  }

  public getHealthReport(): ModuleHealthReport {
    return this.healthReport;
  }

  // --- Required Lifecycle Methods (Objective 3) ---

  /**
   * Initializes internal state, pre-loads dependencies and configuration.
   */
  public abstract initialize(): Promise<void>;

  /**
   * Registers the module manifest, services, capabilities, events, and routes with the central registries.
   */
  public abstract register(): Promise<void>;

  /**
   * Starts module background tasks, listeners, and operational handlers.
   */
  public abstract start(): Promise<void>;

  /**
   * Gracefully pauses or stops active processing without dropping persistent state.
   */
  public abstract stop(): Promise<void>;

  /**
   * Restarts the module by stopping and starting it again.
   */
  public async restart(): Promise<void> {
    this.lifecycleState = 'RESTARTING';
    await this.stop();
    await this.start();
    this.lifecycleState = 'RUNNING';
  }

  /**
   * Executes a live health check on the module resources.
   */
  public abstract health(): Promise<ModuleHealthReport>;

  /**
   * Reloads dynamic configuration and updates internal registry metadata without full restart.
   */
  public abstract reload(newConfig?: Record<string, any>): Promise<void>;

  /**
   * Performs complete resource teardown, unbinds events, and unregisters services.
   */
  public abstract shutdown(): Promise<void>;

  /**
   * Invokes a service provided by this module.
   */
  public abstract executeService(serviceKey: string, params?: any): Promise<ServiceExecutionResult>;
}

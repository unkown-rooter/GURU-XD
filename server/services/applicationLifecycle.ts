import { AppEventBus } from './eventBus';
import { ApplicationManager } from './applicationManager';

export type LifecycleState =
  | 'UNREGISTERED'
  | 'INSTALLED'
  | 'CONFIGURED'
  | 'STARTING'
  | 'RUNNING'
  | 'RELOADING'
  | 'UPDATING'
  | 'STOPPING'
  | 'STOPPED'
  | 'SUSPENDED'
  | 'FAILED'
  | 'REMOVED';

export type LifecycleAction =
  | 'install'
  | 'configure'
  | 'start'
  | 'stop'
  | 'restart'
  | 'reload'
  | 'update'
  | 'suspend'
  | 'resume'
  | 'remove';

export interface LifecycleHookContext {
  appId: string;
  action: LifecycleAction;
  previousState: LifecycleState;
  targetState: LifecycleState;
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
}

export interface LifecycleAuditRecord {
  id: string;
  appId: string;
  action: LifecycleAction;
  fromState: LifecycleState;
  toState: LifecycleState;
  status: 'success' | 'failed';
  message: string;
  timestamp: string;
  executedBy: string;
  durationMs: number;
}

export type LifecycleHookHandler = (ctx: LifecycleHookContext) => Promise<void> | void;

export class ApplicationLifecycleManager {
  private static instance: ApplicationLifecycleManager;
  private appStates: Map<string, LifecycleState> = new Map();
  private auditLogs: LifecycleAuditRecord[] = [];
  private preHooks: Set<LifecycleHookHandler> = new Set();
  private postHooks: Set<LifecycleHookHandler> = new Set();
  private eventBus = AppEventBus.getInstance();
  private appManager = ApplicationManager.getInstance();

  private allowedTransitions: Record<LifecycleState, LifecycleState[]> = {
    UNREGISTERED: ['INSTALLED', 'REMOVED'],
    INSTALLED: ['CONFIGURED', 'STARTING', 'SUSPENDED', 'REMOVED'],
    CONFIGURED: ['STARTING', 'SUSPENDED', 'REMOVED'],
    STARTING: ['RUNNING', 'FAILED', 'STOPPED'],
    RUNNING: ['STOPPING', 'STOPPED', 'RELOADING', 'UPDATING', 'SUSPENDED', 'FAILED'],
    RELOADING: ['RUNNING', 'FAILED'],
    UPDATING: ['RUNNING', 'FAILED'],
    STOPPING: ['STOPPED', 'FAILED'],
    STOPPED: ['STARTING', 'CONFIGURED', 'UPDATING', 'SUSPENDED', 'REMOVED'],
    SUSPENDED: ['STARTING', 'STOPPED', 'CONFIGURED', 'REMOVED'],
    FAILED: ['STARTING', 'CONFIGURED', 'STOPPED', 'REMOVED'],
    REMOVED: ['INSTALLED']
  };

  private constructor() {
    this.syncInitialStates();
  }

  public static getInstance(): ApplicationLifecycleManager {
    if (!ApplicationLifecycleManager.instance) {
      ApplicationLifecycleManager.instance = new ApplicationLifecycleManager();
    }
    return ApplicationLifecycleManager.instance;
  }

  private syncInitialStates() {
    const apps = this.appManager.getAllApplications();
    apps.forEach(app => {
      if (app.status === 'running') this.appStates.set(app.id, 'RUNNING');
      else if (app.status === 'stopped') this.appStates.set(app.id, 'STOPPED');
      else if (app.status === 'failed') this.appStates.set(app.id, 'FAILED');
      else if (app.status === 'suspended') this.appStates.set(app.id, 'SUSPENDED');
      else this.appStates.set(app.id, 'INSTALLED');
    });
  }

  public getAppState(appId: string): LifecycleState {
    const state = this.appStates.get(appId);
    if (state) return state;

    const app = this.appManager.getApplication(appId);
    if (!app) return 'UNREGISTERED';

    return 'INSTALLED';
  }

  public registerPreHook(handler: LifecycleHookHandler): () => void {
    this.preHooks.add(handler);
    return () => this.preHooks.delete(handler);
  }

  public registerPostHook(handler: LifecycleHookHandler): () => void {
    this.postHooks.add(handler);
    return () => this.postHooks.delete(handler);
  }

  private async executeHooks(hooks: Set<LifecycleHookHandler>, ctx: LifecycleHookContext) {
    for (const hook of hooks) {
      try {
        await hook(ctx);
      } catch (err) {
        console.error(`[LIFECYCLE HOOK ERROR] ${ctx.action} on ${ctx.appId}:`, err);
      }
    }
  }

  private canTransition(from: LifecycleState, to: LifecycleState): boolean {
    const allowed = this.allowedTransitions[from] || [];
    return allowed.includes(to);
  }

  private async transition(
    appId: string,
    action: LifecycleAction,
    targetState: LifecycleState,
    user: string = 'operator',
    executor: () => Promise<void>
  ): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    const startMs = Date.now();
    const currentState = this.getAppState(appId);

    if (!this.canTransition(currentState, targetState)) {
      const msg = `Invalid state transition for app [${appId}]: cannot move from ${currentState} to ${targetState} via action '${action}'.`;
      this.recordAudit(appId, action, currentState, currentState, 'failed', msg, user, Date.now() - startMs);
      return { success: false, state: currentState, message: msg };
    }

    const ctx: LifecycleHookContext = {
      appId,
      action,
      previousState: currentState,
      targetState,
      timestamp: new Date().toISOString(),
      user
    };

    await this.executeHooks(this.preHooks, ctx);

    try {
      await executor();
      this.appStates.set(appId, targetState);

      // Sync status back to ApplicationManager
      let mappedStatus: 'running' | 'stopped' | 'failed' | 'deploying' | 'suspended' | 'installed' = 'installed';
      if (targetState === 'RUNNING') mappedStatus = 'running';
      else if (targetState === 'STOPPED') mappedStatus = 'stopped';
      else if (targetState === 'FAILED') mappedStatus = 'failed';
      else if (targetState === 'SUSPENDED') mappedStatus = 'suspended';
      else if (targetState === 'STARTING' || targetState === 'UPDATING' || targetState === 'RELOADING') mappedStatus = 'deploying';

      this.appManager.updateApplication(appId, { status: mappedStatus });

      const durationMs = Date.now() - startMs;
      const successMsg = `Successfully executed ${action} for application [${appId}]. State: ${currentState} -> ${targetState}.`;
      this.recordAudit(appId, action, currentState, targetState, 'success', successMsg, user, durationMs);

      await this.executeHooks(this.postHooks, { ...ctx, previousState: currentState, targetState });

      return { success: true, state: targetState, message: successMsg };
    } catch (err: any) {
      const durationMs = Date.now() - startMs;
      const failureMsg = `Failed executing ${action} for application [${appId}]: ${err.message}`;
      this.appStates.set(appId, 'FAILED');
      this.appManager.updateApplication(appId, { status: 'failed' });

      this.recordAudit(appId, action, currentState, 'FAILED', 'failed', failureMsg, user, durationMs);
      return { success: false, state: 'FAILED', message: failureMsg };
    }
  }

  private recordAudit(
    appId: string,
    action: LifecycleAction,
    fromState: LifecycleState,
    toState: LifecycleState,
    status: 'success' | 'failed',
    message: string,
    executedBy: string,
    durationMs: number
  ) {
    const record: LifecycleAuditRecord = {
      id: `lfaud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId,
      action,
      fromState,
      toState,
      status,
      message,
      timestamp: new Date().toISOString(),
      executedBy,
      durationMs
    };

    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public async install(appId: string, user: string = 'operator'): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    return this.transition(appId, 'install', 'INSTALLED', user, async () => {
      this.eventBus.publish('APP_CREATED', { appId, stage: 'installed' }, appId, 'ApplicationLifecycleManager');
    });
  }

  public async configure(appId: string, config: Record<string, any>, user: string = 'operator'): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    return this.transition(appId, 'configure', 'CONFIGURED', user, async () => {
      this.appManager.updateConfiguration(appId, config);
    });
  }

  public async start(appId: string, user: string = 'operator'): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    return this.transition(appId, 'start', 'RUNNING', user, async () => {
      this.eventBus.publish('APP_STARTED', { appId, user }, appId, 'ApplicationLifecycleManager');
    });
  }

  public async stop(
    appId: string,
    options?: { gracefulTimeoutMs?: number; force?: boolean },
    user: string = 'operator'
  ): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    return this.transition(appId, 'stop', 'STOPPED', user, async () => {
      const timeout = options?.gracefulTimeoutMs || 5000;
      if (timeout > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      this.eventBus.publish('APP_STOPPED', { appId, user, force: !!options?.force }, appId, 'ApplicationLifecycleManager');
    });
  }

  public async restart(appId: string, user: string = 'operator'): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    await this.stop(appId, { gracefulTimeoutMs: 100 }, user);
    return this.start(appId, user);
  }

  public async reload(appId: string, user: string = 'operator'): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    return this.transition(appId, 'reload', 'RUNNING', user, async () => {
      this.eventBus.publish('APP_RESTARTED', { appId, user, mode: 'zero-downtime-reload' }, appId, 'ApplicationLifecycleManager');
    });
  }

  public async update(appId: string, version: string, user: string = 'operator'): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    return this.transition(appId, 'update', 'RUNNING', user, async () => {
      this.appManager.registerVersion(appId, {
        version,
        releaseNotes: `Applied version update to ${version}`,
        createdBy: user,
        commitHash: Math.random().toString(16).substring(2, 9)
      });
      this.eventBus.publish('APP_UPDATED', { appId, version, user }, appId, 'ApplicationLifecycleManager');
    });
  }

  public async suspend(appId: string, reason: string = 'Administrative pause', user: string = 'operator'): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    return this.transition(appId, 'suspend', 'SUSPENDED', user, async () => {
      this.eventBus.publish('APP_STOPPED', { appId, user, mode: 'suspended', reason }, appId, 'ApplicationLifecycleManager');
    });
  }

  public async resume(appId: string, user: string = 'operator'): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    return this.transition(appId, 'resume', 'RUNNING', user, async () => {
      this.eventBus.publish('APP_STARTED', { appId, user, mode: 'resumed' }, appId, 'ApplicationLifecycleManager');
    });
  }

  public async remove(appId: string, force: boolean = false, user: string = 'operator'): Promise<{ success: boolean; state: LifecycleState; message: string }> {
    const result = await this.transition(appId, 'remove', 'REMOVED', user, async () => {
      this.eventBus.publish('APP_DELETED', { appId, user, force }, appId, 'ApplicationLifecycleManager');
    });

    if (result.success) {
      this.appManager.deleteApplication(appId);
    }
    return result;
  }

  public getAuditHistory(appId?: string, limit: number = 50): LifecycleAuditRecord[] {
    let filtered = this.auditLogs;
    if (appId) {
      filtered = filtered.filter(l => l.appId === appId);
    }
    return filtered.slice(0, limit);
  }
}

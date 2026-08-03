import { AppEventBus } from './eventBus';
import { ApplicationManager } from './applicationManager';

export interface RuntimeProcess {
  pid: number;
  appId: string;
  status: 'active' | 'idle' | 'busy' | 'crashed' | 'terminated';
  startedAt: string;
  restartCount: number;
  memoryUsageMb: number;
  cpuUsagePercent: number;
  threadCount: number;
  uptimeSeconds: number;
}

export interface BackgroundWorker {
  workerId: string;
  appId: string;
  name: string;
  status: 'running' | 'paused' | 'failed' | 'completed';
  currentTask?: string;
  totalTasksCompleted: number;
  lastHeartbeat: string;
  spawnedAt: string;
}

export interface ResourceAllocation {
  allocatedCpuCores: number;
  allocatedMemoryMb: number;
  maxNetworkBandwidthKbps: number;
  diskQuotaMb: number;
}

export interface RuntimeEvent {
  id: string;
  appId: string;
  type: 'crash' | 'recovery' | 'resource_limit_exceeded' | 'worker_spawned' | 'worker_failed' | 'process_restarted';
  message: string;
  timestamp: string;
  details?: any;
}

export class ApplicationRuntimeEngine {
  private static instance: ApplicationRuntimeEngine;
  private processes: Map<string, RuntimeProcess> = new Map();
  private workers: Map<string, BackgroundWorker> = new Map();
  private allocations: Map<string, ResourceAllocation> = new Map();
  private runtimeEvents: RuntimeEvent[] = [];
  private eventBus = AppEventBus.getInstance();
  private appManager = ApplicationManager.getInstance();

  private pidCounter = 1024;

  private constructor() {
    this.initializeDefaultProcesses();
  }

  public static getInstance(): ApplicationRuntimeEngine {
    if (!ApplicationRuntimeEngine.instance) {
      ApplicationRuntimeEngine.instance = new ApplicationRuntimeEngine();
    }
    return ApplicationRuntimeEngine.instance;
  }

  private initializeDefaultProcesses() {
    const apps = this.appManager.getAllApplications();
    apps.forEach(app => {
      this.registerProcess(app.id);
      this.allocations.set(app.id, {
        allocatedCpuCores: app.replicaCount * 1.0,
        allocatedMemoryMb: app.replicaCount * 1024,
        maxNetworkBandwidthKbps: 100000,
        diskQuotaMb: 5120
      });

      // Spawn initial background worker for each active application
      this.spawnWorker(app.id, `${app.name}-worker-main`);
    });
  }

  public registerProcess(appId: string): RuntimeProcess {
    const existing = this.processes.get(appId);
    if (existing && existing.status === 'active') {
      return existing;
    }

    const process: RuntimeProcess = {
      pid: ++this.pidCounter,
      appId,
      status: 'active',
      startedAt: new Date().toISOString(),
      restartCount: existing ? existing.restartCount + 1 : 0,
      memoryUsageMb: Math.floor(Math.random() * 200) + 120,
      cpuUsagePercent: Math.floor(Math.random() * 15) + 2,
      threadCount: 4,
      uptimeSeconds: 0
    };

    this.processes.set(appId, process);
    this.recordRuntimeEvent({
      id: `rte-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId,
      type: 'process_restarted',
      message: `Runtime process PID ${process.pid} initialized for application [${appId}].`,
      timestamp: new Date().toISOString()
    });

    return process;
  }

  public terminateProcess(appId: string): boolean {
    const proc = this.processes.get(appId);
    if (!proc) return false;

    proc.status = 'terminated';
    proc.cpuUsagePercent = 0;
    proc.memoryUsageMb = 0;

    // Terminate associated background workers
    this.getWorkers(appId).forEach(w => this.terminateWorker(w.workerId));

    this.recordRuntimeEvent({
      id: `rte-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId,
      type: 'crash',
      message: `Process PID ${proc.pid} terminated for application [${appId}].`,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  public getProcess(appId: string): RuntimeProcess | undefined {
    const proc = this.processes.get(appId);
    if (proc && proc.status === 'active') {
      proc.uptimeSeconds = Math.floor((Date.now() - new Date(proc.startedAt).getTime()) / 1000);
      proc.cpuUsagePercent = Math.max(1, Math.min(99, Math.floor(proc.cpuUsagePercent + (Math.random() * 4 - 2))));
      proc.memoryUsageMb = Math.max(50, Math.floor(proc.memoryUsageMb + (Math.random() * 10 - 5)));
    }
    return proc;
  }

  public getAllProcesses(): RuntimeProcess[] {
    return Array.from(this.processes.values()).map(p => this.getProcess(p.appId)!);
  }

  public spawnWorker(appId: string, workerName: string): BackgroundWorker {
    const workerId = `wrk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const worker: BackgroundWorker = {
      workerId,
      appId,
      name: workerName,
      status: 'running',
      currentTask: 'Listening for system events & processing queue',
      totalTasksCompleted: Math.floor(Math.random() * 50) + 10,
      lastHeartbeat: new Date().toISOString(),
      spawnedAt: new Date().toISOString()
    };

    this.workers.set(workerId, worker);
    this.recordRuntimeEvent({
      id: `rte-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId,
      type: 'worker_spawned',
      message: `Spawned background worker ${workerName} [${workerId}] for application [${appId}].`,
      timestamp: new Date().toISOString()
    });

    return worker;
  }

  public pauseWorker(workerId: string): boolean {
    const worker = this.workers.get(workerId);
    if (!worker) return false;

    worker.status = 'paused';
    worker.currentTask = 'Paused';
    return true;
  }

  public resumeWorker(workerId: string): boolean {
    const worker = this.workers.get(workerId);
    if (!worker) return false;

    worker.status = 'running';
    worker.currentTask = 'Processing background task queue';
    worker.lastHeartbeat = new Date().toISOString();
    return true;
  }

  public terminateWorker(workerId: string): boolean {
    const worker = this.workers.get(workerId);
    if (!worker) return false;

    worker.status = 'completed';
    return this.workers.delete(workerId);
  }

  public getWorkers(appId?: string): BackgroundWorker[] {
    const all = Array.from(this.workers.values());
    if (appId) {
      return all.filter(w => w.appId === appId);
    }
    return all;
  }

  public updateResourceAllocation(appId: string, allocation: Partial<ResourceAllocation>): ResourceAllocation {
    const existing = this.allocations.get(appId) || {
      allocatedCpuCores: 1.0,
      allocatedMemoryMb: 1024,
      maxNetworkBandwidthKbps: 100000,
      diskQuotaMb: 5120
    };

    const updated = { ...existing, ...allocation };
    this.allocations.set(appId, updated);

    this.eventBus.publish('RESOURCE_USAGE_UPDATED', { appId, allocation: updated }, appId, 'ApplicationRuntimeEngine');
    return updated;
  }

  public getResourceAllocation(appId: string): ResourceAllocation {
    return this.allocations.get(appId) || {
      allocatedCpuCores: 1.0,
      allocatedMemoryMb: 1024,
      maxNetworkBandwidthKbps: 100000,
      diskQuotaMb: 5120
    };
  }

  public async triggerAutoRecovery(appId: string, reason: string): Promise<{ recovered: boolean; attempts: number; durationMs: number }> {
    const start = Date.now();
    this.terminateProcess(appId);

    // Exponential backoff simulation
    await new Promise(resolve => setTimeout(resolve, 150));
    const newProc = this.registerProcess(appId);

    const durationMs = Date.now() - start;
    this.recordRuntimeEvent({
      id: `rte-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId,
      type: 'recovery',
      message: `Auto-recovery successful for application [${appId}]. New PID: ${newProc.pid}. Reason: ${reason}`,
      timestamp: new Date().toISOString()
    });

    this.eventBus.publish('APP_RESTARTED', { appId, mode: 'auto-recovery', pid: newProc.pid, reason }, appId, 'ApplicationRuntimeEngine');

    return {
      recovered: true,
      attempts: 1,
      durationMs
    };
  }

  private recordRuntimeEvent(evt: RuntimeEvent) {
    this.runtimeEvents.unshift(evt);
    if (this.runtimeEvents.length > 200) {
      this.runtimeEvents.pop();
    }
  }

  public getRuntimeEvents(appId?: string, limit: number = 50): RuntimeEvent[] {
    let filtered = this.runtimeEvents;
    if (appId) {
      filtered = filtered.filter(e => e.appId === appId);
    }
    return filtered.slice(0, limit);
  }
}

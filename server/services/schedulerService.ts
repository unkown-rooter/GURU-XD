import { AppEventBus } from './eventBus';

export type TaskCategory = 'cron' | 'recurring' | 'delayed' | 'retry' | 'cleanup' | 'health' | 'ai_learning';

export interface ScheduledTask {
  id: string;
  name: string;
  intervalMs: number;
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
  handler: () => void | Promise<void>;
  category?: TaskCategory;
  cronExpression?: string;
  maxRetries?: number;
  retryCount?: number;
  status?: 'idle' | 'running' | 'failed' | 'completed';
}

export interface TaskExecutionRecord {
  id: string;
  taskId: string;
  taskName: string;
  executedAt: string;
  durationMs: number;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export class SchedulerService {
  private static instance: SchedulerService;
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private executionHistory: TaskExecutionRecord[] = [];
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.registerSystemDefaultJobs();
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  private registerSystemDefaultJobs() {
    // Health Check Job
    this.registerTask({
      id: 'job-health-probe',
      name: 'Subsystem Health & Probe Job',
      intervalMs: 30000,
      enabled: true,
      category: 'health',
      handler: async () => {
        this.eventBus.publish('HEALTH_CHECK_SCHEDULED', { timestamp: new Date().toISOString() }, 'system', 'SchedulerService');
      }
    });

    // Cleanup Job
    this.registerTask({
      id: 'job-log-cleanup',
      name: 'Audit Log & Metric Retention Cleanup',
      intervalMs: 3600000, // 1 hour
      enabled: true,
      category: 'cleanup',
      handler: async () => {
        // Routine system sweep
      }
    });

    // AI Learning Job
    this.registerTask({
      id: 'job-ai-pattern-learning',
      name: 'AI System Telemetry Pattern Learning',
      intervalMs: 300000, // 5 min
      enabled: true,
      category: 'ai_learning',
      handler: async () => {
        this.eventBus.publish('AI_LEARNING_RUN', { timestamp: new Date().toISOString() }, 'system', 'SchedulerService');
      }
    });
  }

  public registerTask(task: ScheduledTask): void {
    const fullTask: ScheduledTask = {
      ...task,
      category: task.category || 'recurring',
      status: 'idle',
      retryCount: 0,
      maxRetries: task.maxRetries ?? 3
    };

    this.tasks.set(fullTask.id, fullTask);
    if (fullTask.enabled) {
      this.startTask(fullTask.id);
    }
  }

  public startTask(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;

    if (this.timers.has(id)) {
      clearInterval(this.timers.get(id)!);
    }

    task.enabled = true;
    task.nextRun = new Date(Date.now() + task.intervalMs).toISOString();

    const timer = setInterval(async () => {
      await this.executeTask(task);
    }, task.intervalMs);

    this.timers.set(id, timer);
  }

  public stopTask(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }

    const task = this.tasks.get(id);
    if (task) {
      task.enabled = false;
      task.status = 'idle';
      return true;
    }
    return false;
  }

  public async triggerTaskNow(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;
    await this.executeTask(task);
    return true;
  }

  public scheduleOneOffDelayedTask(name: string, delayMs: number, handler: () => void | Promise<void>): string {
    const taskId = `delay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const task: ScheduledTask = {
      id: taskId,
      name,
      intervalMs: delayMs,
      enabled: true,
      category: 'delayed',
      handler
    };

    this.tasks.set(taskId, task);

    const timer = setTimeout(async () => {
      await this.executeTask(task);
      this.tasks.delete(taskId);
      this.timers.delete(taskId);
    }, delayMs);

    this.timers.set(taskId, timer as unknown as NodeJS.Timeout);
    return taskId;
  }

  private async executeTask(task: ScheduledTask) {
    const startMs = Date.now();
    task.status = 'running';
    task.lastRun = new Date().toISOString();
    task.nextRun = new Date(Date.now() + task.intervalMs).toISOString();

    try {
      await task.handler();
      task.status = 'completed';
      task.retryCount = 0;

      this.recordExecution({
        id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        taskId: task.id,
        taskName: task.name,
        executedAt: task.lastRun,
        durationMs: Date.now() - startMs,
        status: 'success'
      });
    } catch (err: any) {
      task.status = 'failed';
      task.retryCount = (task.retryCount || 0) + 1;

      this.recordExecution({
        id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        taskId: task.id,
        taskName: task.name,
        executedAt: task.lastRun,
        durationMs: Date.now() - startMs,
        status: 'failed',
        errorMessage: err.message
      });

      console.error(`Scheduler task [${task.name}] failed (attempt ${task.retryCount}):`, err);

      // Retry policy if within limit
      if (task.retryCount <= (task.maxRetries || 3)) {
        setTimeout(() => this.executeTask(task), 2000 * task.retryCount);
      }
    }
  }

  private recordExecution(record: TaskExecutionRecord) {
    this.executionHistory.unshift(record);
    if (this.executionHistory.length > 500) {
      this.executionHistory.pop();
    }
  }

  public getTask(id: string): ScheduledTask | undefined {
    return this.tasks.get(id);
  }

  public getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  public getExecutionHistory(taskId?: string, limit: number = 50): TaskExecutionRecord[] {
    if (taskId) {
      return this.executionHistory.filter(e => e.taskId === taskId).slice(0, limit);
    }
    return this.executionHistory.slice(0, limit);
  }

  public stopAll(): void {
    this.timers.forEach(t => clearInterval(t));
    this.timers.clear();
  }
}

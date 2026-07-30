import { AppEventBus } from './eventBus';

export interface ScheduledTask {
  id: string;
  name: string;
  intervalMs: number;
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
  handler: () => void | Promise<void>;
}

export class SchedulerService {
  private static instance: SchedulerService;
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private eventBus = AppEventBus.getInstance();

  private constructor() {}

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  public registerTask(task: ScheduledTask): void {
    this.tasks.set(task.id, task);
    if (task.enabled) {
      this.startTask(task.id);
    }
  }

  public startTask(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;

    if (this.timers.has(id)) {
      clearInterval(this.timers.get(id)!);
    }

    const timer = setInterval(async () => {
      try {
        task.lastRun = new Date().toISOString();
        task.nextRun = new Date(Date.now() + task.intervalMs).toISOString();
        await task.handler();
      } catch (err) {
        console.error(`Scheduler task [${task.name}] failed:`, err);
      }
    }, task.intervalMs);

    this.timers.set(id, timer);
  }

  public stopAll(): void {
    this.timers.forEach(t => clearInterval(t));
    this.timers.clear();
  }
}

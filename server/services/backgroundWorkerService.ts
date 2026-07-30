export interface BackgroundJob<T = any> {
  id: string;
  type: string;
  payload: T;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export class BackgroundWorkerService {
  private static instance: BackgroundWorkerService;
  private queue: BackgroundJob[] = [];
  private handlers: Map<string, (job: BackgroundJob) => Promise<void>> = new Map();
  private isProcessing = false;

  private constructor() {
    this.startLoop();
  }

  public static getInstance(): BackgroundWorkerService {
    if (!BackgroundWorkerService.instance) {
      BackgroundWorkerService.instance = new BackgroundWorkerService();
    }
    return BackgroundWorkerService.instance;
  }

  public registerHandler(type: string, handler: (job: BackgroundJob) => Promise<void>): void {
    this.handlers.set(type, handler);
  }

  public enqueueJob<T = any>(type: string, payload: T): BackgroundJob<T> {
    const job: BackgroundJob<T> = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      payload,
      status: 'queued',
      createdAt: new Date().toISOString()
    };
    this.queue.push(job);
    return job;
  }

  private startLoop(): void {
    setInterval(async () => {
      if (this.isProcessing || this.queue.length === 0) return;
      this.isProcessing = true;

      const job = this.queue.find(j => j.status === 'queued');
      if (job) {
        job.status = 'processing';
        const handler = this.handlers.get(job.type);
        if (handler) {
          try {
            await handler(job);
            job.status = 'completed';
            job.processedAt = new Date().toISOString();
          } catch (err: any) {
            job.status = 'failed';
            job.error = err.message || 'Worker processing error';
          }
        } else {
          job.status = 'completed';
          job.processedAt = new Date().toISOString();
        }
      }

      this.isProcessing = false;
    }, 500);
  }

  public getJobs(): BackgroundJob[] {
    return this.queue;
  }
}

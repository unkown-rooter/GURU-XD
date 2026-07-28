import { AIQueueItem, AIQueueStatus } from "./types";
import { DatabaseService } from "../db";

/**
 * AI Request Queue Manager
 * Ensures user prompts are safely stored immediately so no message is ever lost.
 * Supports cancellation, active status tracking, and queue metrics.
 */
export class QueueManager {
  private static instance: QueueManager;
  private dbService = DatabaseService.getInstance();
  private queue: Map<string, AIQueueItem> = new Map();
  private activeControllers: Map<string, AbortController> = new Map();

  private constructor() {}

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public enqueue(prompt: string, agentId: string, userRole: string): { item: AIQueueItem; controller: AbortController } {
    const id = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const item: AIQueueItem = {
      id,
      timestamp: now,
      prompt,
      agentId,
      userRole,
      status: 'queued',
      retries: 0,
      maxRetries: 5,
      progressStep: '🧠 Reading memory...',
      createdAt: now
    };

    this.queue.set(id, item);

    const controller = new AbortController();
    this.activeControllers.set(id, controller);

    this.dbService.addLog("info", "AI_QUEUE", `Enqueued user prompt [${id}] for agent [${agentId}]`);

    return { item, controller };
  }

  public updateStatus(id: string, status: AIQueueStatus, progressStep?: string, error?: string, providerUsed?: string, cacheHit?: boolean) {
    const item = this.queue.get(id);
    if (!item) return;

    item.status = status;
    if (progressStep) item.progressStep = progressStep;
    if (error) item.lastError = error;
    if (providerUsed) item.providerUsed = providerUsed;
    if (cacheHit !== undefined) item.cacheHit = cacheHit;

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      item.completedAt = new Date().toISOString();
      this.activeControllers.delete(id);
    }
  }

  public cancel(id: string): boolean {
    const controller = this.activeControllers.get(id);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(id);
    }

    const item = this.queue.get(id);
    if (item) {
      item.status = 'cancelled';
      item.progressStep = 'Request cancelled by user.';
      item.completedAt = new Date().toISOString();
      this.dbService.addLog("warning", "AI_QUEUE", `Cancelled AI request [${id}]`);
      return true;
    }
    return false;
  }

  public getQueueStats() {
    const items = Array.from(this.queue.values());
    const queuedCount = items.filter(i => i.status === 'queued').length;
    const processingCount = items.filter(i => i.status === 'processing' || i.status === 'retrying').length;
    const completedCount = items.filter(i => i.status === 'completed').length;
    const failedCount = items.filter(i => i.status === 'failed').length;

    return {
      totalQueuedRequests: items.length,
      activeQueueSize: queuedCount + processingCount,
      queuedCount,
      processingCount,
      completedCount,
      failedCount,
      recentItems: items.slice(-10)
    };
  }

  public getItem(id: string): AIQueueItem | undefined {
    return this.queue.get(id);
  }
}

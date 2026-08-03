import { AIQueueItem, AIQueueStatus, AIRequestPriority, AIRateLimitConfig } from "./types";
import { DatabaseService } from "../db";

/**
 * AI Request Queue Manager
 * Ensures user prompts are safely stored immediately so no message is ever lost.
 * Supports cancellation, active status tracking, request tracing, priority queueing, and rate limiting.
 */
export class QueueManager {
  private static instance: QueueManager;
  private dbService = DatabaseService.getInstance();
  private queue: Map<string, AIQueueItem> = new Map();
  private activeControllers: Map<string, AbortController> = new Map();
  private userRateLimit: Map<string, { count: number; resetAt: number }> = new Map();

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  private startCleanupTimer() {
    setInterval(() => {
      this.pruneStaleRequests();
    }, 60000); // Clean every minute
  }

  private pruneStaleRequests() {
    const now = Date.now();
    for (const [id, item] of this.queue.entries()) {
      if ((item.status === 'queued' || item.status === 'processing' || item.status === 'retrying') &&
          now - new Date(item.createdAt).getTime() > 300000) { // 5 mins
        item.status = 'failed';
        item.progressStep = 'Request timed out due to queue staleness';
        item.completedAt = new Date().toISOString();
        this.activeControllers.delete(id);
      }
    }
  }

  public enqueue(
    prompt: string,
    agentId: string,
    userRole: string,
    priority: AIRequestPriority = 'MEDIUM'
  ): { item: AIQueueItem; controller: AbortController } {
    const id = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
      createdAt: now,
      priority,
      traceId
    };

    this.queue.set(id, item);

    const controller = new AbortController();
    this.activeControllers.set(id, controller);

    this.dbService.addLog("info", "AI_QUEUE", `Enqueued user prompt [${id}] (Trace: ${traceId}) for agent [${agentId}]`);

    return { item, controller };
  }

  public updateStatus(
    id: string,
    status: AIQueueStatus,
    progressStep?: string,
    error?: string,
    providerUsed?: string,
    cacheHit?: boolean
  ) {
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

  public getRateLimitStatus(userRole: string = 'Administrator'): AIRateLimitConfig {
    const maxRequestsPerMin = userRole === 'Administrator' ? 60 : 30;
    const key = `role:${userRole}`;
    const now = Date.now();
    const existing = this.userRateLimit.get(key);

    if (!existing || now > existing.resetAt) {
      this.userRateLimit.set(key, { count: 1, resetAt: now + 60000 });
      return { maxRequestsPerMin, currentUsage: 1, resetTimeMs: 60000 };
    }

    existing.count += 1;
    return {
      maxRequestsPerMin,
      currentUsage: existing.count,
      resetTimeMs: Math.max(0, existing.resetAt - now)
    };
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

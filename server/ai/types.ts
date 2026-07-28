export type AIProviderStatus = 'ONLINE' | 'BUSY' | 'SLOW' | 'OFFLINE';
export type AIProviderHealth = 'Excellent' | 'Good' | 'Moderate' | 'Degraded' | 'Offline';

export interface AIProviderMetrics {
  id: string;
  name: string;
  type: 'gemini' | 'openai' | 'local' | 'cache';
  status: AIProviderStatus;
  health: AIProviderHealth;
  latencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retriesCount: number;
  errorRatePct: number;
  lastChecked: string;
  lastError?: string;
  isPrimary?: boolean;
}

export type AIQueueStatus = 'queued' | 'processing' | 'retrying' | 'completed' | 'failed' | 'cancelled';

export interface AIQueueItem {
  id: string;
  timestamp: string;
  prompt: string;
  agentId: string;
  userRole: string;
  status: AIQueueStatus;
  retries: number;
  maxRetries: number;
  progressStep: string;
  lastError?: string;
  createdAt: string;
  completedAt?: string;
  providerUsed?: string;
  cacheHit?: boolean;
}

export interface AICacheEntry {
  hash: string;
  prompt: string;
  agentId: string;
  response: string;
  provider: string;
  timestamp: string;
  hitCount: number;
}

export interface AIProgressCallback {
  (step: string, attempt?: number, maxAttempts?: number): void;
}

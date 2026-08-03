export type AIProviderStatus = 'ONLINE' | 'BUSY' | 'SLOW' | 'OFFLINE';
export type AIProviderHealth = 'Excellent' | 'Good' | 'Moderate' | 'Degraded' | 'Offline';

export interface AIProviderMetrics {
  id: string;
  name: string;
  type: 'gemini' | 'openai' | 'local' | 'cache' | 'groq' | 'openrouter' | 'github' | 'ollama' | 'anthropic' | 'deepseek' | 'xai' | string;
  status: AIProviderStatus;
  health: AIProviderHealth;
  latencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retriesCount: number;
  errorRatePct: number;
  lastChecked: string;
  lastRequestTime?: string;
  lastError?: string;
  isPrimary?: boolean;
  scorePct?: number;
  totalTokensProcessed?: number;
  estimatedCostUsd?: number;
  circuitBreakerOpen?: boolean;
  consecutiveFailures?: number;
  configuredEnvVar?: string;
  currentModel?: string;
}

export interface AIDecisionLogItem {
  decision: string;
  time: string;
  selectedProvider: string;
  reason: string;
  evidence: string;
  confidence: number;
  result: string;
}

export interface AIRuntimeAuditReport {
  timestamp: string;
  providers: {
    providerId: string;
    providerName: string;
    enabled: boolean;
    configured: boolean;
    lastRequestTime: string;
    totalRequestsToday: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTimeMs: number;
    averageCostUsd: number;
    totalCostUsd: number;
    currentStatus: string;
    rawStatus: string;
    currentModel: string;
    lastError: string;
    isReceivingTraffic: boolean;
    configuredEnvVar: string;
  }[];
  summary: {
    totalConfiguredProviders: number;
    providersActivelyServingRequests: number;
    idleProviders: number;
    offlineProviders: number;
    recommendedProviderOrder: string[];
    currentFailoverChain: string[];
    automaticFailoverStatus: string;
    queueSize: number;
  };
  decisionLog: AIDecisionLogItem[];
}

export type AIQueueStatus = 'queued' | 'processing' | 'retrying' | 'completed' | 'failed' | 'cancelled';
export type AIRequestPriority = 'HIGH' | 'MEDIUM' | 'LOW';

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
  priority?: AIRequestPriority;
  traceId?: string;
}

export interface AICacheEntry {
  hash: string;
  prompt: string;
  agentId: string;
  response: string;
  provider: string;
  timestamp: string;
  hitCount: number;
  ttlMs?: number;
  expiresAt?: string;
  tokenCount?: number;
  savedCostUsd?: number;
}

export interface AIProgressCallback {
  (step: string, attempt?: number, maxAttempts?: number): void;
}

export type AISafetyLevel = 'SAFE' | 'WARNING' | 'BLOCKED';

export interface PromptInjectionCheckResult {
  isInjection: boolean;
  riskScore: number;
  detectedPatterns: string[];
  sanitizedPrompt: string;
}

export interface AISafetyResult {
  passed: boolean;
  safetyLevel: AISafetyLevel;
  promptInjection: PromptInjectionCheckResult;
  violationDetails?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AICostMetrics {
  estimatedCostUsd: number;
  currency: string;
  promptCostUsd: number;
  completionCostUsd: number;
}

export interface ProviderScore {
  providerId: string;
  overallScorePct: number;
  latencyScore: number;
  reliabilityScore: number;
  costScore: number;
}

export interface ProviderBenchmarkResult {
  providerId: string;
  providerName: string;
  averageLatencyMs: number;
  successRatePct: number;
  benchmarkTimestamp: string;
  samplesCount: number;
}

export interface AITelemetrySpan {
  spanId: string;
  name: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}

export interface AIRequestTrace {
  traceId: string;
  timestamp: string;
  promptHash: string;
  agentId: string;
  userRole: string;
  spans: AITelemetrySpan[];
  finalProvider: string;
  durationMs: number;
  success: boolean;
  tokenUsage?: TokenUsage;
  costMetrics?: AICostMetrics;
}

export interface AIValidationResult {
  isValid: boolean;
  syntaxValid: boolean;
  formattingValid: boolean;
  antiHallucinationScore: number;
  issues: string[];
}

export interface AIRateLimitConfig {
  maxRequestsPerMin: number;
  currentUsage: number;
  resetTimeMs: number;
}

export interface AICopilotConfig {
  defaultModel: string;
  fallbackModel: string;
  enableCache: boolean;
  enableSafetyFilters: boolean;
  enableQueueing: boolean;
  maxRetries: number;
  requestTimeoutMs: number;
}

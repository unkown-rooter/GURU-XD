import { AIProgressCallback, AITelemetrySpan } from "./types";
import { HealthMonitor } from "./healthMonitor";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxTimeoutMs?: number;
  providerId?: string;
  traceId?: string;
  enableJitter?: boolean;
}

/**
 * Exponential Backoff Retry Manager with Timeout Enforcement, Jitter Calculation,
 * Error Retriability Classification, and Live Progress Feedback.
 */
export class RetryManager {
  private static healthMonitor = HealthMonitor.getInstance();

  /**
   * Evaluates whether an error is temporary and retriable vs permanent.
   */
  public static isRetriableError(err: any): boolean {
    if (!err) return true;
    const msg = String(err.message || err).toLowerCase();

    // Permanent non-retriable errors (security, bad syntax, invalid auth token)
    if (msg.includes("unauthorized") || msg.includes("invalid_api_key") || msg.includes("prompt injection") || msg.includes("syntax error")) {
      return false;
    }

    // Temporary retriable errors
    return true;
  }

  /**
   * Executes an async operation with exponential backoff retries and strict per-attempt timeout limits.
   */
  public static async executeWithRetry<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    onProgress?: AIProgressCallback,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || 5;
    const initialDelayMs = options.initialDelayMs || 2000;
    const maxTimeoutMs = options.maxTimeoutMs || 12000; // 12 seconds timeout per attempt
    const providerId = options.providerId || "gemini-primary";
    const enableJitter = options.enableJitter !== false;

    // Standard progression steps
    if (onProgress) onProgress("🧠 Reading memory...", 1, maxAttempts);

    let lastError: any = null;
    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, maxTimeoutMs);

      try {
        if (onProgress) {
          if (attempt === 1) {
            onProgress("✓ Preparing prompt & collecting context...", 1, maxAttempts);
            onProgress("⏳ Waiting for Gemini AI Provider...", 1, maxAttempts);
          } else {
            onProgress(`⚠️ High traffic. Retrying attempt ${attempt} of ${maxAttempts}...`, attempt, maxAttempts);
          }
        }

        const startTime = Date.now();
        const result = await operation(controller.signal);
        clearTimeout(timeoutId);

        // Record successful execution
        const latencyMs = Date.now() - startTime;
        this.healthMonitor.recordSuccess(providerId, latencyMs);

        return result;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;

        const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('timeout');
        const errorMessage = isTimeout 
          ? `Request timed out after ${maxTimeoutMs / 1000}s` 
          : (err.message || String(err));

        this.healthMonitor.recordFailure(providerId, errorMessage);
        this.healthMonitor.recordRetry(providerId);

        // Check non-retriable failure
        if (!this.isRetriableError(err)) {
          throw err;
        }

        if (attempt < maxAttempts) {
          // Calculate exponential backoff delay (2s -> 4s -> 8s -> 15s) with optional jitter
          if (attempt === 1) delay = 2000;
          else if (attempt === 2) delay = 4000;
          else if (attempt === 3) delay = 8000;
          else delay = 15000;

          if (enableJitter) {
            delay += Math.floor(Math.random() * 500);
          }

          if (onProgress) {
            onProgress(
              `⚠️ Gemini is experiencing high traffic. Retrying attempt ${attempt + 1} of ${maxAttempts} in ${Math.round(delay / 100) / 10}s...`,
              attempt + 1,
              maxAttempts
            );
          }

          // Wait before next retry
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Operation failed after ${maxAttempts} retries`);
  }
}

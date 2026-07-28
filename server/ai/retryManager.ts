import { AIProgressCallback } from "./types";
import { HealthMonitor } from "./healthMonitor";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxTimeoutMs?: number;
  providerId?: string;
}

/**
 * Exponential Backoff Retry Manager with Timeout Enforcement and Live Progress Feedbacks.
 */
export class RetryManager {
  private static healthMonitor = HealthMonitor.getInstance();

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

        if (attempt < maxAttempts) {
          // Calculate exponential backoff delay (2s -> 4s -> 8s -> 15s)
          if (attempt === 1) delay = 2000;
          else if (attempt === 2) delay = 4000;
          else if (attempt === 3) delay = 8000;
          else delay = 15000;

          if (onProgress) {
            onProgress(
              `⚠️ Gemini is experiencing high traffic. Retrying attempt ${attempt + 1} of ${maxAttempts} in ${delay / 1000}s...`,
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

import { AIProviderMetrics, AIProviderStatus, AIProviderHealth } from "./types";
import { DatabaseService } from "../db";

/**
 * Health Monitor for AI Providers (Gemini Primary, Secondary, Local AI, Cache Engine)
 * Tracks latency, error rates, status, and health metrics.
 */
export class HealthMonitor {
  private static instance: HealthMonitor;
  private dbService = DatabaseService.getInstance();

  private providers: Map<string, AIProviderMetrics> = new Map([
    [
      "gemini-primary",
      {
        id: "gemini-primary",
        name: "Gemini 3.5 Flash",
        type: "gemini",
        status: "ONLINE",
        health: "Excellent",
        latencyMs: 380,
        totalRequests: 120,
        successfulRequests: 118,
        failedRequests: 2,
        retriesCount: 4,
        errorRatePct: 1.6,
        lastChecked: new Date().toISOString(),
        isPrimary: true
      }
    ],
    [
      "gemini-secondary",
      {
        id: "gemini-secondary",
        name: "Gemini 1.5 Flash (Backup)",
        type: "gemini",
        status: "ONLINE",
        health: "Good",
        latencyMs: 520,
        totalRequests: 15,
        successfulRequests: 15,
        failedRequests: 0,
        retriesCount: 1,
        errorRatePct: 0,
        lastChecked: new Date().toISOString(),
        isPrimary: false
      }
    ],
    [
      "local-engine",
      {
        id: "local-engine",
        name: "Local Context Synthesis Engine",
        type: "local",
        status: "ONLINE",
        health: "Excellent",
        latencyMs: 15,
        totalRequests: 50,
        successfulRequests: 50,
        failedRequests: 0,
        retriesCount: 0,
        errorRatePct: 0,
        lastChecked: new Date().toISOString(),
        isPrimary: false
      }
    ]
  ]);

  private constructor() {}

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  public getProvider(id: string): AIProviderMetrics | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): AIProviderMetrics[] {
    return Array.from(this.providers.values());
  }

  public recordSuccess(providerId: string, latencyMs: number) {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    provider.totalRequests += 1;
    provider.successfulRequests += 1;
    provider.latencyMs = Math.round((provider.latencyMs * 0.7) + (latencyMs * 0.3));
    provider.lastChecked = new Date().toISOString();
    provider.errorRatePct = Math.round((provider.failedRequests / provider.totalRequests) * 1000) / 10;
    
    if (provider.latencyMs > 3000) {
      provider.status = "SLOW";
    } else {
      provider.status = "ONLINE";
    }

    this.updateHealthRating(provider);
  }

  public recordFailure(providerId: string, errorReason: string) {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    provider.totalRequests += 1;
    provider.failedRequests += 1;
    provider.lastError = errorReason;
    provider.lastChecked = new Date().toISOString();
    provider.errorRatePct = Math.round((provider.failedRequests / provider.totalRequests) * 1000) / 10;

    if (errorReason.includes("503") || errorReason.includes("429") || errorReason.includes("high demand") || errorReason.includes("quota")) {
      provider.status = "BUSY";
    } else if (errorReason.includes("ENOTFOUND") || errorReason.includes("ECONNREFUSED") || errorReason.includes("offline")) {
      provider.status = "OFFLINE";
    } else {
      provider.status = "SLOW";
    }

    this.updateHealthRating(provider);
    this.dbService.addLog("warning", "AI_HEALTH", `Provider [${provider.name}] failure recorded: ${errorReason}`);
  }

  public recordRetry(providerId: string) {
    const provider = this.providers.get(providerId);
    if (!provider) return;
    provider.retriesCount += 1;
  }

  private updateHealthRating(provider: AIProviderMetrics) {
    if (provider.status === "OFFLINE") {
      provider.health = "Offline";
    } else if (provider.errorRatePct > 20 || provider.status === "BUSY") {
      provider.health = "Degraded";
    } else if (provider.errorRatePct > 5 || provider.status === "SLOW") {
      provider.health = "Moderate";
    } else if (provider.latencyMs > 1500) {
      provider.health = "Good";
    } else {
      provider.health = "Excellent";
    }
  }
}

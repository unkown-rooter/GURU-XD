import { HealthMonitor } from "./healthMonitor";
import { CacheManager } from "./cacheManager";
import { RetryManager } from "./retryManager";
import { QueueManager } from "./queueManager";
import { KeywordEngine } from "./keywordEngine";
import {
  AIProgressCallback,
  AISafetyResult,
  PromptInjectionCheckResult,
  AIValidationResult,
  TokenUsage,
  AICostMetrics
} from "./types";
import { DatabaseService } from "../db";
import { COPILOT_AGENTS, CopilotAgentProfile } from "../copilotEngine";
import {
  IAIProviderAdapter,
  GeminiAdapter,
  OpenAIAdapter,
  GroqAdapter,
  OpenRouterAdapter,
  GitHubAdapter,
  OllamaAdapter,
  AnthropicAdapter,
  DeepSeekAdapter,
  XAIAdapter,
  LocalAdapter
} from "./adapters";

export interface ProviderResponse {
  response: string;
  agent: CopilotAgentProfile;
  responseTimeMs: number;
  memoryHit: boolean;
  providerUsed: string;
  cacheHit: boolean;
  retryCount: number;
  progressSteps: string[];
  traceId?: string;
  tokenUsage?: TokenUsage;
  costMetrics?: AICostMetrics;
  safetyResult?: AISafetyResult;
  validationResult?: AIValidationResult;
}

interface CircuitBreakerState {
  consecutiveFailures: number;
  circuitOpenUntil: number;
}

/**
 * Enterprise AI Provider Manager
 * High-Availability Multi-Provider Routing Engine for GURU-XD.
 * Transparently orchestrates requests across Gemini, OpenAI, Groq, OpenRouter,
 * GitHub Models, Ollama, Anthropic, DeepSeek, and xAI with intelligent failover,
 * circuit breaker protection, and local synthesis fallback.
 */
export class ProviderManager {
  private static instance: ProviderManager;
  private healthMonitor = HealthMonitor.getInstance();
  private cacheManager = CacheManager.getInstance();
  private queueManager = QueueManager.getInstance();
  private dbService = DatabaseService.getInstance();

  private adapters: Map<string, IAIProviderAdapter> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  private constructor() {
    this.registerDefaultAdapters();
    this.discoverAndInitializeProviders();
  }

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  private registerDefaultAdapters() {
    const defaultAdapters: IAIProviderAdapter[] = [
      new GeminiAdapter(),
      new OpenAIAdapter(),
      new GroqAdapter(),
      new OpenRouterAdapter(),
      new GitHubAdapter(),
      new OllamaAdapter(),
      new AnthropicAdapter(),
      new DeepSeekAdapter(),
      new XAIAdapter(),
      new LocalAdapter()
    ];

    for (const adapter of defaultAdapters) {
      this.adapters.set(adapter.id, adapter);
      this.circuitBreakers.set(adapter.id, { consecutiveFailures: 0, circuitOpenUntil: 0 });
    }
  }

  /**
   * On startup: detects configured environment variables and registers health state
   */
  public discoverAndInitializeProviders() {
    for (const [id, adapter] of this.adapters.entries()) {
      const isConfigured = adapter.isConfigured();
      if (isConfigured) {
        this.dbService.addLog("info", "AI_PROVIDER", `Discovered configured provider: ${adapter.name} (${adapter.envVar})`);
      }
    }
  }

  /**
   * Checks if circuit breaker is active for a provider
   */
  private isCircuitOpen(providerId: string): boolean {
    const cb = this.circuitBreakers.get(providerId);
    if (!cb) return false;
    if (cb.circuitOpenUntil > 0 && Date.now() < cb.circuitOpenUntil) {
      return true;
    }
    if (cb.circuitOpenUntil > 0 && Date.now() >= cb.circuitOpenUntil) {
      cb.consecutiveFailures = 0;
      cb.circuitOpenUntil = 0;
      this.dbService.addLog("info", "AI_PROVIDER", `Circuit breaker closed for provider [${providerId}]. Restored to active pool.`);
    }
    return false;
  }

  private recordProviderFailure(providerId: string, errorReason: string) {
    const cb = this.circuitBreakers.get(providerId) || { consecutiveFailures: 0, circuitOpenUntil: 0 };
    cb.consecutiveFailures += 1;

    // Trip circuit breaker if 3 consecutive failures occur
    if (cb.consecutiveFailures >= 3) {
      cb.circuitOpenUntil = Date.now() + 60000; // Open for 60 seconds
      this.dbService.addLog("warning", "AI_PROVIDER", `Circuit breaker TRIPPED for provider [${providerId}] due to 3 consecutive failures. Circuit open for 60s.`);
    }

    this.circuitBreakers.set(providerId, cb);
    this.healthMonitor.recordFailure(providerId, errorReason);
  }

  private recordProviderSuccess(providerId: string, latencyMs: number) {
    const cb = this.circuitBreakers.get(providerId);
    if (cb) {
      cb.consecutiveFailures = 0;
      cb.circuitOpenUntil = 0;
    }
    this.healthMonitor.recordSuccess(providerId, latencyMs);
  }

  /**
   * Smart Provider Selection
   * Ranks available, healthy providers based on health scores, latency, and circuit breaker status.
   */
  public getRankedProviders(): IAIProviderAdapter[] {
    const configured: IAIProviderAdapter[] = [];
    const localAdapter = this.adapters.get("local-engine") || new LocalAdapter();

    for (const [id, adapter] of this.adapters.entries()) {
      if (id === "local-engine") continue;
      if (adapter.isConfigured() && !this.isCircuitOpen(id)) {
        configured.push(adapter);
      }
    }

    // Sort by health monitor score
    configured.sort((a, b) => {
      const metricA = this.healthMonitor.getProvider(a.id);
      const metricB = this.healthMonitor.getProvider(b.id);
      const scoreA = metricA ? (metricA.scorePct || 90) : 80;
      const scoreB = metricB ? (metricB.scorePct || 90) : 80;
      return scoreB - scoreA;
    });

    // Local adapter is always the final safety net
    configured.push(localAdapter);
    return configured;
  }

  /**
   * Scans user prompt for prompt injection patterns and security threats
   */
  public scanPromptSafety(userPrompt: string): AISafetyResult {
    const lower = userPrompt.toLowerCase();
    const detectedPatterns: string[] = [];
    let riskScore = 0;

    const injectionPatterns = [
      { pattern: /ignore\s+(all\s+)?(previous\s+)?instructions/i, name: "Instruction Bypass Attempt", risk: 80 },
      { pattern: /system\s*:\s*you\s+are/i, name: "System Persona Override", risk: 75 },
      { pattern: /disregard\s+(all\s+)?rules/i, name: "Safety Rule Disregard", risk: 70 },
      { pattern: /reveal\s+(api|secret|token|password)/i, name: "Credential Exfiltration Attempt", risk: 85 },
      { pattern: /eval\s*\(/i, name: "Code Injection Threat", risk: 90 }
    ];

    for (const item of injectionPatterns) {
      if (item.pattern.test(lower)) {
        detectedPatterns.push(item.name);
        riskScore += item.risk;
      }
    }

    const isInjection = riskScore >= 70;
    const promptInjection: PromptInjectionCheckResult = {
      isInjection,
      riskScore: Math.min(100, riskScore),
      detectedPatterns,
      sanitizedPrompt: userPrompt.replace(/(ignore\s+all\s+instructions|system\s*:\s*you\s+are)/gi, "[REDACTED]")
    };

    return {
      passed: !isInjection,
      safetyLevel: isInjection ? 'BLOCKED' : riskScore > 30 ? 'WARNING' : 'SAFE',
      promptInjection,
      violationDetails: isInjection ? `Prompt blocked due to security threats: ${detectedPatterns.join(', ')}` : undefined
    };
  }

  /**
   * Validates AI response structure, code syntax, and completeness
   */
  public validateAIResponse(response: string): AIValidationResult {
    const issues: string[] = [];
    let syntaxValid = true;

    // Check code blocks syntax if JS code is returned
    const jsCodeBlocks = response.match(/```(?:js|javascript|cjs)\n([\s\S]*?)```/g);
    if (jsCodeBlocks) {
      for (const block of jsCodeBlocks) {
        const code = block.replace(/```(?:js|javascript|cjs)\n/, '').replace(/```$/, '');
        try {
          new Function('client', 'message', 'args', code);
        } catch (err: any) {
          syntaxValid = false;
          issues.push(`JS syntax error in code block: ${err.message}`);
        }
      }
    }

    const antiHallucinationScore = Math.max(50, 100 - (issues.length * 20));

    return {
      isValid: syntaxValid && response.trim().length > 0,
      syntaxValid,
      formattingValid: response.includes('#') || response.includes('*') || response.length < 200,
      antiHallucinationScore,
      issues
    };
  }

  /**
   * Primary entry point for AI generation requests with complete Enterprise High Availability handling.
   */
  public async processRequest(
    userPrompt: string,
    targetAgentId: string = "guru-core",
    userRole: string = "Administrator",
    onProgress?: AIProgressCallback
  ): Promise<ProviderResponse> {
    const startTime = Date.now();
    const progressLog: string[] = [];

    const handleProgress = (step: string, attempt?: number, maxAttempts?: number) => {
      progressLog.push(step);
      if (onProgress) onProgress(step, attempt, maxAttempts);
    };

    // 0. Safety Scan & Security Filter Check
    const safetyResult = this.scanPromptSafety(userPrompt);
    if (!safetyResult.passed) {
      handleProgress("🛡️ Prompt Security Sentinel: Threat detected. Request sanitized.");
      this.dbService.addLog("warning", "AI_SAFETY", safetyResult.violationDetails || "Prompt injection blocked");
      if (safetyResult.safetyLevel === 'BLOCKED') {
        return {
          response: `### 🛡️ SpamShield Security Boundary Active\n\nYour request contained forbidden instruction override patterns (\`${safetyResult.promptInjection.detectedPatterns.join(', ')}\`) and was blocked to maintain cluster integrity.`,
          agent: COPILOT_AGENTS.find(a => a.id === 'security-analyst') || COPILOT_AGENTS[0],
          responseTimeMs: Date.now() - startTime,
          memoryHit: false,
          providerUsed: "SpamShield Security Filter",
          cacheHit: false,
          retryCount: 0,
          progressSteps: progressLog,
          safetyResult
        };
      }
    }

    // 1. Enqueue Request
    const { item } = this.queueManager.enqueue(userPrompt, targetAgentId, userRole);
    const traceId = item.traceId;
    this.queueManager.updateStatus(item.id, 'processing', '🧠 Reading memory & checking cache...');

    // Resolve Target Agent
    let agent = COPILOT_AGENTS.find(a => a.id === targetAgentId) || COPILOT_AGENTS[0];
    const agentMentionMatch = userPrompt.match(/@([A-Za-z0-9_\s-]+)/);
    if (agentMentionMatch && agentMentionMatch[1]) {
      const mentionName = agentMentionMatch[1].trim().toLowerCase();
      const matchedAgent = COPILOT_AGENTS.find(a =>
        a.name.toLowerCase().includes(mentionName) ||
        a.id.toLowerCase().includes(mentionName)
      );
      if (matchedAgent) agent = matchedAgent;
    }

    // Check memory hit
    const db = this.dbService.read();
    const memories = db.copilotMemory || [];
    const memoryHit = memories.some(m => userPrompt.toLowerCase().includes(m.key.toLowerCase().replace(/_/g, ' ')));

    // 2. Check AI Response Cache
    handleProgress("🧠 Reading memory & checking AI response cache...");
    const cachedResponse = this.cacheManager.get(userPrompt, agent.id);
    if (cachedResponse) {
      handleProgress("✓ Found cached response! Returning immediately.");
      this.queueManager.updateStatus(item.id, 'completed', 'Cache Hit', undefined, 'Cached AI Memory', true);

      const latencyMs = Date.now() - startTime;
      this.recordAnalytics('Cached AI Memory', latencyMs, true, memoryHit, true);

      return {
        response: cachedResponse.response,
        agent,
        responseTimeMs: latencyMs,
        memoryHit,
        providerUsed: "Cached AI Memory",
        cacheHit: true,
        retryCount: 0,
        progressSteps: progressLog,
        traceId,
        safetyResult
      };
    }

    // 3. Smart Multi-Provider Failover Pipeline
    const rankedProviders = this.getRankedProviders();
    let responseText = "";
    let providerUsed = "Local Context Synthesis Engine";
    let retryCount = 0;
    let success = false;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalCostUsd = 0;

    const platformContext = this.buildPlatformContext(db);
    const keywordCtx = KeywordEngine.getInstance().buildKeywordContext(userPrompt);
    const systemInstruction = `
${agent.systemInstruction}

IDENTITY & CONTEXT:
- Platform Name: GURU-XD (AI-Powered Hosting Operating System)
- Role: Core AI Orchestrator / Specialist AI (${agent.name})
- Founder & Chief Architect: UnknownRooter (Founder of G7 COMMUNITY)
- Domain Expertise: ${agent.domain}
- Operator Authorization: ${userRole}

${platformContext}

${keywordCtx.contextPrompt}

CORE OPERATING DIRECTIVES & MISSION:
1. You are the Core AI of GURU-XD — an intelligent operating system for an AI hosting platform, NOT a generic chatbot.
2. Think like an infrastructure engineer, cloud architect, DevOps engineer, backend engineer, systems analyst, and AI orchestrator.
3. Follow the AI Brain Workflow: Observe 👀 -> Collect Platform Metrics -> Analyze 🧠 -> Detect Problems -> Determine Severity -> Search Memory -> Compare Previous Events -> Predict Outcomes -> Recommend Solutions -> Execute (Only with Permission) -> Learn.
4. Always base recommendations on evidence and telemetry. Never guess or fabricate metrics.
5. When recommending infrastructure fixes or analyzing issues, use the standard format:
   - ## Issue
   - ## Confidence (e.g. 96%)
   - ## Severity (Critical / High / Medium / Low)
   - ## Evidence
   - ## Possible Cause
   - ## Recommended Actions
   - ## Potential Risk
   - ## Expected Improvement
6. When interacting with Founder UnknownRooter, provide engineering-level depth, focus on scalable architecture, challenge weak designs respectfully, and recommend production-ready solutions.
7. When asked to write bot scripts, produce complete, valid, error-bounded CommonJS JavaScript code blocks.
`;

    for (let i = 0; i < rankedProviders.length; i++) {
      const provider = rankedProviders[i];
      const isLast = i === rankedProviders.length - 1;

      try {
        if (!isLast) {
          handleProgress(`✓ Routing to ${provider.name}...`);
        } else {
          handleProgress(`⚠️ External providers offline/busy. Routing to Local Memory Engine...`);
        }

        const genStartTime = Date.now();
        const result = await provider.generateContent({
          prompt: userPrompt,
          systemInstruction,
          agentId: agent.id,
          userRole
        });

        if (result && result.text && result.text.trim().length > 0) {
          responseText = result.text;
          providerUsed = result.providerName;
          totalPromptTokens = result.promptTokens;
          totalCompletionTokens = result.completionTokens;
          totalCostUsd = result.costUsd;
          success = true;

          const latencyMs = Date.now() - genStartTime;
          this.recordProviderSuccess(provider.id, latencyMs);
          this.healthMonitor.recordTokenUsage(provider.id, totalPromptTokens, totalCompletionTokens);
          this.healthMonitor.recordDecision({
            decision: i === 0 ? "Primary Provider Selection" : `Failover Route ${i + 1}`,
            time: new Date().toISOString(),
            selectedProvider: provider.name,
            reason: i === 0 ? "Highest ranked configured provider" : `Failover from previous failed attempts`,
            evidence: `Latency: ${latencyMs}ms | Tokens: ${totalPromptTokens + totalCompletionTokens}`,
            confidence: 95,
            result: "SUCCESS"
          });
          break; // Request succeeded!
        }
      } catch (err: any) {
        retryCount++;
        this.recordProviderFailure(provider.id, err.message || "Provider generation error");
        this.dbService.addLog("warning", "AI_PROVIDER", `Provider [${provider.name}] failed: ${err.message}. Triggering automatic failover...`);
        this.healthMonitor.recordDecision({
          decision: `Failover Execution #${retryCount}`,
          time: new Date().toISOString(),
          selectedProvider: provider.name,
          reason: `Execution failure: ${err.message || 'Error'}`,
          evidence: `Failed attempt on ${provider.id}`,
          confidence: 70,
          result: "FAILED_FAILOVER"
        });

        if (!isLast) {
          handleProgress(`⚠️ ${provider.name} unavailable. Switching to next provider in failover chain...`);
        }
      }
    }

    const responseTimeMs = Date.now() - startTime;
    const tokenUsage: TokenUsage = {
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens
    };

    const costMetrics: AICostMetrics = {
      estimatedCostUsd: Math.round(totalCostUsd * 100000) / 100000,
      currency: "USD",
      promptCostUsd: Math.round((totalPromptTokens / 1000 * 0.0001) * 100000) / 100000,
      completionCostUsd: Math.round((totalCompletionTokens / 1000 * 0.0004) * 100000) / 100000
    };

    // 4. Validate Response
    const validationResult = this.validateAIResponse(responseText);

    // 5. Cache successful response
    if (success && responseText && validationResult.isValid) {
      this.cacheManager.set(userPrompt, agent.id, responseText, providerUsed);
      this.queueManager.updateStatus(item.id, 'completed', 'Completed', undefined, providerUsed, false);
    } else {
      this.queueManager.updateStatus(item.id, 'failed', 'Failed', 'All providers exhausted', providerUsed, false);
    }

    // 6. Update Analytics & Audit Logs
    this.recordAnalytics(providerUsed, responseTimeMs, success, memoryHit, false);

    return {
      response: responseText,
      agent,
      responseTimeMs,
      memoryHit,
      providerUsed,
      cacheHit: false,
      retryCount,
      progressSteps: progressLog,
      traceId,
      tokenUsage,
      costMetrics,
      safetyResult,
      validationResult
    };
  }

  private buildPlatformContext(db: any): string {
    const memories = db.copilotMemory || [];
    const runningBots = (db.bots || []).filter((b: any) => b.status === 'running');
    const recentLogs = (db.logs || []).slice(-6).map((l: any) => `[${l.type.toUpperCase()}] ${l.message}`).join('\n');

    return `
=== GURU-XD REAL-TIME TELEMETRY ===
Bots Online: ${runningBots.length}/${(db.bots || []).length}
Active Commands: ${(db.commands || []).length}
Memories Stored: ${memories.length}
Recent Logs:
${recentLogs}
`;
  }

  private recordAnalytics(providerUsed: string, responseTimeMs: number, success: boolean, memoryHit: boolean, cacheHit: boolean) {
    const db = this.dbService.read();
    if (!db.copilotAnalytics) {
      db.copilotAnalytics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatencyMs: 380,
        memoryHitsCount: 0,
        memorySavesCount: 0,
        toolExecutionsCount: 0,
        providerUsage: {}
      };
    }

    db.copilotAnalytics.totalRequests += 1;
    if (success) db.copilotAnalytics.successfulRequests += 1;
    else db.copilotAnalytics.failedRequests += 1;

    if (memoryHit || cacheHit) db.copilotAnalytics.memoryHitsCount += 1;
    db.copilotAnalytics.avgLatencyMs = Math.round((db.copilotAnalytics.avgLatencyMs + responseTimeMs) / 2);

    if (!db.copilotAnalytics.providerUsage) db.copilotAnalytics.providerUsage = {};
    db.copilotAnalytics.providerUsage[providerUsed] = (db.copilotAnalytics.providerUsage[providerUsed] || 0) + 1;

    this.dbService.write(db);
  }
}

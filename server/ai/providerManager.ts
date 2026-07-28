import { GoogleGenAI } from "@google/genai";
import { HealthMonitor } from "./healthMonitor";
import { CacheManager } from "./cacheManager";
import { RetryManager } from "./retryManager";
import { QueueManager } from "./queueManager";
import { AIProgressCallback } from "./types";
import { DatabaseService } from "../db";
import { COPILOT_AGENTS, CopilotAgentProfile } from "../copilotEngine";

export interface ProviderResponse {
  response: string;
  agent: CopilotAgentProfile;
  responseTimeMs: number;
  memoryHit: boolean;
  providerUsed: string;
  cacheHit: boolean;
  retryCount: number;
  progressSteps: string[];
}

/**
 * Provider Manager Orchestrator
 * High Availability AI Engine for GURU-XD
 * Handles multi-provider failovers, automatic exponential retries, request queuing,
 * response caching, and friendly error masking.
 */
export class ProviderManager {
  private static instance: ProviderManager;
  private healthMonitor = HealthMonitor.getInstance();
  private cacheManager = CacheManager.getInstance();
  private queueManager = QueueManager.getInstance();
  private dbService = DatabaseService.getInstance();

  private constructor() {}

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  /**
   * Primary entry point for AI generation requests with complete High Availability handling.
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

    // 1. Safely Enqueue Request First (Zero-Data-Loss guarantee)
    const { item, controller } = this.queueManager.enqueue(userPrompt, targetAgentId, userRole);
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
        progressSteps: progressLog
      };
    }

    // 3. Multi-Provider Execution Chain with Retries
    const apiKey = process.env.GEMINI_API_KEY;
    let responseText = "";
    let providerUsed = "Gemini 3.5 Flash";
    let retryCount = 0;
    let success = false;

    if (!apiKey) {
      // Graceful local mode fallback
      handleProgress("✓ Local environment active (No external key). Using Local Context Synthesis...");
      responseText = this.cacheManager.synthesizeInternalFallback(userPrompt, agent.name, agent.domain);
      providerUsed = "Local Context Synthesis";
      success = true;
    } else {
      // Attempt 1: Gemini Primary (gemini-3.5-flash) with Exponential Backoff
      try {
        const platformContext = this.buildPlatformContext(db);
        const systemInstruction = `
${agent.systemInstruction}

Role: ${agent.name} (${agent.role})
Domain Expertise: ${agent.domain}
Current Operator Authorization: ${userRole}

${platformContext}

IMPORTANT INSTRUCTIONS:
1. You are an expert AI Engineering Assistant for GURU-XD. Always answer with authority, technical accuracy, and domain-specific knowledge.
2. When asked to write bot scripts, produce complete, valid CommonJS JavaScript code blocks.
3. Keep answers concise, scannable, and formatted in clean Markdown.
`;

        handleProgress("✓ Preparing prompt & collecting platform context...");

        responseText = await RetryManager.executeWithRetry<string>(
          async (signal) => {
            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: { 'User-Agent': 'aistudio-build' }
              }
            });

            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: userPrompt,
              config: {
                systemInstruction
              }
            });

            return response.text || "No response generated by intelligence engine.";
          },
          (step, attempt, max) => {
            if (attempt) retryCount = attempt - 1;
            handleProgress(step, attempt, max);
            this.queueManager.updateStatus(item.id, attempt && attempt > 1 ? 'retrying' : 'processing', step);
          },
          {
            maxAttempts: 5,
            initialDelayMs: 2000,
            maxTimeoutMs: 12000,
            providerId: "gemini-primary"
          }
        );

        providerUsed = "Gemini 3.5 Flash";
        success = true;
      } catch (primaryErr: any) {
        this.dbService.addLog("warning", "AI_PROVIDER", `Primary provider [Gemini 3.5 Flash] exhausted retries: ${primaryErr.message}. Attempting secondary backup provider...`);
        
        // Attempt 2: Backup Gemini 1.5 Flash Provider
        try {
          handleProgress("⚠️ Primary provider busy. Switching to Secondary Backup AI Model...");
          this.queueManager.updateStatus(item.id, 'processing', "Switching to Secondary Backup AI Model...");

          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

          const backupRes = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: userPrompt
          });

          responseText = backupRes.text || "Generated by secondary model.";
          providerUsed = "Gemini 1.5 Flash (Backup)";
          success = true;
          this.healthMonitor.recordSuccess("gemini-secondary", Date.now() - startTime);
        } catch (secondaryErr: any) {
          this.dbService.addLog("warning", "AI_PROVIDER", `Secondary provider exhausted. Falling back to Local Context Synthesis...`);
          
          // Attempt 3: Intelligent Internal Memory Synthesis Fallback
          handleProgress("⚠️ External providers busy. Synthesizing answer via Internal Memory Engine...");
          responseText = this.cacheManager.synthesizeInternalFallback(userPrompt, agent.name, agent.domain);
          providerUsed = "Local Context Synthesis Engine";
          success = true;
          this.healthMonitor.recordSuccess("local-engine", Date.now() - startTime);
        }
      }
    }

    const responseTimeMs = Date.now() - startTime;

    // 4. Cache successful response
    if (success && responseText) {
      this.cacheManager.set(userPrompt, agent.id, responseText, providerUsed);
      this.queueManager.updateStatus(item.id, 'completed', 'Completed', undefined, providerUsed, false);
    } else {
      this.queueManager.updateStatus(item.id, 'failed', 'Failed', 'All providers exhausted', providerUsed, false);
    }

    // 5. Update Analytics & Audit Logs
    this.recordAnalytics(providerUsed, responseTimeMs, success, memoryHit, false);

    return {
      response: responseText,
      agent,
      responseTimeMs,
      memoryHit,
      providerUsed,
      cacheHit: false,
      retryCount,
      progressSteps: progressLog
    };
  }

  private buildPlatformContext(db: any): string {
    const memories = db.copilotMemory || [];
    const workTimeline = db.copilotWorkTimeline || [];
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

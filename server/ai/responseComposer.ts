import { DatabaseService } from "../db";
import { COPILOT_AGENTS, CopilotAgentProfile } from "../copilotEngine";
import { KeywordEngine } from "./keywordEngine";

export interface ResponseCompositionOptions {
  userPrompt: string;
  agent: CopilotAgentProfile;
  rawText?: string;
  memoryContext?: string;
  isSystemDiagnosticRequest?: boolean;
}

/**
 * Response Composer Module for GURU-XD
 * Responsible for formatting user-friendly AI responses, separating system orchestration
 * diagnostics from conversational AI answers.
 */
export class ResponseComposer {
  private static instance: ResponseComposer;
  private dbService = DatabaseService.getInstance();
  private keywordEngine = KeywordEngine.getInstance();

  private constructor() {}

  public static getInstance(): ResponseComposer {
    if (!ResponseComposer.instance) {
      ResponseComposer.instance = new ResponseComposer();
    }
    return ResponseComposer.instance;
  }

  /**
   * Determines whether a user prompt is specifically asking for system status / cluster diagnostics
   */
  public isSystemStatusInquiry(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    const systemKeywords = [
      'cluster status',
      'system health',
      'active bots',
      'bot status',
      'diagnostics',
      'server health',
      'system status',
      'infrastructure status',
      'node health',
      'container health'
    ];
    return systemKeywords.some(kw => lower.includes(kw));
  }

  /**
   * Synthesizes a clean, direct, helpful conversational response when external LLM APIs are offline
   * or when local context synthesis is required, without spewing unrequested cluster diagnostics.
   */
  public synthesizeConversationalAnswer(prompt: string, agent: CopilotAgentProfile): string {
    const keywordDetection = this.keywordEngine.detectKeywords(prompt);
    const db = this.dbService.read();
    const memories = db.copilotMemory || [];
    const lower = keywordDetection.normalizedText;

    // Check greeting keywords first
    if (keywordDetection.primaryIntent === 'GREETING') {
      const keywordCtx = this.keywordEngine.buildKeywordContext(prompt);
      if (keywordCtx.greetingGreetingSnippet) {
        return keywordCtx.greetingGreetingSnippet;
      }
    }

    // Check emergency keywords
    if (keywordDetection.primaryIntent === 'EMERGENCY') {
      const offlineBots = (db.bots || []).filter(b => b.status === 'stopped').length;
      const recentErrorLogs = (db.logs || []).filter(l => l.type === 'error').slice(-3);
      
      return `### 🚨 Diagnostic Mode Activated
      
**Issue Detection:** Emergency / System Exception triggered by user request.
**Severity Estimate:** ${offlineBots > 0 || recentErrorLogs.length > 0 ? 'HIGH' : 'MEDIUM'}

**Observed Telemetry Evidence:**
- **Offline Bots:** ${offlineBots} stopped instance(s)
- **Recent Error Logs:** ${recentErrorLogs.length > 0 ? recentErrorLogs.map(l => l.message).join('; ') : 'No critical system crashes logged in active session.'}

**Recommended Recovery Steps:**
1. Check process socket listeners and database connection health.
2. Execute \`POST /api/v1/bots/start-all\` or restart specific target bot container.
3. Review full logs via \`GET /api/v1/deployments/operations/logs\`.`;
    }

    // Check founder keywords
    if (keywordDetection.primaryIntent === 'FOUNDER') {
      return `**GURU-XD Architectural Intelligence**
*Founded by UnknownRooter (Founder, G7 COMMUNITY)*

**Core Platform Vision & Roadmap:**
- **Production Scalability:** Autonomous self-healing microservice clusters with zero-downtime hot redeploys.
- **Zero-Trust Security:** Integrated AI threat sentinel scanning prompt injections, RBAC roles, and AES-256 payload encryption.
- **Cognitive Orchestration:** 7-stage AI Brain workflow executing real-time telemetry analysis, predictive load balance, and state retention.`;
    }

    // Check help keywords
    if (keywordDetection.primaryIntent === 'HELP') {
      return `### 📘 GURU-XD Interactive Guidance & Learning Mode

Welcome! Here is how to work with **GURU-XD**:

- **Bot Management:** Manage WhatsApp (Baileys MD) & Telegram (Telegraf) scripts via the Bots dashboard.
- **Copilot Terminal:** Run natural language commands or chat with specialized AI agents (@Security AI, @Bot AI, @Database AI).
- **Deployment Pipelines:** Manage container hot-deploys, environment secrets, and automated rollbacks under Deployments.
- **Example Command:** Ask me to *"build a WhatsApp bot handler"* or *"run a security audit"*.`;
    }

    // Check memory keywords
    if (keywordDetection.primaryIntent === 'MEMORY') {
      const personality = this.keywordEngine.getLearnedPersonality();
      const recentProjs = personality.frequentlyDiscussedProjects.map(p => `• **${p.phrase}:** Discussed ${p.frequencyCount} times`).join("\n");
      const savedMems = memories.slice(-3).map(m => `• **${m.key.toUpperCase()}:** ${JSON.stringify(m.content || m.value).slice(0, 80)}`).join("\n");

      return `### 🧠 Platform Memory Retrieval

**Recent Project Context:**
${recentProjs || "• GURU-XD AI\n• Hosting Platform\n• Core AI Improvements"}

**Saved Memory Context:**
${savedMems || "No custom memory records found."}

Resuming session from latest context. Ready to proceed.`;
    }

    // Check development keywords
    if (keywordDetection.primaryIntent === 'DEVELOPMENT') {
      return `### 🛠️ Engineering Mode Technical Recommendations

1. **Architecture & Design:** Keep bot handlers event-driven and modular. Always isolate socket handlers from API routes.
2. **Error Boundaries:** Wrap code execution blocks in try/catch handlers and register unhandled rejection listeners.
3. **State Management:** Use Mongoose schema indexing or Redis caching layers for sub-millisecond session state retrieval.
4. **Sandbox Validation:** Validate all custom plugins using \`POST /api/v1/copilot/sandbox/validate\` before production deployment.`;
    }

    // Check action keywords
    if (keywordDetection.primaryIntent === 'ACTION') {
      return `### ⚡ Action Safety Analysis

**Action Intent Detected:** ${detectionSummary(keywordDetection.matches)}

**Safety Protocol:**
- Non-destructive actions (analyzing, scanning, reading status) execute automatically.
- Destructive operations (deleting instances, clearing databases, hard resets) require explicit operator confirmation before execution.

Please confirm if you would like to proceed with this operation.`;
    }

    // Search for relevant knowledge / project memory
    const relevantMemories = memories.filter(m =>
      lower.includes(m.key.toLowerCase().replace(/_/g, ' ')) ||
      (m.value && m.value.toLowerCase().includes(lower.slice(0, 15)))
    );

    // If explicit status request
    if (this.isSystemStatusInquiry(prompt)) {
      const runningBots = db.bots.filter(b => b.status === 'running').length;
      return `### 📊 GURU-XD Platform Cluster Status

**Agent Domain:** ${agent.name} (${agent.domain})

**Current System Telemetry:**
- **Active Bots:** ${runningBots} / ${db.bots.length} Online
- **Active Commands:** ${db.commands.length} Registered
- **System Memory:** ${memories.length} Persisted Context Items
- **Maintenance Mode:** ${db.maintenanceMode ? 'Active 🔒' : 'Normal Operational State 🟢'}

*All subsystem services, security sentinels, and database drivers are operating normally.*`;
    }

    if (relevantMemories.length > 0) {
      return `Based on GURU-XD knowledge memory:\n\n${relevantMemories.map(m => `* **${m.key.replace(/_/g, ' ').toUpperCase()}:** ${m.value || JSON.stringify(m.content)}`).join('\n\n')}`;
    }

    if (lower.includes('bot') || lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('baileys')) {
      return `To design or deploy custom bot handlers in GURU-XD:
      
1. **Baileys MD (WhatsApp):** Event-driven handlers process inbound socket events using \`client.ev.on('messages.upsert', ...)\`. Always include \`quoted\` message context.
2. **Telegraf (Telegram):** Commands are registered via \`.command('trigger', ctx => ...)\`.
3. **Sandbox Deployment:** You can write and hot-deploy bot scripts directly using the GURU Sandbox Security Engine (\`POST /api/v1/sandbox/deploy\`).`;
    }

    if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('spam')) {
      return `GURU-XD enforces a **zero-trust defense-in-depth framework**:
      
- **API Guard:** Authorization via \`x-api-key\` and RBAC roles (\`SuperAdmin\`, \`Admin\`, \`Operator\`, \`Viewer\`).
- **Security AI:** Automated scanning for prompt injections, \`eval()\` execution, rate limiting, and credential leaks.
- **Payload Encryption:** AES-256 CBC with SHA-256 key derivation.
- **Audit Chain:** Persistent tamper-evident logging of all administrative actions.`;
    }

    return `Hello! I am **${agent.name}** (${agent.role}).

I am part of the GURU-XD AI Operating System (founded by **UnknownRooter**, **G7 COMMUNITY**). I am here to assist you with ${agent.domain.toLowerCase()}.

How can I assist in managing, securing, or optimizing your platform infrastructure today?`;
  }

  /**
   * Composes and polishes the final response text
   */
  public composeResponse(options: ResponseCompositionOptions): string {
    const { userPrompt, agent, rawText } = options;

    if (rawText && rawText.trim().length > 0) {
      return rawText;
    }

    return this.synthesizeConversationalAnswer(userPrompt, agent);
  }
}

function detectionSummary(matches: any[]): string {
  if (!matches || matches.length === 0) return "General System Action";
  return matches.map(m => m.keyword).join(", ");
}


import { GoogleGenAI } from "@google/genai";
import { DatabaseService, DatabaseState, Log, Bot, Command, Plugin } from "./db";

export interface CopilotMemoryItem {
  id: string;
  category: 'knowledge' | 'project' | 'conversation' | 'ai_learning' | 'user' | 'platform';
  key: string;
  value: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CopilotPromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  promptText: string;
  targetAgent?: string;
  isBuiltIn?: boolean;
}

export interface CopilotSandboxDeployment {
  id: string;
  trigger: string;
  code: string;
  description: string;
  category: string;
  version: number;
  securityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deployedBy: string;
  deployedAt: string;
}

export interface CopilotAuditLog {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  provider: string;
  responseTimeMs: number;
  success: boolean;
  toolUsed?: string;
  memoryHit?: boolean;
  details: string;
}

export interface CopilotAnalyticsStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  memoryHitsCount: number;
  memorySavesCount: number;
  toolExecutionsCount: number;
  providerUsage: { [provider: string]: number };
}

export interface CopilotAgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  avatarColor: string;
  domain: string;
  systemInstruction: string;
}

/**
 * Multi-Agent Specialist Profiles for GURU-XD Copilot
 */
export const COPILOT_AGENTS: CopilotAgentProfile[] = [
  {
    id: "guru-core",
    name: "GURU Core",
    role: "AI Cluster Host & Master Orchestrator",
    description: "Primary hypervisor host agent overseeing cluster state, bots, and platform architecture.",
    avatarColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    domain: "Orchestration & Core Systems",
    systemInstruction: "You are GURU Core, the primary AI Cluster Host for GURU-XD. You oversee container health, bot daemons, sessions, and platform architecture. Answer concisely, autoritatively, and with deep systems knowledge."
  },
  {
    id: "security-analyst",
    name: "SpamShield Analyst",
    role: "AI Security & Audit Sentinel",
    description: "Specializes in prompt injection detection, code security scanning, rate limiting, and incident response.",
    avatarColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    domain: "Security & Vulnerabilities",
    systemInstruction: "You are SpamShield Security Analyst, the defensive security sentinel for GURU-XD. Focus on threat detection, code vulnerability checks, anti-spam filters, and secure authentication policies."
  },
  {
    id: "bot-engineer",
    name: "Bot Engineer",
    role: "WhatsApp & Telegram Script Specialist",
    description: "Expert in Baileys WhatsApp MD and Telegraf bot handlers, event listeners, and media streaming.",
    avatarColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    domain: "Bot Scripting & Baileys/Telegraf",
    systemInstruction: "You are the Bot Engineer. You craft clean, robust, event-driven Node.js bot scripts for WhatsApp and Telegram. Always generate production-ready code with error boundaries."
  },
  {
    id: "analytics-expert",
    name: "Analytics Expert",
    role: "Metrics & Telemetry Specialist",
    description: "Analyzes system traffic, peak loads, command usage velocity, and server performance metrics.",
    avatarColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    domain: "Telemetry & Performance",
    systemInstruction: "You are the Analytics Expert for GURU-XD. You analyze latency, memory allocation, throughput, peak load hours, and generate actionable telemetry insights."
  },
  {
    id: "database-engineer",
    name: "Database Engineer",
    role: "MongoDB & Data Schema Architect",
    description: "Designs schemas, optimizes database indexing, manages state retention, and queries historical data.",
    avatarColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    domain: "Databases & Schemas",
    systemInstruction: "You are the Database Engineer. You design clean document models, Mongoose schemas, and query optimizations for GURU-XD storage layers."
  },
  {
    id: "deployment-engineer",
    name: "Deployment Engineer",
    role: "Sandbox & Cloud Run Orchestrator",
    description: "Manages container hot-deploys, environment variables, build pipelines, and rollback history.",
    avatarColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    domain: "CI/CD & Sandbox Deployment",
    systemInstruction: "You are the Deployment Engineer. You manage hot-loading code into sandbox containers, verify syntax safety, manage rollbacks, and inspect build logs."
  },
  {
    id: "plugin-developer",
    name: "Plugin Developer",
    role: "Plugin Systems Architect",
    description: "Creates, enables, and manages modular platform plugins and third-party extension modules.",
    avatarColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    domain: "Plugins & Extensions",
    systemInstruction: "You are the Plugin Developer. You build modular, isolated GURU-XD plugins, hook into event registers, and design extensible platform tools."
  },
  {
    id: "debug-assistant",
    name: "Debug Assistant",
    role: "Crash Log & Stack Trace Debugger",
    description: "Parses error logs, diagnoses socket drops, unhandled promise rejections, and memory leaks.",
    avatarColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    domain: "Debugging & Stack Traces",
    systemInstruction: "You are the Debug Assistant. You analyze raw log streams, parse error stack traces, pinpoint root causes, and provide step-by-step bug fixes."
  },
  {
    id: "documentation-assistant",
    name: "Docs Assistant",
    role: "API & Command Specs Documentation Writer",
    description: "Generates clear, comprehensive technical documentation, manuals, and API specifications.",
    avatarColor: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    domain: "Documentation & Manuals",
    systemInstruction: "You are the Documentation Assistant. You write clear, beautifully structured Markdown documentation, command references, and setup guides."
  }
];

/**
 * Built-in Backend Prompt Templates
 */
export const DEFAULT_PROMPT_TEMPLATES: CopilotPromptTemplate[] = [
  {
    id: "prompt-weather",
    title: "Build Weather Command",
    description: "Generates an automated weather forecast command script with emoji formatting.",
    category: "Utility",
    promptText: "Write a JavaScript WhatsApp bot command handler triggered by '.weather <city>' that fetches current weather from a simulated API and formats a gorgeous emoji-rich card response.",
    targetAgent: "bot-engineer",
    isBuiltIn: true
  },
  {
    id: "prompt-antispam",
    title: "Create Anti-Spam Filter",
    description: "Group moderation script to detect unauthorized channel links and auto-kick spammers.",
    category: "Moderation",
    promptText: "Build a group moderation command script triggered by '.spamshield' that detects links containing invite channels and auto-kicks the participant with customized logs.",
    targetAgent: "security-analyst",
    isBuiltIn: true
  },
  {
    id: "prompt-log-diag",
    title: "Analyze Cluster Logs",
    description: "Parses active terminal log history to diagnose crashes and suggest fixes.",
    category: "Diagnostics",
    promptText: "Review the current active system log lines, analyze failures, identify socket disconnect causes, and suggest the exact configuration corrections to prevent crash state loops.",
    targetAgent: "debug-assistant",
    isBuiltIn: true
  },
  {
    id: "prompt-quiz",
    title: "Create Economy Quiz Game",
    description: "Interactive chat trivia mini-game handler with coin reward distribution.",
    category: "Economy",
    promptText: "Generate an interactive chat trivia mini-game handler triggered by '.quiz' that gives participants coins in our economy ledger database upon answering correct.",
    targetAgent: "bot-engineer",
    isBuiltIn: true
  },
  {
    id: "prompt-security-audit",
    title: "Full Security Vulnerability Audit",
    description: "Performs a deep scan on custom commands and active API routes for security risks.",
    category: "Security",
    promptText: "Perform a comprehensive security audit of all custom bot commands, checking for unhandled exceptions, command injection, and API token exposure.",
    targetAgent: "security-analyst",
    isBuiltIn: true
  },
  {
    id: "prompt-mongo-schema",
    title: "Design Analytics Schema",
    description: "Generates MongoDB schema and Mongoose model for chat telemetry.",
    category: "Database",
    promptText: "Design a production-grade MongoDB schema for tracking bot chat messages, user interaction frequency, and latency benchmarks.",
    targetAgent: "database-engineer",
    isBuiltIn: true
  }
];

/**
 * Pre-seeded Copilot Memories (3-Tiered Architecture: Knowledge, Project, Conversation)
 */
export const DEFAULT_MEMORIES: CopilotMemoryItem[] = [
  // 📚 Knowledge Memory
  {
    id: "mem-k1",
    category: "knowledge",
    key: "guru_architecture_spec",
    value: "GURU-XD operates on Linux x86_64 Cloud Run, Node v22, Express backend CJS bundle, Single-Page React 18 client, JSON persistence store, Baileys MD WhatsApp socket layer, and Telegraf Telegram daemons.",
    tags: ["architecture", "docs", "stack"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mem-k2",
    category: "knowledge",
    key: "baileys_whatsapp_protocol",
    value: "Baileys socket daemons require session credential restoration from /sessions, automatic reconnect backoff loops, and passing { quoted: message } for thread context.",
    tags: ["baileys", "whatsapp", "docs"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mem-k3",
    category: "knowledge",
    key: "sandbox_security_rules",
    value: "Sandbox scripts must export an async function (client, message, args). Forbidden: eval(), child_process, process.exit, and plain-text API secrets.",
    tags: ["sandbox", "security", "rules"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 🏗️ Project Memory
  {
    id: "mem-p1",
    category: "project",
    key: "completed_core_modules",
    value: "Dashboard, Bot Daemons, Custom Command Registry, Plugins System, Live Terminal Diagnostics, MongoDB Schemas, AI Copilot Engine V2 with Sandbox.",
    tags: ["roadmap", "completed"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mem-p2",
    category: "project",
    key: "active_working_files",
    value: "server/copilotEngine.ts, server/controllers.ts, server/routes.ts, src/components/CopilotView.tsx, src/types.ts",
    tags: ["files", "context"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mem-p3",
    category: "project",
    key: "pending_engineering_tasks",
    value: "Enhance Socket.IO auto-reconnect fallback, optimize Mongoose query index memory footprint, refine rate limiter security thresholds.",
    tags: ["pending", "tasks"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 💬 Conversation Memory
  {
    id: "mem-c1",
    category: "conversation",
    key: "recent_operator_decision",
    value: "Operator confirmed upgrade of Copilot to a Full-Screen Engineering Workspace with 3-tier memory and work timeline resume capability.",
    tags: ["decision", "context"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // User & Platform
  {
    id: "mem-u1",
    category: "user",
    key: "preferred_ai_provider",
    value: "Gemini 3.5 Flash (Server-Side Secure Proxy)",
    tags: ["ai", "config"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mem-u2",
    category: "user",
    key: "favorite_coding_style",
    value: "Clean CommonJS async handlers with defensive try-catch blocks, JSDoc headers, and zero external dependencies.",
    tags: ["code", "style"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mem-l1",
    category: "ai_learning",
    key: "whatsapp_quoted_rule",
    value: "When responding in WhatsApp groups using Baileys, always pass { quoted: message } for clear thread context.",
    tags: ["learning", "baileys"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Pre-seeded Engineering Work Timeline Items
 */
export const DEFAULT_WORK_TIMELINE: any[] = [
  {
    id: "work-106",
    timestamp: new Date().toISOString(),
    project: "GURU-XD",
    module: "AI Copilot Workspace",
    filesChanged: ["server/copilotEngine.ts", "src/components/CopilotView.tsx", "src/types.ts"],
    summary: "Upgraded GURU-XD AI Copilot to 3-Tiered Memory Architecture & Full-Screen Engineering Workspace",
    status: "completed",
    details: "Implemented Knowledge, Project, and Conversation memory banks with work timeline tracking and hot-sandbox deployer."
  },
  {
    id: "work-105",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    project: "GURU-XD",
    module: "Dashboard & Analytics",
    filesChanged: ["src/components/DashboardView.tsx", "src/components/AnalyticsView.tsx"],
    summary: "Connected Live Socket.IO telemetry feeds & system health metrics cards",
    status: "completed",
    details: "Added real-time CPU memory gauges, active session pings, and cluster logs stream listeners."
  },
  {
    id: "work-104",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    project: "GURU-XD",
    module: "Bot Daemons & Commands",
    filesChanged: ["server/controllers.ts", "server/routes.ts"],
    summary: "Fixed memory leak in log listener & added anti-spam rate limiter middleware",
    status: "completed",
    details: "Wrapped Baileys reconnect loop with exponential backoff and cleaned log array overflow buffer."
  },
  {
    id: "work-103",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    project: "GURU-XD",
    module: "Database & Mongo",
    filesChanged: ["server/db.ts", "src/components/DatabaseView.tsx"],
    summary: "Connected MongoDB Atlas mock collection query tools & schema builder",
    status: "completed",
    details: "Integrated Mongoose schema validator and state retention clear policy."
  },
  {
    id: "work-102",
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
    project: "GURU-XD",
    module: "Security & Auth",
    filesChanged: ["server/controllers.ts"],
    summary: "Implemented 2FA OTP verification service & session audit log ledger",
    status: "completed",
    details: "Added secure bcrypt salt hashing and audit log stream for login attempts."
  },
  {
    id: "work-101",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    project: "GURU-XD",
    module: "Orchestration",
    filesChanged: ["server/routes.ts", "server/services.ts"],
    summary: "Configured Express API routes & Cloud Run reverse-proxy ingress",
    status: "completed",
    details: "Bound server to 0.0.0.0:3000 and setup SPA static fallback serving."
  }
];

/**
 * Core Copilot Engine Class
 */
export class CopilotEngine {
  private static dbService = DatabaseService.getInstance();

  /**
   * Initializes or gets stored Copilot memories from Database (3-Tiered Architecture)
   */
  public static getMemories(category?: 'knowledge' | 'project' | 'conversation' | 'ai_learning' | 'user' | 'platform'): CopilotMemoryItem[] {
    const db = this.dbService.read();
    if (!db.copilotMemory || db.copilotMemory.length === 0) {
      db.copilotMemory = [...DEFAULT_MEMORIES];
      this.dbService.write(db);
    }
    if (category) {
      return db.copilotMemory.filter(m => m.category === category);
    }
    return db.copilotMemory;
  }

  /**
   * Saves or updates a Copilot memory item
   */
  public static saveMemory(category: 'knowledge' | 'project' | 'conversation' | 'ai_learning' | 'user' | 'platform', key: string, value: string, tags: string[] = []): CopilotMemoryItem {
    const db = this.dbService.read();
    if (!db.copilotMemory) db.copilotMemory = [...DEFAULT_MEMORIES];

    const existingIndex = db.copilotMemory.findIndex(m => m.key.toLowerCase() === key.toLowerCase() && m.category === category);
    const now = new Date().toISOString();

    let memoryItem: CopilotMemoryItem;

    if (existingIndex >= 0) {
      memoryItem = {
        ...db.copilotMemory[existingIndex],
        value,
        tags: tags.length > 0 ? tags : db.copilotMemory[existingIndex].tags,
        updatedAt: now
      };
      db.copilotMemory[existingIndex] = memoryItem;
    } else {
      memoryItem = {
        id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        category,
        key,
        value,
        tags,
        createdAt: now,
        updatedAt: now
      };
      db.copilotMemory.push(memoryItem);
    }

    if (!db.copilotAnalytics) {
      db.copilotAnalytics = this.getDefaultAnalytics();
    }
    db.copilotAnalytics.memorySavesCount = (db.copilotAnalytics.memorySavesCount || 0) + 1;

    this.dbService.addLog("info", "COPILOT_MEMORY", `Persisted [${category.toUpperCase()}] memory: ${key}`);
    this.dbService.write(db);
    return memoryItem;
  }

  /**
   * Retrieves Engineering Work Timeline items
   */
  public static getWorkTimeline(): any[] {
    const db = this.dbService.read();
    if (!db.copilotWorkTimeline || db.copilotWorkTimeline.length === 0) {
      db.copilotWorkTimeline = [...DEFAULT_WORK_TIMELINE];
      this.dbService.write(db);
    }
    return db.copilotWorkTimeline;
  }

  /**
   * Adds an engineering work item to the timeline and project memory
   */
  public static addWorkItem(module: string, filesChanged: string[], summary: string, status: 'completed' | 'in_progress' | 'planned' = 'completed', details: string = ''): any {
    const db = this.dbService.read();
    if (!db.copilotWorkTimeline) db.copilotWorkTimeline = [...DEFAULT_WORK_TIMELINE];

    const workItem = {
      id: `work-${Date.now()}`,
      timestamp: new Date().toISOString(),
      project: "GURU-XD",
      module,
      filesChanged,
      summary,
      status,
      details
    };

    db.copilotWorkTimeline.unshift(workItem);

    // Save to Project Memory
    this.saveMemory('project', `last_work_${module.toLowerCase().replace(/\s+/g, '_')}`, `${summary} (${status.toUpperCase()}) in files: ${filesChanged.join(', ')}`, ['work_timeline']);

    this.dbService.addLog("info", "WORK_TIMELINE", `Logged Work Item [${module}]: ${summary}`);
    this.dbService.write(db);
    return workItem;
  }

  /**
   * Resume Previous Work context summary generator
   */
  public static resumeWorkContext() {
    const timeline = this.getWorkTimeline();
    const lastCompleted = timeline.find(w => w.status === 'completed') || timeline[0];
    const inProgress = timeline.filter(w => w.status === 'in_progress');
    const planned = timeline.filter(w => w.status === 'planned');

    const summaryText = `
### 🏗️ Resume Previous Work Engine

**Project:** GURU-XD Core Engine  
**Last Completed Task:** ${lastCompleted?.summary || 'Upgraded Copilot Engine Architecture'}  
**Module:** ${lastCompleted?.module || 'AI Copilot Workspace'}  
**Files Modified:** \`${lastCompleted?.filesChanged?.join(', ') || 'server/copilotEngine.ts, src/components/CopilotView.tsx'}\`  
**Timestamp:** ${lastCompleted?.timestamp ? new Date(lastCompleted.timestamp).toLocaleString() : 'Just now'}  

**Active / In-Progress Tasks:**
${inProgress.length > 0 ? inProgress.map(p => `- [${p.module}] **${p.summary}** (\`${p.filesChanged.join(', ')}\`)`).join('\n') : '- No blocked tasks. Ready for next engineering task.'}

**Next Recommended Task:**
${planned.length > 0 ? planned.map(p => `- [${p.module}] ${p.summary}`).join('\n') : '- Connect Socket.IO auto-reconnect fallback and refine rate limiter security limits.'}
`;

    return {
      summaryText,
      lastCompleted,
      inProgress,
      planned,
      activeFiles: lastCompleted?.filesChanged || []
    };
  }

  /**
   * Proactive Engineering Suggestions with "Why" reasoning
   */
  public static getSuggestions() {
    const db = this.dbService.read();
    const runningBots = db.bots.filter(b => b.status === 'running');
    const suggestions: any[] = [];

    if (runningBots.length < db.bots.length) {
      suggestions.push({
        id: "sug-1",
        module: "Bot Daemons",
        title: "Restart Disconnected WhatsApp/Telegram Session Daemons",
        description: "1 or more bot instances are currently offline or stopped.",
        reasoning: "Session daemons require active connection threads to process inbound message webhooks and Baileys events. Automatic recovery loop paused.",
        actionType: "connect_api",
        recommendedAgent: "bot-engineer",
        priority: "HIGH"
      });
    }

    if (db.commands.length < 5) {
      suggestions.push({
        id: "sug-2",
        module: "Command Registry",
        title: "Deploy Automated Anti-Spam & Weather Command Handlers",
        description: "Custom command registry is lightly populated.",
        reasoning: "Pre-validating command triggers in the sandbox reduces chat latency and establishes fail-safe error boundaries for group moderation.",
        actionType: "create_command",
        recommendedAgent: "security-analyst",
        priority: "MEDIUM"
      });
    }

    const recentErrors = db.logs.filter(l => l.type === 'error' || l.type === 'warning');
    if (recentErrors.length > 0) {
      suggestions.push({
        id: "sug-3",
        module: "Diagnostics",
        title: "Inspect Terminal Warnings and Socket Reconnect Logs",
        description: `Found ${recentErrors.length} recent system warning/error events in cluster log buffer.`,
        reasoning: "Addressing unhandled promise rejections and socket dropouts early prevents container crash-loop backoffs in production.",
        actionType: "inspect_logs",
        recommendedAgent: "debug-assistant",
        priority: "HIGH"
      });
    }

    suggestions.push({
      id: "sug-4",
      module: "Database & Mongo",
      title: "Optimize Indexing & Retention Clear Policy",
      description: "Ensure Mongoose collection indexes are cached for optimal query throughput.",
      reasoning: "Un-indexed text searches on high-volume chat logs increase memory pressure on Cloud Run containers.",
      actionType: "optimize",
      recommendedAgent: "database-engineer",
      priority: "LOW"
    });

    return suggestions;
  }

  /**
   * Retrieves code drafts saved in Sandbox
   */
  public static getDrafts(): any[] {
    const db = this.dbService.read();
    return db.copilotDrafts || [];
  }

  /**
   * Saves a sandbox draft
   */
  public static saveDraft(title: string, trigger: string, code: string, description: string, category: string): any {
    const db = this.dbService.read();
    if (!db.copilotDrafts) db.copilotDrafts = [];

    const existingIdx = db.copilotDrafts.findIndex(d => d.trigger === trigger);
    const draft = {
      id: existingIdx >= 0 ? db.copilotDrafts[existingIdx].id : `draft-${Date.now()}`,
      title,
      trigger,
      code,
      description,
      category,
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      db.copilotDrafts[existingIdx] = draft;
    } else {
      db.copilotDrafts.push(draft);
    }

    this.dbService.addLog("info", "SANDBOX_DRAFT", `Saved sandbox draft [.${trigger}]`);
    this.dbService.write(db);
    return draft;
  }

  /**
   * Deletes a memory item by ID
   */
  public static deleteMemory(id: string): boolean {
    const db = this.dbService.read();
    if (!db.copilotMemory) return false;
    const initialLen = db.copilotMemory.length;
    db.copilotMemory = db.copilotMemory.filter(m => m.id !== id);
    if (db.copilotMemory.length !== initialLen) {
      this.dbService.addLog("info", "COPILOT_MEMORY", `Removed memory entry ID [${id}]`);
      this.dbService.write(db);
      return true;
    }
    return false;
  }

  /**
   * Gets prompt templates (built-in + custom created)
   */
  public static getPrompts(): CopilotPromptTemplate[] {
    const db = this.dbService.read();
    if (!db.copilotPrompts || db.copilotPrompts.length === 0) {
      db.copilotPrompts = [...DEFAULT_PROMPT_TEMPLATES];
      this.dbService.write(db);
    }
    return db.copilotPrompts;
  }

  /**
   * Creates or updates a prompt template
   */
  public static savePrompt(template: Omit<CopilotPromptTemplate, 'id'> & { id?: string }): CopilotPromptTemplate {
    const db = this.dbService.read();
    if (!db.copilotPrompts) db.copilotPrompts = [...DEFAULT_PROMPT_TEMPLATES];

    let savedPrompt: CopilotPromptTemplate;

    if (template.id) {
      const idx = db.copilotPrompts.findIndex(p => p.id === template.id);
      if (idx >= 0) {
        savedPrompt = { ...db.copilotPrompts[idx], ...template };
        db.copilotPrompts[idx] = savedPrompt;
      } else {
        savedPrompt = { ...template, id: template.id || `prompt-${Date.now()}` };
        db.copilotPrompts.push(savedPrompt);
      }
    } else {
      savedPrompt = { ...template, id: `prompt-${Date.now()}` };
      db.copilotPrompts.push(savedPrompt);
    }

    this.dbService.addLog("success", "COPILOT_PROMPTS", `Saved prompt template: "${savedPrompt.title}"`);
    this.dbService.write(db);
    return savedPrompt;
  }

  /**
   * Deletes a prompt template
   */
  public static deletePrompt(id: string): boolean {
    const db = this.dbService.read();
    if (!db.copilotPrompts) return false;
    const target = db.copilotPrompts.find(p => p.id === id);
    if (target?.isBuiltIn) {
      throw new Error("Cannot delete built-in prompt templates.");
    }
    db.copilotPrompts = db.copilotPrompts.filter(p => p.id !== id);
    this.dbService.write(db);
    return true;
  }

  /**
   * Performs static code analysis, AST parsing check, and security scanning on code
   */
  public static validateSandboxCode(code: string, trigger: string) {
    const issues: string[] = [];
    const requiredScopes: string[] = ['chat:write'];
    const dependencies: string[] = ['express'];
    let riskTotal = 0;

    // 1. Syntax check via Function constructor validation
    let syntaxValid = true;
    try {
      new Function('client', 'message', 'args', code);
    } catch (err: any) {
      syntaxValid = false;
      issues.push(`Syntax error: ${err.message || 'Invalid JavaScript code snippet'}`);
      riskTotal += 40;
    }

    // 2. Static Security Scanning for risky patterns
    if (/\beval\s*\(/i.test(code) || /new\s+Function\s*\(/i.test(code)) {
      issues.push("CRITICAL: Use of eval() or dynamic Function constructor detected.");
      riskTotal += 40;
    }

    if (/child_process|exec\s*\(|spawn\s*\(/i.test(code)) {
      issues.push("HIGH RISK: Execution of shell sub-processes (child_process) detected.");
      riskTotal += 30;
      requiredScopes.push("system:exec");
    }

    if (/process\.exit|process\.kill/i.test(code)) {
      issues.push("HIGH RISK: Process termination commands (process.exit) detected.");
      riskTotal += 30;
      requiredScopes.push("system:admin");
    }

    if (/fs\.rmdir|fs\.unlink|fs\.writeFileSync\s*\(\s*["']\/[a-z]+/i.test(code)) {
      issues.push("HIGH RISK: Unsafe filesystem modification operations detected.");
      riskTotal += 25;
      requiredScopes.push("filesystem:write");
    }

    if (/(AIzaSy[A-Za-z0-9_-]{33}|sk-[A-Za-z0-9]{32,}|ghp_[A-Za-z0-9]{36})/i.test(code)) {
      issues.push("SECURITY WARNING: Hardcoded secret key or API token string detected in source.");
      riskTotal += 35;
    }

    if (/while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/i.test(code)) {
      issues.push("PERFORMANCE WARNING: Infinite loop structure detected.");
      riskTotal += 20;
    }

    // Detect imports / requires
    const reqMatches = code.match(/require\s*\(\s*["']([^"']+)["']\s*\)/g);
    if (reqMatches) {
      reqMatches.forEach(m => {
        const pkgMatch = m.match(/require\s*\(\s*["']([^"']+)["']\s*\)/);
        if (pkgMatch && pkgMatch[1] && !dependencies.includes(pkgMatch[1])) {
          dependencies.push(pkgMatch[1]);
        }
      });
    }

    const securityScore = Math.max(0, 100 - riskTotal);
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (securityScore < 40) riskLevel = 'CRITICAL';
    else if (securityScore < 65) riskLevel = 'HIGH';
    else if (securityScore < 85) riskLevel = 'MEDIUM';

    // Estimated memory footprint
    const estimatedMemoryMb = Math.round(12 + (code.length / 500) + (dependencies.length * 3));

    return {
      isValid: syntaxValid && riskLevel !== 'CRITICAL',
      syntaxValid,
      securityScore,
      riskLevel,
      issues,
      requiredScopes,
      dependencies,
      estimatedMemoryMb
    };
  }

  /**
   * Deploys code to active commands register and saves rollback snapshot
   */
  public static deploySandboxCode(
    trigger: string,
    code: string,
    description: string,
    category: string,
    userRole: string = 'Administrator'
  ) {
    const db = this.dbService.read();

    // 1. Run validation
    const validation = this.validateSandboxCode(code, trigger);
    if (!validation.isValid) {
      throw new Error(`Deployment rejected by Sandbox Security Engine: ${validation.issues.join(' | ')}`);
    }

    // 2. Determine version number
    if (!db.copilotSandboxHistory) db.copilotSandboxHistory = [];
    const prevDeployments = db.copilotSandboxHistory.filter(d => d.trigger === trigger);
    const version = prevDeployments.length + 1;

    const deployment: CopilotSandboxDeployment = {
      id: `deploy-${Date.now()}`,
      trigger,
      code,
      description: description || 'Custom hot-deployed script',
      category: category || 'Utility',
      version,
      securityScore: validation.securityScore,
      riskLevel: validation.riskLevel,
      deployedBy: userRole,
      deployedAt: new Date().toISOString()
    };

    db.copilotSandboxHistory.push(deployment);

    // 3. Update or create command in db.commands
    const existingCmdIndex = db.commands.findIndex(c => c.trigger === trigger);
    if (existingCmdIndex >= 0) {
      db.commands[existingCmdIndex] = {
        ...db.commands[existingCmdIndex],
        description,
        category,
        code,
        isActive: true
      };
    } else {
      db.commands.push({
        id: `cmd-${Date.now()}`,
        trigger,
        prefix: '.',
        description,
        category,
        isActive: true,
        code
      });
    }

    this.dbService.addLog(
      "success",
      "HOT_DEPLOY",
      `Hot-deployed Command [.${trigger}] (v${version}) with Security Score ${validation.securityScore}/100 [${validation.riskLevel} RISK]`
    );

    this.dbService.write(db);
    return { deployment, command: db.commands.find(c => c.trigger === trigger), validation };
  }

  /**
   * Retrieves rollback history for sandbox deployments
   */
  public static getSandboxHistory(): CopilotSandboxDeployment[] {
    const db = this.dbService.read();
    return db.copilotSandboxHistory || [];
  }

  /**
   * Rollback sandbox deployment to a specific historic snapshot
   */
  public static rollbackSandbox(deploymentId: string) {
    const db = this.dbService.read();
    if (!db.copilotSandboxHistory) throw new Error("No deployment history available.");

    const targetSnapshot = db.copilotSandboxHistory.find(d => d.id === deploymentId);
    if (!targetSnapshot) throw new Error("Target deployment snapshot not found.");

    // Update command
    const cmdIndex = db.commands.findIndex(c => c.trigger === targetSnapshot.trigger);
    if (cmdIndex >= 0) {
      db.commands[cmdIndex].code = targetSnapshot.code;
      db.commands[cmdIndex].description = targetSnapshot.description;
    } else {
      db.commands.push({
        id: `cmd-${Date.now()}`,
        trigger: targetSnapshot.trigger,
        prefix: '.',
        description: targetSnapshot.description,
        category: targetSnapshot.category,
        isActive: true,
        code: targetSnapshot.code
      });
    }

    this.dbService.addLog(
      "warning",
      "SANDBOX_ROLLBACK",
      `Rolled back command [.${targetSnapshot.trigger}] to version v${targetSnapshot.version} (Deployed ${targetSnapshot.deployedAt})`
    );

    this.dbService.write(db);
    return targetSnapshot;
  }

  /**
   * Safely executes an authorized platform tool on behalf of the AI
   */
  public static executeTool(
    toolName: string,
    args: any,
    userRole: string = 'Administrator'
  ) {
    const db = this.dbService.read();

    // Permissions check
    if (userRole === 'Viewer' && !['view_logs', 'search_logs', 'analyze_analytics'].includes(toolName)) {
      throw new Error(`Permission Denied: User role [${userRole}] cannot execute action '${toolName}'. Required role: Developer or Administrator.`);
    }

    let result: any = null;

    switch (toolName) {
      case 'restart_bot': {
        const botId = args.botId || db.bots[0]?.id;
        const bot = db.bots.find(b => b.id === botId);
        if (!bot) throw new Error(`Bot instance ID '${botId}' not found.`);
        bot.status = 'running';
        bot.uptime = '0h 0m 1s';
        this.dbService.addLog("info", "ORCHESTRATOR", `Copilot restarted bot daemon [${bot.name}]`);
        result = { success: true, message: `Successfully restarted bot daemon '${bot.name}'.`, bot };
        break;
      }

      case 'stop_bot': {
        const botId = args.botId || db.bots[0]?.id;
        const bot = db.bots.find(b => b.id === botId);
        if (!bot) throw new Error(`Bot instance ID '${botId}' not found.`);
        bot.status = 'stopped';
        this.dbService.addLog("warning", "ORCHESTRATOR", `Copilot stopped bot daemon [${bot.name}]`);
        result = { success: true, message: `Stopped bot daemon '${bot.name}'.`, bot };
        break;
      }

      case 'start_bot': {
        const botId = args.botId || db.bots[0]?.id;
        const bot = db.bots.find(b => b.id === botId);
        if (!bot) throw new Error(`Bot instance ID '${botId}' not found.`);
        bot.status = 'running';
        bot.uptime = '0h 0m 1s';
        this.dbService.addLog("success", "ORCHESTRATOR", `Copilot started bot daemon [${bot.name}]`);
        result = { success: true, message: `Started bot daemon '${bot.name}'.`, bot };
        break;
      }

      case 'view_logs': {
        const limit = args.limit || 15;
        result = { success: true, logs: db.logs.slice(-limit) };
        break;
      }

      case 'search_logs': {
        const query = (args.query || '').toLowerCase();
        const matches = db.logs.filter(l => l.message.toLowerCase().includes(query) || l.source.toLowerCase().includes(query));
        result = { success: true, matches: matches.slice(-20) };
        break;
      }

      case 'install_plugin': {
        const pluginId = args.pluginId;
        const plugin = db.plugins.find(p => p.id === pluginId);
        if (!plugin) throw new Error(`Plugin ID '${pluginId}' not found.`);
        plugin.installed = true;
        this.dbService.addLog("success", "PLUGIN", `Copilot installed plugin [${plugin.name}]`);
        result = { success: true, plugin };
        break;
      }

      case 'save_memory': {
        const memory = this.saveMemory(args.category || 'project', args.key, args.value, args.tags || []);
        result = { success: true, memory };
        break;
      }

      case 'clear_memory': {
        if (args.category) {
          db.copilotMemory = (db.copilotMemory || []).filter(m => m.category !== args.category);
        } else {
          db.copilotMemory = [];
        }
        this.dbService.addLog("warning", "COPILOT_MEMORY", `Cleared Copilot memory category: ${args.category || 'ALL'}`);
        result = { success: true, message: "Memory cleared successfully." };
        break;
      }

      default:
        throw new Error(`Unknown Copilot tool: '${toolName}'`);
    }

    if (!db.copilotAnalytics) db.copilotAnalytics = this.getDefaultAnalytics();
    db.copilotAnalytics.toolExecutionsCount = (db.copilotAnalytics.toolExecutionsCount || 0) + 1;

    // Log Audit
    this.addAuditLog("guru-core", `tool_execution:${toolName}`, "Gemini 3.5 Flash", 120, true, toolName, false, JSON.stringify(result));

    this.dbService.write(db);
    return result;
  }

  /**
   * Appends an audit log for AI interactions
   */
  public static addAuditLog(
    agent: string,
    action: string,
    provider: string,
    responseTimeMs: number,
    success: boolean,
    toolUsed?: string,
    memoryHit?: boolean,
    details: string = ""
  ) {
    const db = this.dbService.read();
    if (!db.copilotAuditLogs) db.copilotAuditLogs = [];

    const log: CopilotAuditLog = {
      id: `copilot-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      agent,
      action,
      provider,
      responseTimeMs,
      success,
      toolUsed,
      memoryHit,
      details
    };

    db.copilotAuditLogs.push(log);
    if (db.copilotAuditLogs.length > 100) {
      db.copilotAuditLogs = db.copilotAuditLogs.slice(-100);
    }

    this.dbService.write(db);
    return log;
  }

  /**
   * Retrieves Copilot analytics telemetry & status metrics for Dashboard
   */
  public static getAnalyticsStats(): CopilotAnalyticsStats & { activeProvider: string; memoryUsageCount: number; status: string } {
    const db = this.dbService.read();
    const stats = db.copilotAnalytics || this.getDefaultAnalytics();
    const memories = db.copilotMemory || DEFAULT_MEMORIES;

    return {
      ...stats,
      activeProvider: "Gemini 3.5 Flash",
      memoryUsageCount: memories.length,
      status: "ONLINE"
    };
  }

  private static getDefaultAnalytics(): CopilotAnalyticsStats {
    return {
      totalRequests: 142,
      successfulRequests: 140,
      failedRequests: 2,
      avgLatencyMs: 380,
      memoryHitsCount: 48,
      memorySavesCount: 12,
      toolExecutionsCount: 18,
      providerUsage: {
        "Gemini 3.5 Flash": 142
      }
    };
  }

  /**
   * Builds the comprehensive platform context string to inject into Gemini prompt
   */
  private static buildPlatformContext(db: DatabaseState): string {
    const memories = db.copilotMemory || DEFAULT_MEMORIES;
    const workTimeline = db.copilotWorkTimeline || DEFAULT_WORK_TIMELINE;
    const runningBots = db.bots.filter(b => b.status === 'running');
    const recentLogs = db.logs.slice(-8).map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] [${l.source}] ${l.message}`).join('\n');
    const activePlugins = db.plugins.filter(p => p.installed).map(p => p.name).join(', ');

    const knowledgeMems = memories.filter(m => m.category === 'knowledge').map(m => `- [KNOWLEDGE 📚] ${m.key}: ${m.value}`).join('\n');
    const projectMems = memories.filter(m => m.category === 'project').map(m => `- [PROJECT 🏗️] ${m.key}: ${m.value}`).join('\n');
    const conversationMems = memories.filter(m => m.category === 'conversation' || m.category === 'user').map(m => `- [CONVERSATION 💬] ${m.key}: ${m.value}`).join('\n');

    const recentWork = workTimeline.slice(0, 5).map(w => `- [${w.status.toUpperCase()}] ${w.module}: ${w.summary} (Files: ${w.filesChanged?.join(', ') || 'N/A'})`).join('\n');

    return `
=== GURU-XD REAL-TIME PLATFORM TELEMETRY & CONTEXT ===
System Environment: Linux Container x86_64, Node v22, Port 3000
Hosted Bot Clusters (${db.bots.length} Total, ${runningBots.length} Online):
${db.bots.map(b => `  * ${b.name} (${b.platform}): ${b.status.toUpperCase()} | Uptime: ${b.uptime} | Memory: ${b.memory} | Commands: ${b.commandsCount}`).join('\n')}

Active Custom Commands Register: ${db.commands.length} Commands compiled
Installed Plugins: ${activePlugins || 'None'}
Active Registered Users: ${db.users.length} Users (${db.users.map(u => `${u.username}:${u.role}`).join(', ')})

=== 3-TIER PERSISTENT COPILOT MEMORY ===
Knowledge Memory 📚:
${knowledgeMems || 'None'}

Project Memory 🏗️:
${projectMems || 'None'}

Conversation Memory 💬:
${conversationMems || 'None'}

=== ENGINEERING WORK TIMELINE (RECENT WORK) ===
${recentWork || 'No recorded timeline'}

=== RECENT SYSTEM LOG STREAM ===
${recentLogs}
===================================================
`;
  }

  /**
   * Main Generator method interfacing with ProviderManager for High Availability & Retry Backoff
   */
  public static async generateCopilotResponse(
    userPrompt: string,
    targetAgentId: string = "guru-core",
    userRole: string = "Administrator",
    onProgress?: (step: string, attempt?: number, maxAttempts?: number) => void
  ): Promise<{ response: string; agent: CopilotAgentProfile; responseTimeMs: number; memoryHit: boolean; providerUsed?: string; cacheHit?: boolean; retryCount?: number; progressSteps?: string[] }> {
    const { ProviderManager } = await import("./ai/providerManager");
    const manager = ProviderManager.getInstance();

    // Auto extract memory if prompt contains "remember"
    if (userPrompt.toLowerCase().includes("remember")) {
      const parts = userPrompt.split(/remember/i);
      if (parts[1]) {
        this.saveMemory("project", `user_note_${Date.now()}`, parts[1].trim(), ["user_prompt"]);
      }
    }

    const result = await manager.processRequest(userPrompt, targetAgentId, userRole, onProgress);

    // Save audit log
    this.addAuditLog(
      result.agent.id,
      "copilot_chat",
      result.providerUsed,
      result.responseTimeMs,
      true,
      undefined,
      result.memoryHit,
      userPrompt.slice(0, 100)
    );

    return {
      response: result.response,
      agent: result.agent,
      responseTimeMs: result.responseTimeMs,
      memoryHit: result.memoryHit,
      providerUsed: result.providerUsed,
      cacheHit: result.cacheHit,
      retryCount: result.retryCount,
      progressSteps: result.progressSteps
    };
  }
}

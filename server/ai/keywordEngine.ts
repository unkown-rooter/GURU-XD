import { DatabaseService } from "../db";

export type KeywordCategory =
  | 'GREETING'
  | 'PROJECT'
  | 'DEVELOPMENT'
  | 'HELP'
  | 'MEMORY'
  | 'EMERGENCY'
  | 'ACTION'
  | 'FOUNDER'
  | 'GENERAL';

export interface DetectedKeywordMatch {
  category: KeywordCategory;
  keyword: string;
}

export interface KeywordDetectionResult {
  primaryIntent: KeywordCategory;
  matchedCategories: KeywordCategory[];
  matches: DetectedKeywordMatch[];
  normalizedText: string;
  confidence: number;
}

export interface LearnedPattern {
  phrase: string;
  category: KeywordCategory | 'USER_STYLE';
  frequencyCount: number;
  lastSeen: string;
  confidenceScore: number;
}

export interface LearnedPersonalityData {
  favoriteGreetings: LearnedPattern[];
  frequentlyDiscussedProjects: LearnedPattern[];
  commonTechnicalTerms: LearnedPattern[];
  frequentlyUsedCommands: LearnedPattern[];
  preferredResponseStyle: string;
}

/**
 * GURU-XD Keyword Recognition & Intent Classification Engine
 * Normalizes text, classifies intent categories dynamically, tracks user style patterns,
 * and builds contextual memory blocks for seamless conversational continuity.
 */
export class KeywordEngine {
  private static instance: KeywordEngine;
  private dbService = DatabaseService.getInstance();

  private keywordDictionary: Record<KeywordCategory, string[]> = {
    GREETING: [
      "buddy", "hey buddy", "hello buddy", "morning buddy", "good morning",
      "good afternoon", "good evening", "welcome back", "yo buddy", "hi buddy",
      "hey", "hello", "hi", "yo", "greetings"
    ],
    PROJECT: [
      "guru-xd", "guru", "hosting", "dashboard", "plugin", "module", "backend",
      "frontend", "bot", "ai", "database", "deployment", "analytics", "security",
      "network", "memory", "platform", "cluster"
    ],
    DEVELOPMENT: [
      "build", "create", "improve", "upgrade", "optimize", "audit", "review",
      "debug", "fix", "deploy", "scale", "architecture", "design", "engineer",
      "refactor", "implement", "coding"
    ],
    HELP: [
      "help", "teach", "explain", "guide", "example", "show", "why", "how",
      "tutorial", "manual"
    ],
    MEMORY: [
      "remember", "recall", "continue", "again", "previous", "history",
      "last time", "saved", "context", "recent"
    ],
    EMERGENCY: [
      "crash", "offline", "bug", "error", "failed", "cannot connect",
      "timeout", "broken", "not working", "down", "critical", "incident"
    ],
    ACTION: [
      "restart", "stop", "start", "delete", "backup", "restore", "rollback",
      "update", "upgrade", "analyze", "scan", "run", "clear"
    ],
    FOUNDER: [
      "unknownrooter", "founder", "g7 community", "g7", "vision", "roadmap"
    ],
    GENERAL: []
  };

  private constructor() {}

  public static getInstance(): KeywordEngine {
    if (!KeywordEngine.instance) {
      KeywordEngine.instance = new KeywordEngine();
    }
    return KeywordEngine.instance;
  }

  /**
   * Text normalization pipeline: converts to lowercase, strips punctuation, normalizes spaces
   */
  public normalizeText(text: string): string {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Analyzes prompt text and classifies keywords into intent categories
   */
  public detectKeywords(userPrompt: string): KeywordDetectionResult {
    const normalizedText = this.normalizeText(userPrompt);
    const matches: DetectedKeywordMatch[] = [];
    const categoryHits: Record<KeywordCategory, number> = {
      GREETING: 0,
      PROJECT: 0,
      DEVELOPMENT: 0,
      HELP: 0,
      MEMORY: 0,
      EMERGENCY: 0,
      ACTION: 0,
      FOUNDER: 0,
      GENERAL: 0
    };

    const words = normalizedText.split(" ");

    for (const [category, keywords] of Object.entries(this.keywordDictionary) as [KeywordCategory, string[]][]) {
      if (category === 'GENERAL') continue;

      for (const kw of keywords) {
        if (kw.includes(" ")) {
          // Multi-word phrase check
          if (normalizedText.includes(kw)) {
            matches.push({ category, keyword: kw });
            categoryHits[category] += 2; // Multi-word matches carry higher weight
          }
        } else {
          // Single word check
          if (words.includes(kw)) {
            matches.push({ category, keyword: kw });
            categoryHits[category] += 1;
          }
        }
      }
    }

    // Determine primary intent
    let primaryIntent: KeywordCategory = 'GENERAL';
    let maxScore = 0;

    // Prioritize EMERGENCY, FOUNDER, GREETING if tied
    const priorityOrder: KeywordCategory[] = ['EMERGENCY', 'FOUNDER', 'GREETING', 'DEVELOPMENT', 'ACTION', 'PROJECT', 'HELP', 'MEMORY'];

    for (const cat of priorityOrder) {
      if (categoryHits[cat] > maxScore) {
        maxScore = categoryHits[cat];
        primaryIntent = cat;
      }
    }

    const matchedCategories = Object.keys(categoryHits).filter(cat => categoryHits[cat as KeywordCategory] > 0) as KeywordCategory[];
    const confidence = Math.min(1.0, 0.5 + (maxScore * 0.15));

    // Record learned patterns automatically
    this.recordLearnedPatterns(userPrompt, primaryIntent, matches);

    return {
      primaryIntent,
      matchedCategories,
      matches,
      normalizedText,
      confidence
    };
  }

  /**
   * Learning Engine: learns user phrases, greetings, commands, and style preferences continuously
   */
  public recordLearnedPatterns(userPrompt: string, intent: KeywordCategory, matches: DetectedKeywordMatch[]) {
    try {
      const db = this.dbService.read();
      if (!db.copilotMemory) db.copilotMemory = [];

      const normalized = this.normalizeText(userPrompt);
      const learnedMemKey = "learned_user_personality";

      let personalityRecord = db.copilotMemory.find((m: any) => m.key === learnedMemKey);
      let data: LearnedPersonalityData = personalityRecord ? personalityRecord.content : {
        favoriteGreetings: [],
        frequentlyDiscussedProjects: [],
        commonTechnicalTerms: [],
        frequentlyUsedCommands: [],
        preferredResponseStyle: "Concise, structured, and engineering-focused"
      };

      // Process matched greetings
      if (intent === 'GREETING' || matches.some(m => m.category === 'GREETING')) {
        const greetingMatch = matches.find(m => m.category === 'GREETING')?.keyword || normalized.split(" ").slice(0, 3).join(" ");
        this.updatePatternList(data.favoriteGreetings, greetingMatch, 'GREETING');
      }

      // Process project mentions
      const projectMatches = matches.filter(m => m.category === 'PROJECT').map(m => m.keyword);
      for (const proj of projectMatches) {
        this.updatePatternList(data.frequentlyDiscussedProjects, proj, 'PROJECT');
      }

      // Process development terms
      const devMatches = matches.filter(m => m.category === 'DEVELOPMENT' || m.category === 'ACTION').map(m => m.keyword);
      for (const term of devMatches) {
        this.updatePatternList(data.commonTechnicalTerms, term, 'DEVELOPMENT');
      }

      if (personalityRecord) {
        personalityRecord.content = data;
        personalityRecord.updatedAt = new Date().toISOString();
      } else {
        db.copilotMemory.push({
          id: `mem-personality-${Date.now()}`,
          key: learnedMemKey,
          content: data,
          createdAt: new Date().toISOString()
        });
      }

      this.dbService.write(db);
    } catch (err) {
      // Non-blocking learning engine failure protection
    }
  }

  private updatePatternList(list: LearnedPattern[], phrase: string, category: KeywordCategory) {
    if (!phrase || phrase.trim().length === 0) return;
    const existing = list.find(item => item.phrase.toLowerCase() === phrase.toLowerCase());
    if (existing) {
      existing.frequencyCount += 1;
      existing.lastSeen = new Date().toISOString();
      existing.confidenceScore = Math.min(1.0, 0.5 + (existing.frequencyCount * 0.1));
    } else {
      list.push({
        phrase,
        category,
        frequencyCount: 1,
        lastSeen: new Date().toISOString(),
        confidenceScore: 0.5
      });
    }

    // Keep list sorted by frequency
    list.sort((a, b) => b.frequencyCount - a.frequencyCount);
  }

  /**
   * Retrieves learned personality data
   */
  public getLearnedPersonality(): LearnedPersonalityData {
    const db = this.dbService.read();
    const mem = (db.copilotMemory || []).find((m: any) => m.key === "learned_user_personality");
    if (mem && mem.content) {
      return mem.content;
    }
    return {
      favoriteGreetings: [{ phrase: "Buddy", category: 'GREETING', frequencyCount: 5, lastSeen: new Date().toISOString(), confidenceScore: 0.8 }],
      frequentlyDiscussedProjects: [
        { phrase: "GURU-XD AI", category: 'PROJECT', frequencyCount: 12, lastSeen: new Date().toISOString(), confidenceScore: 0.95 },
        { phrase: "Hosting Platform", category: 'PROJECT', frequencyCount: 9, lastSeen: new Date().toISOString(), confidenceScore: 0.9 },
        { phrase: "Core AI Improvements", category: 'PROJECT', frequencyCount: 7, lastSeen: new Date().toISOString(), confidenceScore: 0.85 }
      ],
      commonTechnicalTerms: [{ phrase: "architecture", category: 'DEVELOPMENT', frequencyCount: 8, lastSeen: new Date().toISOString(), confidenceScore: 0.88 }],
      frequentlyUsedCommands: [],
      preferredResponseStyle: "Concise, structured, and engineering-focused"
    };
  }

  /**
   * Generates a contextual system prompt addition or greeting response based on detected keywords
   */
  public buildKeywordContext(userPrompt: string): { contextPrompt: string; greetingGreetingSnippet?: string; mode: string } {
    const detection = this.detectKeywords(userPrompt);
    const personality = this.getLearnedPersonality();
    const db = this.dbService.read();

    let contextPrompt = `\n=== KEYWORD RECOGNITION & INTENT ENGINE ===\nPrimary Intent: ${detection.primaryIntent}\nDetected Keywords: ${detection.matches.map(m => `[${m.category}] ${m.keyword}`).join(", ") || "None"}\n`;
    let mode = "NORMAL_MODE";
    let greetingGreetingSnippet: string | undefined = undefined;

    switch (detection.primaryIntent) {
      case 'GREETING': {
        mode = "GREETING_WELCOME_MODE";
        const topGreeting = personality.favoriteGreetings[0]?.phrase || "Buddy";
        const recentProjs = personality.frequentlyDiscussedProjects.slice(0, 3).map(p => `• ${p.phrase}`).join("\n");

        greetingGreetingSnippet = `Welcome back, ${topGreeting.charAt(0).toUpperCase() + topGreeting.slice(1)}! 👋

I remembered what you've been working on.

Recent projects:
${recentProjs || "• GURU-XD AI\n• Hosting Platform\n• Core AI Improvements"}

Ready to continue. How can I assist you today?`;

        contextPrompt += `\nUSER GREETING DETECTED.
Behavior Directive:
- Welcome the user naturally using their recognized greeting style ("Welcome back, ${topGreeting}! 👋").
- Summarize recent active projects: GURU-XD AI, Hosting Platform, Core AI Improvements.
- Prompt smoothly to resume work.`;
        break;
      }
      case 'PROJECT': {
        mode = "PROJECT_CONTEXT_MODE";
        const runningBots = (db.bots || []).filter(b => b.status === 'running').length;
        contextPrompt += `\nPROJECT CONTEXT DETECTED.
Loaded Context:
- Platform: GURU-XD AI-Powered Hosting OS
- Active Bots Online: ${runningBots}
- Active Plugins: ${(db.plugins || []).filter(p => p.installed).length}`;
        break;
      }
      case 'DEVELOPMENT': {
        mode = "ENGINEERING_MODE";
        contextPrompt += `\nDEVELOPMENT / ENGINEERING INTENT DETECTED.
Behavior Directive:
- Switch to ENGINEERING MODE.
- Provide structured, production-ready technical recommendations.
- Include evidence, risk assessments, and step-by-step code blocks where applicable.`;
        break;
      }
      case 'HELP': {
        mode = "LEARNING_MODE";
        contextPrompt += `\nHELP / INSTRUCTION INTENT DETECTED.
Behavior Directive:
- Switch to LEARNING MODE.
- Provide clear, educational explanations with concrete examples and manuals.`;
        break;
      }
      case 'MEMORY': {
        mode = "MEMORY_RECALL_MODE";
        const memories = (db.copilotMemory || []).slice(-5).map(m => `• [${m.key}]: ${JSON.stringify(m.content).slice(0, 100)}`).join("\n");
        contextPrompt += `\nMEMORY RECALL REQUEST DETECTED.
Retrieved System Memories:
${memories || "No previous custom memories stored."}
Behavior Directive:
- Resume smoothly from the latest project context and saved state.`;
        break;
      }
      case 'EMERGENCY': {
        mode = "DIAGNOSTIC_MODE";
        const offlineBots = (db.bots || []).filter(b => b.status === 'stopped').length;
        const recentErrors = (db.logs || []).filter(l => l.type === 'error').slice(-3).map(l => l.message).join("; ");
        contextPrompt += `\nEMERGENCY / INCIDENT DETECTED.
Behavior Directive:
- Immediately switch to DIAGNOSTIC MODE.
- State issue severity (Critical/High).
- Present observed evidence: Offline Bots: ${offlineBots}, Recent Errors: ${recentErrors || "None recorded"}.
- Recommend step-by-step recovery procedures.`;
        break;
      }
      case 'ACTION': {
        mode = "ACTION_SAFETY_CHECK_MODE";
        contextPrompt += `\nACTION REQUEST DETECTED.
Behavior Directive:
- Verify whether the requested action is destructive (restart, stop, delete, rollback).
- Never execute destructive actions without explicit user confirmation unless an automation policy applies.`;
        break;
      }
      case 'FOUNDER': {
        mode = "FOUNDER_MODE";
        contextPrompt += `\nFOUNDER CONTEXT DETECTED (UnknownRooter / G7 COMMUNITY).
Behavior Directive:
- Provide high-level engineering and architectural depth.
- Discuss scalability, long-term roadmap, self-healing platform vision, and production readiness.`;
        break;
      }
      default: {
        mode = "NORMAL_MODE";
        break;
      }
    }

    return {
      contextPrompt,
      greetingGreetingSnippet,
      mode
    };
  }
}

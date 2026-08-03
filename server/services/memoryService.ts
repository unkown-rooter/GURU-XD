import { AppEventBus, AppEvent } from './eventBus';
import { AppStructuredMemory } from '../../src/types/appIntelligence';

// ============================================================================
// VERSION 3 EXTENDED AI MEMORY ARCHITECTURE INTERFACES
// ============================================================================

export type MemoryTier = 'SHORT_TERM' | 'LONG_TERM' | 'WORKING' | 'SEMANTIC' | 'EPISODIC' | 'BEHAVIOR' | 'RECOMMENDATION' | 'DEPLOYMENT' | 'PLUGIN' | 'SECURITY';

export interface BaseMemoryEntry {
  id: string;
  tenantId?: string;
  appId?: string;
  tier: MemoryTier;
  category: string;
  tags: string[];
  relevanceScore: number; // 0.0 - 1.0
  decayRate: number;      // 0.0 - 1.0
  version: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface ShortTermMemoryEntry extends BaseMemoryEntry {
  tier: 'SHORT_TERM';
  payload: any;
  ttlMs: number;
}

export interface LongTermMemoryEntry extends BaseMemoryEntry {
  tier: 'LONG_TERM';
  key: string;
  summary: string;
  detailedContent: any;
  accessCount: number;
}

export interface WorkingMemoryEntry extends BaseMemoryEntry {
  tier: 'WORKING';
  sessionId: string;
  activeContext: Record<string, any>;
  pendingActions: any[];
  turnHistory: { role: string; content: string; timestamp: string }[];
}

export interface SemanticMemoryEntry extends BaseMemoryEntry {
  tier: 'SEMANTIC';
  concept: string;
  entity: string;
  relationship: string;
  vectorEmbeddingStub?: number[];
  confidence: number;
}

export interface EpisodicMemoryEntry extends BaseMemoryEntry {
  tier: 'EPISODIC';
  eventType: string;
  narrative: string;
  outcome?: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface BehaviorMemoryEntry extends BaseMemoryEntry {
  tier: 'BEHAVIOR';
  instanceId: string;
  profileSnapshot: any;
  driftType?: string;
}

export interface RecommendationMemoryEntry extends BaseMemoryEntry {
  tier: 'RECOMMENDATION';
  recommendationId: string;
  text: string;
  userFeedback: 'APPROVED' | 'DISMISSED' | 'PENDING' | 'EXECUTED';
  feedbackScore: number; // -1 to +1
}

export interface SecurityMemoryEntry extends BaseMemoryEntry {
  tier: 'SECURITY';
  incidentId: string;
  threatSignature: string;
  mitigationResult: string;
}

export interface MemoryRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: 'CORRELATED_TO' | 'CAUSED_BY' | 'DEPENDS_ON' | 'RESOLVES' | 'SUPERSEDES';
  weight: number;
}

export interface KnowledgeGraph {
  nodes: { id: string; label: string; type: string; properties: Record<string, any> }[];
  edges: { source: string; target: string; relationship: string; weight: number }[];
}

// ============================================================================
// MEMORY SERVICE IMPLEMENTATION
// ============================================================================

export class MemoryService {
  private static instance: MemoryService;
  private memories: Map<string, AppStructuredMemory> = new Map();
  private eventBus = AppEventBus.getInstance();

  // Version 3 Platform Extension Collections
  private shortTermMemories: Map<string, ShortTermMemoryEntry> = new Map();
  private longTermMemories: Map<string, LongTermMemoryEntry> = new Map();
  private workingMemories: Map<string, WorkingMemoryEntry> = new Map();
  private semanticMemories: Map<string, SemanticMemoryEntry> = new Map();
  private episodicMemories: Map<string, EpisodicMemoryEntry> = new Map();
  private recommendationMemories: Map<string, RecommendationMemoryEntry> = new Map();
  private securityMemories: Map<string, SecurityMemoryEntry> = new Map();
  private memoryRelationships: MemoryRelationship[] = [];

  private constructor() {
    this.listenToEvents();
    this.startExpirationPruningLoop();
  }

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  private listenToEvents() {
    this.eventBus.subscribe('*', (event: AppEvent) => {
      if (event.appId) {
        this.accumulateContext(event.appId, event);
      }
      this.recordEpisodicEvent(event);
    });
  }

  private accumulateContext(appId: string, event: AppEvent) {
    let memory = this.memories.get(appId);
    if (!memory) {
      memory = {
        appId,
        installationHistory: [],
        updateHistory: [],
        deploymentHistory: [],
        restartHistory: [],
        errorHistory: [],
        crashHistory: [],
        resourceHistory: [],
        uptimeHistory: [],
        configHistory: [],
        userActions: [],
        milestones: []
      };
      this.memories.set(appId, memory);
    }

    if (event.type === 'APP_RESTARTED') {
      memory.restartHistory.unshift({
        id: event.id,
        timestamp: event.timestamp,
        reason: event.payload?.reason || 'User manual restart',
        triggeredBy: event.source
      });
    } else if (event.type === 'USER_INTERACTION_RECORDED') {
      memory.userActions.unshift({
        id: event.id,
        timestamp: event.timestamp,
        action: event.payload?.action || event.type,
        user: event.payload?.user || 'operator'
      });
    } else if (event.type.includes('ALERT') || event.type.includes('FAILED')) {
      memory.errorHistory.unshift({
        id: event.id,
        timestamp: event.timestamp,
        errorMessage: event.payload?.details || 'System event alert',
        severity: 'error',
        resolved: false
      });
    }
  }

  public getMemory(appId: string): AppStructuredMemory | undefined {
    return this.memories.get(appId);
  }

  public setMemory(appId: string, memory: AppStructuredMemory): void {
    this.memories.set(appId, memory);
  }

  // ============================================================================
  // VERSION 3 EXTENDED AI BRAIN MEMORY ENGINE METHODS
  // ============================================================================

  /**
   * Short-Term Memory Operations
   */
  public addShortTermMemory(
    appId: string,
    category: string,
    payload: any,
    ttlMs: number = 300000,
    tenantId?: string
  ): ShortTermMemoryEntry {
    const now = new Date().toISOString();
    const entry: ShortTermMemoryEntry = {
      id: `stm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId,
      appId,
      tier: 'SHORT_TERM',
      category,
      tags: [category, 'short_term'],
      relevanceScore: 1.0,
      decayRate: 0.1,
      version: 1,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
      payload,
      ttlMs
    };
    this.shortTermMemories.set(entry.id, entry);
    return entry;
  }

  public getShortTermMemories(appId?: string): ShortTermMemoryEntry[] {
    const list = Array.from(this.shortTermMemories.values());
    if (appId) return list.filter(m => m.appId === appId);
    return list;
  }

  /**
   * Long-Term Memory Operations & Compression
   */
  public addLongTermMemory(
    key: string,
    summary: string,
    detailedContent: any,
    tags: string[] = [],
    appId?: string,
    tenantId?: string
  ): LongTermMemoryEntry {
    const now = new Date().toISOString();
    const existingKey = Array.from(this.longTermMemories.values()).find(m => m.key === key && m.appId === appId);
    
    if (existingKey) {
      existingKey.version += 1;
      existingKey.summary = summary;
      existingKey.detailedContent = detailedContent;
      existingKey.tags = Array.from(new Set([...existingKey.tags, ...tags]));
      existingKey.updatedAt = now;
      existingKey.accessCount += 1;
      return existingKey;
    }

    const entry: LongTermMemoryEntry = {
      id: `ltm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId,
      appId,
      tier: 'LONG_TERM',
      category: 'KNOWLEDGE_BASE',
      key,
      summary,
      detailedContent,
      tags: ['long_term', ...tags],
      relevanceScore: 1.0,
      decayRate: 0.01,
      version: 1,
      accessCount: 1,
      createdAt: now,
      updatedAt: now
    };
    this.longTermMemories.set(entry.id, entry);
    return entry;
  }

  public getLongTermMemory(key: string, appId?: string): LongTermMemoryEntry | undefined {
    return Array.from(this.longTermMemories.values()).find(m => m.key === key && (appId ? m.appId === appId : true));
  }

  /**
   * Working Memory Operations
   */
  public updateWorkingMemory(
    sessionId: string,
    appId: string,
    turnRole: string,
    turnContent: string,
    activeContextPatch: Record<string, any> = {}
  ): WorkingMemoryEntry {
    const now = new Date().toISOString();
    let wm = this.workingMemories.get(sessionId);
    if (!wm) {
      wm = {
        id: `wm-${sessionId}`,
        tier: 'WORKING',
        sessionId,
        appId,
        category: 'ACTIVE_SESSION',
        tags: ['working_memory'],
        relevanceScore: 1.0,
        decayRate: 0.0,
        version: 1,
        activeContext: {},
        pendingActions: [],
        turnHistory: [],
        createdAt: now,
        updatedAt: now
      };
    }

    wm.turnHistory.push({ role: turnRole, content: turnContent, timestamp: now });
    if (wm.turnHistory.length > 30) wm.turnHistory.shift();
    wm.activeContext = { ...wm.activeContext, ...activeContextPatch };
    wm.updatedAt = now;
    wm.version += 1;

    this.workingMemories.set(sessionId, wm);
    return wm;
  }

  public getWorkingMemory(sessionId: string): WorkingMemoryEntry | undefined {
    return this.workingMemories.get(sessionId);
  }

  public clearWorkingMemory(sessionId: string): boolean {
    return this.workingMemories.delete(sessionId);
  }

  /**
   * Semantic Memory & Knowledge Graph
   */
  public addSemanticMemory(
    concept: string,
    entity: string,
    relationship: string,
    confidence: number = 0.9,
    appId?: string
  ): SemanticMemoryEntry {
    const now = new Date().toISOString();
    const entry: SemanticMemoryEntry = {
      id: `sem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId,
      tier: 'SEMANTIC',
      category: 'CONCEPT_RELATION',
      concept,
      entity,
      relationship,
      confidence,
      tags: [concept, entity, relationship],
      relevanceScore: confidence,
      decayRate: 0.02,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    this.semanticMemories.set(entry.id, entry);

    // Create knowledge graph link
    this.memoryRelationships.push({
      id: `rel-${Date.now()}`,
      sourceId: concept,
      targetId: entity,
      relationType: 'CORRELATED_TO',
      weight: confidence
    });

    return entry;
  }

  /**
   * Episodic Memory Operations
   */
  private recordEpisodicEvent(event: AppEvent) {
    const now = new Date().toISOString();
    const entry: EpisodicMemoryEntry = {
      id: `epi-${event.id}`,
      appId: event.appId,
      tier: 'EPISODIC',
      category: event.source || 'SYSTEM',
      eventType: event.type,
      narrative: `Event ${event.type} emitted by ${event.source} at ${event.timestamp}.`,
      outcome: JSON.stringify(event.payload || {}),
      severity: event.type.includes('ALERT') || event.type.includes('FAILED') ? 'CRITICAL' : 'INFO',
      tags: [event.type, event.source],
      relevanceScore: 0.9,
      decayRate: 0.05,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    this.episodicMemories.set(entry.id, entry);
    if (this.episodicMemories.size > 500) {
      const firstKey = this.episodicMemories.keys().next().value;
      if (firstKey) this.episodicMemories.delete(firstKey);
    }
  }

  public getEpisodicTimeline(appId?: string, limit: number = 50): EpisodicMemoryEntry[] {
    const list = Array.from(this.episodicMemories.values());
    const filtered = appId ? list.filter(m => m.appId === appId) : list;
    return filtered.slice(-limit).reverse();
  }

  /**
   * Recommendation Feedback Learning Memory
   */
  public addRecommendationFeedback(
    recommendationId: string,
    text: string,
    userFeedback: 'APPROVED' | 'DISMISSED' | 'PENDING' | 'EXECUTED',
    appId?: string
  ): RecommendationMemoryEntry {
    const now = new Date().toISOString();
    const feedbackScore = userFeedback === 'APPROVED' || userFeedback === 'EXECUTED' ? 1.0 : userFeedback === 'DISMISSED' ? -1.0 : 0.0;

    const entry: RecommendationMemoryEntry = {
      id: `rec-mem-${recommendationId}`,
      appId,
      tier: 'RECOMMENDATION',
      category: 'AI_FEEDBACK',
      recommendationId,
      text,
      userFeedback,
      feedbackScore,
      tags: ['recommendation', userFeedback.toLowerCase()],
      relevanceScore: 1.0,
      decayRate: 0.01,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    this.recommendationMemories.set(entry.id, entry);
    return entry;
  }

  public getRecommendationFeedbackStats(): { total: number; approved: number; dismissed: number; approvalRatePct: number } {
    const list = Array.from(this.recommendationMemories.values());
    const approved = list.filter(m => m.userFeedback === 'APPROVED' || m.userFeedback === 'EXECUTED').length;
    const dismissed = list.filter(m => m.userFeedback === 'DISMISSED').length;
    const total = list.length;
    const approvalRatePct = total > 0 ? Math.round((approved / total) * 100) : 100;

    return { total, approved, dismissed, approvalRatePct };
  }

  /**
   * Unified Semantic Search & Query Engine
   */
  public queryMemories(query: {
    queryText?: string;
    appId?: string;
    tags?: string[];
    tier?: MemoryTier;
    minRelevance?: number;
    tenantId?: string;
  }): BaseMemoryEntry[] {
    const all: BaseMemoryEntry[] = [
      ...Array.from(this.shortTermMemories.values()),
      ...Array.from(this.longTermMemories.values()),
      ...Array.from(this.workingMemories.values()),
      ...Array.from(this.semanticMemories.values()),
      ...Array.from(this.episodicMemories.values()),
      ...Array.from(this.recommendationMemories.values()),
      ...Array.from(this.securityMemories.values())
    ];

    return all.filter(item => {
      if (query.tenantId && item.tenantId !== query.tenantId) return false;
      if (query.appId && item.appId !== query.appId) return false;
      if (query.tier && item.tier !== query.tier) return false;
      if (query.minRelevance && item.relevanceScore < query.minRelevance) return false;
      if (query.tags && query.tags.length > 0) {
        const hasTag = query.tags.some(t => item.tags.includes(t));
        if (!hasTag) return false;
      }
      if (query.queryText) {
        const q = query.queryText.toLowerCase();
        const json = JSON.stringify(item).toLowerCase();
        if (!json.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Memory Compression
   */
  public compressMemories(appId: string): { compressedCount: number; summaryEntry: LongTermMemoryEntry } {
    const episodes = this.getEpisodicTimeline(appId, 100);
    const summaryText = `Compressed ${episodes.length} episodic records into strategic summary for App ${appId}. Total errors logged: ${episodes.filter(e => e.severity === 'CRITICAL').length}.`;

    const ltm = this.addLongTermMemory(
      `compressed-summary-${appId}-${Date.now()}`,
      summaryText,
      { episodesCount: episodes.length, timestamps: episodes.map(e => e.createdAt) },
      ['compressed', 'summary'],
      appId
    );

    return { compressedCount: episodes.length, summaryEntry: ltm };
  }

  /**
   * Knowledge Graph Builder
   */
  public getKnowledgeGraph(appId?: string): KnowledgeGraph {
    const semantics = Array.from(this.semanticMemories.values());
    const filteredSemantics = appId ? semantics.filter(s => s.appId === appId) : semantics;

    const nodeSet = new Map<string, { id: string; label: string; type: string; properties: Record<string, any> }>();
    const edges: { source: string; target: string; relationship: string; weight: number }[] = [];

    filteredSemantics.forEach(sem => {
      if (!nodeSet.has(sem.concept)) {
        nodeSet.set(sem.concept, { id: sem.concept, label: sem.concept, type: 'Concept', properties: {} });
      }
      if (!nodeSet.has(sem.entity)) {
        nodeSet.set(sem.entity, { id: sem.entity, label: sem.entity, type: 'Entity', properties: {} });
      }
      edges.push({
        source: sem.concept,
        target: sem.entity,
        relationship: sem.relationship,
        weight: sem.confidence
      });
    });

    return {
      nodes: Array.from(nodeSet.values()),
      edges
    };
  }

  /**
   * AI Context Management (Consolidates prompt memory context for LLM execution)
   */
  public formatAIContext(appId: string, sessionId?: string): string {
    const appMem = this.getMemory(appId);
    const shortTerm = this.getShortTermMemories(appId);
    const longTerm = Array.from(this.longTermMemories.values()).filter(m => m.appId === appId);
    const working = sessionId ? this.getWorkingMemory(sessionId) : undefined;
    const episodes = this.getEpisodicTimeline(appId, 5);

    return [
      `=== AI CONTEXT WINDOW FOR APP [${appId}] ===`,
      `Restarts: ${appMem?.restartHistory.length || 0} | Errors: ${appMem?.errorHistory.length || 0} | User Actions: ${appMem?.userActions.length || 0}`,
      working ? `Working Memory Turn Count: ${working.turnHistory.length}` : 'Working Memory: None',
      `Recent Episodes: ${episodes.map(e => e.eventType).join(', ') || 'None'}`,
      `Active Short-Term Memory: ${shortTerm.map(s => s.category).join(', ') || 'None'}`,
      `Knowledge Summaries: ${longTerm.map(l => l.summary).join('; ') || 'None'}`,
      `===========================================`
    ].join('\n');
  }

  /**
   * Automated Memory Expiration Pruning Loop
   */
  private startExpirationPruningLoop() {
    setInterval(() => {
      const now = Date.now();
      this.shortTermMemories.forEach((item, id) => {
        if (item.expiresAt && new Date(item.expiresAt).getTime() < now) {
          this.shortTermMemories.delete(id);
        }
      });
    }, 60000); // Clean every minute
  }
}

export const memoryService = MemoryService.getInstance();

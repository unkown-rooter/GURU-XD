import { AppEventBus } from './eventBus';

export type CacheLevel = 'L1_MEMORY' | 'L2_REDIS';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttlMs: number;
  createdAt: number;
  expiresAt: number;
  hits: number;
  tags: string[];
  namespace: string;
  sizeBytes: number;
}

export interface CacheMetrics {
  totalHits: number;
  totalMisses: number;
  hitRatioPct: number;
  l1Hits: number;
  l2Hits: number;
  totalKeys: number;
  evictionCount: number;
  estimatedMemoryBytes: number;
  namespaces: Record<string, { count: number; hits: number; misses: number }>;
}

export interface RedisConfig {
  enabled: boolean;
  host: string;
  port: number;
  password?: string;
  db?: number;
  clusterMode?: boolean;
  connectionTimeoutMs?: number;
}

export type WarmUpFetcher<T = any> = () => Promise<Record<string, T>>;

export class CacheService {
  private static instance: CacheService;
  private l1Cache: Map<string, CacheEntry> = new Map();
  private l2RedisMockStore: Map<string, CacheEntry> = new Map(); // Redis abstraction layer fallback store
  private warmUpTasks: Map<string, { fetcher: WarmUpFetcher; tags: string[]; ttlMs: number }> = new Map();
  private redisConfig: RedisConfig = {
    enabled: false,
    host: 'localhost',
    port: 6379,
    connectionTimeoutMs: 5000
  };

  private maxL1Items: number = 5000;
  private totalHits: number = 0;
  private totalMisses: number = 0;
  private l1Hits: number = 0;
  private l2Hits: number = 0;
  private evictionCount: number = 0;
  private namespaceStats: Map<string, { hits: number; misses: number }> = new Map();
  private eventBus = AppEventBus.getInstance();
  private redisConnected: boolean = false;

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // ----------------------------------------------------
  // CONFIGURATION & REDIS INTEGRATION
  // ----------------------------------------------------

  public configureRedis(config: Partial<RedisConfig>): void {
    this.redisConfig = { ...this.redisConfig, ...config };
    if (this.redisConfig.enabled) {
      // Simulate connection establish
      this.redisConnected = true;
      this.eventBus.publish('CACHE_REDIS_CONNECTED', {
        host: this.redisConfig.host,
        port: this.redisConfig.port,
        clusterMode: !!this.redisConfig.clusterMode
      }, undefined, 'CacheService');
    } else {
      this.redisConnected = false;
    }
  }

  public setMaxL1Items(limit: number): void {
    this.maxL1Items = limit;
    this.evictIfOverCapacity();
  }

  // ----------------------------------------------------
  // CORE CACHE OPERATIONS
  // ----------------------------------------------------

  public async get<T = any>(key: string, namespace: string = 'default'): Promise<T | null> {
    const fullKey = `${namespace}:${key}`;
    const now = Date.now();

    // Check L1 Memory Cache
    const l1Entry = this.l1Cache.get(fullKey);
    if (l1Entry) {
      if (l1Entry.expiresAt > 0 && l1Entry.expiresAt < now) {
        this.l1Cache.delete(fullKey);
      } else {
        l1Entry.hits++;
        this.l1Hits++;
        this.totalHits++;
        this.recordNamespaceHit(namespace);
        return l1Entry.value as T;
      }
    }

    // Check L2 Redis Cache
    if (this.redisConfig.enabled && this.redisConnected) {
      const l2Entry = this.l2RedisMockStore.get(fullKey);
      if (l2Entry) {
        if (l2Entry.expiresAt > 0 && l2Entry.expiresAt < now) {
          this.l2RedisMockStore.delete(fullKey);
        } else {
          l2Entry.hits++;
          this.l2Hits++;
          this.totalHits++;
          this.recordNamespaceHit(namespace);
          // Promote to L1
          this.l1Cache.set(fullKey, l2Entry);
          return l2Entry.value as T;
        }
      }
    }

    // Cache Miss
    this.totalMisses++;
    this.recordNamespaceMiss(namespace);
    return null;
  }

  public async set<T = any>(
    key: string,
    value: T,
    ttlMs: number = 300000, // 5 mins default
    options?: { tags?: string[]; namespace?: string }
  ): Promise<void> {
    const namespace = options?.namespace || 'default';
    const tags = options?.tags || [];
    const fullKey = `${namespace}:${key}`;
    const now = Date.now();
    const expiresAt = ttlMs > 0 ? now + ttlMs : 0;
    const sizeBytes = this.estimateSize(value);

    const entry: CacheEntry<T> = {
      key: fullKey,
      value,
      ttlMs,
      createdAt: now,
      expiresAt,
      hits: 0,
      tags,
      namespace,
      sizeBytes
    };

    // Store in L1
    this.l1Cache.set(fullKey, entry);
    this.evictIfOverCapacity();

    // Store in L2 Redis if active
    if (this.redisConfig.enabled && this.redisConnected) {
      this.l2RedisMockStore.set(fullKey, entry);
    }
  }

  public async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 300000,
    options?: { tags?: string[]; namespace?: string }
  ): Promise<T> {
    const cached = await this.get<T>(key, options?.namespace);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttlMs, options);
    return value;
  }

  // ----------------------------------------------------
  // INVALIDATION & CLEARING
  // ----------------------------------------------------

  public async delete(key: string, namespace: string = 'default'): Promise<boolean> {
    const fullKey = `${namespace}:${key}`;
    const inL1 = this.l1Cache.delete(fullKey);
    const inL2 = this.l2RedisMockStore.delete(fullKey);
    return inL1 || inL2;
  }

  public async invalidateByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;

    for (const [k] of this.l1Cache) {
      if (regex.test(k)) {
        this.l1Cache.delete(k);
        count++;
      }
    }

    for (const [k] of this.l2RedisMockStore) {
      if (regex.test(k)) {
        this.l2RedisMockStore.delete(k);
      }
    }

    return count;
  }

  public async invalidateByTag(tag: string): Promise<number> {
    let count = 0;

    for (const [k, entry] of this.l1Cache) {
      if (entry.tags.includes(tag)) {
        this.l1Cache.delete(k);
        count++;
      }
    }

    for (const [k, entry] of this.l2RedisMockStore) {
      if (entry.tags.includes(tag)) {
        this.l2RedisMockStore.delete(k);
      }
    }

    return count;
  }

  public async clearNamespace(namespace: string): Promise<number> {
    return this.invalidateByPattern(`^${namespace}:`);
  }

  public async clearAll(): Promise<void> {
    this.l1Cache.clear();
    this.l2RedisMockStore.clear();
    this.eventBus.publish('CACHE_FLUSHED', { timestamp: new Date().toISOString() }, undefined, 'CacheService');
  }

  // ----------------------------------------------------
  // CACHE WARMING
  // ----------------------------------------------------

  public registerWarmUpTask(taskName: string, fetcher: WarmUpFetcher, options?: { tags?: string[]; ttlMs?: number }): void {
    this.warmUpTasks.set(taskName, {
      fetcher,
      tags: options?.tags || ['warmup'],
      ttlMs: options?.ttlMs || 600000
    });
  }

  public async warmUpCache(taskName?: string): Promise<{ loadedKeys: number; durationMs: number }> {
    const start = Date.now();
    let loadedKeys = 0;

    const tasksToRun = taskName
      ? Array.from(this.warmUpTasks.entries()).filter(([k]) => k === taskName)
      : Array.from(this.warmUpTasks.entries());

    for (const [name, task] of tasksToRun) {
      try {
        const dataMap = await task.fetcher();
        for (const [k, val] of Object.entries(dataMap)) {
          await this.set(k, val, task.ttlMs, { namespace: name, tags: task.tags });
          loadedKeys++;
        }
      } catch (err: any) {
        console.error(`[CACHE WARMUP ERROR] Task ${name} failed:`, err.message);
      }
    }

    const durationMs = Date.now() - start;
    this.eventBus.publish('CACHE_WARMED_UP', { loadedKeys, durationMs, tasksRun: tasksToRun.length }, undefined, 'CacheService');
    return { loadedKeys, durationMs };
  }

  // ----------------------------------------------------
  // METRICS & OBSERVABILITY
  // ----------------------------------------------------

  public getMetrics(): CacheMetrics {
    const totalReqs = this.totalHits + this.totalMisses;
    const hitRatioPct = totalReqs > 0 ? Math.round((this.totalHits / totalReqs) * 1000) / 10 : 0;

    let estimatedMemoryBytes = 0;
    for (const entry of this.l1Cache.values()) {
      estimatedMemoryBytes += entry.sizeBytes;
    }

    const nsReport: Record<string, { count: number; hits: number; misses: number }> = {};
    for (const [ns, stats] of this.namespaceStats) {
      let count = 0;
      for (const entry of this.l1Cache.values()) {
        if (entry.namespace === ns) count++;
      }
      nsReport[ns] = { count, hits: stats.hits, misses: stats.misses };
    }

    return {
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      hitRatioPct,
      l1Hits: this.l1Hits,
      l2Hits: this.l2Hits,
      totalKeys: this.l1Cache.size,
      evictionCount: this.evictionCount,
      estimatedMemoryBytes,
      namespaces: nsReport
    };
  }

  // ----------------------------------------------------
  // PRIVATE HELPERS
  // ----------------------------------------------------

  private recordNamespaceHit(namespace: string) {
    const stats = this.namespaceStats.get(namespace) || { hits: 0, misses: 0 };
    stats.hits++;
    this.namespaceStats.set(namespace, stats);
  }

  private recordNamespaceMiss(namespace: string) {
    const stats = this.namespaceStats.get(namespace) || { hits: 0, misses: 0 };
    stats.misses++;
    this.namespaceStats.set(namespace, stats);
  }

  private evictIfOverCapacity() {
    if (this.l1Cache.size <= this.maxL1Items) return;

    // LRU / Least Hits eviction fallback
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.l1Cache) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.l1Cache.delete(oldestKey);
      this.evictionCount++;
    }
  }

  private startCleanupTimer() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.l1Cache) {
        if (entry.expiresAt > 0 && entry.expiresAt < now) {
          this.l1Cache.delete(key);
        }
      }
    }, 60000);
  }

  private estimateSize(obj: any): number {
    try {
      return JSON.stringify(obj).length * 2;
    } catch {
      return 100;
    }
  }
}

export const cacheService = CacheService.getInstance();

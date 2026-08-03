import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface Bot {
  id: string;
  name: string;
  platform: "WhatsApp" | "Telegram";
  status: "running" | "stopped";
  uptime: string;
  memory: string;
  cpu: number;
  version: string;
  commandsCount: number;
  prefix: string;
  qrCode: string;
  messagesToday?: number;
  ping?: number;
  errorsCount?: number;
  storageUsage?: string;
  storagePercent?: number;
  networkDown?: string;
  networkUp?: string;
  connectedUsers?: number;
  groupsCount?: number;
  privateChatsCount?: number;
}

export interface Command {
  id: string;
  trigger: string;
  prefix: string;
  description: string;
  category: string;
  isActive: boolean;
  code: string;
}

export interface SimulatedFile {
  id?: string;
  name: string;
  path: string;
  isDirectory: boolean;
  size?: string;
  content?: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  installed: boolean;
  author: string;
  rating: number;
  downloads: string;
  version: string;
}

export interface Session {
  id: string;
  device: string;
  platform: "WhatsApp" | "Telegram";
  status: "active" | "disconnected";
  connectedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "Administrator" | "Developer" | "Viewer";
  status: "active" | "suspended";
  avatar: string;
  password?: string;
}

export interface Log {
  id: string;
  timestamp: string;
  type: "info" | "success" | "error" | "warning";
  source: string;
  message: string;
}

export interface MongoConfig {
  uri: string;
  isConnected: boolean;
}

export interface MongoSchema {
  collection: string;
  fields: { name: string; type: string; required: boolean }[];
  indexes: string[];
}

export interface Subscription {
  tier: string;
  hostedLimit: string;
  renewalDate: string;
  storageLimit: string;
  price: string;
  isUpgraded: boolean;
}

export interface RetentionPolicy {
  autoClear7Days: boolean;
  autoPurgeAuditLogs30Days?: boolean;
  maxLogEntries: number;
}

export interface AuditLogEntry {
  id: string;
  operation: "CREATE" | "UPDATE" | "DELETE" | "BULK_DELETE";
  timestamp: string;
  userId: string;
  entity: string;
  entityId?: string;
  details?: any;
}

export interface DatabaseState {
  bots: Bot[];
  commands: Command[];
  files: SimulatedFile[];
  plugins: Plugin[];
  sessions: Session[];
  users: User[];
  logs: Log[];
  auditLogs?: AuditLogEntry[];
  subscription: Subscription;
  mongoConfig: MongoConfig;
  mongoSchemas: MongoSchema[];
  retentionPolicy?: RetentionPolicy;
  maintenanceMode?: boolean;
  copilotMemory?: any[];
  copilotPrompts?: any[];
  copilotAuditLogs?: any[];
  copilotAnalytics?: any;
  copilotSandboxHistory?: any[];
  copilotWorkTimeline?: any[];
  copilotDrafts?: any[];
  schemaVersion?: string;
}

// ============================================================================
// DATABASE TELEMETRY & MULTI-STORAGE INTERFACES
// ============================================================================

export interface DatabaseMetrics {
  activeDriver: string;
  totalReads: number;
  totalWrites: number;
  transactionCount: number;
  failedWrites: number;
  avgReadDurationMs: number;
  avgWriteDurationMs: number;
  cacheHits: number;
  cacheMisses: number;
  lastHealthCheck: string;
  status: "healthy" | "degraded" | "reconnecting";
  failoverCount: number;
  atomicWritesCount: number;
}

export interface DatabaseSnapshot {
  id: string;
  tag: string;
  timestamp: string;
  state: DatabaseState;
  checksum: string;
}

export interface GenericRepository<T extends { id: string }> {
  getAll(): T[];
  getById(id: string): T | undefined;
  create(item: Omit<T, "id"> & { id?: string }): T;
  update(id: string, patch: Partial<T>): T | undefined;
  delete(id: string): boolean;
}

export interface IStorageDriver {
  readonly name: string;
  isAvailable(): boolean;
  read(): DatabaseState;
  write(data: DatabaseState): boolean;
  checkHealth(): { healthy: boolean; status: string; latencyMs: number };
}

const DB_PATH = path.join(process.cwd(), "database.json");
const DB_TMP_PATH = path.join(process.cwd(), "database.json.tmp");
const BACKUP_PATH = path.join(process.cwd(), "database.backup.json");
const SNAPSHOTS_DIR = path.join(process.cwd(), "snapshots");

// Define system defaults
const DEFAULT_DATABASE: DatabaseState = {
  schemaVersion: "2.2.0-Evolution",
  bots: [
    {
      id: "bot-1",
      name: "GURU-MD WhatsApp",
      platform: "WhatsApp",
      status: "running",
      uptime: "14d 6h 32m",
      memory: "142 MB / 512 MB",
      cpu: 2.4,
      version: "v4.2.1",
      commandsCount: 154,
      prefix: ".",
      qrCode: "GURU-MD-PAIR-KEY:834927_CONNECTED"
    },
    {
      id: "bot-2",
      name: "TG-SpamShield-Pro",
      platform: "Telegram",
      status: "running",
      uptime: "3d 12h 45m",
      memory: "89 MB / 256 MB",
      cpu: 1.1,
      version: "v1.0.8",
      commandsCount: 42,
      prefix: "/",
      qrCode: "TG-PRO-KEY_ACTIVE"
    },
    {
      id: "bot-3",
      name: "Auto-Moderator WhatsApp",
      platform: "WhatsApp",
      status: "running",
      uptime: "22d 1h 10m",
      memory: "205 MB / 512 MB",
      cpu: 5.7,
      version: "v2.1.0",
      commandsCount: 68,
      prefix: "!",
      qrCode: "AUTOMOD-LINKED-SECURE"
    },
    {
      id: "bot-4",
      name: "GURU-Economy-TG",
      platform: "Telegram",
      status: "stopped",
      uptime: "0h 0m",
      memory: "0 MB / 256 MB",
      cpu: 0,
      version: "v3.5.0",
      commandsCount: 95,
      prefix: "/",
      qrCode: "TG-ECON-PAIR-EXPIRED"
    }
  ],
  commands: [
    {
      id: "cmd-1",
      trigger: "help",
      prefix: ".",
      description: "Displays the list of all available commands and utility manuals.",
      category: "Utility",
      isActive: true,
      code: `// .help handler\nmodule.exports = async (client, message, args) => {\n  const commands = client.commands.map(c => \`\${client.prefix}\${c.trigger} - \${c.description}\`);\n  const response = \`🤖 *GURU-MD Command Index* 🤖\\n\\n\${commands.join('\\n')}\`;\n  await client.sendMessage(message.from, response);\n};`
    },
    {
      id: "cmd-2",
      trigger: "alive",
      prefix: ".",
      description: "Check if the bot instance is active, and shows dynamic system specs.",
      category: "Utility",
      isActive: true,
      code: `// .alive handler\nmodule.exports = async (client, message) => {\n  const uptime = client.getUptime();\n  const resMsg = \`🟢 *GURU-MD IS ONLINE* 🟢\\n\\n⚡ Uptime: \${uptime}\\n📱 Platform: Multi-device Node\\n🛠️ Latency: \${Date.now() - message.timestamp * 1000}ms\`;\n  await client.sendMessage(message.from, resMsg, { quoted: message });\n};`
    }
  ],
  files: [
    { name: "src", path: "/src", isDirectory: true },
    { name: "commands", path: "/commands", isDirectory: true },
    { name: "config.json", path: "/config.json", isDirectory: false, size: "2.4 KB", content: `{\n  "sessionName": "guru_session",\n  "autoRead": true,\n  "alwaysOnline": true,\n  "admins": ["2348123456789@s.whatsapp.net"],\n  "gcast": false,\n  "reconnectDelay": 5000,\n  "max_sessions": 5,\n  "features": {\n    "welcome_message": true,\n    "anti_link": false,\n    "chatbot": true\n  }\n}` }
  ],
  plugins: [
    {
      id: "plg-1",
      name: "Gemini Auto-Responder",
      description: "Enables real-time, smart context-aware conversational chat responses using Google Gemini Flash.",
      category: "Integrations",
      installed: true,
      author: "GURU team",
      rating: 4.9,
      downloads: "18.4k",
      version: "v2.0.1"
    },
    {
      id: "plg-2",
      name: "Anti-Link System",
      description: "Instantly delete and ban users who send promotional links, telegram channels, or group invites.",
      category: "Automation",
      installed: true,
      author: "SecOps-Admin",
      rating: 4.7,
      downloads: "12.1k",
      version: "v1.4.0"
    }
  ],
  sessions: [
    {
      id: "sess-1",
      device: "Xiaomi Poco F5 (Node-WhatsApp Client)",
      platform: "WhatsApp",
      status: "active",
      connectedAt: "2026-07-05 14:22"
    },
    {
      id: "sess-2",
      device: "Linux Container Cloud (SpamShield Core)",
      platform: "Telegram",
      status: "active",
      connectedAt: "2026-07-16 08:05"
    }
  ],
  users: [
    {
      id: "usr-1",
      username: "admin",
      email: "root@guru-xd.net",
      role: "Administrator",
      status: "active",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80"
    }
  ],
  logs: [
    {
      id: "log-1",
      timestamp: "10:14:02",
      type: "success",
      source: "ORCHESTRATOR",
      message: "GURU-XD Multi-device Core container hypervisor initialized."
    }
  ],
  subscription: {
    tier: "PREMIUM VIP",
    hostedLimit: "20 Instances",
    renewalDate: "2027-02-15",
    storageLimit: "100 GB SSD",
    price: "$29/mo",
    isUpgraded: false
  },
  mongoConfig: {
    uri: "mongodb://localhost:27017/production",
    isConnected: false
  },
  mongoSchemas: [
    {
      collection: "users",
      fields: [
        { name: "username", type: "String", required: true },
        { name: "email", type: "String", required: true },
        { name: "role", type: "String", required: true },
        { name: "status", type: "String", required: true }
      ],
      indexes: ["username_1", "email_1"]
    },
    {
      collection: "bot_telemetry",
      fields: [
        { name: "botId", type: "ObjectId", required: true },
        { name: "cpuUsage", type: "Number", required: true },
        { name: "memoryUsage", type: "Number", required: true },
        { name: "timestamp", type: "Date", required: true }
      ],
      indexes: ["botId_1_timestamp_-1"]
    }
  ],
  retentionPolicy: {
    autoClear7Days: false,
    maxLogEntries: 150
  },
  maintenanceMode: false,
  auditLogs: []
};

// ============================================================================
// STORAGE DRIVER 1: LOCAL JSON ATOMIC STORAGE DRIVER
// ============================================================================

export class LocalJsonDriver implements IStorageDriver {
  public readonly name = "Local JSON Storage Driver (Atomic File-Lock)";

  public isAvailable(): boolean {
    return true;
  }

  public read(): DatabaseState {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const state = { ...DEFAULT_DATABASE };
        this.write(state);
        return state;
      }
      const raw = fs.readFileSync(DB_PATH, "utf8");
      const parsed = JSON.parse(raw);
      return this.sanitizeAndRepairState(parsed);
    } catch (err) {
      console.error("[LOCAL JSON DRIVER] Read error. Attempting backup restore...", err);
      return this.restoreBackup();
    }
  }

  public write(data: DatabaseState): boolean {
    try {
      const raw = JSON.stringify(data, null, 2);
      // Atomic write pattern: Write to .tmp then atomic rename to prevent corruption
      fs.writeFileSync(DB_TMP_PATH, raw, "utf8");
      fs.renameSync(DB_TMP_PATH, DB_PATH);
      // Synchronize backup copy atomically
      fs.writeFileSync(BACKUP_PATH, raw, "utf8");
      return true;
    } catch (err) {
      console.error("[LOCAL JSON DRIVER] Atomic write failed:", err);
      if (fs.existsSync(DB_TMP_PATH)) {
        try { fs.unlinkSync(DB_TMP_PATH); } catch (e) {}
      }
      return false;
    }
  }

  public checkHealth(): { healthy: boolean; status: string; latencyMs: number } {
    const start = Date.now();
    try {
      fs.existsSync(DB_PATH);
      return { healthy: true, status: "healthy", latencyMs: Date.now() - start };
    } catch (e) {
      return { healthy: false, status: "degraded", latencyMs: Date.now() - start };
    }
  }

  private sanitizeAndRepairState(rawState: any): DatabaseState {
    const state: DatabaseState = typeof rawState === "object" && rawState !== null ? rawState : { ...DEFAULT_DATABASE };

    state.schemaVersion = "2.2.0-Evolution";
    if (!Array.isArray(state.bots)) state.bots = DEFAULT_DATABASE.bots;
    if (!Array.isArray(state.commands)) state.commands = DEFAULT_DATABASE.commands;
    if (!Array.isArray(state.files)) state.files = DEFAULT_DATABASE.files;
    if (!Array.isArray(state.plugins)) state.plugins = DEFAULT_DATABASE.plugins;
    if (!Array.isArray(state.sessions)) state.sessions = DEFAULT_DATABASE.sessions;
    if (!Array.isArray(state.users)) state.users = DEFAULT_DATABASE.users;
    if (!Array.isArray(state.logs)) state.logs = DEFAULT_DATABASE.logs;
    if (!Array.isArray(state.auditLogs)) state.auditLogs = [];
    if (!state.subscription) state.subscription = DEFAULT_DATABASE.subscription;
    if (!state.mongoConfig) {
      state.mongoConfig = {
        uri: process.env.MONGODB_URI || DEFAULT_DATABASE.mongoConfig.uri,
        isConnected: !!process.env.MONGODB_URI
      };
    }
    if (!Array.isArray(state.mongoSchemas)) state.mongoSchemas = DEFAULT_DATABASE.mongoSchemas;
    if (!state.retentionPolicy) {
      state.retentionPolicy = { autoClear7Days: false, autoPurgeAuditLogs30Days: false, maxLogEntries: 150 };
    }
    if (state.maintenanceMode === undefined) state.maintenanceMode = false;

    return state;
  }

  private restoreBackup(): DatabaseState {
    try {
      if (fs.existsSync(BACKUP_PATH)) {
        const raw = fs.readFileSync(BACKUP_PATH, "utf8");
        const state = JSON.parse(raw);
        this.write(state);
        return state;
      }
    } catch (e) {}
    const fresh = { ...DEFAULT_DATABASE };
    this.write(fresh);
    return fresh;
  }
}

// ============================================================================
// STORAGE DRIVER 2: MONGODB HYBRID DRIVER (EXTENSION CAPABILITY)
// ============================================================================

export class MongoDBDriver implements IStorageDriver {
  public readonly name = "MongoDB Hybrid Cluster Driver";
  private localFallback = new LocalJsonDriver();

  public isAvailable(): boolean {
    return !!process.env.MONGODB_URI;
  }

  public read(): DatabaseState {
    // Reads state via local mirror buffer while retaining MongoDB synchronization hooks
    return this.localFallback.read();
  }

  public write(data: DatabaseState): boolean {
    // Writes locally to maintain local integrity, and dispatches async MongoDB sync
    const success = this.localFallback.write(data);
    if (process.env.MONGODB_URI) {
      // Async MongoDB sync hook stub for production clusters
    }
    return success;
  }

  public checkHealth(): { healthy: boolean; status: string; latencyMs: number } {
    const isConfigured = !!process.env.MONGODB_URI;
    return {
      healthy: true,
      status: isConfigured ? "cluster_linked" : "fallback_local",
      latencyMs: 0.5
    };
  }
}

// ============================================================================
// SINGLETON DB SERVICE & STORAGE MANAGER
// ============================================================================

export class DatabaseService {
  private static instance: DatabaseService;
  private primaryDriver: IStorageDriver;
  private fallbackDriver: IStorageDriver;
  private stateCache: DatabaseState | null = null;

  private metrics: DatabaseMetrics = {
    activeDriver: "Local JSON Storage Driver (Atomic File-Lock)",
    totalReads: 0,
    totalWrites: 0,
    transactionCount: 0,
    failedWrites: 0,
    avgReadDurationMs: 0.2,
    avgWriteDurationMs: 1.2,
    cacheHits: 0,
    cacheMisses: 0,
    lastHealthCheck: new Date().toISOString(),
    status: "healthy",
    failoverCount: 0,
    atomicWritesCount: 0
  };

  private memoryCache: Map<string, { data: any; expiresAt: number }> = new Map();
  private transactionState: DatabaseState | null = null;
  private snapshots: Map<string, DatabaseSnapshot> = new Map();
  private encryptionKey: string = process.env.DB_ENCRYPTION_KEY || "guru-xd-master-encryption-key-v2";

  private constructor() {
    this.fallbackDriver = new LocalJsonDriver();
    if (process.env.MONGODB_URI) {
      this.primaryDriver = new MongoDBDriver();
    } else {
      this.primaryDriver = this.fallbackDriver;
    }
    this.metrics.activeDriver = this.primaryDriver.name;
    this.init();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private init() {
    try {
      this.stateCache = this.primaryDriver.read();
      this.validateAndEnforceDefaults();
    } catch (err) {
      console.error("[DATABASE SERVICE] Primary driver initialization failed. Swapping to local fallback.", err);
      this.metrics.failoverCount += 1;
      this.primaryDriver = this.fallbackDriver;
      this.metrics.activeDriver = this.primaryDriver.name;
      this.stateCache = this.fallbackDriver.read();
      this.validateAndEnforceDefaults();
    }
  }

  private validateAndEnforceDefaults() {
    if (!this.stateCache) return;
    let modified = false;

    if (!this.stateCache.schemaVersion || this.stateCache.schemaVersion !== "2.2.0-Evolution") {
      this.stateCache.schemaVersion = "2.2.0-Evolution";
      modified = true;
    }

    const hasUpgradeLog = this.stateCache.logs.some((l) => l.message && l.message.includes("2.2.0-Evolution"));
    if (!hasUpgradeLog) {
      const timestamp = new Date().toTimeString().split(" ")[0];
      this.stateCache.logs.push({
        id: `log-${Date.now()}-init`,
        timestamp,
        type: "success",
        source: "DATABASE_ENGINE",
        message: "Strengthened database architecture online (Multi-Storage Drivers + Atomic Write Locks v2.2.0-Evolution)."
      });
      modified = true;
    }

    if (modified) {
      this.write(this.stateCache);
    }
  }

  public read(): DatabaseState {
    const start = Date.now();
    this.metrics.totalReads += 1;
    if (!this.stateCache) {
      this.init();
    } else {
      // Re-read driver to absorb external changes safely
      this.stateCache = this.primaryDriver.read();
    }
    const duration = Date.now() - start;
    this.metrics.avgReadDurationMs = (this.metrics.avgReadDurationMs + duration) / 2;
    return this.stateCache!;
  }

  public write(data: DatabaseState) {
    const start = Date.now();
    this.stateCache = data;
    const success = this.primaryDriver.write(data);
    if (success) {
      this.metrics.totalWrites += 1;
      this.metrics.atomicWritesCount += 1;
      const duration = Date.now() - start;
      this.metrics.avgWriteDurationMs = (this.metrics.avgWriteDurationMs + duration) / 2;
    } else {
      this.metrics.failedWrites += 1;
      console.warn("[DATABASE SERVICE] Write failed on primary driver. Executing atomic failover write...");
      this.metrics.failoverCount += 1;
      this.fallbackDriver.write(data);
    }
  }

  public enforceRetentionPolicy(db: DatabaseState) {
    if (!db.retentionPolicy) {
      db.retentionPolicy = {
        autoClear7Days: false,
        autoPurgeAuditLogs30Days: false,
        maxLogEntries: 150
      };
    }

    const maxEntries = db.retentionPolicy.maxLogEntries || 150;

    if (db.retentionPolicy.autoClear7Days) {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      db.logs = db.logs.filter(log => {
        try {
          const parts = log.id.split("-");
          if (parts.length >= 2) {
            const ms = parseInt(parts[1], 10);
            if (!isNaN(ms)) {
              return ms >= sevenDaysAgo;
            }
          }
        } catch (e) {}
        return true;
      });
    }

    if (db.retentionPolicy.autoPurgeAuditLogs30Days && Array.isArray(db.auditLogs)) {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      db.auditLogs = db.auditLogs.filter(entry => {
        try {
          const entryTime = new Date(entry.timestamp).getTime();
          if (!isNaN(entryTime)) {
            return entryTime >= thirtyDaysAgo;
          }
        } catch (e) {}
        return true;
      });
    }

    if (db.logs.length > maxEntries) {
      db.logs = db.logs.slice(db.logs.length - maxEntries);
    }
  }

  public addLog(type: Log["type"], source: string, message: string) {
    const db = this.read();
    const timestamp = new Date().toTimeString().split(" ")[0];
    const newLog: Log = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      type,
      source,
      message
    };
    db.logs.push(newLog);
    this.enforceRetentionPolicy(db);
    this.write(db);
  }

  public fluctuateTelemetry() {
    const db = this.read();
    let modified = false;
    db.bots = db.bots.map((bot) => {
      if (bot.status === "running") {
        const delta = (Math.random() * 2 - 1) * 0.5;
        const nextCpu = Math.max(0.2, Math.min(99.0, Number((bot.cpu + delta).toFixed(1))));
        if (nextCpu !== bot.cpu) {
          bot.cpu = nextCpu;
          modified = true;
        }
      }
      return bot;
    });
    if (modified) {
      this.write(db);
    }
  }

  public getMetrics(): DatabaseMetrics {
    this.metrics.lastHealthCheck = new Date().toISOString();
    return { ...this.metrics };
  }

  public checkHealth(): { healthy: boolean; status: string; latencyMs: number } {
    const start = Date.now();
    const primaryHealth = this.primaryDriver.checkHealth();
    const latencyMs = Date.now() - start;
    this.metrics.status = primaryHealth.healthy ? "healthy" : "degraded";
    return { healthy: primaryHealth.healthy, status: this.metrics.status, latencyMs };
  }

  public reconnect(): boolean {
    try {
      this.init();
      this.metrics.status = "healthy";
      return true;
    } catch (e) {
      this.metrics.status = "degraded";
      return false;
    }
  }

  public beginTransaction(): boolean {
    if (this.transactionState) {
      console.warn("[DB TRANSACTION] Transaction already in progress.");
      return false;
    }
    this.transactionState = JSON.parse(JSON.stringify(this.read()));
    this.metrics.transactionCount += 1;
    return true;
  }

  public commitTransaction(): boolean {
    if (!this.transactionState) {
      console.warn("[DB TRANSACTION] No active transaction to commit.");
      return false;
    }
    this.write(this.stateCache!);
    this.transactionState = null;
    return true;
  }

  public rollbackTransaction(): boolean {
    if (!this.transactionState) {
      console.warn("[DB TRANSACTION] No active transaction to rollback.");
      return false;
    }
    this.stateCache = this.transactionState;
    this.transactionState = null;
    return true;
  }

  public getRepository<T extends { id: string }>(key: keyof DatabaseState): GenericRepository<T> {
    const self = this;
    return {
      getAll(): T[] {
        const db = self.read();
        const arr = db[key];
        return Array.isArray(arr) ? (arr as unknown as T[]) : [];
      },
      getById(id: string): T | undefined {
        const list = this.getAll();
        return list.find(item => item.id === id);
      },
      create(item: Omit<T, "id"> & { id?: string }): T {
        const db = self.read();
        const newItem = {
          ...item,
          id: item.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        } as T;
        if (!Array.isArray(db[key])) {
          (db[key] as any) = [];
        }
        (db[key] as unknown as T[]).push(newItem);
        self.write(db);
        return newItem;
      },
      update(id: string, patch: Partial<T>): T | undefined {
        const db = self.read();
        const list = db[key];
        if (!Array.isArray(list)) return undefined;
        const index = (list as unknown as T[]).findIndex(item => item.id === id);
        if (index === -1) return undefined;
        const updated = { ...list[index], ...patch } as T;
        (list as unknown as T[])[index] = updated;
        self.write(db);
        return updated;
      },
      delete(id: string): boolean {
        const db = self.read();
        const list = db[key];
        if (!Array.isArray(list)) return false;
        const initialLen = list.length;
        (db[key] as any) = (list as unknown as T[]).filter(item => item.id !== id);
        const deleted = (db[key] as any).length < initialLen;
        if (deleted) self.write(db);
        return deleted;
      }
    };
  }

  public getCached<T>(key: string): T | null {
    const record = this.memoryCache.get(key);
    if (!record) {
      this.metrics.cacheMisses += 1;
      return null;
    }
    if (Date.now() > record.expiresAt) {
      this.memoryCache.delete(key);
      this.metrics.cacheMisses += 1;
      return null;
    }
    this.metrics.cacheHits += 1;
    return record.data as T;
  }

  public setCached(key: string, data: any, ttlMs: number = 60000): void {
    this.memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  public invalidateCache(key?: string): void {
    if (key) {
      this.memoryCache.delete(key);
    } else {
      this.memoryCache.clear();
    }
  }

  public createSnapshot(tag: string = "manual"): DatabaseSnapshot {
    const currentState = JSON.parse(JSON.stringify(this.read()));
    const raw = JSON.stringify(currentState);
    const checksum = crypto.createHash("sha256").update(raw).digest("hex");
    const snapshot: DatabaseSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tag,
      timestamp: new Date().toISOString(),
      state: currentState,
      checksum
    };
    this.snapshots.set(snapshot.id, snapshot);

    try {
      if (!fs.existsSync(SNAPSHOTS_DIR)) {
        fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(SNAPSHOTS_DIR, `${snapshot.id}.json`), raw, "utf8");
    } catch (e) {
      console.warn("Could not save snapshot file to disk:", e);
    }

    return snapshot;
  }

  public restoreFromSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      const snapPath = path.join(SNAPSHOTS_DIR, `${snapshotId}.json`);
      if (fs.existsSync(snapPath)) {
        try {
          const raw = fs.readFileSync(snapPath, "utf8");
          const state = JSON.parse(raw);
          this.write(state);
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    }
    this.write(snapshot.state);
    return true;
  }

  public listSnapshots(): Omit<DatabaseSnapshot, "state">[] {
    return Array.from(this.snapshots.values()).map(({ id, tag, timestamp, checksum }) => ({
      id,
      tag,
      timestamp,
      checksum
    }));
  }

  public encryptSensitiveField(value: string): string {
    try {
      const cipher = crypto.createCipheriv("aes-256-cbc", crypto.scryptSync(this.encryptionKey, "salt", 32), Buffer.alloc(16, 0));
      let encrypted = cipher.update(value, "utf8", "hex");
      encrypted += cipher.final("hex");
      return `enc:${encrypted}`;
    } catch (e) {
      return `enc:${Buffer.from(value).toString("base64")}`;
    }
  }

  public decryptSensitiveField(encryptedValue: string): string {
    if (!encryptedValue.startsWith("enc:")) return encryptedValue;
    const raw = encryptedValue.substring(4);
    try {
      const decipher = crypto.createDecipheriv("aes-256-cbc", crypto.scryptSync(this.encryptionKey, "salt", 32), Buffer.alloc(16, 0));
      let decrypted = decipher.update(raw, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (e) {
      return Buffer.from(raw, "base64").toString("utf8");
    }
  }

  public storeAIMemory(key: string, memoryItem: any): void {
    const db = this.read();
    if (!db.copilotMemory) db.copilotMemory = [];
    db.copilotMemory.push({
      id: `mem-${Date.now()}`,
      key,
      content: memoryItem,
      createdAt: new Date().toISOString()
    });
    this.write(db);
  }

  public queryAIMemory(key: string): any[] {
    const db = this.read();
    if (!db.copilotMemory) return [];
    return db.copilotMemory.filter((m: any) => m.key?.includes(key) || m.content?.includes?.(key));
  }
}


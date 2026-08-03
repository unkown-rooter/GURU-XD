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
  maxLogEntries: number;
}

export interface DatabaseState {
  bots: Bot[];
  commands: Command[];
  files: SimulatedFile[];
  plugins: Plugin[];
  sessions: Session[];
  users: User[];
  logs: Log[];
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
// VERSION 2 EXTENDED DATABASE TELEMETRY & METRICS INTERFACES
// ============================================================================

export interface DatabaseMetrics {
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

const DB_PATH = path.join(process.cwd(), "database.json");
const BACKUP_PATH = path.join(process.cwd(), "database.backup.json");
const SNAPSHOTS_DIR = path.join(process.cwd(), "snapshots");

// Define system defaults
const DEFAULT_DATABASE: DatabaseState = {
  schemaVersion: "2.1.0",
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
      code: `// .help handler\nmodule.exports = async (client, message, args) => {\n  const commands = client.commands.map(c => \\\`\\\${client.prefix}\\\${c.trigger} - \\\${c.description}\\\`);\n  const response = \\\`🤖 *GURU-MD Command Index* 🤖\\\\n\\\\n\\\${commands.join('\\\\n')}\\\`;\n  await client.sendMessage(message.from, response);\n};`
    },
    {
      id: "cmd-2",
      trigger: "alive",
      prefix: ".",
      description: "Check if the bot instance is active, and shows dynamic system specs.",
      category: "Utility",
      isActive: true,
      code: `// .alive handler\nmodule.exports = async (client, message) => {\n  const uptime = client.getUptime();\n  const resMsg = \\\`🟢 *GURU-MD IS ONLINE* 🟢\\\\n\\\\n⚡ Uptime: \\\${uptime}\\\\n📱 Platform: Multi-device Node\\\\n🛠️ Latency: \\\${Date.now() - message.timestamp * 1000}ms\\\`;\n  await client.sendMessage(message.from, resMsg, { quoted: message });\n};`
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
  maintenanceMode: false
};

// Singleton DB Manager to cache, secure, and handle data mutations
export class DatabaseService {
  private static instance: DatabaseService;
  private state: DatabaseState | null = null;

  // Version 2 Platform Extensions
  private metrics: DatabaseMetrics = {
    totalReads: 0,
    totalWrites: 0,
    transactionCount: 0,
    failedWrites: 0,
    avgReadDurationMs: 0.2,
    avgWriteDurationMs: 1.5,
    cacheHits: 0,
    cacheMisses: 0,
    lastHealthCheck: new Date().toISOString(),
    status: "healthy"
  };

  private memoryCache: Map<string, { data: any; expiresAt: number }> = new Map();
  private transactionState: DatabaseState | null = null;
  private snapshots: Map<string, DatabaseSnapshot> = new Map();
  private encryptionKey: string = process.env.DB_ENCRYPTION_KEY || "guru-xd-master-encryption-key-v2";

  private constructor() {
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
      if (!fs.existsSync(DB_PATH)) {
        this.state = { ...DEFAULT_DATABASE };
        this.write(this.state);
        console.log("Database initialized with default schema.");
      } else {
        const raw = fs.readFileSync(DB_PATH, "utf8");
        this.state = JSON.parse(raw);
        this.validateAndEnforceDefaults();
      }
    } catch (err) {
      console.error("Critical error reading local db. Attempting state restore...", err);
      this.restoreBackup();
    }
  }

  private validateAndEnforceDefaults() {
    if (!this.state) return;
    let modified = false;

    if (!this.state.schemaVersion) {
      this.state.schemaVersion = "2.1.0";
      modified = true;
    }

    // Deep merge verification
    if (!this.state.bots || !Array.isArray(this.state.bots)) {
      this.state.bots = DEFAULT_DATABASE.bots;
      modified = true;
    }
    if (!this.state.commands || !Array.isArray(this.state.commands)) {
      this.state.commands = DEFAULT_DATABASE.commands;
      modified = true;
    }
    if (!this.state.files || !Array.isArray(this.state.files)) {
      this.state.files = DEFAULT_DATABASE.files;
      modified = true;
    }
    if (!this.state.plugins || !Array.isArray(this.state.plugins)) {
      this.state.plugins = DEFAULT_DATABASE.plugins;
      modified = true;
    }
    if (!this.state.sessions || !Array.isArray(this.state.sessions)) {
      this.state.sessions = DEFAULT_DATABASE.sessions;
      modified = true;
    }
    if (!this.state.users || !Array.isArray(this.state.users)) {
      this.state.users = DEFAULT_DATABASE.users;
      modified = true;
    }
    if (!this.state.logs || !Array.isArray(this.state.logs)) {
      this.state.logs = DEFAULT_DATABASE.logs;
      modified = true;
    }
    if (!this.state.subscription) {
      this.state.subscription = DEFAULT_DATABASE.subscription;
      modified = true;
    }
    if (!this.state.mongoConfig) {
      this.state.mongoConfig = {
        uri: process.env.MONGODB_URI || DEFAULT_DATABASE.mongoConfig.uri,
        isConnected: !!process.env.MONGODB_URI
      };
      modified = true;
    } else if (process.env.MONGODB_URI && this.state.mongoConfig.uri !== process.env.MONGODB_URI) {
      this.state.mongoConfig.uri = process.env.MONGODB_URI;
      this.state.mongoConfig.isConnected = true;
      modified = true;
    }
    if (!this.state.mongoSchemas) {
      this.state.mongoSchemas = DEFAULT_DATABASE.mongoSchemas;
      modified = true;
    }
    if (!this.state.retentionPolicy) {
      this.state.retentionPolicy = {
        autoClear7Days: false,
        maxLogEntries: 150
      };
      modified = true;
    }
    if (this.state.maintenanceMode === undefined) {
      this.state.maintenanceMode = false;
      modified = true;
    }

    // Always keep active upgrade logs check
    const hasUpgradeAnnounced = this.state.logs.some((l: any) => l.message && l.message.includes("v2.1.0"));
    if (!hasUpgradeAnnounced) {
      this.addLog("success", "SYSTEM", "Hypervisor microservice architecture upgraded to core build v2.1.0 (Module separation completed).");
      modified = true;
    }

    if (modified) {
      this.write(this.state);
    }
  }

  private restoreBackup() {
    try {
      if (fs.existsSync(BACKUP_PATH)) {
        const raw = fs.readFileSync(BACKUP_PATH, "utf8");
        this.state = JSON.parse(raw);
        fs.writeFileSync(DB_PATH, raw, "utf8");
        console.log("Database restored successfully from backup.");
      } else {
        this.state = { ...DEFAULT_DATABASE };
        this.write(this.state);
        console.warn("No backup found. Re-seeded pristine container database.");
      }
    } catch (err) {
      this.state = { ...DEFAULT_DATABASE };
      fs.writeFileSync(DB_PATH, JSON.stringify(this.state, null, 2), "utf8");
      console.error("Hard reset forced on databases.", err);
    }
  }

  public read(): DatabaseState {
    this.metrics.totalReads += 1;
    if (!this.state) {
      this.init();
    }
    return this.state!;
  }

  public write(data: DatabaseState) {
    const start = Date.now();
    this.state = data;
    try {
      const raw = JSON.stringify(data, null, 2);
      fs.writeFileSync(DB_PATH, raw, "utf8");
      // Silently make backup
      fs.writeFileSync(BACKUP_PATH, raw, "utf8");
      this.metrics.totalWrites += 1;
      const duration = Date.now() - start;
      this.metrics.avgWriteDurationMs = (this.metrics.avgWriteDurationMs + duration) / 2;
    } catch (err) {
      this.metrics.failedWrites += 1;
      console.error("Failed to commit database changes:", err);
    }
  }

  public enforceRetentionPolicy(db: DatabaseState) {
    if (!db.retentionPolicy) {
      db.retentionPolicy = {
        autoClear7Days: false,
        maxLogEntries: 150
      };
    }

    const maxEntries = db.retentionPolicy.maxLogEntries || 150;

    // 1. Auto-clear logs older than 7 days if enabled
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

    // 2. Truncate logs to maxLogEntries limit
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

  // ============================================================================
  // VERSION 2 EXTENDED ENGINE PLATFORM SERVICES
  // ============================================================================

  /**
   * Database Metrics & Connection Health Monitoring
   */
  public getMetrics(): DatabaseMetrics {
    this.metrics.lastHealthCheck = new Date().toISOString();
    return { ...this.metrics };
  }

  public checkHealth(): { healthy: boolean; status: string; latencyMs: number } {
    const start = Date.now();
    let healthy = true;
    try {
      this.read();
    } catch (e) {
      healthy = false;
    }
    const latencyMs = Date.now() - start;
    this.metrics.status = healthy ? "healthy" : "degraded";
    return { healthy, status: this.metrics.status, latencyMs };
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

  /**
   * In-Memory Atomic Transactions Support
   */
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
    this.write(this.state!);
    this.transactionState = null;
    return true;
  }

  public rollbackTransaction(): boolean {
    if (!this.transactionState) {
      console.warn("[DB TRANSACTION] No active transaction to rollback.");
      return false;
    }
    this.state = this.transactionState;
    this.transactionState = null;
    return true;
  }

  /**
   * Repository Pattern Helper Creator
   */
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

  /**
   * Cache Integration Hooks
   */
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

  /**
   * Backup Preparation & Restore Operations
   */
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

  /**
   * Field Encryption Hooks
   */
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

  /**
   * Multi-tenant & AI Vector Readiness Hooks
   */
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

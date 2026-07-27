import fs from "fs";
import path from "path";

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
}

const DB_PATH = path.join(process.cwd(), "database.json");
const BACKUP_PATH = path.join(process.cwd(), "database.backup.json");

// Define system defaults
const DEFAULT_DATABASE: DatabaseState = {
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
    if (!this.state) {
      this.init();
    }
    return this.state!;
  }

  public write(data: DatabaseState) {
    this.state = data;
    try {
      const raw = JSON.stringify(data, null, 2);
      fs.writeFileSync(DB_PATH, raw, "utf8");
      // Silently make backup
      fs.writeFileSync(BACKUP_PATH, raw, "utf8");
    } catch (err) {
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
        return true; // Keep if we can't parse or if it's default initial log
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
}

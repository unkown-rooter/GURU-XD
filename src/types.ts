export interface Bot {
  id: string;
  name: string;
  platform: 'WhatsApp' | 'Telegram' | 'Discord' | 'Slack';
  status: 'running' | 'stopped' | 'starting' | 'restarting' | 'updating' | 'suspended';
  uptime: string;
  memory: string;
  cpu: number;
  version: string;
  commandsCount: number;
  qrCode?: string;
  prefix: string;
  cpuLimit?: number;       // CPU Limit % (e.g. 25, 50, 75, 100)
  memoryLimit?: number;    // Memory Allocation Limit MB (e.g. 128, 256, 512, 1024)
  autoRestart?: boolean;   // Auto Restart on Crash
  logLevel?: 'info' | 'warning' | 'error' | 'silent';
  aiResponder?: boolean;   // Smart AI auto-responder toggle
  
  // Extended resource and live metrics
  storageUsage?: string;
  storagePercent?: number;
  networkDown?: string;
  networkUp?: string;
  ping?: number;
  connectedUsers?: number;
  groupsCount?: number;
  privateChatsCount?: number;
  messagesToday?: number;
  errorsCount?: number;

  // Bot metadata
  avatar?: string;
  owner?: string;
  phone?: string;
  language?: string;
  timezone?: string;
  createdDate?: string;
  lastRestart?: string;
  database?: string;
  nodeVersion?: string;
  baileysVersion?: string;

  // Security badges
  twoFactor?: boolean;
  encrypted?: boolean;
  verified?: boolean;
  trusted?: boolean;
  webhookProtected?: boolean;
  rateLimited?: boolean;
}

export interface Command {
  id: string;
  trigger: string;
  prefix: string;
  description: string;
  category: 'Utility' | 'Fun' | 'Moderation' | 'AI' | 'Economy';
  isActive: boolean;
  code: string;
}

export interface BotFile {
  name: string;
  path: string;
  isDirectory: boolean;
  content?: string;
  size?: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: 'Admin' | 'Entertainment' | 'Automation' | 'Integrations';
  installed: boolean;
  author: string;
  rating: number;
  downloads: string;
  version: string;
  code?: string;           // Optional plugin executable script
  configSchema?: string;   // Optional configuration JSON schema / explanation
  customSettings?: Record<string, string>; // User custom settings for the plugin
}

export interface Session {
  id: string;
  device: string;
  location: string;
  activeAt: string;
  status: 'connected' | 'disconnected' | 'pending';
  ip: string;
}

export interface PortalUser {
  id: string;
  username: string;
  email: string;
  role: 'Administrator' | 'Developer' | 'Viewer';
  status: 'active' | 'suspended' | 'pending';
  avatar: string;
  createdAt?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'email' | 'sms' | 'authenticator' | 'authy' | 'microsoft';
  failedAttempts?: number;
  lockUntil?: number;
  recoveryCodes?: string[];
  securityScore?: number;
}

export interface LoginHistoryItem {
  id: string;
  date: string;
  time: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  location: string;
  ip: string;
  status: 'successful' | 'failed' | 'blocked';
  reason?: string;
}

export interface TrustedDevice {
  id: string;
  name: string;
  browser: string;
  os: string;
  ip: string;
  addedAt: string;
  expiresAt: string;
  lastUsed: string;
}

export interface SecurityAlert {
  id: string;
  type: 'NEW_LOGIN' | 'NEW_DEVICE' | 'PASSWORD_CHANGED' | '2FA_DISABLED' | 'SUSPICIOUS_LOGIN' | 'MULTIPLE_FAILED_ATTEMPTS' | 'IMPOSSIBLE_TRAVEL' | 'TOR_PROXY_DETECTED';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  ip: string;
  location?: string;
  resolved: boolean;
}

export interface LogLine {
  id: string;
  timestamp: string;
  type: 'info' | 'command' | 'error' | 'success' | 'warning' | 'mtls';
  message: string;
  source: string;
}

export interface Subscription {
  tier: string;
  hostedLimit: string;
  renewalDate: string;
  storageLimit: string;
  price: string;
  isUpgraded: boolean;
}

export interface MongoField {
  name: string;
  type: 'String' | 'Number' | 'Boolean' | 'Date' | 'ObjectId' | 'Array' | 'Mixed';
  required: boolean;
  unique: boolean;
  defaultValue?: string;
}

export interface MongoSchema {
  id: string;
  name: string;
  description: string;
  fields: MongoField[];
}

export interface MongoConfig {
  uri: string;
  isConnected: boolean;
}

export interface CopilotMemoryItem {
  id: string;
  category: 'knowledge' | 'project' | 'conversation' | 'ai_learning' | 'user' | 'platform';
  key: string;
  value: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CopilotWorkItem {
  id: string;
  timestamp: string;
  project: string;
  module: string;
  filesChanged: string[];
  summary: string;
  status: 'completed' | 'in_progress' | 'planned';
  details?: string;
}

export interface CopilotSuggestion {
  id: string;
  module: string;
  title: string;
  description: string;
  reasoning: string;
  actionType: 'connect_api' | 'security_fix' | 'optimize' | 'create_command' | 'inspect_logs';
  recommendedAgent: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CopilotSandboxDraft {
  id: string;
  title: string;
  trigger: string;
  code: string;
  description: string;
  category: string;
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

export interface CopilotAgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  avatarColor: string;
  domain: string;
  systemInstruction: string;
}

export interface CopilotAnalyticsStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  memoryHitsCount: number;
  memorySavesCount: number;
  toolExecutionsCount: number;
  providerUsage: Record<string, number>;
  activeProvider: string;
  memoryUsageCount: number;
  status: string;
}


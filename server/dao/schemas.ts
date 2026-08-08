import { z } from "zod";
import { DaoValidationError } from "./errors";

/**
 * Centralized Zod Validation Layer for GURU-XD DAO Architecture
 */

// 1. Bot Schema
export const BotSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Bot name is required").trim(),
  platform: z.enum(["WhatsApp", "Telegram"]),
  status: z.enum(["running", "stopped"]).default("stopped"),
  uptime: z.string().default("0m"),
  memory: z.string().default("128MB"),
  cpu: z.number().nonnegative().default(0),
  version: z.string().default("2.0.1"),
  commandsCount: z.number().int().nonnegative().default(0),
  prefix: z.string().default("."),
  qrCode: z.string().default(""),
  messagesToday: z.number().int().nonnegative().optional(),
  ping: z.number().nonnegative().optional(),
  errorsCount: z.number().int().nonnegative().optional(),
  storageUsage: z.string().optional(),
  storagePercent: z.number().optional(),
  networkDown: z.string().optional(),
  networkUp: z.string().optional(),
  connectedUsers: z.number().int().nonnegative().optional(),
  groupsCount: z.number().int().nonnegative().optional(),
  privateChatsCount: z.number().int().nonnegative().optional()
});

// 2. Command Schema
export const CommandSchema = z.object({
  id: z.string().optional(),
  trigger: z.string().min(1, "Command trigger is required").trim(),
  prefix: z.string().default("."),
  description: z.string().default("No description provided"),
  category: z.string().default("General"),
  isActive: z.boolean().default(true),
  code: z.string().default("// Command logic")
});

// 3. User Schema
export const UserSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(1, "Username is required").trim(),
  email: z.string().email("Invalid email address"),
  role: z.enum(["Administrator", "Developer", "Viewer"]).default("Developer"),
  status: z.enum(["active", "suspended"]).default("active"),
  avatar: z.string().default("/assets/avatars/default.jpg"),
  password: z.string().min(4).optional(),
  workspaceId: z.string().optional(),
  orgId: z.string().optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

// 3a. Workspace Schema
export const WorkspaceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Workspace name is required").trim(),
  ownerId: z.string().default("user-admin-root"),
  members: z.array(z.string()).default([]),
  status: z.enum(["active", "archived"]).default("active"),
  settings: z.record(z.string(), z.any()).default({}),
  version: z.string().default("1.0.0"),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

// 3b. Organization Schema (Future-Ready)
export const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Organization name is required").trim(),
  slug: z.string().min(1).trim(),
  plan: z.enum(["community", "pro", "enterprise"]).default("community"),
  ownerId: z.string().default("user-admin-root"),
  settings: z.record(z.string(), z.any()).default({}),
  createdAt: z.string().default(() => new Date().toISOString())
});

// 3c. Device Schema
export const DeviceSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  name: z.string().default("Default Device"),
  deviceType: z.enum(["desktop", "mobile", "tablet", "server"]).default("desktop"),
  os: z.string().default("Linux"),
  lastActiveAt: z.string().default(() => new Date().toISOString()),
  status: z.enum(["trusted", "untrusted", "revoked"]).default("trusted")
});

// 3d. Authentication Schema
export const AuthenticationSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  provider: z.enum(["local", "google", "github", "saml"]).default("local"),
  tokenHash: z.string().optional(),
  mfaEnabled: z.boolean().default(false),
  lastLoginAt: z.string().default(() => new Date().toISOString())
});

// 4. Plugin Schema
export const PluginSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Plugin name is required").trim(),
  description: z.string().default(""),
  category: z.string().default("Utility"),
  installed: z.boolean().default(false),
  author: z.string().default("Community"),
  rating: z.number().min(0).max(5).default(5.0),
  downloads: z.string().default("0"),
  version: z.string().default("1.0.0")
});

// 5. File Schema
export const FileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "File name is required").trim(),
  path: z.string().min(1, "File path is required").trim(),
  isDirectory: z.boolean().default(false),
  size: z.string().optional(),
  content: z.string().optional()
});

// 6. Session Schema
export const SessionSchema = z.object({
  id: z.string().optional(),
  device: z.string().min(1, "Device name is required").trim(),
  platform: z.enum(["WhatsApp", "Telegram"]),
  status: z.enum(["active", "disconnected"]).default("active"),
  connectedAt: z.string().default(() => new Date().toISOString())
});

// 7. Log Schema
export const LogSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string().default(() => new Date().toTimeString().split(" ")[0]),
  type: z.enum(["info", "success", "error", "warning"]),
  source: z.string().min(1, "Log source is required").trim(),
  message: z.string().min(1, "Log message is required").trim()
});

// 8. Copilot Memory Schema
export const CopilotMemorySchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1, "Memory key is required").trim(),
  content: z.string().min(1, "Memory content is required"),
  tags: z.array(z.string()).default([]),
  workspaceId: z.string().default("default-workspace"),
  category: z.string().default("general"),
  retentionDays: z.number().default(365),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().optional()
});

// 8a. Agent Schema
export const AgentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Agent name is required").trim(),
  role: z.string().default("assistant"),
  model: z.string().default("gemini-3.5-flash"),
  capabilities: z.array(z.string()).default([]),
  systemPrompt: z.string().default(""),
  status: z.enum(["active", "idle", "paused", "error"]).default("active"),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

// 8b. Conversation Schema
export const ConversationSchema = z.object({
  id: z.string().optional(),
  workspaceId: z.string().default("default-workspace"),
  userId: z.string().default("user-admin-root"),
  title: z.string().default("New Conversation"),
  agentId: z.string().default("guru-core"),
  status: z.enum(["active", "archived", "deleted"]).default("active"),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

// 8c. Message Schema
export const MessageSchema = z.object({
  id: z.string().optional(),
  conversationId: z.string().min(1, "Conversation ID is required"),
  senderRole: z.enum(["user", "assistant", "system", "tool"]).default("user"),
  content: z.string().min(1, "Message content is required"),
  reasoningMetadata: z.record(z.string(), z.any()).optional(),
  attachments: z.array(z.string()).default([]),
  createdAt: z.string().default(() => new Date().toISOString())
});

// 8d. Knowledge Schema
export const KnowledgeSchema = z.object({
  id: z.string().optional(),
  workspaceId: z.string().default("default-workspace"),
  title: z.string().min(1, "Title is required").trim(),
  content: z.string().min(1, "Content is required"),
  vectorEmbeddingRef: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["active", "archived"]).default("active"),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

// 8e. LearningRecord Schema
export const LearningRecordSchema = z.object({
  id: z.string().optional(),
  agentId: z.string().default("guru-core"),
  inputTrigger: z.string().min(1),
  actionTaken: z.string().min(1),
  userFeedback: z.enum(["positive", "negative", "neutral"]).default("neutral"),
  verifiedScore: z.number().min(0).max(1).default(1.0),
  timestamp: z.string().default(() => new Date().toISOString())
});

// 8f. Task Schema
export const TaskSchema = z.object({
  id: z.string().optional(),
  workspaceId: z.string().default("default-workspace"),
  conversationId: z.string().optional(),
  title: z.string().min(1, "Task title is required").trim(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]).default("pending"),
  assignedAgent: z.string().default("guru-core"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  result: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

// 8g. Execution Schema
export const ExecutionSchema = z.object({
  id: z.string().optional(),
  taskId: z.string().min(1),
  status: z.enum(["running", "success", "failed"]).default("running"),
  durationMs: z.number().nonnegative().default(0),
  error: z.string().optional(),
  logRef: z.string().optional(),
  startedAt: z.string().default(() => new Date().toISOString()),
  completedAt: z.string().optional()
});

// 8h. Application Schema
export const ApplicationSchema = z.object({
  id: z.string().optional(),
  workspaceId: z.string().default("default-workspace"),
  name: z.string().min(1, "Application name is required").trim(),
  description: z.string().default(""),
  status: z.enum(["idle", "building", "deployed", "stopped", "error"]).default("idle"),
  buildScript: z.string().default("npm run build"),
  envVars: z.record(z.string(), z.string()).default({}),
  version: z.string().default("1.0.0"),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

// 8i. Deployment Schema
export const DeploymentSchema = z.object({
  id: z.string().optional(),
  appId: z.string().min(1),
  environment: z.enum(["development", "staging", "production"]).default("production"),
  version: z.string().default("1.0.0"),
  status: z.enum(["pending", "building", "active", "failed", "rolled_back"]).default("pending"),
  url: z.string().optional(),
  deployedBy: z.string().default("system"),
  deployedAt: z.string().default(() => new Date().toISOString()),
  logs: z.array(z.string()).default([])
});

// 8j. Instance Schema
export const InstanceSchema = z.object({
  id: z.string().optional(),
  appId: z.string().min(1),
  instanceType: z.string().default("standard-1x"),
  cpu: z.number().default(1),
  memory: z.string().default("512MB"),
  status: z.enum(["starting", "healthy", "unhealthy", "stopped"]).default("healthy"),
  hostRegion: z.string().default("europe-west2"),
  startedAt: z.string().default(() => new Date().toISOString())
});

// 8k. Provider Schema
export const ProviderSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Provider name is required").trim(),
  type: z.enum(["ai", "cloud", "auth", "db"]).default("ai"),
  apiKeyConfig: z.record(z.string(), z.any()).default({}),
  isDefault: z.boolean().default(false),
  status: z.enum(["active", "inactive", "error"]).default("active")
});

// 8l. Notification Schema
export const NotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string().default("user-admin-root"),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  title: z.string().min(1).trim(),
  body: z.string().default(""),
  isRead: z.boolean().default(false),
  link: z.string().optional(),
  createdAt: z.string().default(() => new Date().toISOString())
});

// 8m. Settings Schema
export const SettingsSchema = z.object({
  id: z.string().optional(),
  scope: z.enum(["global", "workspace", "user"]).default("global"),
  scopeId: z.string().default("system"),
  theme: z.enum(["dark", "light", "system"]).default("dark"),
  notifications: z.record(z.string(), z.boolean()).default({ email: true, inApp: true }),
  featureFlags: z.record(z.string(), z.boolean()).default({}),
  updatedAt: z.string().default(() => new Date().toISOString())
});

// 8n. Analytics Schema
export const AnalyticsSchema = z.object({
  id: z.string().optional(),
  event: z.string().min(1).trim(),
  workspaceId: z.string().default("default-workspace"),
  userId: z.string().default("system"),
  payload: z.record(z.string(), z.any()).default({}),
  timestamp: z.string().default(() => new Date().toISOString())
});

// 8o. Telemetry Schema
export const TelemetrySchema = z.object({
  id: z.string().optional(),
  metricName: z.string().min(1).trim(),
  value: z.number(),
  tags: z.record(z.string(), z.string()).default({}),
  timestamp: z.string().default(() => new Date().toISOString())
});

// 8p. SecurityEvent Schema
export const SecurityEventSchema = z.object({
  id: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  eventType: z.string().min(1).trim(),
  actorId: z.string().default("system"),
  details: z.record(z.string(), z.any()).default({}),
  timestamp: z.string().default(() => new Date().toISOString())
});

// 8q. HealthStatus Schema
export const HealthStatusSchema = z.object({
  id: z.string().optional(),
  component: z.string().min(1).trim(),
  status: z.enum(["healthy", "degraded", "down"]).default("healthy"),
  latencyMs: z.number().nonnegative().default(0),
  lastCheckedAt: z.string().default(() => new Date().toISOString()),
  details: z.record(z.string(), z.any()).optional()
});

// 9. Audit Log Schema
export const AuditLogSchema = z.object({
  id: z.string().optional(),
  operation: z.enum(["CREATE", "UPDATE", "DELETE", "BULK_DELETE"]),
  timestamp: z.string().default(() => new Date().toISOString()),
  userId: z.string().default("system"),
  workspaceId: z.string().default("default-workspace"),
  entity: z.string().min(1, "Entity name is required").trim(),
  entityId: z.string().optional(),
  ipAddress: z.string().optional(),
  status: z.enum(["success", "failed"]).default("success"),
  details: z.any().optional()
});

/**
 * Validation helper function
 */
export function validateWithSchema<T>(schema: z.ZodSchema<any>, data: any, entityName: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((err) => `${err.path.join(".") || "value"}: ${err.message}`)
      .join("; ");
    throw new DaoValidationError(`[DAO VALIDATION ERROR - ${entityName.toUpperCase()}] ${errorDetails}`, entityName, result.error.issues);
  }
  return result.data as T;
}

export function validatePartialWithSchema<T>(schema: z.ZodObject<any>, data: any, entityName: string): Partial<T> {
  const partialSchema = schema.partial();
  const result = partialSchema.safeParse(data);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((err) => `${err.path.join(".") || "value"}: ${err.message}`)
      .join("; ");
    throw new DaoValidationError(`[DAO VALIDATION ERROR - ${entityName.toUpperCase()}] ${errorDetails}`, entityName, result.error.issues);
  }
  return result.data as Partial<T>;
}

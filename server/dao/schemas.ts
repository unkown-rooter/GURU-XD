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
  role: z.enum(["Administrator", "Developer", "Viewer"]),
  status: z.enum(["active", "suspended"]).default("active"),
  avatar: z.string().default("/assets/avatars/default.jpg"),
  password: z.string().min(4).optional()
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
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().optional()
});

// 9. Audit Log Schema
export const AuditLogSchema = z.object({
  id: z.string().optional(),
  operation: z.enum(["CREATE", "UPDATE", "DELETE", "BULK_DELETE"]),
  timestamp: z.string().default(() => new Date().toISOString()),
  userId: z.string().default("system"),
  entity: z.string().min(1, "Entity name is required").trim(),
  entityId: z.string().optional(),
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

import { DatabaseService, AuditLogEntry } from "../db";
import { AuditLogSchema } from "./schemas";
import { DaoValidationError } from "./errors";

export interface AuditContext {
  operation: "CREATE" | "UPDATE" | "DELETE" | "BULK_DELETE";
  entity: string;
  entityId?: string;
  userId?: string;
  details?: any;
}

/**
 * Audit Log recorder for DAO operations.
 * Validates against Zod AuditLogSchema and persists directly to 'auditLogs' collection in database.
 */
export function recordAuditLog(context: AuditContext): AuditLogEntry {
  const dbService = DatabaseService.getInstance();
  const db = dbService.read();

  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }

  const rawEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    operation: context.operation,
    timestamp: new Date().toISOString(),
    userId: context.userId && context.userId.trim() !== "" ? context.userId : "system",
    entity: context.entity,
    entityId: context.entityId,
    details: context.details
  };

  const parseResult = AuditLogSchema.safeParse(rawEntry);
  if (!parseResult.success) {
    const issues = parseResult.error.issues;
    throw new DaoValidationError(
      `[AUDIT LOG VALIDATION FAILED] ${issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      "AuditLog",
      issues
    );
  }

  const validatedEntry = parseResult.data as AuditLogEntry;
  db.auditLogs.push(validatedEntry);
  dbService.write(db);

  return validatedEntry;
}

/**
 * Centralized audit middleware function for DAO layer.
 * Intercepts or executes operations, logging operation type, timestamp, user ID, entity, and entity ID.
 */
export function auditMiddleware<T>(
  context: AuditContext,
  operationFn?: () => T
): T | AuditLogEntry {
  const auditRecord = recordAuditLog(context);
  if (operationFn) {
    return operationFn();
  }
  return auditRecord;
}

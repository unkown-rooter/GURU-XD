import { BaseDao } from "./BaseDao";
import { AuditLogEntry } from "../db";
import { AuditLogSchema, validateWithSchema, validatePartialWithSchema } from "./schemas";
import { PaginationOptions, PaginatedResult } from "./types";

export class AuditLogDao extends BaseDao<AuditLogEntry> {
  constructor() {
    super("auditLogs", "AuditLog");
  }

  protected override validateItem(entry: Partial<AuditLogEntry>, isUpdate: boolean = false): any {
    super.validateItem(entry, isUpdate);
    if (isUpdate) {
      return validatePartialWithSchema(AuditLogSchema, entry, "AuditLog");
    } else {
      return validateWithSchema(AuditLogSchema, entry, "AuditLog");
    }
  }

  /**
   * Find audit logs by user ID
   */
  public findByUser(userId: string, pagination?: PaginationOptions): PaginatedResult<AuditLogEntry> {
    return this.findMany((entry) => entry.userId === userId, pagination);
  }

  /**
   * Find audit logs by affected entity name
   */
  public findByEntity(entity: string, pagination?: PaginationOptions): PaginatedResult<AuditLogEntry> {
    return this.findMany((entry) => entry.entity.toLowerCase() === entity.toLowerCase(), pagination);
  }

  /**
   * Find audit logs by operation type
   */
  public findByOperation(
    operation: "CREATE" | "UPDATE" | "DELETE" | "BULK_DELETE",
    pagination?: PaginationOptions
  ): PaginatedResult<AuditLogEntry> {
    return this.findMany((entry) => entry.operation === operation, pagination);
  }
}

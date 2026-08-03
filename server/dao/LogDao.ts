import { BaseDao } from "./BaseDao";
import { Log } from "../db";
import { PaginationOptions, PaginatedResult } from "./types";
import { LogSchema, validateWithSchema, validatePartialWithSchema } from "./schemas";

export class LogDao extends BaseDao<Log> {
  constructor() {
    super("logs", "Log");
  }

  protected override validateItem(log: Partial<Log>, isUpdate: boolean = false): any {
    super.validateItem(log, isUpdate);
    if (isUpdate) {
      return validatePartialWithSchema(LogSchema, log, "Log");
    } else {
      return validateWithSchema(LogSchema, log, "Log");
    }
  }

  /**
   * Find logs by severity type ("info" | "success" | "warning" | "error")
   */
  public findByType(type: "info" | "success" | "warning" | "error", pagination?: PaginationOptions): PaginatedResult<Log> {
    return this.findMany((log) => log.type === type, pagination);
  }

  /**
   * Find logs by system component source (e.g., "SYSTEM", "COPILOT", "BOT_ENGINE")
   */
  public findBySource(source: string, pagination?: PaginationOptions): PaginatedResult<Log> {
    return this.findMany((log) => log.source.toLowerCase() === source.toLowerCase(), pagination);
  }

  /**
   * Search system logs with query
   */
  public searchLogs(query: string, pagination?: PaginationOptions): PaginatedResult<Log> {
    return this.findAll(
      {
        search: query,
        searchFields: ["message", "source", "type", "timestamp"]
      },
      pagination
    );
  }

  /**
   * Clear all logs or logs matching type
   */
  public clearLogs(typeFilter?: "info" | "success" | "warning" | "error", actor?: string): number {
    if (!typeFilter) {
      const count = this.getCollection().length;
      this.saveCollection([]);
      this.logAudit("BULK_DELETE", `Cleared all ${count} system log entries${actor ? ` by ${actor}` : ""}`, "warning");
      return count;
    }
    return this.deleteWhere((log) => log.type === typeFilter, actor);
  }
}

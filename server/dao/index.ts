import { DatabaseService } from "../db";
import { BotDao } from "./BotDao";
import { CommandDao } from "./CommandDao";
import { UserDao } from "./UserDao";
import { PluginDao } from "./PluginDao";
import { FileDao } from "./FileDao";
import { SessionDao } from "./SessionDao";
import { LogDao } from "./LogDao";
import { CopilotMemoryDao } from "./CopilotMemoryDao";
import { AuditLogDao } from "./AuditLogDao";
import { DaoTransactionError, categorizeDaoError } from "./errors";

export * from "./types";
export * from "./errors";
export * from "./schemas";
export * from "./auditMiddleware";
export * from "./BaseDao";
export * from "./BotDao";
export * from "./CommandDao";
export * from "./UserDao";
export * from "./PluginDao";
export * from "./FileDao";
export * from "./SessionDao";
export * from "./LogDao";
export * from "./CopilotMemoryDao";
export * from "./AuditLogDao";

export class DaoRegistry {
  private static instance: DaoRegistry;

  public readonly bot: BotDao;
  public readonly command: CommandDao;
  public readonly user: UserDao;
  public readonly plugin: PluginDao;
  public readonly file: FileDao;
  public readonly session: SessionDao;
  public readonly log: LogDao;
  public readonly copilotMemory: CopilotMemoryDao;
  public readonly auditLog: AuditLogDao;

  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.bot = new BotDao();
    this.command = new CommandDao();
    this.user = new UserDao();
    this.plugin = new PluginDao();
    this.file = new FileDao();
    this.session = new SessionDao();
    this.log = new LogDao();
    this.copilotMemory = new CopilotMemoryDao();
    this.auditLog = new AuditLogDao();
  }

  public static getInstance(): DaoRegistry {
    if (!DaoRegistry.instance) {
      DaoRegistry.instance = new DaoRegistry();
    }
    return DaoRegistry.instance;
  }

  /**
   * Execute atomic transaction wrapper across DAOs
   */
  public async withTransaction<R>(operation: (dao: DaoRegistry) => Promise<R> | R): Promise<R> {
    this.dbService.beginTransaction();
    try {
      const result = await operation(this);
      this.dbService.commitTransaction();
      return result;
    } catch (err) {
      this.dbService.rollbackTransaction();
      const categorized = categorizeDaoError(err);
      console.error("[DAO TRANSACTION ERROR] Rollback executed due to exception:", categorized);
      if (categorized instanceof DaoTransactionError) {
        throw categorized;
      }
      throw new DaoTransactionError(
        `Transaction failed during execution: ${categorized.message}`,
        categorized
      );
    }
  }

  /**
   * Get total entity counts across all platform tables
   */
  public getGlobalStats() {
    return {
      bots: this.bot.count(),
      commands: this.command.count(),
      users: this.user.count(),
      plugins: this.plugin.count(),
      files: this.file.count(),
      sessions: this.session.count(),
      logs: this.log.count(),
      copilotMemoryItems: this.copilotMemory.count(),
      auditLogs: this.auditLog.count()
    };
  }
}

// Global Singleton Export for convenient import across application services & controllers
export const dao = DaoRegistry.getInstance();

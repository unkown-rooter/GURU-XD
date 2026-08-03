import { BaseDao } from "./BaseDao";
import { Session } from "../db";
import { PaginationOptions, PaginatedResult } from "./types";
import { SessionSchema, validateWithSchema, validatePartialWithSchema } from "./schemas";

export class SessionDao extends BaseDao<Session> {
  constructor() {
    super("sessions", "Session");
  }

  protected override validateItem(session: Partial<Session>, isUpdate: boolean = false): any {
    super.validateItem(session, isUpdate);
    if (isUpdate) {
      return validatePartialWithSchema(SessionSchema, session, "Session");
    } else {
      return validateWithSchema(SessionSchema, session, "Session");
    }
  }

  /**
   * Find active sessions
   */
  public findActiveSessions(): Session[] {
    return this.getCollection().filter((session) => session.status === "active");
  }

  /**
   * Find sessions by platform (WhatsApp or Telegram)
   */
  public findByPlatform(platform: "WhatsApp" | "Telegram", pagination?: PaginationOptions): PaginatedResult<Session> {
    return this.findMany((session) => session.platform === platform, pagination);
  }

  /**
   * Disconnect a session by ID
   */
  public disconnectSession(sessionId: string, actor?: string): Session | null {
    return this.update(sessionId, { status: "disconnected" }, actor);
  }
}

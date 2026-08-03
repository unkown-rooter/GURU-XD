import { BaseDao } from "./BaseDao";
import { User } from "../db";
import { PaginationOptions, PaginatedResult } from "./types";
import { UserSchema, validateWithSchema, validatePartialWithSchema } from "./schemas";

export type SanitizedUser = Omit<User, "password">;

export class UserDao extends BaseDao<User> {
  constructor() {
    super("users", "User");
  }

  protected override validateItem(user: Partial<User>, isUpdate: boolean = false): any {
    super.validateItem(user, isUpdate);
    if (isUpdate) {
      return validatePartialWithSchema(UserSchema, user, "User");
    } else {
      return validateWithSchema(UserSchema, user, "User");
    }
  }

  /**
   * Find user by email address
   */
  public findByEmail(email: string): User | null {
    if (!email) return null;
    return this.findOne((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Find user by username
   */
  public findByUsername(username: string): User | null {
    if (!username) return null;
    return this.findOne((user) => user.username.toLowerCase() === username.toLowerCase());
  }

  /**
   * Find users by role
   */
  public findByRole(role: "Administrator" | "Developer" | "Viewer", pagination?: PaginationOptions): PaginatedResult<SanitizedUser> {
    const result = this.findMany((user) => user.role === role, pagination);
    return {
      ...result,
      data: result.data.map((u) => this.sanitizeUser(u))
    };
  }

  /**
   * Get all users with password fields stripped out for security
   */
  public findAllSanitized(query?: string, pagination?: PaginationOptions): PaginatedResult<SanitizedUser> {
    const rawResult = this.findAll(
      query ? { search: query, searchFields: ["username", "email", "role"] } : undefined,
      pagination
    );

    return {
      ...rawResult,
      data: rawResult.data.map((u) => this.sanitizeUser(u))
    };
  }

  /**
   * Strip sensitive password data from user entity
   */
  public sanitizeUser(user: User): SanitizedUser {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update user status (e.g. "active" | "suspended")
   */
  public setStatus(userId: string, status: "active" | "suspended", actor?: string): User | null {
    return this.update(userId, { status }, actor);
  }
}

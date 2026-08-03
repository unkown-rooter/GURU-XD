import { DatabaseService, DatabaseState } from "../db";
import { DaoValidationError } from "./errors";
import { auditMiddleware } from "./auditMiddleware";
import {
  IBaseDao,
  PaginationOptions,
  PaginatedResult,
  FilterOptions,
  DaoOperationResult
} from "./types";

export abstract class BaseDao<T extends { id?: string }> implements IBaseDao<T> {
  protected dbService: DatabaseService;
  protected collectionKey: keyof DatabaseState;
  protected entityName: string;

  constructor(collectionKey: keyof DatabaseState, entityName: string) {
    this.dbService = DatabaseService.getInstance();
    this.collectionKey = collectionKey;
    this.entityName = entityName;
  }

  /**
   * Helper to retrieve current raw collection array safely
   */
  protected getCollection(): T[] {
    const db = this.dbService.read();
    const collection = db[this.collectionKey];
    if (Array.isArray(collection)) {
      return collection as unknown as T[];
    }
    return [];
  }

  /**
   * Helper to update collection back into DatabaseState
   */
  protected saveCollection(items: T[]): void {
    const db = this.dbService.read();
    (db as any)[this.collectionKey] = items;
    this.dbService.write(db);
  }

  /**
   * Audit log helper
   */
  protected logAudit(
    action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "BULK_DELETE",
    details: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ): void {
    try {
      this.dbService.addLog(type, `DAO_${this.entityName.toUpperCase()}`, `[${action}] ${details}`);
    } catch (e) {
      console.error(`[DAO AUDIT ERROR] Failed to record audit log for ${this.entityName}:`, e);
    }
  }

  /**
   * Find all items with optional filtering and pagination
   */
  public findAll(filter?: FilterOptions, pagination?: PaginationOptions): PaginatedResult<T> {
    let items = [...this.getCollection()];

    // Apply generic filter options
    if (filter) {
      if (filter.search && filter.searchFields && filter.searchFields.length > 0) {
        const query = filter.search.toLowerCase();
        items = items.filter((item: any) =>
          filter.searchFields!.some((field) => {
            const val = item[field];
            return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
          })
        );
      }

      if (filter.where) {
        items = items.filter((item: any) =>
          Object.entries(filter.where!).every(([k, v]) => item[k] === v)
        );
      }
    }

    return this.paginate(items, pagination);
  }

  /**
   * Find item by unique ID
   */
  public findById(id: string): T | null {
    if (!id) return null;
    const items = this.getCollection();
    const match = items.find((item) => item.id === id);
    return match ? { ...match } : null;
  }

  /**
   * Find first item matching predicate
   */
  public findOne(predicate: (item: T) => boolean): T | null {
    const items = this.getCollection();
    const match = items.find(predicate);
    return match ? { ...match } : null;
  }

  /**
   * Find many items matching predicate with pagination
   */
  public findMany(predicate: (item: T) => boolean, pagination?: PaginationOptions): PaginatedResult<T> {
    const items = this.getCollection().filter(predicate);
    return this.paginate(items, pagination);
  }

  /**
   * Create a new item
   */
  public create(item: Omit<T, "id"> & { id?: string }, actor?: string): T {
    const validatedItem = this.validateItem(item, false) || item;
    const items = this.getCollection();

    const newId = (item as any).id || `${this.entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem = {
      ...validatedItem,
      id: newId
    } as unknown as T;

    items.push(newItem);
    this.saveCollection(items);

    if (this.collectionKey !== "auditLogs") {
      auditMiddleware({
        operation: "CREATE",
        entity: this.entityName,
        entityId: newId,
        userId: actor || "system",
        details: { id: newId }
      });
    }

    this.logAudit("CREATE", `Created ${this.entityName} ID: ${newId}${actor ? ` by ${actor}` : ""}`, "success");
    return { ...newItem };
  }

  /**
   * Update existing item by ID
   */
  public update(id: string, updates: Partial<T>, actor?: string): T | null {
    if (!id) return null;
    const items = this.getCollection();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const validatedUpdates = this.validateItem(updates, true) || updates;

    // Preserve ID
    const updated = {
      ...items[index],
      ...validatedUpdates,
      id
    };

    items[index] = updated;
    this.saveCollection(items);

    if (this.collectionKey !== "auditLogs") {
      auditMiddleware({
        operation: "UPDATE",
        entity: this.entityName,
        entityId: id,
        userId: actor || "system",
        details: { updates: validatedUpdates }
      });
    }

    this.logAudit("UPDATE", `Updated ${this.entityName} ID: ${id}${actor ? ` by ${actor}` : ""}`, "info");
    return { ...updated };
  }

  /**
   * Delete item by ID
   */
  public delete(id: string, actor?: string): boolean {
    if (!id) return false;
    const items = this.getCollection();
    const initialLength = items.length;
    const filtered = items.filter((item) => item.id !== id);

    if (filtered.length === initialLength) {
      return false;
    }

    this.saveCollection(filtered);

    if (this.collectionKey !== "auditLogs") {
      auditMiddleware({
        operation: "DELETE",
        entity: this.entityName,
        entityId: id,
        userId: actor || "system"
      });
    }

    this.logAudit("DELETE", `Deleted ${this.entityName} ID: ${id}${actor ? ` by ${actor}` : ""}`, "warning");
    return true;
  }

  /**
   * Delete multiple items matching predicate
   */
  public deleteWhere(predicate: (item: T) => boolean, actor?: string): number {
    const items = this.getCollection();
    const initialLength = items.length;
    const remaining = items.filter((item) => !predicate(item));
    const deletedCount = initialLength - remaining.length;

    if (deletedCount > 0) {
      this.saveCollection(remaining);
      if (this.collectionKey !== "auditLogs") {
        auditMiddleware({
          operation: "BULK_DELETE",
          entity: this.entityName,
          userId: actor || "system",
          details: { deletedCount }
        });
      }
      this.logAudit("BULK_DELETE", `Deleted ${deletedCount} ${this.entityName} records${actor ? ` by ${actor}` : ""}`, "warning");
    }

    return deletedCount;
  }

  /**
   * Count total items or items matching predicate
   */
  public count(predicate?: (item: T) => boolean): number {
    const items = this.getCollection();
    if (!predicate) return items.length;
    return items.filter(predicate).length;
  }

  /**
   * Check if item exists by ID
   */
  public exists(id: string): boolean {
    if (!id) return false;
    return this.getCollection().some((item) => item.id === id);
  }

  /**
   * Apply pagination and sorting
   */
  protected paginate(items: T[], pagination?: PaginationOptions): PaginatedResult<T> {
    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.max(1, Math.min(500, pagination?.limit || 50));
    const sortBy = pagination?.sortBy;
    const sortOrder = pagination?.sortOrder || "asc";

    let sorted = [...items];
    if (sortBy) {
      sorted.sort((a: any, b: any) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        return sortOrder === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    const total = sorted.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = sorted.slice(startIndex, startIndex + limit);

    return {
      data: paginatedItems,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  /**
   * Hook for entity subclass validation before database mutation
   */
  protected validateItem(item: any, isUpdate: boolean = false): any {
    if (!item || typeof item !== "object") {
      throw new DaoValidationError(`[DAO VALIDATION ERROR] Invalid item object for ${this.entityName}`, this.entityName);
    }
    return item;
  }
}

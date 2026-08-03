/**
 * Data Access Object (DAO) Architecture Types & Interfaces for GURU-XD
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FilterOptions {
  search?: string;
  searchFields?: string[];
  where?: Record<string, any>;
  [key: string]: any;
}

export interface DaoAuditEntry {
  timestamp: string;
  action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "BULK_DELETE" | "TRANSACTION";
  entity: string;
  entityId?: string;
  actor?: string;
  details?: string;
}

export interface DaoOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  affectedCount?: number;
}

export interface IBaseDao<T extends { id?: string }> {
  findAll(filter?: FilterOptions, pagination?: PaginationOptions): PaginatedResult<T>;
  findById(id: string): T | null;
  findOne(predicate: (item: T) => boolean): T | null;
  findMany(predicate: (item: T) => boolean, pagination?: PaginationOptions): PaginatedResult<T>;
  create(item: Omit<T, "id"> & { id?: string }, actor?: string): T;
  update(id: string, updates: Partial<T>, actor?: string): T | null;
  delete(id: string, actor?: string): boolean;
  deleteWhere(predicate: (item: T) => boolean, actor?: string): number;
  count(predicate?: (item: T) => boolean): number;
  exists(id: string): boolean;
}

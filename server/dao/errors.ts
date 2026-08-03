/**
 * Centralized DAO Error Handling Utility for GURU-XD
 * Provides categorized, typed custom error classes and standardized response formatting.
 */

export type DaoErrorCode =
  | "VALIDATION_ERROR"
  | "ENTITY_NOT_FOUND"
  | "DUPLICATE_ENTITY"
  | "STORAGE_ERROR"
  | "TRANSACTION_ERROR"
  | "UNAUTHORIZED"
  | "UNKNOWN_ERROR";

export interface DaoErrorResponsePayload {
  success: false;
  error: {
    code: DaoErrorCode;
    message: string;
    entity?: string;
    statusCode: number;
    details?: any;
    timestamp: string;
  };
}

export abstract class BaseDaoError extends Error {
  public readonly code: DaoErrorCode;
  public readonly entity?: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: DaoErrorCode,
    statusCode: number = 500,
    entity?: string,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.entity = entity;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintain prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toResponse(): DaoErrorResponsePayload {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        entity: this.entity,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

export class DaoValidationError extends BaseDaoError {
  constructor(message: string, entity?: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400, entity, details);
  }
}

export class DaoEntityNotFoundError extends BaseDaoError {
  constructor(entity: string, entityId?: string) {
    const msg = entityId
      ? `${entity} with ID '${entityId}' was not found.`
      : `${entity} entity was not found.`;
    super(msg, "ENTITY_NOT_FOUND", 404, entity, { entityId });
  }
}

export class DaoDuplicateEntityError extends BaseDaoError {
  constructor(entity: string, field: string, value: string) {
    super(
      `A duplicate ${entity} already exists with ${field}: '${value}'.`,
      "DUPLICATE_ENTITY",
      409,
      entity,
      { field, value }
    );
  }
}

export class DaoStorageError extends BaseDaoError {
  constructor(message: string, entity?: string, cause?: any) {
    super(message, "STORAGE_ERROR", 500, entity, cause);
  }
}

export class DaoTransactionError extends BaseDaoError {
  constructor(message: string, cause?: any) {
    super(message, "TRANSACTION_ERROR", 500, undefined, cause);
  }
}

export class DaoUnauthorizedError extends BaseDaoError {
  constructor(message: string = "Unauthorized database operation.", entity?: string) {
    super(message, "UNAUTHORIZED", 403, entity);
  }
}

export class DaoUnknownError extends BaseDaoError {
  constructor(message: string = "An unexpected error occurred during DAO execution.", entity?: string, cause?: any) {
    super(message, "UNKNOWN_ERROR", 500, entity, cause);
  }
}

/**
 * Standardized Error Categorizer and Formatter
 */
export function categorizeDaoError(err: unknown, entityName?: string): BaseDaoError {
  if (err instanceof BaseDaoError) {
    return err;
  }

  if (err && typeof err === "object" && "name" in err && (err as any).name === "ZodError") {
    const issues = (err as any).issues || [];
    const details = issues.map((i: any) => `${i.path.join(".") || "value"}: ${i.message}`).join("; ");
    return new DaoValidationError(`[VALIDATION FAILED] ${details}`, entityName, issues);
  }

  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("[DAO VALIDATION ERROR") || msg.includes("validation")) {
      return new DaoValidationError(msg, entityName, { originalMessage: msg });
    }
    if (msg.includes("not found") || msg.includes("404")) {
      return new DaoEntityNotFoundError(entityName || "Entity");
    }
    if (msg.includes("duplicate") || msg.includes("already exists") || msg.includes("E11000")) {
      return new DaoDuplicateEntityError(entityName || "Entity", "field", "value");
    }
    return new DaoStorageError(msg, entityName, { originalMessage: msg, stack: err.stack });
  }

  return new DaoUnknownError(String(err), entityName, err);
}

/**
 * Higher-order utility to wrap safe execution of DAO methods with standardized error handling
 */
export function executeSafeDaoOp<T>(
  operation: () => T,
  entityName?: string
): { success: true; data: T } | DaoErrorResponsePayload {
  try {
    const data = operation();
    return { success: true, data };
  } catch (err) {
    const categorized = categorizeDaoError(err, entityName);
    return categorized.toResponse();
  }
}

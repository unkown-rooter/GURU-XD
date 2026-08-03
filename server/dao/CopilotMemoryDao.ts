import { BaseDao } from "./BaseDao";
import { PaginationOptions, PaginatedResult } from "./types";
import { CopilotMemorySchema, validateWithSchema, validatePartialWithSchema } from "./schemas";

export interface CopilotMemoryRecord {
  id: string;
  key: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export class CopilotMemoryDao extends BaseDao<CopilotMemoryRecord> {
  constructor() {
    super("copilotMemory", "CopilotMemory");
  }

  protected override validateItem(memory: Partial<CopilotMemoryRecord>, isUpdate: boolean = false): any {
    super.validateItem(memory, isUpdate);
    if (isUpdate) {
      return validatePartialWithSchema(CopilotMemorySchema, memory, "CopilotMemory");
    } else {
      return validateWithSchema(CopilotMemorySchema, memory, "CopilotMemory");
    }
  }

  /**
   * Search AI memory by key or content keyword
   */
  public searchMemory(query: string, pagination?: PaginationOptions): PaginatedResult<CopilotMemoryRecord> {
    return this.findAll(
      {
        search: query,
        searchFields: ["key", "content", "tags"]
      },
      pagination
    );
  }

  /**
   * Store or update AI memory item key
   */
  public storeMemoryKey(key: string, content: string, tags?: string[], actor?: string): CopilotMemoryRecord {
    const existing = this.findOne((m) => m.key.toLowerCase() === key.toLowerCase());
    if (existing && existing.id) {
      const updated = this.update(
        existing.id,
        {
          content,
          tags: tags || existing.tags,
          updatedAt: new Date().toISOString()
        },
        actor
      );
      return updated!;
    }

    return this.create(
      {
        key,
        content,
        tags: tags || [],
        createdAt: new Date().toISOString()
      },
      actor
    );
  }
}

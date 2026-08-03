import { BaseDao } from "./BaseDao";
import { Command } from "../db";
import { PaginationOptions, PaginatedResult } from "./types";
import { CommandSchema, validateWithSchema, validatePartialWithSchema } from "./schemas";

export class CommandDao extends BaseDao<Command> {
  constructor() {
    super("commands", "Command");
  }

  protected override validateItem(command: Partial<Command>, isUpdate: boolean = false): any {
    super.validateItem(command, isUpdate);
    if (isUpdate) {
      return validatePartialWithSchema(CommandSchema, command, "Command");
    } else {
      return validateWithSchema(CommandSchema, command, "Command");
    }
  }

  /**
   * Find command by trigger string (e.g. "help", "alive")
   */
  public findByTrigger(trigger: string): Command | null {
    if (!trigger) return null;
    const cleanTrigger = trigger.startsWith(".") ? trigger.slice(1) : trigger;
    return this.findOne((cmd) => cmd.trigger.toLowerCase() === cleanTrigger.toLowerCase());
  }

  /**
   * Find commands by category
   */
  public findByCategory(category: string, pagination?: PaginationOptions): PaginatedResult<Command> {
    return this.findMany(
      (cmd) => cmd.category.toLowerCase() === category.toLowerCase(),
      pagination
    );
  }

  /**
   * Get all active commands
   */
  public findActiveCommands(): Command[] {
    return this.getCollection().filter((cmd) => cmd.isActive);
  }

  /**
   * Search commands by trigger, description, category, or code
   */
  public searchCommands(query: string, pagination?: PaginationOptions): PaginatedResult<Command> {
    return this.findAll(
      {
        search: query,
        searchFields: ["trigger", "description", "category", "code"]
      },
      pagination
    );
  }

  /**
   * Toggle command active state
   */
  public toggleActive(commandId: string, actor?: string): Command | null {
    const cmd = this.findById(commandId);
    if (!cmd) return null;
    return this.update(commandId, { isActive: !cmd.isActive }, actor);
  }
}

import { BaseDao } from "./BaseDao";
import { Plugin } from "../db";
import { PaginationOptions, PaginatedResult } from "./types";
import { PluginSchema, validateWithSchema, validatePartialWithSchema } from "./schemas";

export class PluginDao extends BaseDao<Plugin> {
  constructor() {
    super("plugins", "Plugin");
  }

  protected override validateItem(plugin: Partial<Plugin>, isUpdate: boolean = false): any {
    super.validateItem(plugin, isUpdate);
    if (isUpdate) {
      return validatePartialWithSchema(PluginSchema, plugin, "Plugin");
    } else {
      return validateWithSchema(PluginSchema, plugin, "Plugin");
    }
  }

  /**
   * Find all installed/active plugins
   */
  public findInstalled(): Plugin[] {
    return this.getCollection().filter((plugin) => plugin.installed);
  }

  /**
   * Find plugins by category
   */
  public findByCategory(category: string, pagination?: PaginationOptions): PaginatedResult<Plugin> {
    return this.findMany(
      (plugin) => plugin.category.toLowerCase() === category.toLowerCase(),
      pagination
    );
  }

  /**
   * Toggle plugin installation status
   */
  public toggleInstalled(pluginId: string, actor?: string): Plugin | null {
    const plugin = this.findById(pluginId);
    if (!plugin) return null;
    return this.update(pluginId, { installed: !plugin.installed }, actor);
  }

  /**
   * Search marketplace plugins
   */
  public searchPlugins(query: string, pagination?: PaginationOptions): PaginatedResult<Plugin> {
    return this.findAll(
      {
        search: query,
        searchFields: ["name", "description", "category", "author"]
      },
      pagination
    );
  }
}

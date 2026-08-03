import { DatabaseService } from "../db";
import { CopilotEngine } from "../copilotEngine";

/**
 * Tool Engine Module
 * Safely executes authorized platform tools on behalf of the AI with strict RBAC permission controls.
 */
export class ToolEngine {
  private static instance: ToolEngine;
  private dbService = DatabaseService.getInstance();

  private constructor() {}

  public static getInstance(): ToolEngine {
    if (!ToolEngine.instance) {
      ToolEngine.instance = new ToolEngine();
    }
    return ToolEngine.instance;
  }

  /**
   * Safely executes an authorized platform tool
   */
  public executeTool(toolName: string, args: any, userRole: string = 'Administrator'): any {
    return CopilotEngine.executeTool(toolName, args, userRole);
  }
}

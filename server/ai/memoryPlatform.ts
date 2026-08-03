import { DatabaseService } from "../db";
import { CopilotEngine, CopilotMemoryItem } from "../copilotEngine";

/**
 * Memory Platform Module
 * Provides unified interfaces for 3-tier persistent memory management across sessions and projects.
 */
export class MemoryPlatform {
  private static instance: MemoryPlatform;
  private dbService = DatabaseService.getInstance();

  private constructor() {}

  public static getInstance(): MemoryPlatform {
    if (!MemoryPlatform.instance) {
      MemoryPlatform.instance = new MemoryPlatform();
    }
    return MemoryPlatform.instance;
  }

  public getMemories(category?: 'knowledge' | 'project' | 'conversation' | 'ai_learning' | 'user' | 'platform'): CopilotMemoryItem[] {
    return CopilotEngine.getMemories(category);
  }

  public saveMemory(category: 'knowledge' | 'project' | 'conversation' | 'ai_learning' | 'user' | 'platform', key: string, value: string, tags: string[] = []): CopilotMemoryItem {
    return CopilotEngine.saveMemory(category, key, value, tags);
  }

  public deleteMemory(id: string): boolean {
    return CopilotEngine.deleteMemory(id);
  }
}

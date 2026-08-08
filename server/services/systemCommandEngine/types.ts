export type CommandPermission = 'Administrator' | 'Operator' | 'Viewer';

export type CommandOutputType = 'system' | 'success' | 'error' | 'warning' | 'info' | 'output' | 'ai';

export interface CommandOutputLine {
  text: string;
  type?: CommandOutputType;
  durationMs?: number;
}

export interface CommandContext {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  environment?: string;
  clientIp?: string;
}

export interface CommandResult {
  command: string;
  group?: string;
  action?: string;
  timestamp: string;
  outputLines: CommandOutputLine[];
  executionMs: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemCommandDefinition {
  id: string;
  group: string;
  action: string;
  aliases?: string[];
  description: string;
  requiredRole: CommandPermission;
  category: string;
  usage: string;
  examples?: string[];
  execute: (args: string[], context: CommandContext) => Promise<CommandOutputLine[]> | CommandOutputLine[];
}

export interface FuzzySuggestion {
  command: string;
  description: string;
  category: string;
  score: number;
}

export interface AutocompleteItem {
  trigger: string;
  description: string;
  category: string;
  usage: string;
  requiredRole: CommandPermission;
}

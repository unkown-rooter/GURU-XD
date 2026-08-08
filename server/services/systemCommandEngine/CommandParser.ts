import { commandRegistry } from './CommandRegistry';
import { SystemCommandDefinition, FuzzySuggestion } from './types';

export interface ParsedCommand {
  rawInput: string;
  matchedCommand?: SystemCommandDefinition;
  args: string[];
  fuzzySuggestions: FuzzySuggestion[];
  isExactMatch: boolean;
}

export class CommandParser {
  /**
   * Parse input terminal string into command definition & argument array
   */
  public parse(rawInput: string): ParsedCommand {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return {
        rawInput: '',
        args: [],
        fuzzySuggestions: [],
        isExactMatch: false
      };
    }

    const parts = trimmed.split(/\s+/);
    
    // First check 2-word group+action combination (e.g., "system status", "db backup", "logs errors")
    if (parts.length >= 2) {
      const twoWordCandidate = `${parts[0]} ${parts[1]}`.toLowerCase();
      const match2 = commandRegistry.findCommand(twoWordCandidate);
      if (match2) {
        return {
          rawInput: trimmed,
          matchedCommand: match2,
          args: parts.slice(2),
          fuzzySuggestions: [],
          isExactMatch: true
        };
      }
    }

    // Check single-word command or alias (e.g., "status", "ps", "bots", "plugins", "mtls", "ai", "help")
    const oneWordCandidate = parts[0].toLowerCase();
    const match1 = commandRegistry.findCommand(oneWordCandidate);
    if (match1) {
      return {
        rawInput: trimmed,
        matchedCommand: match1,
        args: parts.slice(1),
        fuzzySuggestions: [],
        isExactMatch: true
      };
    }

    // No exact match found -> find fuzzy suggestions using Levenshtein distance
    const fuzzySuggestions = commandRegistry.findClosestCommands(trimmed, 3);

    return {
      rawInput: trimmed,
      args: parts.slice(1),
      fuzzySuggestions,
      isExactMatch: false
    };
  }
}

export const commandParser = new CommandParser();

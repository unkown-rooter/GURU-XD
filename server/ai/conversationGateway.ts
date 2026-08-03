import { RequestOrchestrator } from "./requestOrchestrator";
import { ProviderResponse } from "./providerManager";
import { AIProgressCallback } from "./types";

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agentId?: string;
}

/**
 * Conversation Gateway Module for GURU-XD
 * Entrance point for user conversation messages.
 * Decouples Express controllers and UI chat endpoints from raw infrastructure services.
 */
export class ConversationGateway {
  private static instance: ConversationGateway;
  private orchestrator = RequestOrchestrator.getInstance();

  private constructor() {}

  public static getInstance(): ConversationGateway {
    if (!ConversationGateway.instance) {
      ConversationGateway.instance = new ConversationGateway();
    }
    return ConversationGateway.instance;
  }

  /**
   * Processes an incoming conversational chat message
   */
  public async handleConversationMessage(
    prompt: string,
    agentId: string = "guru-core",
    userRole: string = "Administrator",
    onProgress?: AIProgressCallback
  ): Promise<ProviderResponse> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt message cannot be empty.");
    }

    return this.orchestrator.orchestrateRequest(prompt, agentId, userRole, onProgress);
  }
}

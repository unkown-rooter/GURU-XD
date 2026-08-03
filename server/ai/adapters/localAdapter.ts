import { BaseProviderAdapter, ProviderGenerateOptions, ProviderGenerateResult } from "./baseAdapter";
import { ResponseComposer } from "../responseComposer";
import { COPILOT_AGENTS } from "../../copilotEngine";

export class LocalAdapter extends BaseProviderAdapter {
  id = "local-engine";
  name = "Local Context Synthesis Engine";
  type = "local";
  envVar = "LOCAL_SYNTHESIS_ENABLED";
  defaultModel = "guru-local-v1";

  public isConfigured(): boolean {
    return true; // Local synthesis is always available as default fallback
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }

  public async generateContent(options: ProviderGenerateOptions): Promise<ProviderGenerateResult> {
    const composer = ResponseComposer.getInstance();
    const matchedAgent = COPILOT_AGENTS.find(a => a.id === options.agentId) || COPILOT_AGENTS[0];
    const text = composer.synthesizeConversationalAnswer(options.prompt, matchedAgent);

    const promptTokens = this.estimateTokens(options.prompt);
    const completionTokens = this.estimateTokens(text);

    return {
      text,
      providerId: this.id,
      providerName: this.name,
      promptTokens,
      completionTokens,
      costUsd: 0.0,
      modelUsed: this.defaultModel
    };
  }
}

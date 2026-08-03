import { BaseProviderAdapter, ProviderGenerateOptions, ProviderGenerateResult } from "./baseAdapter";

export class OllamaAdapter extends BaseProviderAdapter {
  id = "ollama-local";
  name = "Ollama Local Instance";
  type = "ollama";
  envVar = "OLLAMA_URL";
  defaultModel = "llama3";

  public isConfigured(): boolean {
    const val = process.env[this.envVar];
    return typeof val === 'string' && val.trim().length > 0;
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const baseUrl = process.env[this.envVar] || "http://localhost:11434";
      const res = await this.fetchWithTimeout(`${baseUrl.replace(/\/$/, '')}/api/tags`, {}, 3000);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async generateContent(options: ProviderGenerateOptions): Promise<ProviderGenerateResult> {
    const baseUrl = process.env[this.envVar] || "http://localhost:11434";

    const res = await this.fetchWithTimeout(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.defaultModel,
        prompt: options.systemInstruction ? `${options.systemInstruction}\n\n${options.prompt}` : options.prompt,
        stream: false
      })
    }, 12000);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama API error [${res.status}]: ${errText.slice(0, 150)}`);
    }

    const data = await res.json();
    const text = data.response || "";
    const promptTokens = data.prompt_eval_count || this.estimateTokens(options.prompt);
    const completionTokens = data.eval_count || this.estimateTokens(text);

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

import { BaseProviderAdapter, ProviderGenerateOptions, ProviderGenerateResult } from "./baseAdapter";

export class XAIAdapter extends BaseProviderAdapter {
  id = "xai-primary";
  name = "xAI Grok 2";
  type = "xai";
  envVar = "XAI_API_KEY";
  defaultModel = "grok-2-latest";

  public async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const apiKey = process.env[this.envVar];
      const res = await this.fetchWithTimeout("https://api.x.ai/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey}` }
      }, 5000);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async generateContent(options: ProviderGenerateOptions): Promise<ProviderGenerateResult> {
    const apiKey = process.env[this.envVar];
    if (!apiKey) throw new Error(`Environment variable ${this.envVar} is missing.`);

    const messages = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    messages.push({ role: "user", content: options.prompt });

    const res = await this.fetchWithTimeout("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages,
        temperature: options.temperature || 0.7
      })
    }, 12000);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`xAI API error [${res.status}]: ${errText.slice(0, 150)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const promptTokens = data.usage?.prompt_tokens || this.estimateTokens(options.prompt);
    const completionTokens = data.usage?.completion_tokens || this.estimateTokens(text);

    return {
      text,
      providerId: this.id,
      providerName: this.name,
      promptTokens,
      completionTokens,
      costUsd: (promptTokens / 1000 * 0.002) + (completionTokens / 1000 * 0.010),
      modelUsed: this.defaultModel
    };
  }
}

import { BaseProviderAdapter, ProviderGenerateOptions, ProviderGenerateResult } from "./baseAdapter";

export class AnthropicAdapter extends BaseProviderAdapter {
  id = "anthropic-primary";
  name = "Anthropic Claude 3.5 Sonnet";
  type = "anthropic";
  envVar = "ANTHROPIC_API_KEY";
  defaultModel = "claude-3-5-sonnet-20241022";

  public async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const apiKey = process.env[this.envVar];
      // Test request to Anthropic API endpoint
      const res = await this.fetchWithTimeout("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey!,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }]
        })
      }, 5000);
      return res.ok || res.status === 400; // 400 can occur for valid token with edge syntax
    } catch {
      return false;
    }
  }

  public async generateContent(options: ProviderGenerateOptions): Promise<ProviderGenerateResult> {
    const apiKey = process.env[this.envVar];
    if (!apiKey) throw new Error(`Environment variable ${this.envVar} is missing.`);

    const res = await this.fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.defaultModel,
        max_tokens: options.maxTokens || 1024,
        system: options.systemInstruction || undefined,
        messages: [{ role: "user", content: options.prompt }]
      })
    }, 12000);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error [${res.status}]: ${errText.slice(0, 150)}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const promptTokens = data.usage?.input_tokens || this.estimateTokens(options.prompt);
    const completionTokens = data.usage?.output_tokens || this.estimateTokens(text);
    const costUsd = (promptTokens / 1000 * 0.003) + (completionTokens / 1000 * 0.015);

    return {
      text,
      providerId: this.id,
      providerName: this.name,
      promptTokens,
      completionTokens,
      costUsd,
      modelUsed: this.defaultModel
    };
  }
}

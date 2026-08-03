export interface ProviderGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  agentId?: string;
  userRole?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderGenerateResult {
  text: string;
  providerId: string;
  providerName: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  modelUsed: string;
}

export interface IAIProviderAdapter {
  id: string;
  name: string;
  type: string;
  envVar: string;
  defaultModel: string;
  
  isConfigured(): boolean;
  healthCheck(): Promise<boolean>;
  generateContent(options: ProviderGenerateOptions): Promise<ProviderGenerateResult>;
}

export abstract class BaseProviderAdapter implements IAIProviderAdapter {
  abstract id: string;
  abstract name: string;
  abstract type: string;
  abstract envVar: string;
  abstract defaultModel: string;

  public isConfigured(): boolean {
    const val = process.env[this.envVar];
    return typeof val === 'string' && val.trim().length > 0;
  }

  protected async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  protected estimateTokens(text: string): number {
    return Math.max(1, Math.round(text.length / 4));
  }

  abstract healthCheck(): Promise<boolean>;
  abstract generateContent(options: ProviderGenerateOptions): Promise<ProviderGenerateResult>;
}

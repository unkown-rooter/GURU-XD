import { ProviderManager } from "../server/ai/providerManager";
import { HealthMonitor } from "../server/ai/healthMonitor";
import { ConversationGateway } from "../server/ai/conversationGateway";

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runMultiProviderTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Provider Manager Discovery & Adapters Registration
  try {
    const providerManager = ProviderManager.getInstance();
    const ranked = providerManager.getRankedProviders();
    const passed = Array.isArray(ranked) && ranked.length > 0 && ranked.some(p => p.id === 'local-engine');
    results.push({
      name: "ProviderManager: Registers all enterprise adapters without crashing on missing keys",
      passed,
      error: passed ? undefined : "Ranked providers list empty or missing local engine fallback"
    });
  } catch (err: any) {
    results.push({
      name: "ProviderManager: Registers all enterprise adapters without crashing on missing keys",
      passed: false,
      error: err.message
    });
  }

  // Test 2: Health Monitor metrics for Enterprise Providers
  try {
    const healthMonitor = HealthMonitor.getInstance();
    const allProviders = healthMonitor.getAllProviders();
    const expectedIds = ["gemini-primary", "openai-primary", "groq-primary", "openrouter-primary", "github-primary", "ollama-local", "anthropic-primary", "deepseek-primary", "xai-primary", "local-engine"];
    const foundAll = expectedIds.every(id => allProviders.some(p => p.id === id));
    results.push({
      name: "HealthMonitor: Tracks metrics for all 9 supported enterprise providers plus local fallback",
      passed: foundAll,
      error: foundAll ? undefined : "Some expected provider metrics were missing in HealthMonitor"
    });
  } catch (err: any) {
    results.push({
      name: "HealthMonitor: Tracks metrics for all 9 supported enterprise providers plus local fallback",
      passed: false,
      error: err.message
    });
  }

  // Test 3: Seamless Conversation Gateway Output without Raw Leaks
  try {
    const gateway = ConversationGateway.getInstance();
    const res = await gateway.handleConversationMessage("Explain what GURU-XD is");
    const text = res.response;
    const passed = typeof text === 'string' &&
      text.length > 0 &&
      !text.includes("OPENAI_API_KEY") &&
      !text.includes("GEMINI_API_KEY") &&
      !text.includes("Circuit breaker TRIPPED");
    results.push({
      name: "ConversationGateway: Transparent user experience without raw API key or failover message leaks",
      passed,
      error: passed ? undefined : "Output contains raw provider secrets or internal failover logs"
    });
  } catch (err: any) {
    results.push({
      name: "ConversationGateway: Transparent user experience without raw API key or failover message leaks",
      passed: false,
      error: err.message
    });
  }

  return results;
}

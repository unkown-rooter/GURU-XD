import { ConversationGateway } from "../server/ai/conversationGateway";
import { RequestOrchestrator } from "../server/ai/requestOrchestrator";
import { ResponseComposer } from "../server/ai/responseComposer";
import { ContextEngine } from "../server/ai/contextEngine";
import { AIBrain } from "../server/ai/aiBrain";
import { KeywordEngine } from "../server/ai/keywordEngine";

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runAITests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Conversation Gateway
  try {
    const gateway = ConversationGateway.getInstance();
    const result = await gateway.handleConversationMessage("What is GURU-XD Core AI Engine?");
    const passed = typeof result.response === "string" && !result.response.includes("External AI model endpoints are currently experiencing heavy traffic");
    results.push({
      name: "ConversationGateway: Generates conversational response without raw diagnostic boilerplate",
      passed,
      error: passed ? undefined : "Returned diagnostic response instead of conversational answer"
    });
  } catch (err: any) {
    results.push({
      name: "ConversationGateway: Generates conversational response without raw diagnostic boilerplate",
      passed: false,
      error: err.message
    });
  }

  // Test 2: System Diagnostic Request versus Normal Question
  try {
    const composer = ResponseComposer.getInstance();
    const isDiag1 = composer.isSystemStatusInquiry("What is TypeScript?");
    const isDiag2 = composer.isSystemStatusInquiry("Show cluster status and active bots");
    const passed = !isDiag1 && isDiag2;
    results.push({
      name: "ResponseComposer: Correctly classifies system diagnostic vs conversational query",
      passed,
      error: passed ? undefined : "Classification failed"
    });
  } catch (err: any) {
    results.push({
      name: "ResponseComposer: Correctly classifies system diagnostic vs conversational query",
      passed: false,
      error: err.message
    });
  }

  // Test 3: Context Engine
  try {
    const contextEngine = ContextEngine.getInstance();
    const sysCtx = contextEngine.getSystemContext();
    const passed = typeof sysCtx.activeBotsCount === "number";
    results.push({
      name: "ContextEngine: Returns structured system context",
      passed,
      error: passed ? undefined : "activeBotsCount missing"
    });
  } catch (err: any) {
    results.push({
      name: "ContextEngine: Returns structured system context",
      passed: false,
      error: err.message
    });
  }

  // Test 4: AI Brain
  try {
    const brain = AIBrain.getInstance();
    const analysis = brain.analyzePrompt("Build a weather bot script");
    const passed = analysis.intent === 'CODE_GENERATION_REQUEST';
    results.push({
      name: "AIBrain: Correctly classifies code generation intent",
      passed,
      error: passed ? undefined : `Expected CODE_GENERATION_REQUEST, got ${analysis.intent}`
    });
  } catch (err: any) {
    results.push({
      name: "AIBrain: Correctly classifies code generation intent",
      passed: false,
      error: err.message
    });
  }

  // Test 5: Keyword Engine Intent & Greeting Classification
  try {
    const keywordEngine = KeywordEngine.getInstance();
    const detection = keywordEngine.detectKeywords("Hey Buddy! Good morning! Let's check GURU-XD hosting platform");
    const context = keywordEngine.buildKeywordContext("Hey Buddy! Good morning!");
    const passed = detection.primaryIntent === 'GREETING' && detection.matches.some(m => m.keyword === 'hey buddy') && typeof context.contextPrompt === 'string';
    results.push({
      name: "KeywordEngine: Accurately classifies greeting intent, normalizes keywords, and builds context",
      passed,
      error: passed ? undefined : `Classification or context generation failed. Detected intent: ${detection.primaryIntent}`
    });
  } catch (err: any) {
    results.push({
      name: "KeywordEngine: Accurately classifies greeting intent, normalizes keywords, and builds context",
      passed: false,
      error: err.message
    });
  }

  return results;
}

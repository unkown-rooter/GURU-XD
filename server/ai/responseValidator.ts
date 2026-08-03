import { AIValidationResult } from "./types";
import { ResponseComposer } from "./responseComposer";

/**
 * Response Validator Module
 * Validates generated AI responses for formatting, code syntax, safety, and verifies
 * that unrequested system diagnostic boilerplate is removed from standard conversation outputs.
 */
export class ResponseValidator {
  private static instance: ResponseValidator;
  private composer = ResponseComposer.getInstance();

  private constructor() {}

  public static getInstance(): ResponseValidator {
    if (!ResponseValidator.instance) {
      ResponseValidator.instance = new ResponseValidator();
    }
    return ResponseValidator.instance;
  }

  /**
   * Validates AI response structure, code syntax, and completeness
   */
  public validate(response: string, userPrompt: string): AIValidationResult {
    const issues: string[] = [];
    let syntaxValid = true;

    if (!response || response.trim().length === 0) {
      return {
        isValid: false,
        syntaxValid: false,
        formattingValid: false,
        antiHallucinationScore: 0,
        issues: ["Empty response received."]
      };
    }

    // Check code blocks syntax if JS code is returned
    const jsCodeBlocks = response.match(/```(?:js|javascript|cjs)\n([\s\S]*?)```/g);
    if (jsCodeBlocks) {
      for (const block of jsCodeBlocks) {
        const code = block.replace(/```(?:js|javascript|cjs)\n/, '').replace(/```$/, '');
        try {
          new Function('client', 'message', 'args', code);
        } catch (err: any) {
          syntaxValid = false;
          issues.push(`JS syntax error in code block: ${err.message}`);
        }
      }
    }

    // Check if system diagnostic string was accidentally returned for non-diagnostic query
    const isDiagInquiry = this.composer.isSystemStatusInquiry(userPrompt);
    if (!isDiagInquiry && response.includes("External AI model endpoints are currently experiencing heavy traffic")) {
      issues.push("Unrequested infrastructure diagnostic response detected for conversational query.");
    }

    const antiHallucinationScore = Math.max(50, 100 - (issues.length * 20));

    return {
      isValid: syntaxValid && issues.length === 0,
      syntaxValid,
      formattingValid: response.includes('#') || response.includes('*') || response.length < 200,
      antiHallucinationScore,
      issues
    };
  }
}

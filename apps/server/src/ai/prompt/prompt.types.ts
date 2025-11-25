/**
 * Few-Shot Example Interface
 *
 * Represents a complete story example used for Few-shot learning.
 * Each example teaches GPT-4 the desired output format, length, and style.
 *
 * Design Decision (from Sequential Thinking):
 * - Full-length examples (1700-1900 words) for quality over cost
 * - Tag-based matching using Jaccard similarity
 * - 3 examples per request for optimal learning
 */
export interface FewShotExample {
  /**
   * Example story title (Korean)
   */
  title: string;

  /**
   * Style tags (genre, mood, ending)
   * Used for Jaccard similarity matching with user requests
   */
  tags: string[];

  /**
   * Complete story content (1700-1900 words)
   * Full length ensures GPT-4 learns proper pacing and structure
   */
  content: string;

  /**
   * Word count (for validation)
   */
  wordCount: number;

  /**
   * Metadata for tracking
   */
  metadata?: {
    created: string;
    version: string;
    successRate?: number;
  };
}

/**
 * Prompt Build Result
 */
export interface PromptBuildResult {
  /**
   * Complete system prompt ready for OpenAI API
   */
  systemPrompt: string;

  /**
   * User message (task specification)
   */
  userPrompt: string;

  /**
   * Selected examples for this request
   */
  selectedExamples: FewShotExample[];

  /**
   * Token estimate
   */
  estimatedTokens: number;
}

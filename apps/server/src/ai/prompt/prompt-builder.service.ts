import { Injectable, Logger } from '@nestjs/common';
import { FewShotExample, PromptBuildResult } from './prompt.types';
import { SEED_EXAMPLES } from './examples.data';

/**
 * Prompt Builder Service
 *
 * Implements Few-shot learning strategy with tag-based example selection.
 *
 * Design Strategy (from Sequential Thinking MCP analysis):
 * 1. Use Jaccard similarity for tag matching
 * 2. Select top 3 most relevant examples per request
 * 3. Build layered prompt: Base + Writer Style + Examples + User Request
 * 4. Target token budget: ~12,000 tokens total
 *
 * Token Breakdown:
 * - Base instruction: ~500 tokens
 * - Writer systemPrompt: ~200-500 tokens
 * - 3 Few-shot examples: ~6000 tokens (3 × 2000)
 * - User request: ~100-200 tokens
 * - Response generation: ~4000 tokens
 * Total: ~11,000-12,000 tokens (comfortable within GPT-4 Turbo 128K limit)
 */
@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);
  private readonly examples: FewShotExample[] = SEED_EXAMPLES;

  /**
   * Build complete prompt for story generation
   *
   * @param writerSystemPrompt - Writer's unique style/voice (from Writer.systemPrompt)
   * @param requestTags - User's requested tags (1-3 tags)
   * @returns Complete system and user prompts with selected examples
   */
  buildPrompt(
    writerSystemPrompt: string,
    requestTags: string[],
  ): PromptBuildResult {
    this.logger.debug({
      event: 'prompt_build_started',
      requestTags,
    });

    // Step 1: Select top 3 examples by tag similarity
    const selectedExamples = this.selectExamples(requestTags, 3);

    this.logger.debug({
      event: 'examples_selected',
      count: selectedExamples.length,
      titles: selectedExamples.map((ex) => ex.title),
    });

    // Step 2: Build layered system prompt
    const systemPrompt = this.buildSystemPrompt(
      writerSystemPrompt,
      selectedExamples,
    );

    // Step 3: Build user task prompt
    const userPrompt = this.buildUserPrompt(requestTags);

    // Step 4: Estimate token usage (rough estimate: ~4 chars per token for Korean)
    const estimatedTokens = Math.ceil(
      (systemPrompt.length + userPrompt.length) / 4,
    );

    this.logger.debug({
      event: 'prompt_built',
      estimatedTokens,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
    });

    return {
      systemPrompt,
      userPrompt,
      selectedExamples,
      estimatedTokens,
    };
  }

  /**
   * Select examples using Jaccard similarity
   *
   * Algorithm:
   * 1. Calculate Jaccard similarity for each example
   * 2. Sort by similarity score (descending)
   * 3. Return top N examples
   * 4. If no matches (score = 0), return diverse fallback set
   *
   * @private
   */
  private selectExamples(
    requestTags: string[],
    count: number,
  ): FewShotExample[] {
    // Guard: Check if examples array is empty
    if (this.examples.length === 0) {
      this.logger.error({
        event: 'no_seed_examples',
        requestTags,
        message: 'SEED_EXAMPLES is empty - cannot select few-shot examples',
      });
      return [];
    }

    // Calculate similarity scores
    const scoredExamples = this.examples.map((example) => ({
      example,
      score: this.calculateJaccardSimilarity(example.tags, requestTags),
    }));

    // Sort by score descending
    scoredExamples.sort((a, b) => b.score - a.score);

    // Check if we have any matches (safely check array length first)
    const hasMatches = scoredExamples.length > 0 && scoredExamples[0].score > 0;

    if (!hasMatches) {
      // No tag matches - return diverse fallback set
      // Pick first N examples (they're already diverse in SEED_EXAMPLES)
      this.logger.warn({
        event: 'no_tag_matches',
        requestTags,
        fallbackStrategy: 'diverse_defaults',
      });
      return this.examples.slice(0, count);
    }

    // Return top N by similarity
    return scoredExamples.slice(0, count).map((s) => s.example);
  }

  /**
   * Calculate Jaccard similarity coefficient
   *
   * Formula: |A ∩ B| / |A ∪ B|
   * Where A and B are tag sets
   *
   * Returns: 0.0 (no overlap) to 1.0 (identical)
   *
   * @private
   */
  private calculateJaccardSimilarity(tags1: string[], tags2: string[]): number {
    const set1 = new Set(tags1);
    const set2 = new Set(tags2);

    // Intersection: tags in both sets
    const intersection = new Set([...set1].filter((tag) => set2.has(tag)));

    // Union: all unique tags from both sets
    const union = new Set([...set1, ...set2]);

    // Avoid division by zero
    if (union.size === 0) return 0;

    return intersection.size / union.size;
  }

  /**
   * Build layered system prompt
   *
   * Structure:
   * 1. Base Instruction (immutable)
   * 2. Writer's Style (from database)
   * 3. Few-shot Examples (tag-matched)
   * 4. Final Instructions
   *
   * @private
   */
  private buildSystemPrompt(
    writerSystemPrompt: string,
    examples: FewShotExample[],
  ): string {
    // Layer 1: Base instruction
    const baseInstruction = `당신은 뛰어난 한국어 단편 소설 작가입니다.

# 작가 스타일 학습

아래는 우수한 한국어 단편 소설의 예시들입니다. 이 예시들을 학습하여 같은 수준의 작품을 작성하세요.`;

    // Layer 2: Writer's unique style
    const writerStyle = `

# 당신의 작가 스타일

${writerSystemPrompt}`;

    // Layer 3: Few-shot examples
    const examplesSection = examples
      .map(
        (ex, idx) => `

## 예시 ${idx + 1}: ${ex.title}

**스타일**: ${ex.tags.join(', ')}
**단어 수**: ${ex.wordCount}단어

${ex.content}`,
      )
      .join('\n');

    // Layer 4: Final instructions
    const finalInstructions = `

# 작성 규칙 (반드시 준수)

1. **길이**: 정확히 1,500단어 이상 작성하세요. 1,500단어 미만으로 끝내지 마세요.
2. **구조**: 시작-중간-끝이 명확한 완전한 이야기를 작성하세요.
3. **문체**: 한국어 자연스러움을 최우선으로 하세요.
4. **캐릭터**: 등장인물의 성격과 동기가 명확해야 합니다.
5. **묘사**: 생동감 있고 구체적인 묘사를 사용하세요.
6. **플롯**: 논리적이고 흥미로운 전개를 유지하세요.

**중요**: 반드시 완전한 이야기로 마무리하세요. 1,500단어 이상 작성은 필수입니다.`;

    return baseInstruction + writerStyle + examplesSection + finalInstructions;
  }

  /**
   * Build user task prompt
   *
   * Specifies the requested style/tags and reinforces length requirement
   *
   * @private
   */
  private buildUserPrompt(requestTags: string[]): string {
    return `다음 스타일로 단편 소설을 작성해주세요:

- 장르/분위기/결말: ${requestTags.join(', ')}
- 길이: 1,500-2,000단어
- 구조: 완전한 시작-중간-끝

지금부터 1,500단어 이상의 완성된 소설을 작성하세요.`;
  }
}

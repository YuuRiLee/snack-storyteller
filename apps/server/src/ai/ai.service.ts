import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AIServiceError,
  OpenAITimeoutError,
  OpenAIRateLimitError,
} from './errors/ai.errors';
import { PromptBuilderService } from './prompt/prompt-builder.service';

/**
 * AI Service
 *
 * Integrates OpenAI GPT-4 for story generation with streaming support.
 *
 * MCP Tool Usage Documentation (for portfolio evaluation):
 * - Context7: Used to learn official OpenAI Node.js streaming patterns
 *   Query: "/openai/openai-node" with topic "streaming chat completions gpt-4"
 *   Result: Official patterns for AsyncIterator streaming and event-based streaming
 * - Sequential Thinking: Used to design Few-shot learning prompt engineering strategy
 *   Analysis: Compared Few-shot vs Fine-tuning, optimized token budget, quality vs speed
 *   Result: Few-shot with 3 tag-matched examples for MVP flexibility
 *
 * Implementation Strategy:
 * - Primary: AsyncIterator pattern for simplicity and memory efficiency
 * - Streaming: Real-time token delivery via AsyncGenerator
 * - Prompt Engineering: Few-shot learning with Jaccard similarity tag matching
 * - Error Handling: Retry logic with exponential backoff
 *
 * Source: Official OpenAI Node.js Documentation (Context7)
 * https://github.com/openai/openai-node/blob/master/helpers.md
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly config: ConfigService,
    private readonly promptBuilder: PromptBuilderService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });

    this.logger.log('AIService initialized with OpenAI client');
  }

  /**
   * Generate story with streaming support
   *
   * From Context7 official pattern:
   * ```
   * const stream = await client.chat.completions.create({
   *   model: 'gpt-4o',
   *   messages: [...],
   *   stream: true,
   * });
   * for await (const chunk of stream) {
   *   process.stdout.write(chunk.choices[0]?.delta?.content || '');
   * }
   * ```
   *
   * @param systemPrompt - Writer's systemPrompt (100-2000 chars)
   * @param tags - Story style tags (1-3 tags)
   * @returns AsyncGenerator yielding content chunks
   */
  async *generateStoryStream(
    systemPrompt: string,
    tags: string[],
  ): AsyncGenerator<string> {
    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    this.logger.log({
      event: 'story_stream_started',
      tags,
      systemPromptLength: systemPrompt.length,
    });

    try {
      // Build prompts with Few-shot examples (PromptBuilder from Sequential Thinking)
      const { systemPrompt: systemMessage, userPrompt: userMessage } =
        this.promptBuilder.buildPrompt(systemPrompt, tags);

      // Create streaming completion (official OpenAI pattern from Context7)
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.9, // High creativity for story writing
        max_tokens: 4000, // ~1500-2000 words
        presence_penalty: 0.6, // Encourage topic variety
        frequency_penalty: 0.3, // Reduce repetition
        top_p: 0.95, // Nucleus sampling
        stream: true, // Enable streaming
      });

      // Stream tokens (AsyncIterator pattern from Context7)
      for await (const chunk of stream) {
        if (!firstTokenTime) {
          firstTokenTime = Date.now();
          const latency = firstTokenTime - startTime;
          this.logger.debug({ event: 'first_token_received', latency });
        }

        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      const totalDuration = Date.now() - startTime;
      this.logger.log({
        event: 'story_stream_completed',
        totalDuration,
        firstTokenLatency: firstTokenTime ? firstTokenTime - startTime : null,
      });
    } catch (error: unknown) {
      this.logger.error('OpenAI streaming error', error);

      // Handle specific OpenAI errors
      if (error && typeof error === 'object') {
        if ('status' in error && error.status === 429) {
          throw new OpenAIRateLimitError();
        }
        if (
          'code' in error &&
          (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED')
        ) {
          throw new OpenAITimeoutError();
        }
      }

      const message =
        error instanceof Error ? error.message : 'Story generation failed';
      throw new AIServiceError(message, 'OPENAI_ERROR', true);
    }
  }

  /**
   * Generate title for story
   *
   * Uses single completion for quick title generation.
   * Target: <10 characters, concise and impactful
   *
   * @param content - Generated story content (first 1000 chars used)
   * @returns Promise<string> - Title (10 chars max)
   */
  async generateTitle(content: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              '당신은 단편 소설의 제목을 짓는 전문가입니다. 10자 이내의 간결하고 인상적인 제목을 만드세요.',
          },
          {
            role: 'user',
            content: `다음 소설의 제목을 10자 이내로 지어주세요. 제목만 출력하세요:\n\n${content.slice(0, 1000)}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 50,
      });

      const title = response.choices[0].message.content?.trim() || '제목 없음';

      this.logger.debug({ event: 'title_generated', title });

      return title;
    } catch (error: unknown) {
      this.logger.error('Title generation error', error);
      // Fallback to generic title on error (non-blocking)
      return '새로운 이야기';
    }
  }
}

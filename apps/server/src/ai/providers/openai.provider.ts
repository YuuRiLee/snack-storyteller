import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AIProvider,
  AIProviderConfig,
  AIProviderError,
} from './ai-provider.interface';
import { PromptBuilderService } from '../prompt/prompt-builder.service';

/**
 * OpenAI Provider
 *
 * Primary AI provider using OpenAI GPT-4o-mini for story generation.
 * Implements AIProvider interface for Fallback system compatibility.
 */
@Injectable()
export class OpenAIProvider implements AIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;
  readonly config: AIProviderConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly promptBuilder: PromptBuilderService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    this.client = new OpenAI({
      apiKey,
      timeout: this.configService.get<number>('OPENAI_TIMEOUT_MS', 60000),
    });

    this.config = {
      name: 'openai',
      priority: 1, // Primary provider
      enabled: !!apiKey,
      supportsStreaming: true,
      timeoutMs: this.configService.get<number>('OPENAI_TIMEOUT_MS', 60000),
      model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
    };

    this.logger.log('OpenAIProvider initialized', {
      enabled: this.config.enabled,
      model: this.config.model,
    });
  }

  /**
   * Generate story with streaming support
   */
  async *generateStoryStream(
    systemPrompt: string,
    tags: string[],
  ): AsyncGenerator<string> {
    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    this.logger.log({
      event: 'openai_stream_started',
      tags,
      systemPromptLength: systemPrompt.length,
      model: this.config.model,
    });

    try {
      // Build prompts with Few-shot examples
      const { systemPrompt: systemMessage, userPrompt: userMessage } =
        this.promptBuilder.buildPrompt(systemPrompt, tags);

      // Create streaming completion
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.9,
        max_tokens: 4000,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
        top_p: 0.95,
        stream: true,
      });

      // Stream tokens
      for await (const chunk of stream) {
        if (!firstTokenTime) {
          firstTokenTime = Date.now();
          this.logger.debug({
            event: 'openai_first_token',
            latency: firstTokenTime - startTime,
          });
        }

        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      this.logger.log({
        event: 'openai_stream_completed',
        duration: Date.now() - startTime,
        firstTokenLatency: firstTokenTime ? firstTokenTime - startTime : null,
      });
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate title for story
   * Uses the same model as story generation for cost efficiency
   */
  async generateTitle(content: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
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

      this.logger.debug({ event: 'openai_title_generated', title });

      return title;
    } catch (error: unknown) {
      this.logger.error('OpenAI title generation error', error);
      // Non-blocking: return default title
      return '새로운 이야기';
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple models.list call to verify API connectivity
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle OpenAI-specific errors and convert to AIProviderError
   */
  private handleError(error: unknown): AIProviderError {
    this.logger.error('OpenAI error', error);

    const originalError = error instanceof Error ? error : undefined;

    // Handle OpenAI specific error types
    if (error && typeof error === 'object') {
      // Rate limit error
      if ('status' in error && error.status === 429) {
        return new AIProviderError(
          'OpenAI rate limit exceeded',
          this.config.name,
          'RATE_LIMIT',
          true,
          originalError,
        );
      }

      // Timeout error
      if (
        'code' in error &&
        (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED')
      ) {
        return new AIProviderError(
          'OpenAI request timed out',
          this.config.name,
          'TIMEOUT',
          true,
          originalError,
        );
      }

      // Authentication error
      if ('status' in error && error.status === 401) {
        return new AIProviderError(
          'OpenAI authentication failed',
          this.config.name,
          'AUTHENTICATION',
          false,
          originalError,
        );
      }

      // Content filter
      if (
        'error' in error &&
        typeof error.error === 'object' &&
        error.error &&
        'code' in error.error &&
        error.error.code === 'content_filter'
      ) {
        return new AIProviderError(
          'Content filtered by OpenAI',
          this.config.name,
          'CONTENT_FILTER',
          true,
          originalError,
        );
      }

      // Server error (5xx)
      if (
        'status' in error &&
        typeof error.status === 'number' &&
        error.status >= 500
      ) {
        return new AIProviderError(
          'OpenAI server error',
          this.config.name,
          'SERVER_ERROR',
          true,
          originalError,
        );
      }
    }

    // Network error
    if (
      error instanceof Error &&
      (error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('network'))
    ) {
      return new AIProviderError(
        'Network error connecting to OpenAI',
        this.config.name,
        'NETWORK_ERROR',
        true,
        originalError,
      );
    }

    // Unknown error
    const message =
      error instanceof Error ? error.message : 'Unknown OpenAI error';
    return new AIProviderError(
      message,
      this.config.name,
      'UNKNOWN',
      true,
      originalError,
    );
  }
}

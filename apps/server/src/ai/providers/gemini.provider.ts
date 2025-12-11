import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIProvider,
  AIProviderConfig,
  AIProviderError,
} from './ai-provider.interface';
import { PromptBuilderService } from '../prompt/prompt-builder.service';

/**
 * Gemini API Response Types
 */
interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
  finishReason?: string;
}

interface GeminiStreamResponse {
  candidates?: GeminiCandidate[];
}

interface GeminiContentResponse {
  candidates?: GeminiCandidate[];
}

/**
 * Gemini Provider
 *
 * Fallback AI provider using Google Gemini 2.0 Flash.
 * Used when OpenAI is unavailable or rate-limited.
 *
 * Features:
 * - Fast response times
 * - Cost-effective (generous free tier)
 * - Good Korean language support
 */
@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string | undefined;
  readonly config: AIProviderConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly promptBuilder: PromptBuilderService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');

    this.config = {
      name: 'gemini',
      priority: 2, // Secondary provider
      enabled:
        !!this.apiKey &&
        this.configService.get<string>('GEMINI_ENABLED', 'false') === 'true',
      supportsStreaming: true,
      timeoutMs: Number(
        this.configService.get<string>('GEMINI_TIMEOUT_MS', '45000'),
      ),
      model: this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash'),
    };

    this.logger.log('GeminiProvider initialized', {
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
    if (!this.apiKey) {
      throw new AIProviderError(
        'Gemini API key not configured',
        this.config.name,
        'AUTHENTICATION',
        false,
      );
    }

    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    this.logger.log({
      event: 'gemini_stream_started',
      tags,
      systemPromptLength: systemPrompt.length,
      model: this.config.model,
    });

    try {
      // Build prompts
      const { systemPrompt: systemMessage, userPrompt: userMessage } =
        this.promptBuilder.buildPrompt(systemPrompt, tags);

      // Gemini API streaming request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:streamGenerateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemMessage}\n\n---\n\n${userMessage}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4000,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
            ],
          }),
          signal: AbortSignal.timeout(this.config.timeoutMs),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw this.handleHttpError(response.status, errorText);
      }

      if (!response.body) {
        throw new AIProviderError(
          'No response body from Gemini',
          this.config.name,
          'SERVER_ERROR',
          true,
        );
      }

      // Stream response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON objects from the stream
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === ',')
            continue;

          try {
            // Remove leading comma if present
            const jsonStr = trimmed.startsWith(',')
              ? trimmed.slice(1)
              : trimmed;
            const data = JSON.parse(jsonStr) as GeminiStreamResponse;

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              if (!firstTokenTime) {
                firstTokenTime = Date.now();
                this.logger.debug({
                  event: 'gemini_first_token',
                  latency: firstTokenTime - startTime,
                });
              }

              yield text;
            }

            // Check for safety blocks
            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
              throw new AIProviderError(
                'Content blocked by Gemini safety filters',
                this.config.name,
                'CONTENT_FILTER',
                true,
              );
            }
          } catch (parseError) {
            // Skip malformed JSON lines
            if (parseError instanceof AIProviderError) throw parseError;
          }
        }
      }

      this.logger.log({
        event: 'gemini_stream_completed',
        duration: Date.now() - startTime,
        firstTokenLatency: firstTokenTime ? firstTokenTime - startTime : null,
      });
    } catch (error: unknown) {
      if (error instanceof AIProviderError) throw error;
      throw this.handleError(error);
    }
  }

  /**
   * Generate title for story
   */
  async generateTitle(content: string): Promise<string> {
    if (!this.apiKey) {
      return '새로운 이야기';
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `당신은 단편 소설의 제목을 짓는 전문가입니다. 다음 소설의 제목을 10자 이내로 지어주세요. 제목만 출력하세요:\n\n${content.slice(0, 1000)}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 50,
            },
          }),
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = (await response.json()) as GeminiContentResponse;
      const title =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '제목 없음';

      this.logger.debug({ event: 'gemini_title_generated', title });

      return title;
    } catch (error: unknown) {
      this.logger.error('Gemini title generation error', error);
      return '새로운 이야기';
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Handle HTTP error status codes
   */
  private handleHttpError(status: number, errorText: string): AIProviderError {
    this.logger.error('Gemini HTTP error', { status, errorText });

    switch (status) {
      case 429:
        return new AIProviderError(
          'Gemini rate limit exceeded',
          this.config.name,
          'RATE_LIMIT',
          true,
        );
      case 401:
      case 403:
        return new AIProviderError(
          'Gemini authentication failed',
          this.config.name,
          'AUTHENTICATION',
          false,
        );
      case 400:
        return new AIProviderError(
          `Gemini invalid request: ${errorText}`,
          this.config.name,
          'INVALID_REQUEST',
          false,
        );
      default:
        if (status >= 500) {
          return new AIProviderError(
            'Gemini server error',
            this.config.name,
            'SERVER_ERROR',
            true,
          );
        }
        return new AIProviderError(
          `Gemini error: ${status}`,
          this.config.name,
          'UNKNOWN',
          true,
        );
    }
  }

  /**
   * Handle general errors
   */
  private handleError(error: unknown): AIProviderError {
    this.logger.error('Gemini error', error);

    const originalError = error instanceof Error ? error : undefined;

    // Timeout error
    if (error instanceof Error && error.name === 'TimeoutError') {
      return new AIProviderError(
        'Gemini request timed out',
        this.config.name,
        'TIMEOUT',
        true,
        originalError,
      );
    }

    // Network error
    if (
      error instanceof Error &&
      (error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED'))
    ) {
      return new AIProviderError(
        'Network error connecting to Gemini',
        this.config.name,
        'NETWORK_ERROR',
        true,
        originalError,
      );
    }

    // Unknown error
    const message =
      error instanceof Error ? error.message : 'Unknown Gemini error';
    return new AIProviderError(
      message,
      this.config.name,
      'UNKNOWN',
      true,
      originalError,
    );
  }
}

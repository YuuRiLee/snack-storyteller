import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  AIProvider,
  AIProviderError,
  FallbackEvent,
} from './providers/ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import {
  AIServiceError,
  OpenAITimeoutError,
  OpenAIRateLimitError,
  AIAllProvidersFailedError,
} from './errors/ai.errors';

/**
 * AI Service (Orchestrator)
 *
 * Multi-Provider Fallback System을 구현하는 오케스트레이터.
 *
 * 주요 기능:
 * - Provider 우선순위에 따른 자동 Fallback
 * - Circuit Breaker 패턴으로 장애 격리
 * - 투명한 Provider 전환 (호출자는 변경 불필요)
 *
 * Fallback 순서:
 * 1. OpenAI GPT-4o-mini (Primary)
 * 2. Google Gemini 1.5 Flash (Fallback)
 *
 * 사용법 (기존과 동일):
 * ```typescript
 * for await (const chunk of aiService.generateStoryStream(prompt, tags)) {
 *   console.log(chunk);
 * }
 * ```
 */
@Injectable()
export class AIService implements OnModuleInit {
  private readonly logger = new Logger(AIService.name);
  private providers: AIProvider[] = [];
  private fallbackEvents: FallbackEvent[] = [];

  constructor(
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly openaiProvider: OpenAIProvider,
    private readonly geminiProvider: GeminiProvider,
  ) {}

  onModuleInit() {
    // Initialize providers in priority order
    this.initializeProviders();
  }

  /**
   * Initialize and sort providers by priority
   */
  private initializeProviders(): void {
    const allProviders = [this.openaiProvider, this.geminiProvider];

    // Filter enabled providers and sort by priority
    this.providers = allProviders
      .filter((p) => p.config.enabled)
      .sort((a, b) => a.config.priority - b.config.priority);

    this.logger.log('AIService initialized', {
      providers: this.providers.map((p) => ({
        name: p.config.name,
        priority: p.config.priority,
        enabled: p.config.enabled,
      })),
    });

    if (this.providers.length === 0) {
      this.logger.error(
        'No AI providers are enabled! Story generation will fail.',
      );
    }
  }

  /**
   * Generate story with streaming support
   *
   * Implements automatic fallback:
   * 1. Try primary provider
   * 2. On failure, try next provider
   * 3. Repeat until success or all providers exhausted
   *
   * @param systemPrompt - Writer's systemPrompt (100-2000 chars)
   * @param tags - Story style tags (1-3 tags)
   * @returns AsyncGenerator yielding content chunks
   * @throws AIAllProvidersFailedError if all providers fail
   */
  async *generateStoryStream(
    systemPrompt: string,
    tags: string[],
  ): AsyncGenerator<string> {
    const startTime = Date.now();
    const errors: Array<{ provider: string; error: AIProviderError }> = [];

    this.logger.log({
      event: 'story_stream_started',
      tags,
      systemPromptLength: systemPrompt.length,
      availableProviders: this.providers.map((p) => p.config.name),
    });

    for (const provider of this.providers) {
      const providerName = provider.config.name;

      // Circuit Breaker check
      if (!this.circuitBreaker.canRequest(providerName)) {
        this.logger.warn({
          event: 'provider_skipped_circuit_open',
          provider: providerName,
        });
        continue;
      }

      try {
        this.logger.debug({
          event: 'trying_provider',
          provider: providerName,
        });

        // Stream from provider
        let hasYielded = false;
        for await (const chunk of provider.generateStoryStream(
          systemPrompt,
          tags,
        )) {
          hasYielded = true;
          yield chunk;
        }

        // Success - record and return
        if (hasYielded) {
          this.circuitBreaker.recordSuccess(providerName);

          this.logger.log({
            event: 'story_stream_completed',
            provider: providerName,
            duration: Date.now() - startTime,
          });

          return;
        }
      } catch (error: unknown) {
        const providerError =
          error instanceof AIProviderError
            ? error
            : new AIProviderError(
                error instanceof Error ? error.message : 'Unknown error',
                providerName,
                'UNKNOWN',
                true,
                error instanceof Error ? error : undefined,
              );

        // Record failure
        this.circuitBreaker.recordFailure(
          providerName,
          providerError.originalError,
        );
        errors.push({ provider: providerName, error: providerError });

        // Log fallback event
        const nextProvider = this.getNextAvailableProvider(provider);
        if (nextProvider) {
          this.recordFallbackEvent(
            providerName,
            nextProvider.config.name,
            providerError,
          );
        }

        this.logger.error({
          event: 'provider_failed',
          provider: providerName,
          error: providerError.message,
          code: providerError.code,
          retryable: providerError.retryable,
          willFallback: !!nextProvider,
        });

        // Continue to next provider if error is retryable
        if (!providerError.retryable) {
          // Non-retryable error - throw immediately
          throw this.convertToLegacyError(providerError);
        }
      }
    }

    // All providers failed
    const duration = Date.now() - startTime;
    this.logger.error({
      event: 'all_providers_failed',
      duration,
      errors: errors.map((e) => ({
        provider: e.provider,
        code: e.error.code,
        message: e.error.message,
      })),
    });

    throw new AIAllProvidersFailedError(
      errors.map((e) => e.provider),
      errors.map((e) => e.error),
    );
  }

  /**
   * Generate title for story
   *
   * Uses primary available provider for title generation.
   * Falls back silently on error (non-blocking).
   *
   * @param content - Generated story content (first 1000 chars used)
   * @returns Promise<string> - Title (10 chars max)
   */
  async generateTitle(content: string): Promise<string> {
    for (const provider of this.providers) {
      if (!this.circuitBreaker.canRequest(provider.config.name)) {
        continue;
      }

      try {
        const title = await provider.generateTitle(content);
        this.circuitBreaker.recordSuccess(provider.config.name);
        return title;
      } catch (error) {
        this.logger.warn({
          event: 'title_generation_failed',
          provider: provider.config.name,
          error: error instanceof Error ? error.message : 'Unknown',
        });
        // Continue to next provider
      }
    }

    // Fallback to default title
    return '새로운 이야기';
  }

  /**
   * Get current provider status for monitoring
   */
  getProviderStatus(): Array<{
    name: string;
    enabled: boolean;
    priority: number;
    circuitState: string;
    stats: {
      totalRequests: number;
      totalFailures: number;
      totalSuccesses: number;
    };
  }> {
    return this.providers.map((p) => {
      const stats = this.circuitBreaker.getStats(p.config.name);
      return {
        name: p.config.name,
        enabled: p.config.enabled,
        priority: p.config.priority,
        circuitState: stats.state,
        stats: {
          totalRequests: stats.totalRequests,
          totalFailures: stats.totalFailures,
          totalSuccesses: stats.totalSuccesses,
        },
      };
    });
  }

  /**
   * Get recent fallback events (for monitoring)
   */
  getRecentFallbackEvents(limit = 10): FallbackEvent[] {
    return this.fallbackEvents.slice(-limit);
  }

  /**
   * Reset all circuit breakers (admin operation)
   */
  resetAllCircuits(): void {
    this.circuitBreaker.resetAll();
    this.logger.log('All circuits reset by admin');
  }

  // Private helper methods

  private getNextAvailableProvider(
    currentProvider: AIProvider,
  ): AIProvider | null {
    const currentIndex = this.providers.indexOf(currentProvider);
    for (let i = currentIndex + 1; i < this.providers.length; i++) {
      const nextProvider = this.providers[i];
      if (this.circuitBreaker.canRequest(nextProvider.config.name)) {
        return nextProvider;
      }
    }
    return null;
  }

  private recordFallbackEvent(
    from: string,
    to: string,
    error: AIProviderError,
  ): void {
    const event: FallbackEvent = {
      fromProvider: from,
      toProvider: to,
      reason: error.message,
      errorCode: error.code,
      timestamp: new Date(),
    };

    this.fallbackEvents.push(event);

    // Keep only last 100 events
    if (this.fallbackEvents.length > 100) {
      this.fallbackEvents = this.fallbackEvents.slice(-100);
    }

    this.logger.warn({
      event: 'fallback_triggered',
      ...event,
    });
  }

  /**
   * Convert AIProviderError to legacy error types for backward compatibility
   */
  private convertToLegacyError(error: AIProviderError): Error {
    switch (error.code) {
      case 'TIMEOUT':
        return new OpenAITimeoutError();
      case 'RATE_LIMIT':
        return new OpenAIRateLimitError();
      default:
        return new AIServiceError(error.message, error.code, error.retryable);
    }
  }
}

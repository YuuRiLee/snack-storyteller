import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { PromptBuilderService } from './prompt/prompt-builder.service';
import { ModerationService } from './moderation/moderation.service';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';

/**
 * AI Module
 *
 * Multi-Provider AI Integration for story generation.
 *
 * Architecture:
 * - AIService: Orchestrator with automatic fallback
 * - Providers: OpenAI (primary), Gemini (fallback)
 * - CircuitBreaker: Fault tolerance and recovery
 *
 * Providers:
 * - AIService: Main orchestrator with fallback support
 * - OpenAIProvider: Primary AI provider (GPT-4o-mini)
 * - GeminiProvider: Fallback provider (Gemini 1.5 Flash)
 * - CircuitBreakerService: Provider health management
 * - PromptBuilderService: Few-shot prompt engineering
 * - ModerationService: Content safety filters
 *
 * Controllers:
 * - AIController: Status monitoring and testing endpoints
 *
 * Exports:
 * - AIService: Main service for story generation
 * - ModerationService: For content filtering in StoryService
 */
@Module({
  controllers: [AIController],
  providers: [
    // Core services
    AIService,
    PromptBuilderService,
    ModerationService,

    // Provider infrastructure
    CircuitBreakerService,
    OpenAIProvider,
    GeminiProvider,
  ],
  exports: [AIService, ModerationService],
})
export class AIModule {}

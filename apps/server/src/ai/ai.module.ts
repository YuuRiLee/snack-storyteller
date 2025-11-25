import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { PromptBuilderService } from './prompt/prompt-builder.service';
import { ModerationService } from './moderation/moderation.service';

/**
 * AI Module
 *
 * Provides OpenAI GPT-4 integration for story generation.
 *
 * Providers:
 * - AIService: Core story generation with streaming support
 * - PromptBuilderService: Few-shot prompt engineering with tag matching
 * - ModerationService: Content safety filters (Korean + OpenAI API)
 *
 * Exports:
 * - AIService: Main service for story generation
 * - ModerationService: For content filtering in StoryService
 */
@Module({
  providers: [AIService, PromptBuilderService, ModerationService],
  exports: [AIService, ModerationService],
})
export class AIModule {}

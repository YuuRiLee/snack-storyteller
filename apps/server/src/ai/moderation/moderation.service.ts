import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { KoreanFilter, ModerationResult } from './korean-filter';

/**
 * Moderation Service
 *
 * Two-stage content safety validation:
 * 1. Korean keyword filter (fast, local)
 * 2. OpenAI Moderation API (accurate, comprehensive)
 *
 * Workflow:
 * - Stage 1: Check Korean-specific blocked keywords
 * - If passed → Stage 2: OpenAI Moderation API
 * - If OpenAI fails → Pass through (avoid service disruption)
 *
 * Categories checked by OpenAI:
 * - sexual, hate, harassment, self-harm, sexual/minors,
 *   hate/threatening, violence/graphic, self-harm/intent,
 *   self-harm/instructions, harassment/threatening, violence
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly openai: OpenAI;
  private readonly koreanFilter: KoreanFilter;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
    this.koreanFilter = new KoreanFilter();

    this.logger.log('ModerationService initialized');
  }

  /**
   * Check content safety (2-stage validation)
   *
   * @param content - Text to validate
   * @returns ModerationResult { safe: boolean, reason?: string }
   */
  async checkContent(content: string): Promise<ModerationResult> {
    // Stage 1: Korean keyword filter (fast fail)
    const koreanCheck = this.koreanFilter.check(content);
    if (!koreanCheck.safe) {
      this.logger.warn('Korean filter blocked content', {
        reason: koreanCheck.reason,
      });
      return koreanCheck;
    }

    // Stage 2: OpenAI Moderation API
    try {
      const response = await this.openai.moderations.create({
        input: content,
      });

      const result = response.results[0];

      if (result.flagged) {
        // Extract flagged categories
        const categories = Object.entries(result.categories)
          .filter(([, flagged]) => flagged)
          .map(([category]) => category);

        this.logger.warn('OpenAI moderation flagged content', {
          categories,
        });

        return {
          safe: false,
          reason: `부적절한 콘텐츠 감지: ${categories.join(', ')}`,
        };
      }

      // Passed both stages
      return { safe: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error('Moderation API error', {
        error: errorMessage,
        stack: errorStack,
      });

      // Fail-open: If moderation API fails, pass through
      // Rationale: Better to allow borderline content than block service
      return { safe: true };
    }
  }
}

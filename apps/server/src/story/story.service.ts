import {
  Injectable,
  NotFoundException,
  Logger,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { ModerationService } from '../ai/moderation/moderation.service';
import {
  GenerateStoryDto,
  StoryFiltersDto,
  StoryDto,
  PaginatedStoriesDto,
} from './dto';

/**
 * Story Service
 *
 * Handles story generation, CRUD operations, and business logic.
 *
 * Key Features:
 * - Story generation with retry logic (max 3 attempts)
 * - Exponential backoff for transient failures
 * - Word count and read time calculation
 * - Pagination and filtering
 *
 * Success Criteria (from spec.md):
 * - Generation time < 30s
 * - Success rate > 95%
 * - 1500-2000 word stories
 */
@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly moderationService: ModerationService,
  ) {}

  /**
   * Generate story with retry logic
   *
   * Retry Strategy:
   * - Max 3 attempts
   * - Exponential backoff: 1s, 2s, 4s
   * - Retry on: AI errors, moderation failures, timeout
   *
   * @param dto - Generation parameters (writerId, tags)
   * @param userId - Authenticated user ID
   * @returns Generated and saved story
   */
  async generateStory(
    dto: GenerateStoryDto,
    userId: string,
  ): Promise<StoryDto> {
    const startTime = Date.now();

    // Validate writer exists
    const writer = await this.prisma.writer.findUnique({
      where: { id: dto.writerId },
    });

    if (!writer) {
      throw new NotFoundException(`Writer ${dto.writerId} not found`);
    }

    this.logger.log({
      event: 'story_generation_started',
      userId,
      writerId: dto.writerId,
      tags: dto.tags,
    });

    // Retry loop
    let content: string | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !content) {
      try {
        // Stream AI generation
        const chunks: string[] = [];
        for await (const chunk of this.aiService.generateStoryStream(
          writer.systemPrompt,
          dto.tags,
        )) {
          chunks.push(chunk);
        }

        const generated = chunks.join('');

        // Stage 1: Content moderation check
        const moderation = await this.moderationService.checkContent(generated);
        if (!moderation.safe) {
          this.logger.warn(
            `Moderation failed (attempt ${retryCount + 1}): ${moderation.reason}`,
          );
          retryCount++;
          continue;
        }

        // Stage 2: Minimum length check
        const wordCount = this.countWords(generated);
        if (wordCount < 1000) {
          this.logger.warn(
            `Story too short (${wordCount} words), retry ${retryCount + 1}`,
          );
          retryCount++;
          continue;
        }

        content = generated;
      } catch (error: unknown) {
        this.logger.error(
          `Generation failed (attempt ${retryCount + 1})`,
          error,
        );
        retryCount++;

        if (retryCount >= maxRetries) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)),
        );
      }
    }

    if (!content) {
      throw new Error('Story generation failed after 3 attempts');
    }

    // Generate title
    const title = await this.aiService.generateTitle(content);

    // Calculate metadata
    const wordCount = this.countWords(content);
    const readTime = Math.ceil(wordCount / 200); // 200 words/min

    // Save to database
    const story = await this.prisma.story.create({
      data: {
        title,
        content,
        tags: dto.tags,
        wordCount,
        readTime,
        writerId: dto.writerId,
        userId,
        isPublic: false, // Private by default
      },
      include: {
        writer: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    const duration = Date.now() - startTime;

    this.logger.log({
      event: 'story_generation_completed',
      userId,
      storyId: story.id,
      duration,
      wordCount,
      retryCount,
    });

    return story as StoryDto;
  }

  /**
   * Get user's stories with pagination
   *
   * @param userId - Filter by user
   * @param filters - Page, limit, search, tag, writerId
   * @returns Paginated story list
   */
  async getUserStories(
    userId: string,
    filters: StoryFiltersDto,
  ): Promise<PaginatedStoriesDto> {
    const { page = 1, limit = 20, search, tag, writerId } = filters;
    const skip = (page - 1) * limit;

    // Build where clause

    const where: any = { userId };

    if (search) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tag) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.tags = { has: tag };
    }

    if (writerId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.writerId = writerId;
    }

    // Execute queries in parallel

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
        skip,
        take: limit,
        include: {
          writer: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.prisma.story.count({ where }),
    ]);

    return {
      stories: stories as StoryDto[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single story by ID
   *
   * @param id - Story ID
   * @param userId - User ID for ownership check
   * @returns Story details
   */
  async getStoryById(id: string, userId: string): Promise<StoryDto> {
    const story = await this.prisma.story.findFirst({
      where: { id, userId },
      include: {
        writer: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    if (!story) {
      throw new NotFoundException(`Story ${id} not found`);
    }

    return story as StoryDto;
  }

  /**
   * Delete story
   *
   * @param id - Story ID
   * @param userId - User ID for ownership check
   */
  async deleteStory(id: string, userId: string): Promise<void> {
    const story = await this.prisma.story.findFirst({
      where: { id, userId },
    });

    if (!story) {
      throw new NotFoundException(`Story ${id} not found`);
    }

    await this.prisma.story.delete({ where: { id } });

    this.logger.log({
      event: 'story_deleted',
      userId,
      storyId: id,
    });
  }

  /**
   * Generate story with real-time streaming (SSE)
   *
   * Returns Observable that emits:
   * - { type: 'token', data: string } - Each generated token
   * - { type: 'done', data: StoryDto } - Final saved story
   * - { type: 'error', data: string } - Error message
   *
   * @param dto - Generation parameters
   * @param userId - Authenticated user ID
   * @returns Observable of MessageEvents
   */
  generateStoryStream(
    dto: GenerateStoryDto,
    userId: string,
  ): Observable<MessageEvent> {
    return new Observable((observer) => {
      void (async () => {
        const startTime = Date.now();

        try {
          // Find writer
          const writer = await this.prisma.writer.findUnique({
            where: { id: dto.writerId },
          });

          if (!writer) {
            observer.next({
              type: 'error',
              data: { message: `Writer ${dto.writerId} not found` },
            });
            observer.complete();
            return;
          }

          // Stream generation with retry
          let content: string | null = null;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries && !content) {
            try {
              const chunks: string[] = [];

              // Stream tokens to client
              for await (const chunk of this.aiService.generateStoryStream(
                writer.systemPrompt,
                dto.tags,
              )) {
                chunks.push(chunk);

                // Emit token event
                observer.next({
                  type: 'token',
                  data: { token: chunk },
                });
              }

              const generated = chunks.join('');

              // Stage 1: Moderation
              const moderation =
                await this.moderationService.checkContent(generated);
              if (!moderation.safe) {
                this.logger.warn(
                  `Moderation failed (attempt ${retryCount + 1}): ${moderation.reason}`,
                );
                retryCount++;

                // Notify client of retry
                observer.next({
                  type: 'retry',
                  data: {
                    reason: 'moderation_failed',
                    attempt: retryCount,
                    maxRetries,
                  },
                });
                continue;
              }

              // Stage 2: Length check
              const wordCount = this.countWords(generated);
              if (wordCount < 1000) {
                this.logger.warn(
                  `Story too short (${wordCount} words), retry ${retryCount + 1}`,
                );
                retryCount++;

                // Notify client of retry
                observer.next({
                  type: 'retry',
                  data: {
                    reason: 'too_short',
                    wordCount,
                    attempt: retryCount,
                    maxRetries,
                  },
                });
                continue;
              }

              content = generated;
            } catch (error: unknown) {
              this.logger.error(
                `Generation failed (attempt ${retryCount + 1})`,
                error,
              );
              retryCount++;

              if (retryCount >= maxRetries) {
                throw error;
              }

              // Notify client of retry
              observer.next({
                type: 'retry',
                data: {
                  reason: 'generation_error',
                  attempt: retryCount,
                  maxRetries,
                },
              });

              // Exponential backoff
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)),
              );
            }
          }

          if (!content) {
            throw new Error('Story generation failed after 3 attempts');
          }

          // Generate title
          const title = await this.aiService.generateTitle(content);

          // Calculate metadata
          const wordCount = this.countWords(content);
          const readTime = Math.ceil(wordCount / 200);

          // Save to database
          const story = await this.prisma.story.create({
            data: {
              title,
              content,
              tags: dto.tags,
              wordCount,
              readTime,
              writerId: dto.writerId,
              userId,
              isPublic: false,
            },
            include: {
              writer: {
                select: { id: true, name: true, imageUrl: true },
              },
            },
          });

          const duration = Date.now() - startTime;
          this.logger.log({
            event: 'story_generation_completed',
            userId,
            storyId: story.id,
            duration,
            wordCount,
            retryCount,
          });

          // Emit final story
          observer.next({
            type: 'done',
            data: story,
          });

          observer.complete();
        } catch (error: unknown) {
          this.logger.error('Story generation stream error', error);

          const message =
            error instanceof Error ? error.message : 'Generation failed';

          observer.next({
            type: 'error',
            data: { message },
          });

          observer.complete();
        }
      })();
    });
  }

  /**
   * Count words in Korean/English mixed text
   *
   * Strategy:
   * - Split on whitespace for English words
   * - Count Korean characters as words (1 char = 1 word approximation)
   *
   * @private
   */
  private countWords(text: string): number {
    // Remove excessive whitespace
    const cleaned = text.trim().replace(/\s+/g, ' ');

    // Split by spaces
    const tokens = cleaned.split(' ');

    let wordCount = 0;

    for (const token of tokens) {
      // Count Korean characters
      const koreanChars = token.match(/[\u3131-\uD79D]/g);
      if (koreanChars) {
        wordCount += koreanChars.length;
      }

      // Count English/Latin words
      const latinWords = token.match(/[a-zA-Z]+/g);
      if (latinWords) {
        wordCount += latinWords.length;
      }
    }

    return wordCount;
  }
}

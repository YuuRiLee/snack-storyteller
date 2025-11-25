import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookmarkDto,
  BookmarkWithStoryDto,
  PaginatedBookmarksDto,
} from './dto';

/**
 * Bookmark Service
 *
 * Handles bookmark CRUD operations.
 *
 * Features:
 * - Create bookmark (idempotent - returns existing if duplicate)
 * - Delete bookmark
 * - List bookmarked stories with pagination
 * - Check bookmark status
 *
 * Success Criteria:
 * - Toggle response < 200ms
 * - Idempotent create (no duplicate errors)
 */
@Injectable()
export class BookmarkService {
  private readonly logger = new Logger(BookmarkService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create bookmark (idempotent)
   *
   * If bookmark already exists, returns existing bookmark.
   * Uses upsert to ensure idempotent behavior.
   *
   * @param storyId - Story to bookmark
   * @param userId - User creating bookmark
   * @returns Created or existing bookmark
   */
  async createBookmark(storyId: string, userId: string): Promise<BookmarkDto> {
    // Verify story exists
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story ${storyId} not found`);
    }

    // Upsert for idempotent behavior
    const bookmark = await this.prisma.bookmark.upsert({
      where: {
        userId_storyId: { userId, storyId },
      },
      update: {}, // No update needed - just return existing
      create: {
        userId,
        storyId,
      },
    });

    this.logger.log({
      event: 'bookmark_created',
      userId,
      storyId,
      bookmarkId: bookmark.id,
    });

    return bookmark;
  }

  /**
   * Delete bookmark
   *
   * Removes bookmark if exists. No error if not found (idempotent).
   *
   * @param storyId - Story to unbookmark
   * @param userId - User removing bookmark
   */
  async deleteBookmark(storyId: string, userId: string): Promise<void> {
    // Use deleteMany for idempotent behavior (no error if not found)
    const result = await this.prisma.bookmark.deleteMany({
      where: {
        userId,
        storyId,
      },
    });

    if (result.count > 0) {
      this.logger.log({
        event: 'bookmark_deleted',
        userId,
        storyId,
      });
    }
  }

  /**
   * Toggle bookmark
   *
   * Creates bookmark if not exists, deletes if exists.
   * Returns new bookmark status.
   *
   * @param storyId - Story to toggle bookmark
   * @param userId - User toggling bookmark
   * @returns { isBookmarked: boolean, bookmark?: BookmarkDto }
   */
  async toggleBookmark(
    storyId: string,
    userId: string,
  ): Promise<{ isBookmarked: boolean; bookmark?: BookmarkDto }> {
    // Check if bookmark exists
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    });

    if (existing) {
      // Delete existing bookmark
      await this.deleteBookmark(storyId, userId);
      return { isBookmarked: false };
    } else {
      // Create new bookmark
      const bookmark = await this.createBookmark(storyId, userId);
      return { isBookmarked: true, bookmark };
    }
  }

  /**
   * Get bookmarked stories with pagination
   *
   * Returns user's bookmarked stories ordered by bookmark date (newest first).
   *
   * @param userId - User ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated bookmarks with story details
   */
  async getBookmarkedStories(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedBookmarksDto> {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              tags: true,
              wordCount: true,
              readTime: true,
              createdAt: true,
              writer: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.bookmark.count({ where: { userId } }),
    ]);

    return {
      bookmarks: bookmarks as BookmarkWithStoryDto[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if story is bookmarked by user
   *
   * @param storyId - Story ID
   * @param userId - User ID
   * @returns true if bookmarked, false otherwise
   */
  async isBookmarked(storyId: string, userId: string): Promise<boolean> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    });

    return !!bookmark;
  }

  /**
   * Get bookmark count for a story
   *
   * @param storyId - Story ID
   * @returns Number of bookmarks
   */
  async getBookmarkCount(storyId: string): Promise<number> {
    return this.prisma.bookmark.count({
      where: { storyId },
    });
  }
}

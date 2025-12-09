import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto, BookmarkDto, PaginatedBookmarksDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { getUserIdOrThrow } from '../common/utils';
import type { AuthUser } from '../auth/types/user.type';

interface RequestWithUser {
  user?: AuthUser;
}

/**
 * Bookmark Controller
 *
 * REST API endpoints for bookmark management.
 *
 * Routes:
 * - POST /bookmarks - Create bookmark (idempotent)
 * - POST /bookmarks/:storyId/toggle - Toggle bookmark status
 * - DELETE /bookmarks/:storyId - Remove bookmark
 * - GET /bookmarks - List bookmarked stories (paginated)
 * - GET /bookmarks/:storyId/status - Check bookmark status
 *
 * Authentication: All routes require JWT (JwtAuthGuard)
 */
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  /**
   * Create bookmark (idempotent)
   *
   * POST /bookmarks
   * Body: { storyId: string }
   *
   * Returns existing bookmark if already exists.
   * Response: BookmarkDto
   */
  @Post()
  async createBookmark(
    @Body() dto: CreateBookmarkDto,
    @Req() req: RequestWithUser,
  ): Promise<BookmarkDto> {
    const userId = getUserIdOrThrow(req);
    return this.bookmarkService.createBookmark(dto.storyId, userId);
  }

  /**
   * Toggle bookmark status
   *
   * POST /bookmarks/:storyId/toggle
   *
   * Creates bookmark if not exists, removes if exists.
   * Response: { isBookmarked: boolean, bookmark?: BookmarkDto }
   */
  @Post(':storyId/toggle')
  async toggleBookmark(
    @Param('storyId') storyId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ isBookmarked: boolean; bookmark?: BookmarkDto }> {
    const userId = getUserIdOrThrow(req);
    return this.bookmarkService.toggleBookmark(storyId, userId);
  }

  /**
   * Delete bookmark
   *
   * DELETE /bookmarks/:storyId
   *
   * Idempotent: No error if bookmark doesn't exist.
   * Response: 204 No Content
   */
  @Delete(':storyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBookmark(
    @Param('storyId') storyId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = getUserIdOrThrow(req);
    await this.bookmarkService.deleteBookmark(storyId, userId);
  }

  /**
   * List bookmarked stories
   *
   * GET /bookmarks?page=1&limit=20
   *
   * Returns paginated list of bookmarked stories.
   * Sorted by bookmark date (newest first).
   *
   * Query Parameters:
   * - page (default: 1)
   * - limit (default: 20, max: 50)
   *
   * Response: PaginatedBookmarksDto
   */
  @Get()
  async getBookmarkedStories(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Req() req: RequestWithUser,
  ): Promise<PaginatedBookmarksDto> {
    const userId = getUserIdOrThrow(req);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    return this.bookmarkService.getBookmarkedStories(userId, pageNum, limitNum);
  }

  /**
   * Check bookmark status
   *
   * GET /bookmarks/:storyId/status
   *
   * Response: { isBookmarked: boolean, count: number }
   */
  @Get(':storyId/status')
  async getBookmarkStatus(
    @Param('storyId') storyId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ isBookmarked: boolean; count: number }> {
    const userId = getUserIdOrThrow(req);

    const [isBookmarked, count] = await Promise.all([
      this.bookmarkService.isBookmarked(storyId, userId),
      this.bookmarkService.getBookmarkCount(storyId),
    ]);

    return { isBookmarked, count };
  }
}

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { StoryService } from './story.service';
import {
  GenerateStoryDto,
  GenerateStoryQueryDto,
  StoryFiltersDto,
  StoryDto,
  StoryWithBookmarkDto,
  StoryStatsDto,
  PaginatedStoriesDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { getUserIdOrThrow } from '../common/utils';
import type { AuthUser } from '../auth/types/user.type';

interface RequestWithUser {
  user?: AuthUser;
}

/**
 * Story Controller
 *
 * REST API endpoints for story management.
 *
 * Routes:
 * - POST /stories/generate - Generate new story
 * - GET /stories/generate/stream - Generate story with SSE streaming
 * - GET /stories/stats - Get user story statistics
 * - GET /stories - List user's stories (paginated, filtered, sorted)
 * - GET /stories/:id - Get single story with bookmark status
 * - DELETE /stories/:id - Delete story
 *
 * Authentication: All routes require JWT (JwtAuthGuard)
 * Rate Limiting: Generate endpoint limited to 10 stories/day (implemented in guard)
 */
@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  /**
   * Generate new story (non-streaming)
   *
   * POST /stories/generate
   * Body: { writerId: string, tags: string[] }
   *
   * Response: StoryDto (with id, title, content, etc.)
   * Success Criteria: < 30s response time, >95% success rate
   */
  @Post('generate')
  async generateStory(
    @Body() dto: GenerateStoryDto,
    @Req() req: RequestWithUser,
  ): Promise<StoryDto> {
    const userId = getUserIdOrThrow(req);
    return this.storyService.generateStory(dto, userId);
  }

  /**
   * Generate story with real-time streaming (SSE)
   *
   * GET /stories/generate/stream?writerId=xxx&tags=tag1,tag2,tag3
   *
   * Response: text/event-stream
   * - token: Real-time story generation tokens
   * - done: Final StoryDto with id and metadata
   * - error: Error message if generation fails
   *
   * Note: SSE requires GET (EventSource doesn't support POST)
   * Validation: Uses GenerateStoryQueryDto with Transform for tags parsing
   *
   * Success Criteria: First token < 2s, total < 30s
   */
  @Sse('generate/stream')
  generateStoryStream(
    @Query() queryDto: GenerateStoryQueryDto,
    @Req() req: RequestWithUser,
  ): Observable<MessageEvent> {
    const userId = getUserIdOrThrow(req);

    // DTO is already validated and transformed by ValidationPipe
    const dto: GenerateStoryDto = {
      writerId: queryDto.writerId,
      tags: queryDto.tags,
    };

    return this.storyService.generateStoryStream(dto, userId);
  }

  /**
   * Get user story statistics
   *
   * GET /stories/stats
   *
   * Response: StoryStatsDto
   * - totalStories: number
   * - totalWords: number
   * - totalReadTime: number
   * - averageWordCount: number
   * - topTags: Array<{ tag: string, count: number }>
   * - bookmarkedCount: number
   */
  @Get('stats')
  async getStats(@Req() req: RequestWithUser): Promise<StoryStatsDto> {
    const userId = getUserIdOrThrow(req);
    return this.storyService.getUserStats(userId);
  }

  /**
   * List user's stories
   *
   * GET /stories?page=1&limit=20&search=keyword&tag=로맨스&writerId=xxx&bookmarked=true&sort=createdAt&order=desc
   *
   * Query Parameters:
   * - page (default: 1)
   * - limit (default: 20, max: 50)
   * - search: Search in title and content (case-insensitive)
   * - tag: Filter by single tag
   * - writerId: Filter by writer
   * - bookmarked: Filter only bookmarked stories (boolean)
   * - sort: createdAt | wordCount | readTime (default: createdAt)
   * - order: asc | desc (default: desc)
   *
   * Response: PaginatedStoriesDto with isBookmarked field
   */
  @Get()
  async listStories(
    @Query() filters: StoryFiltersDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedStoriesDto> {
    const userId = getUserIdOrThrow(req);
    return this.storyService.getUserStories(userId, filters);
  }

  /**
   * Get single story with bookmark status
   *
   * GET /stories/:id
   *
   * Response: StoryWithBookmarkDto
   * - All StoryDto fields
   * - isBookmarked: boolean
   * - bookmarkCount: number
   */
  @Get(':id')
  async getStory(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<StoryWithBookmarkDto> {
    const userId = getUserIdOrThrow(req);
    return this.storyService.getStoryById(id, userId);
  }

  /**
   * Delete story
   *
   * DELETE /stories/:id
   *
   * Response: 204 No Content
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStory(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = getUserIdOrThrow(req);
    await this.storyService.deleteStory(id, userId);
  }
}

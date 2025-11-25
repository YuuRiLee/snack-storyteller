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
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { StoryService } from './story.service';
import {
  GenerateStoryDto,
  StoryFiltersDto,
  StoryDto,
  PaginatedStoriesDto,
} from './dto';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Story Controller
 *
 * REST API endpoints for story management.
 *
 * Routes:
 * - POST /stories/generate - Generate new story
 * - GET /stories - List user's stories (paginated)
 * - GET /stories/:id - Get single story
 * - DELETE /stories/:id - Delete story
 *
 * Authentication: All routes require JWT (JwtAuthGuard)
 * Rate Limiting: Generate endpoint limited to 10 stories/day (implemented in guard)
 */
@Controller('stories')
// @UseGuards(JwtAuthGuard) // TODO: Uncomment when auth is implemented
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
    // TODO: Get userId from JWT token (req.user.id)
    const userId = req.user?.id || 'mock-user-id';

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
   *
   * Success Criteria: First token < 2s, total < 30s
   */
  @Sse('generate/stream')
  generateStoryStream(
    @Query('writerId') writerId: string,
    @Query('tags') tagsParam: string,
    @Req() req: RequestWithUser,
  ): Observable<MessageEvent> {
    const userId = req.user?.id || 'mock-user-id';

    // Parse tags from comma-separated string
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

    // Create DTO
    const dto: GenerateStoryDto = {
      writerId,
      tags,
    };

    return this.storyService.generateStoryStream(dto, userId);
  }

  /**
   * List user's stories
   *
   * GET /stories?page=1&limit=20&search=keyword&tag=로맨스&writerId=xxx
   *
   * Response: PaginatedStoriesDto
   */
  @Get()
  async listStories(
    @Query() filters: StoryFiltersDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedStoriesDto> {
    const userId = req.user?.id || 'mock-user-id';

    return this.storyService.getUserStories(userId, filters);
  }

  /**
   * Get single story
   *
   * GET /stories/:id
   *
   * Response: StoryDto
   */
  @Get(':id')
  async getStory(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<StoryDto> {
    const userId = req.user?.id || 'mock-user-id';

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
    const userId = req.user?.id || 'mock-user-id';

    await this.storyService.deleteStory(id, userId);
  }
}

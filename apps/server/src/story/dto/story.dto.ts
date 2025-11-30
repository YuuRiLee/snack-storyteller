/**
 * Story DTO
 *
 * Response format for story data.
 * Includes computed fields (wordCount, readTime) and optional relations (writer).
 */
export class StoryDto {
  id: string;
  title: string;
  content: string;
  tags: string[];
  wordCount: number;
  readTime: number; // minutes
  writerId: string;
  writer?: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Story with Bookmark status
 *
 * Extended StoryDto with bookmark information.
 */
export class StoryWithBookmarkDto extends StoryDto {
  isBookmarked: boolean;
  bookmarkCount: number;
}

/**
 * Story Card DTO
 *
 * Lightweight story data for list views.
 * Includes preview instead of full content.
 */
export class StoryCardDto {
  id: string;
  title: string;
  preview: string; // First 200 chars of content
  tags: string[];
  wordCount: number;
  readTime: number;
  writer: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  isBookmarked: boolean;
  createdAt: Date;
}

/**
 * Story Statistics DTO
 *
 * Aggregated statistics for user's story library.
 */
export class StoryStatsDto {
  totalStories: number;
  totalWords: number;
  totalReadTime: number; // Total minutes to read all stories
  averageWordCount: number;
  topTags: Array<{ tag: string; count: number }>;
  bookmarkedCount: number;
}

/**
 * Paginated Story Response
 *
 * Standard pagination wrapper for story lists.
 */
export class PaginatedStoriesDto {
  stories: StoryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated Response with metadata
 *
 * Generic pagination structure for consistent API responses.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

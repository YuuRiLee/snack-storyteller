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
 * Paginated Story Response
 */
export class PaginatedStoriesDto {
  stories: StoryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

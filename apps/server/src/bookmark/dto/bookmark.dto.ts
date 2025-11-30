import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Create Bookmark DTO
 *
 * Request body for creating a bookmark.
 */
export class CreateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  storyId: string;
}

/**
 * Bookmark DTO
 *
 * Response format for bookmark data.
 */
export class BookmarkDto {
  id: string;
  userId: string;
  storyId: string;
  createdAt: Date;
}

/**
 * Bookmark with Story DTO
 *
 * Bookmark data with associated story details.
 */
export class BookmarkWithStoryDto extends BookmarkDto {
  story: {
    id: string;
    title: string;
    tags: string[];
    wordCount: number;
    readTime: number;
    createdAt: Date;
    writer: {
      id: string;
      name: string;
      imageUrl: string | null;
    };
  };
}

/**
 * Paginated Bookmarks Response
 */
export class PaginatedBookmarksDto {
  bookmarks: BookmarkWithStoryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

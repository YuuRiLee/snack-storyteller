/**
 * Story Types - Phase 5
 *
 * Type definitions for story-related data structures.
 */

import type { Writer } from './writer';

/**
 * Story DTO
 */
export interface Story {
  id: string;
  title: string;
  content: string;
  tags: string[];
  wordCount: number;
  readTime: number;
  writerId: string;
  writer?: Pick<Writer, 'id' | 'name' | 'imageUrl'>;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Story with bookmark status
 */
export interface StoryWithBookmark extends Story {
  isBookmarked: boolean;
  bookmarkCount: number;
}

/**
 * Story Card DTO - for list views
 */
export interface StoryCard {
  id: string;
  title: string;
  preview: string;
  tags: string[];
  wordCount: number;
  readTime: number;
  writer: Pick<Writer, 'id' | 'name' | 'imageUrl'>;
  isBookmarked: boolean;
  createdAt: string;
}

/**
 * Sort field options
 */
export type StorySortField = 'createdAt' | 'wordCount' | 'readTime';

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Story filter parameters
 */
export interface StoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  writerId?: string;
  bookmarked?: boolean;
  sort?: StorySortField;
  order?: SortOrder;
}

/**
 * Paginated stories response
 */
export interface PaginatedStories {
  stories: (Story & { isBookmarked: boolean })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Story statistics
 */
export interface StoryStats {
  totalStories: number;
  totalWords: number;
  totalReadTime: number;
  averageWordCount: number;
  topTags: Array<{ tag: string; count: number }>;
  bookmarkedCount: number;
}

/**
 * Bookmark DTO
 */
export interface Bookmark {
  id: string;
  userId: string;
  storyId: string;
  createdAt: string;
}

/**
 * Bookmark with story details
 */
export interface BookmarkWithStory extends Bookmark {
  story: {
    id: string;
    title: string;
    tags: string[];
    wordCount: number;
    readTime: number;
    createdAt: string;
    writer: Pick<Writer, 'id' | 'name' | 'imageUrl'>;
  };
}

/**
 * Paginated bookmarks response
 */
export interface PaginatedBookmarks {
  bookmarks: BookmarkWithStory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Toggle bookmark response
 */
export interface ToggleBookmarkResponse {
  isBookmarked: boolean;
  bookmark?: Bookmark;
}

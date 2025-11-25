/**
 * Bookmark API - Phase 5
 *
 * API functions for bookmark operations.
 */

import { api } from '../lib/api';
import type {
  Bookmark,
  PaginatedBookmarks,
  ToggleBookmarkResponse,
} from '../types';

/**
 * Create bookmark
 */
export async function createBookmark(storyId: string): Promise<Bookmark> {
  const response = await api.post<Bookmark>('/bookmarks', { storyId });
  return response.data;
}

/**
 * Toggle bookmark status
 */
export async function toggleBookmark(storyId: string): Promise<ToggleBookmarkResponse> {
  const response = await api.post<ToggleBookmarkResponse>(`/bookmarks/${storyId}/toggle`);
  return response.data;
}

/**
 * Delete bookmark
 */
export async function deleteBookmark(storyId: string): Promise<void> {
  await api.delete(`/bookmarks/${storyId}`);
}

/**
 * Get bookmarked stories
 */
export async function getBookmarkedStories(
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedBookmarks> {
  const response = await api.get<PaginatedBookmarks>(
    `/bookmarks?page=${page}&limit=${limit}`,
  );
  return response.data;
}

/**
 * Check bookmark status
 */
export async function getBookmarkStatus(
  storyId: string,
): Promise<{ isBookmarked: boolean; count: number }> {
  const response = await api.get<{ isBookmarked: boolean; count: number }>(
    `/bookmarks/${storyId}/status`,
  );
  return response.data;
}

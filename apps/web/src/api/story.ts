/**
 * Story API - Phase 5
 *
 * API functions for story library operations.
 */

import { api } from '../lib/api';
import type {
  Story,
  StoryWithBookmark,
  StoryFilters,
  PaginatedStories,
  StoryStats,
} from '../types';

/**
 * Build query string from filters
 */
function buildQueryString(filters: StoryFilters): string {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.writerId) params.set('writerId', filters.writerId);
  if (filters.bookmarked !== undefined) params.set('bookmarked', String(filters.bookmarked));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Get user's stories with filters
 */
export async function getStories(filters: StoryFilters = {}): Promise<PaginatedStories> {
  const query = buildQueryString(filters);
  const response = await api.get<PaginatedStories>(`/stories${query}`);
  return response.data;
}

/**
 * Get single story by ID
 */
export async function getStoryById(id: string): Promise<StoryWithBookmark> {
  const response = await api.get<StoryWithBookmark>(`/stories/${id}`);
  return response.data;
}

/**
 * Delete story
 */
export async function deleteStory(id: string): Promise<void> {
  await api.delete(`/stories/${id}`);
}

/**
 * Get user story statistics
 */
export async function getStoryStats(): Promise<StoryStats> {
  const response = await api.get<StoryStats>('/stories/stats');
  return response.data;
}

/**
 * Generate story request
 */
export interface GenerateStoryRequest {
  writerId: string;
  tags: string[];
}

/**
 * Generate new story (non-streaming)
 */
export async function generateStory(request: GenerateStoryRequest): Promise<Story> {
  const response = await api.post<Story>('/stories/generate', request);
  return response.data;
}

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStories, getStoryStats, toggleBookmark } from '../api';
import {
  StoryFilters,
  StoryCard,
  StoryCardSkeleton,
  Pagination,
  StoryStats,
} from '../components/story';
import type { StoryFilters as StoryFiltersType } from '../types';

/**
 * Library Page
 *
 * Main page for story library with:
 * - User statistics summary
 * - Search and filters
 * - Story card grid
 * - Pagination
 */
export function LibraryPage() {
  const queryClient = useQueryClient();

  // Filter state
  const [filters, setFilters] = React.useState<StoryFiltersType>({
    page: 1,
    limit: 12,
    sort: 'createdAt',
    order: 'desc',
  });

  // Fetch stories
  const {
    data: storiesData,
    isLoading: isStoriesLoading,
    error: storiesError,
  } = useQuery({
    queryKey: ['stories', filters],
    queryFn: () => getStories(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['storyStats'],
    queryFn: getStoryStats,
  });

  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: (storyId: string) => toggleBookmark(storyId),
    onMutate: async (storyId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['stories', filters] });

      const previousData = queryClient.getQueryData(['stories', filters]);

      queryClient.setQueryData(['stories', filters], (old: typeof storiesData) => {
        if (!old) return old;
        return {
          ...old,
          stories: old.stories.map((story) =>
            story.id === storyId
              ? { ...story, isBookmarked: !story.isBookmarked }
              : story,
          ),
        };
      });

      return { previousData };
    },
    onError: (err, storyId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['stories', filters], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch stats after bookmark change
      queryClient.invalidateQueries({ queryKey: ['storyStats'] });
    },
  });

  const handleBookmarkToggle = (storyId: string) => {
    bookmarkMutation.mutate(storyId);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extract unique tags from stories for filter dropdown
  const availableTags = React.useMemo(() => {
    if (!storiesData?.stories) return [];
    const tagSet = new Set<string>();
    storiesData.stories.forEach((story) => {
      story.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [storiesData]);

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">내 소설 라이브러리</h1>
        <p className="text-muted-foreground">
          생성된 소설을 검색하고 관리하세요
        </p>
      </div>

      {/* Stats */}
      {stats && <StoryStats stats={stats} />}

      {/* Filters */}
      <StoryFilters
        filters={filters}
        onFiltersChange={setFilters}
        tags={availableTags}
      />

      {/* Error State */}
      {storiesError && (
        <div className="text-center py-8">
          <p className="text-destructive">
            소설을 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['stories'] })}
            className="text-primary underline mt-2"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Loading State */}
      {isStoriesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Story Grid */}
      {storiesData && !isStoriesLoading && (
        <>
          {storiesData.stories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {filters.search || filters.tag || filters.bookmarked
                  ? '검색 결과가 없습니다.'
                  : '아직 생성된 소설이 없습니다.'}
              </p>
              {!filters.search && !filters.tag && !filters.bookmarked && (
                <p className="text-sm text-muted-foreground mt-2">
                  새로운 소설을 생성해보세요!
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storiesData.stories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onBookmarkToggle={handleBookmarkToggle}
                    isBookmarkLoading={
                      bookmarkMutation.isPending &&
                      bookmarkMutation.variables === story.id
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              {storiesData.totalPages > 1 && (
                <div className="pt-4">
                  <Pagination
                    currentPage={storiesData.page}
                    totalPages={storiesData.totalPages}
                    onPageChange={handlePageChange}
                    disabled={isStoriesLoading}
                  />
                </div>
              )}

              {/* Results Summary */}
              <p className="text-center text-sm text-muted-foreground">
                총 {storiesData.total}개의 소설 중{' '}
                {(storiesData.page - 1) * storiesData.limit + 1}-
                {Math.min(
                  storiesData.page * storiesData.limit,
                  storiesData.total,
                )}
                개 표시
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default LibraryPage;

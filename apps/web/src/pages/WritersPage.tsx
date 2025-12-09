import { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useWriterStore, useAuthStore } from '../stores';
import { WriterGallery } from '../components/writer';
import { Button } from '../components/ui';

export function WritersPage() {
  const { isAuthenticated } = useAuthStore();
  const { writers, genres, meta, isLoading, fetchWriters, fetchGenres } = useWriterStore();

  useEffect(() => {
    fetchWriters();
    fetchGenres();
  }, [fetchWriters, fetchGenres]);

  const handleSearch = useCallback(
    (query: string) => {
      fetchWriters({ q: query || undefined });
    },
    [fetchWriters],
  );

  const handleGenreFilter = useCallback(
    (genre: string | undefined) => {
      fetchWriters({ genre });
    },
    [fetchWriters],
  );

  const handleLoadMore = useCallback(() => {
    fetchWriters({ page: meta.page + 1 });
  }, [fetchWriters, meta.page]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">작가 둘러보기</h1>
            <p className="text-muted-foreground mt-1">
              다양한 스타일과 장르를 가진 AI 작가들을 만나보세요
            </p>
          </div>

          {isAuthenticated && (
            <Link to="/writers/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                작가 만들기
              </Button>
            </Link>
          )}
        </div>

        {/* Gallery */}
        <WriterGallery
          writers={writers}
          isLoading={isLoading}
          genres={genres}
          onSearch={handleSearch}
          onGenreFilter={handleGenreFilter}
          onLoadMore={handleLoadMore}
          hasMore={meta.page < meta.totalPages}
          emptyMessage="작가가 없습니다. 첫 번째 작가를 만들어보세요!"
        />
      </div>
    </div>
  );
}

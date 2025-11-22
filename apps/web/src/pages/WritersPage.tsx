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
            <h1 className="text-3xl font-bold text-foreground">Writers</h1>
            <p className="text-muted-foreground mt-1">
              Explore AI writer personas with unique styles and genres
            </p>
          </div>

          {isAuthenticated && (
            <Link to="/writers/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Writer
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
          emptyMessage="No writers found. Be the first to create one!"
        />
      </div>
    </div>
  );
}

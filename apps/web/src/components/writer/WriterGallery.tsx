import { useEffect, useState } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import type { Writer } from '../../types';
import { WriterCard } from './WriterCard';
import { Input, Badge, Button } from '../ui';
import { cn } from '../../lib/utils';

interface WriterGalleryProps {
  writers: Writer[];
  isLoading: boolean;
  genres: string[];
  showActions?: boolean;
  onSearch?: (query: string) => void;
  onGenreFilter?: (genre: string | undefined) => void;
  onEdit?: (writer: Writer) => void;
  onDelete?: (writer: Writer) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
}

export function WriterGallery({
  writers,
  isLoading,
  genres,
  showActions = false,
  onSearch,
  onGenreFilter,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore = false,
  emptyMessage = '작가를 찾을 수 없습니다',
}: WriterGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleGenreClick = (genre: string) => {
    const newGenre = selectedGenre === genre ? undefined : genre;
    setSelectedGenre(newGenre);
    onGenreFilter?.(newGenre);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="작가 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          필터
          {selectedGenre && (
            <Badge variant="secondary" className="ml-1">
              1
            </Badge>
          )}
        </Button>
      </div>

      {/* Genre Filters */}
      {showFilters && genres.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border/50 bg-muted/30 p-4">
          <span className="mr-2 text-sm font-medium text-muted-foreground">장르:</span>
          {genres.map((genre) => (
            <Badge
              key={genre}
              variant={selectedGenre === genre ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                selectedGenre === genre ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
              onClick={() => handleGenreClick(genre)}
            >
              {genre}
            </Badge>
          ))}
          {selectedGenre && (
            <button
              onClick={() => {
                setSelectedGenre(undefined);
                onGenreFilter?.(undefined);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              필터 초기화
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && writers.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && writers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground">{emptyMessage}</p>
        </div>
      )}

      {/* Writer Grid */}
      {writers.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {writers.map((writer) => (
            <WriterCard
              key={writer.id}
              writer={writer}
              showActions={showActions}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                불러오는 중...
              </>
            ) : (
              '더 보기'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

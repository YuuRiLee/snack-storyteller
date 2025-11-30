import * as React from 'react';
import { Input, Select, Button } from '../ui';
import type { StoryFilters as StoryFiltersType, StorySortField, SortOrder } from '../../types';

interface StoryFiltersProps {
  filters: StoryFiltersType;
  onFiltersChange: (filters: StoryFiltersType) => void;
  tags?: string[];
  writers?: Array<{ id: string; name: string }>;
  showBookmarkFilter?: boolean;
}

const sortOptions: Array<{ value: StorySortField; label: string }> = [
  { value: 'createdAt', label: '최신순' },
  { value: 'wordCount', label: '길이순' },
  { value: 'readTime', label: '읽기 시간순' },
];

const orderOptions: Array<{ value: SortOrder; label: string }> = [
  { value: 'desc', label: '내림차순' },
  { value: 'asc', label: '오름차순' },
];

/**
 * StoryFilters Component
 *
 * Filter controls for story library:
 * - Search input (debounced)
 * - Tag filter dropdown
 * - Writer filter dropdown
 * - Bookmark filter toggle
 * - Sort field and order
 */
export function StoryFilters({
  filters,
  onFiltersChange,
  tags = [],
  writers = [],
  showBookmarkFilter = true,
}: StoryFiltersProps) {
  const [searchInput, setSearchInput] = React.useState(filters.search || '');
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined, page: 1 });
    }, 300);
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({ ...filters, tag: value || undefined, page: 1 });
  };

  const handleWriterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({ ...filters, writerId: value || undefined, page: 1 });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as StorySortField;
    onFiltersChange({ ...filters, sort: value, page: 1 });
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SortOrder;
    onFiltersChange({ ...filters, order: value, page: 1 });
  };

  const handleBookmarkToggle = () => {
    onFiltersChange({
      ...filters,
      bookmarked: filters.bookmarked ? undefined : true,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      sort: 'createdAt',
      order: 'desc',
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.tag ||
    filters.writerId ||
    filters.bookmarked ||
    filters.sort !== 'createdAt' ||
    filters.order !== 'desc';

  // Tag options
  const tagOptions = [
    { value: '', label: '전체 태그' },
    ...tags.map((tag) => ({ value: tag, label: tag })),
  ];

  // Writer options
  const writerOptions = [
    { value: '', label: '전체 작가' },
    ...writers.map((w) => ({ value: w.id, label: w.name })),
  ];

  return (
    <div className="space-y-4">
      {/* Search Row */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="소설 검색..."
          value={searchInput}
          onChange={handleSearchChange}
          className="flex-1"
        />
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters}>
            필터 초기화
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2">
        {/* Tag Filter */}
        {tags.length > 0 && (
          <Select
            options={tagOptions}
            value={filters.tag || ''}
            onChange={handleTagChange}
            className="w-36"
          />
        )}

        {/* Writer Filter */}
        {writers.length > 0 && (
          <Select
            options={writerOptions}
            value={filters.writerId || ''}
            onChange={handleWriterChange}
            className="w-36"
          />
        )}

        {/* Bookmark Filter */}
        {showBookmarkFilter && (
          <Button
            variant={filters.bookmarked ? 'default' : 'outline'}
            onClick={handleBookmarkToggle}
            className="gap-1"
          >
            <BookmarkIcon filled={!!filters.bookmarked} />
            북마크
          </Button>
        )}

        {/* Sort Controls */}
        <div className="flex gap-1 ml-auto">
          <Select
            options={sortOptions}
            value={filters.sort || 'createdAt'}
            onChange={handleSortChange}
            className="w-28"
          />
          <Select
            options={orderOptions}
            value={filters.order || 'desc'}
            onChange={handleOrderChange}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Bookmark Icon
 */
function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path
          fillRule="evenodd"
          d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
      />
    </svg>
  );
}

export default StoryFilters;

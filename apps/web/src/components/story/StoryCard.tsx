import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, Badge, Button } from '../ui';
import type { Story } from '../../types';

interface StoryCardProps {
  story: Story & { isBookmarked: boolean };
  onBookmarkToggle?: (storyId: string, isBookmarked: boolean) => void;
  isBookmarkLoading?: boolean;
}

/**
 * StoryCard Component
 *
 * Displays story preview with:
 * - Title and content preview
 * - Tags as badges
 * - Word count and read time
 * - Writer info
 * - Bookmark toggle button
 */
export function StoryCard({
  story,
  onBookmarkToggle,
  isBookmarkLoading = false,
}: StoryCardProps) {
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBookmarkToggle && !isBookmarkLoading) {
      onBookmarkToggle(story.id, story.isBookmarked);
    }
  };

  // Create content preview (first 150 chars)
  const preview = story.content.length > 150
    ? story.content.substring(0, 150) + '...'
    : story.content;

  // Format date
  const formattedDate = new Date(story.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link to={`/stories/${story.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">
              {story.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBookmarkClick}
              disabled={isBookmarkLoading}
              className="shrink-0"
              aria-label={story.isBookmarked ? '북마크 제거' : '북마크 추가'}
            >
              <BookmarkIcon filled={story.isBookmarked} />
            </Button>
          </div>
          {/* Writer info */}
          {story.writer && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {story.writer.imageUrl && (
                <img
                  src={story.writer.imageUrl}
                  alt={story.writer.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              )}
              <span>{story.writer.name}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Content Preview */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {preview}
          </p>

          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {story.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {story.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{story.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{story.wordCount.toLocaleString()}자</span>
              <span>{story.readTime}분 읽기</span>
            </div>
            <span>{formattedDate}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
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
        className="w-5 h-5 text-primary"
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
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
      />
    </svg>
  );
}

/**
 * Story Card Skeleton for loading state
 */
export function StoryCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-muted rounded-full animate-pulse" />
          <div className="h-4 bg-muted rounded w-20 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-muted rounded w-full animate-pulse" />
          <div className="h-4 bg-muted rounded w-full animate-pulse" />
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
        </div>
        <div className="flex gap-1 mb-3">
          <div className="h-5 bg-muted rounded w-12 animate-pulse" />
          <div className="h-5 bg-muted rounded w-12 animate-pulse" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-muted rounded w-24 animate-pulse" />
          <div className="h-3 bg-muted rounded w-16 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default StoryCard;

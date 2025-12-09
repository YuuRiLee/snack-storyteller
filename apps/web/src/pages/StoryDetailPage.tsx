// React import for JSX (using automatic JSX runtime)
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStoryById, deleteStory, toggleBookmark } from '../api';
import { Card, CardContent, CardHeader, Badge, Button } from '../components/ui';

/**
 * Story Detail Page
 *
 * Full story reading view with:
 * - Story title and metadata
 * - Full content display
 * - Bookmark toggle
 * - Delete option
 * - Writer info
 */
export function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch story
  const {
    data: story,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['story', id],
    queryFn: () => getStoryById(id!),
    enabled: !!id,
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: () => toggleBookmark(id!),
    onSuccess: (data) => {
      queryClient.setQueryData(['story', id], (old: typeof story) => {
        if (!old) return old;
        return { ...old, isBookmarked: data.isBookmarked };
      });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['storyStats'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteStory(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['storyStats'] });
      navigate('/library');
    },
  });

  const handleDelete = () => {
    if (window.confirm('이 소설을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="container mx-auto py-6 px-4 text-center">
        <p className="text-destructive mb-4">소설을 불러올 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/library')}>
          라이브러리로 돌아가기
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(story.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      {/* Back Link */}
      <Link
        to="/library"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeftIcon />
        라이브러리로 돌아가기
      </Link>

      <Card>
        <CardHeader>
          {/* Title Row */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold flex-1">{story.title}</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
                aria-label={story.isBookmarked ? '북마크 제거' : '북마크 추가'}
              >
                <BookmarkIcon filled={story.isBookmarked} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                aria-label="삭제"
                className="text-destructive hover:text-destructive"
              >
                <TrashIcon />
              </Button>
            </div>
          </div>

          {/* Writer Info */}
          {story.writer && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {story.writer.imageUrl && (
                <img
                  src={story.writer.imageUrl}
                  alt={story.writer.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <span>by {story.writer.name}</span>
            </div>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{story.wordCount.toLocaleString()}자</span>
            <span>{story.readTime}분 읽기</span>
            <span>{formattedDate}</span>
            {story.bookmarkCount > 0 && (
              <span className="flex items-center gap-1">
                <BookmarkIcon filled={false} className="w-4 h-4" />
                {story.bookmarkCount}
              </span>
            )}
          </div>

          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {story.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Story Content */}
          <div className="prose prose-invert max-w-none">
            {story.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex justify-between items-center mt-6">
        <Button variant="outline" onClick={() => navigate('/library')}>
          <ChevronLeftIcon />
          목록으로
        </Button>
        <Button
          variant={story.isBookmarked ? 'secondary' : 'default'}
          onClick={() => bookmarkMutation.mutate()}
          disabled={bookmarkMutation.isPending}
        >
          <BookmarkIcon filled={story.isBookmarked} />
          {story.isBookmarked ? '북마크됨' : '북마크'}
        </Button>
      </div>
    </div>
  );
}

// Icons
function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4 mr-1"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function BookmarkIcon({ filled, className = 'w-5 h-5' }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${className} text-primary`}
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
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
      />
    </svg>
  );
}

function TrashIcon() {
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
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

export default StoryDetailPage;

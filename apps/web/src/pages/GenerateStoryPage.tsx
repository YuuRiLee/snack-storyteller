import { useState, useEffect } from 'react';
import { StoryGenerationCard } from '../components/StoryGenerationCard';
import { api } from '../lib/api';

interface Writer {
  id: string;
  name: string;
  imageUrl?: string | null;
  personality: string;
}

/**
 * Story Generation Page
 *
 * Main page for generating AI stories.
 * Fetches available writers and passes to StoryGenerationCard.
 */
export function GenerateStoryPage() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchWriters = async () => {
      try {
        const response = await api.get(`/writers?isPublic=true`, {
          signal: controller.signal,
        });
        const { data } = response.data;

        // Only update state if not aborted
        if (!controller.signal.aborted) {
          setWriters(data || []);
          setIsLoading(false);
        }
      } catch (err) {
        // Ignore abort errors (intentional cleanup)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        // Only update state if not aborted
        if (!controller.signal.aborted) {
          console.error('Error fetching writers:', err);
          setError('작가 목록을 불러올 수 없습니다.');
          setIsLoading(false);
        }
      }
    };

    fetchWriters();

    // Cleanup: abort fetch on unmount
    return () => {
      controller.abort();
    };
  }, []);

  const refetchWriters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/writers?isPublic=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch writers');
      }

      const data = await response.json();
      setWriters(data.writers || []);
    } catch (err) {
      console.error('Error fetching writers:', err);
      setError('작가 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md">
          <p className="text-destructive">❌ {error}</p>
          <button
            onClick={refetchWriters}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (writers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-muted border border-border rounded-lg p-6 max-w-md text-center">
          <p className="text-muted-foreground mb-4">사용 가능한 작가가 없습니다.</p>
          <p className="text-sm text-muted-foreground">데이터베이스에 작가를 추가해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <StoryGenerationCard writers={writers} />
    </div>
  );
}

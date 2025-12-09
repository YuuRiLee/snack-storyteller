import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useWriterStore, useAuthStore } from '../stores';
import { WriterForm } from '../components/writer';
import type { CreateWriterDto } from '../types';
import { useEffect, useState } from 'react';

export function CreateWriterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { createWriter, isLoading } = useWriterStore();
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (data: CreateWriterDto) => {
    setError(null);
    try {
      const newWriter = await createWriter(data);
      navigate(`/writers/${newWriter.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '작가 생성에 실패했습니다. 다시 시도해주세요.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back link */}
        <button
          onClick={() => navigate('/writers')}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Writers
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Writer</h1>
          <p className="text-muted-foreground mt-1">
            Design a new AI writer persona with a unique style
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              닫기
            </button>
          </div>
        )}

        {/* Form */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-6">
          <WriterForm
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/writers')}
          />
        </div>
      </div>
    </div>
  );
}

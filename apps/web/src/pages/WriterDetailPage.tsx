import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useWriterStore, useAuthStore } from '../stores';
import { WriterDetails } from '../components/writer';

export function WriterDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { selectedWriter, fetchWriter, deleteWriter } = useWriterStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetchWriter(id).finally(() => setIsLoading(false));
    }
  }, [id, fetchWriter]);

  const isOwner = user && selectedWriter && selectedWriter.userId === user.id;

  const handleEdit = () => {
    navigate(`/writers/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm(`"${selectedWriter?.name}"을(를) 삭제하시겠습니까?`)) {
      setError(null);
      try {
        await deleteWriter(id);
        navigate('/writers');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '작가 삭제에 실패했습니다. 다시 시도해주세요.';
        setError(message);
      }
    }
  };

  const handleGenerateStory = () => {
    // Navigate to story generation page (Phase 4)
    navigate(`/stories/generate?writerId=${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedWriter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Writer not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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

        <WriterDetails
          writer={selectedWriter}
          isOwner={isOwner ?? false}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGenerateStory={handleGenerateStory}
        />
      </div>
    </div>
  );
}

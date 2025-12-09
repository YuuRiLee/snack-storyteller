import { useEffect, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useWriterStore, useAuthStore } from '../stores';
import { WriterGallery } from '../components/writer';
import { Button } from '../components/ui';
import type { Writer } from '../types';

export function MyWritersPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { myWriters, meta, isLoading, fetchMyWriters, deleteWriter } = useWriterStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMyWriters();
  }, [isAuthenticated, navigate, fetchMyWriters]);

  const handleEdit = useCallback(
    (writer: Writer) => {
      navigate(`/writers/${writer.id}/edit`);
    },
    [navigate],
  );

  const handleDelete = useCallback(
    async (writer: Writer) => {
      if (window.confirm(`"${writer.name}"을(를) 삭제하시겠습니까?`)) {
        setError(null);
        try {
          await deleteWriter(writer.id);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : '작가 삭제에 실패했습니다. 다시 시도해주세요.';
          setError(message);
        }
      }
    },
    [deleteWriter],
  );

  const handleLoadMore = useCallback(() => {
    fetchMyWriters({ page: meta.page + 1 });
  }, [fetchMyWriters, meta.page]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Writers</h1>
            <p className="text-muted-foreground mt-1">Manage your AI writer personas</p>
          </div>

          <Link to="/writers/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Writer
            </Button>
          </Link>
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

        {/* Gallery */}
        <WriterGallery
          writers={myWriters}
          isLoading={isLoading}
          genres={[]}
          showActions={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onLoadMore={handleLoadMore}
          hasMore={meta.page < meta.totalPages}
          emptyMessage="You haven't created any writers yet. Create your first one!"
        />
      </div>
    </div>
  );
}

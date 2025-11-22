import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useWriterStore, useAuthStore } from '../stores';
import { WriterForm } from '../components/writer';
import type { CreateWriterDto } from '../types';

export function EditWriterPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const { selectedWriter, fetchWriter, updateWriter, isLoading } = useWriterStore();
  const [isLoadingWriter, setIsLoadingWriter] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (id) {
      setIsLoadingWriter(true);
      fetchWriter(id).finally(() => setIsLoadingWriter(false));
    }
  }, [id, isAuthenticated, navigate, fetchWriter]);

  // Check ownership
  useEffect(() => {
    if (selectedWriter && user && selectedWriter.userId !== user.id) {
      navigate(`/writers/${id}`);
    }
  }, [selectedWriter, user, id, navigate]);

  const handleSubmit = async (data: CreateWriterDto) => {
    if (!id) return;
    try {
      await updateWriter(id, data);
      navigate(`/writers/${id}`);
    } catch (error) {
      console.error('Failed to update writer:', error);
    }
  };

  if (isLoadingWriter) {
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back link */}
        <button
          onClick={() => navigate(`/writers/${id}`)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Writer
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Edit Writer</h1>
          <p className="text-muted-foreground mt-1">Update your AI writer persona</p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-6">
          <WriterForm
            writer={selectedWriter}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/writers/${id}`)}
          />
        </div>
      </div>
    </div>
  );
}

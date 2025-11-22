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
    if (window.confirm('Are you sure you want to delete this writer?')) {
      try {
        await deleteWriter(id);
        navigate('/writers');
      } catch (error) {
        console.error('Failed to delete writer:', error);
      }
    }
  };

  const handleGenerateStory = () => {
    // Navigate to story generation page (Phase 4)
    navigate(`/generate?writerId=${id}`);
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

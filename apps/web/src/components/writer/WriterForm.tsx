import { useState, useEffect } from 'react';
import { Loader2, X, Plus } from 'lucide-react';
import type { Writer, CreateWriterDto } from '../../types';
import { Button, Input, Textarea, Label, Badge } from '../ui';

// Suggested genres for quick selection
const suggestedGenres = [
  '느와르',
  '스릴러',
  '범죄',
  '미스터리',
  '로맨스',
  '드라마',
  '일상',
  '힐링',
  'SF',
  '디스토피아',
  '사이버펑크',
  '우주',
  '판타지',
  '모험',
  '액션',
  '마법',
  '공포',
  '호러',
  '코미디',
  '유머',
];

interface WriterFormProps {
  writer?: Writer;
  isLoading?: boolean;
  onSubmit: (data: CreateWriterDto) => Promise<void>;
  onCancel?: () => void;
}

export function WriterForm({ writer, isLoading = false, onSubmit, onCancel }: WriterFormProps) {
  const isEdit = !!writer;

  const [formData, setFormData] = useState({
    name: writer?.name || '',
    description: writer?.description || '',
    systemPrompt: writer?.systemPrompt || '',
    genre: writer?.genre || [],
    imageUrl: writer?.imageUrl || '',
    isPublic: writer?.isPublic ?? true,
  });

  const [genreInput, setGenreInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (writer) {
      setFormData({
        name: writer.name,
        description: writer.description,
        systemPrompt: writer.systemPrompt,
        genre: writer.genre,
        imageUrl: writer.imageUrl || '',
        isPublic: writer.isPublic,
      });
    }
  }, [writer]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2 || formData.name.length > 50) {
      newErrors.name = 'Name must be between 2 and 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10 || formData.description.length > 500) {
      newErrors.description = 'Description must be between 10 and 500 characters';
    }

    if (!formData.systemPrompt.trim()) {
      newErrors.systemPrompt = 'System prompt is required';
    } else if (formData.systemPrompt.length < 100 || formData.systemPrompt.length > 2000) {
      newErrors.systemPrompt = 'System prompt must be between 100 and 2000 characters';
    }

    if (formData.genre.length === 0) {
      newErrors.genre = 'At least one genre is required';
    } else if (formData.genre.length > 5) {
      newErrors.genre = 'Maximum 5 genres allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: formData.name,
      description: formData.description,
      systemPrompt: formData.systemPrompt,
      genre: formData.genre,
      imageUrl: formData.imageUrl || undefined,
      isPublic: formData.isPublic,
    });
  };

  const addGenre = (genre: string) => {
    const trimmedGenre = genre.trim();
    if (trimmedGenre && !formData.genre.includes(trimmedGenre) && formData.genre.length < 5) {
      setFormData({ ...formData, genre: [...formData.genre, trimmedGenre] });
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setFormData({
      ...formData,
      genre: formData.genre.filter((g) => g !== genre),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Writer Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., 하드보일드 탐정"
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        <p className="text-xs text-muted-foreground">{formData.name.length}/50 characters</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this writer's style and specialty..."
          rows={3}
          disabled={isLoading}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        <p className="text-xs text-muted-foreground">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          This defines how the AI will write stories. Include writing style, genre preferences,
          tone, and any specific instructions.
        </p>
        <Textarea
          id="systemPrompt"
          value={formData.systemPrompt}
          onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
          placeholder={`Example:
당신은 느와르 스타일의 소설가입니다.

## 작가 스타일
- 간결하고 힘있는 문체
- 냉소적이고 현실적인 시선
- 빠른 전개와 긴장감

## 문장 스타일
- 짧고 강렬한 문장
- 감각적 묘사
- 직설적 대화

지금부터 1,500단어 이상의 한국어 단편 소설을 작성하세요.`}
          rows={12}
          className="font-mono text-sm"
          disabled={isLoading}
        />
        {errors.systemPrompt && <p className="text-sm text-destructive">{errors.systemPrompt}</p>}
        <p className="text-xs text-muted-foreground">
          {formData.systemPrompt.length}/2000 characters
        </p>
      </div>

      {/* Genres */}
      <div className="space-y-2">
        <Label>Genres * (1-5)</Label>

        {/* Selected genres */}
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {formData.genre.map((genre) => (
            <Badge key={genre} variant="default" className="flex items-center gap-1 pr-1">
              {genre}
              <button
                type="button"
                onClick={() => removeGenre(genre)}
                className="ml-1 rounded-full p-0.5 hover:bg-primary-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Genre input */}
        <div className="flex gap-2">
          <Input
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            placeholder="Add a genre..."
            disabled={isLoading || formData.genre.length >= 5}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addGenre(genreInput);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addGenre(genreInput)}
            disabled={isLoading || formData.genre.length >= 5 || !genreInput}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggested genres */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {suggestedGenres
            .filter((g) => !formData.genre.includes(g))
            .slice(0, 10)
            .map((genre) => (
              <Badge
                key={genre}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => addGenre(genre)}
              >
                + {genre}
              </Badge>
            ))}
        </div>

        {errors.genre && <p className="text-sm text-destructive">{errors.genre}</p>}
      </div>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
          disabled={isLoading}
        />
      </div>

      {/* Visibility */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
          disabled={isLoading}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isPublic" className="font-normal">
          Make this writer public (visible to all users)
        </Label>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update Writer' : 'Create Writer'}
        </Button>
      </div>
    </form>
  );
}

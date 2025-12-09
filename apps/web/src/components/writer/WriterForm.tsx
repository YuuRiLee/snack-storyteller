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
      newErrors.name = '이름을 입력해주세요';
    } else if (formData.name.length < 2 || formData.name.length > 50) {
      newErrors.name = '이름은 2자 이상 50자 이하로 입력해주세요';
    }

    if (!formData.description.trim()) {
      newErrors.description = '설명을 입력해주세요';
    } else if (formData.description.length < 10 || formData.description.length > 500) {
      newErrors.description = '설명은 10자 이상 500자 이하로 입력해주세요';
    }

    if (!formData.systemPrompt.trim()) {
      newErrors.systemPrompt = '시스템 프롬프트를 입력해주세요';
    } else if (formData.systemPrompt.length < 100 || formData.systemPrompt.length > 2000) {
      newErrors.systemPrompt = '시스템 프롬프트는 100자 이상 2000자 이하로 입력해주세요';
    }

    if (formData.genre.length === 0) {
      newErrors.genre = '최소 1개의 장르를 선택해주세요';
    } else if (formData.genre.length > 5) {
      newErrors.genre = '장르는 최대 5개까지 선택할 수 있습니다';
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
        <Label htmlFor="name">작가 이름 *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., 하드보일드 탐정"
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        <p className="text-xs text-muted-foreground">{formData.name.length}/50자</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">설명 *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="이 작가의 스타일과 특징을 설명해주세요..."
          rows={3}
          disabled={isLoading}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        <p className="text-xs text-muted-foreground">{formData.description.length}/500자</p>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label htmlFor="systemPrompt">시스템 프롬프트 *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          AI가 소설을 작성하는 방식을 정의합니다. 문체, 장르 선호도, 톤, 특별한 지시사항 등을
          포함해주세요.
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
        <p className="text-xs text-muted-foreground">{formData.systemPrompt.length}/2000자</p>
      </div>

      {/* Genres */}
      <div className="space-y-2">
        <Label>장르 * (1-5개)</Label>

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
            placeholder="장르 추가..."
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
        <Label htmlFor="imageUrl">이미지 URL (선택)</Label>
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
          공개 작가로 설정 (모든 사용자에게 표시)
        </Label>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? '작가 수정' : '작가 만들기'}
        </Button>
      </div>
    </form>
  );
}

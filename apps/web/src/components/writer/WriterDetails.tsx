import { Link } from 'react-router-dom';
import { ArrowLeft, User, BookOpen, Calendar, Edit, Trash2 } from 'lucide-react';
import type { Writer } from '../../types';
import { Button, Badge, Card, CardContent } from '../ui';

interface WriterDetailsProps {
  writer: Writer;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onGenerateStory?: () => void;
}

export function WriterDetails({
  writer,
  isOwner = false,
  onEdit,
  onDelete,
  onGenerateStory,
}: WriterDetailsProps) {
  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link
        to="/writers"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        작가 목록으로
      </Link>

      {/* Header section */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Writer image */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
            {writer.imageUrl ? (
              <img src={writer.imageUrl} alt={writer.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <User className="h-20 w-20 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>

        {/* Writer info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{writer.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {writer._count.stories}개의 소설
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(writer.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  수정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground">{writer.description}</p>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {writer.genre.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>

          {/* Generate story button */}
          <div className="pt-4">
            <Button size="lg" onClick={onGenerateStory}>
              이 작가로 소설 생성하기
            </Button>
          </div>
        </div>
      </div>

      {/* System Prompt Preview */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">작문 스타일 & 프롬프트</h2>
          <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap font-mono overflow-x-auto">
            {writer.systemPrompt}
          </pre>
        </CardContent>
      </Card>

      {/* Visibility badge */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">공개 여부:</span>
        <Badge variant={writer.isPublic ? 'default' : 'secondary'}>
          {writer.isPublic ? '공개' : '비공개'}
        </Badge>
      </div>
    </div>
  );
}

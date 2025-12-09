import { Link } from 'react-router-dom';
import { BookOpen, User } from 'lucide-react';
import type { Writer } from '../../types';
import { Card, CardContent, Badge } from '../ui';
import { cn } from '../../lib/utils';

// Genre color mapping
const genreColors: Record<string, string> = {
  느와르: 'bg-gray-700 text-white',
  스릴러: 'bg-red-700 text-white',
  범죄: 'bg-orange-700 text-white',
  미스터리: 'bg-purple-700 text-white',
  로맨스: 'bg-pink-600 text-white',
  드라마: 'bg-blue-600 text-white',
  일상: 'bg-green-600 text-white',
  힐링: 'bg-teal-600 text-white',
  SF: 'bg-cyan-600 text-white',
  디스토피아: 'bg-slate-700 text-white',
  사이버펑크: 'bg-violet-600 text-white',
  우주: 'bg-indigo-600 text-white',
  판타지: 'bg-amber-600 text-white',
  모험: 'bg-emerald-600 text-white',
  액션: 'bg-red-600 text-white',
  마법: 'bg-fuchsia-600 text-white',
  공포: 'bg-gray-900 text-white',
  호러: 'bg-black text-white',
  코미디: 'bg-yellow-500 text-black',
  유머: 'bg-lime-500 text-black',
  로맨틱코미디: 'bg-rose-500 text-white',
};

interface WriterCardProps {
  writer: Writer;
  showActions?: boolean;
  onEdit?: (writer: Writer) => void;
  onDelete?: (writer: Writer) => void;
}

export function WriterCard({ writer, showActions = false, onEdit, onDelete }: WriterCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <Link to={`/writers/${writer.id}`}>
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {writer.imageUrl ? (
            <img
              src={writer.imageUrl}
              alt={writer.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <User className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

          {/* Story count badge */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs backdrop-blur">
            <BookOpen className="h-3 w-3" />
            <span>{writer._count.stories}</span>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/writers/${writer.id}`}>
          <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors hover:text-primary">
            {writer.name}
          </h3>
        </Link>

        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{writer.description}</p>

        {/* Genre tags */}
        <div className="flex flex-wrap gap-1">
          {writer.genre.slice(0, 3).map((g) => (
            <Badge
              key={g}
              variant="secondary"
              className={cn('text-xs', genreColors[g] || 'bg-muted text-muted-foreground')}
            >
              {g}
            </Badge>
          ))}
          {writer.genre.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{writer.genre.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions for owner */}
        {showActions && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit?.(writer);
              }}
              className="flex-1 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80"
            >
              수정
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete?.(writer);
              }}
              className="rounded-md px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              삭제
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

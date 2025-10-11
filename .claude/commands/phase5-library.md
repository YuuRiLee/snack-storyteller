Command: Phase 5 - Story Library & Reading Interface

You are implementing Phase 5: Story library management and reading interface.

## 🤖 MCP Usage Strategy

Before starting implementation, use these MCP tools to ensure correct patterns:

### Step 1: Learn pgvector with Context7
```bash
/context7 pgvector postgres setup
/context7 prisma vector datatype unsupported
/context7 openai embeddings api text-embedding-ada-002
```

**Learning Goals:**
- pgvector extension installation and configuration
- Prisma Unsupported type for vector columns
- OpenAI embeddings API usage and best practices
- Vector similarity operators (<=> for cosine distance)

### Step 2: Design Strategy with Sequential Thinking
Use Sequential Thinking to decide:
- **Migration Strategy**: Docker extension vs manual SQL installation
- **Embedding Timing**: Sync during generation vs async background job
- **Index Type**: IVFFlat vs HNSW (trade-offs: speed vs accuracy)
- **Similarity Metric**: Cosine distance vs L2 distance vs Inner product

### Step 3: Implementation Pattern
1. Read Phase 4 command to understand story generation flow
2. Apply Context7 patterns for pgvector setup
3. Implement EmbeddingService following official OpenAI docs
4. Test vector similarity queries with sample data
5. Integrate with frontend UI components

### Step 4: Validation
```bash
# After implementation, verify:
psql -d zeta_dev -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
curl http://localhost:3001/api/stories/{id}/similar
# Expected: 6 similar stories with distance scores
```

## Phase 5 Goals:
- Build story library with filtering and search
- **Implement pgvector semantic search for story recommendations** ⭐
- Create immersive story reading interface
- Implement bookmark system
- Add story sharing functionality
- Build personal story collection management

## Backend Tasks:

### 🧠 pgvector Setup & Configuration:

**Important**: This phase implements semantic search using pgvector for AI-powered story recommendations. This demonstrates advanced AI integration for portfolio evaluation.

#### 1. Database Migration (Prisma):
```prisma
// Extend Story model in schema.prisma

model Story {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  tags        String[]
  wordCount   Int
  readTime    Int

  // 🆕 Vector embedding for semantic search
  embedding   Unsupported("vector(1536)")?  // OpenAI ada-002 dimensions

  writerId    String
  userId      String
  isPublic    Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  writer      Writer   @relation(fields: [writerId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])
  bookmarks   Bookmark[]

  @@index([userId, createdAt])
  @@index([isPublic, createdAt])
  @@index([writerId])
  // 🆕 IVFFlat index for efficient vector similarity search
  @@index([embedding], type: Ivfflat, ops: VectorL2Ops)
}
```

#### 2. Enable pgvector Extension:
```sql
-- Add to migration or init.sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 3. Embedding Service:
```typescript
// apps/server/src/ai/embedding.service.ts

import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private openai: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Generate embedding vector for text content
   * Uses OpenAI text-embedding-ada-002 (1536 dimensions)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.slice(0, 8000), // Token limit: ~8000 tokens
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Embedding generation failed', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate embedding for story (title + first 500 words)
   * This captures the story's essence for similarity matching
   */
  async generateStoryEmbedding(story: {
    title: string;
    content: string;
  }): Promise<number[]> {
    const textToEmbed = `${story.title}\n\n${story.content.slice(0, 2000)}`;
    return this.generateEmbedding(textToEmbed);
  }
}
```

### Bookmark Model (Prisma):
```prisma
model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  storyId   String
  note      String?  // Optional user note
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  story     Story    @relation(fields: [storyId], references: [id])

  @@unique([userId, storyId])
  @@index([userId, createdAt])
}
```

### Library API Endpoints:
```typescript
// GET /api/stories?page=1&limit=12&tags=느와르&search=탐정
// Response: Paginated story list with writer info

// GET /api/stories/:id
// Response: Full story with writer and user info

// 🆕 GET /api/stories/:id/similar?limit=6
// Response: Similar stories based on vector similarity

// POST /api/stories/:id/bookmark
// Add story to bookmarks

// DELETE /api/stories/:id/bookmark
// Remove from bookmarks

// GET /api/bookmarks
// Get user's bookmarked stories

// GET /api/stories/public
// Get public stories for discovery

// DELETE /api/stories/:id
// Delete user's own story
```

### StoryService Extensions:
```typescript
async getLibrary(
  userId: string,
  filters: LibraryFilters
): Promise<PaginatedStories> {
  const { page = 1, limit = 12, tags, search, writerId } = filters;

  const where: Prisma.StoryWhereInput = {
    userId,
    ...(tags && { tags: { hasSome: tags } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(writerId && { writerId }),
  };

  const [stories, total] = await Promise.all([
    this.prisma.story.findMany({
      where,
      include: {
        writer: true,
        _count: {
          select: { bookmarks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.prisma.story.count({ where }),
  ]);

  return {
    stories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async toggleBookmark(
  userId: string,
  storyId: string
): Promise<boolean> {
  const existing = await this.prisma.bookmark.findUnique({
    where: {
      userId_storyId: { userId, storyId },
    },
  });

  if (existing) {
    await this.prisma.bookmark.delete({
      where: { id: existing.id },
    });
    return false; // Removed
  } else {
    await this.prisma.bookmark.create({
      data: { userId, storyId },
    });
    return true; // Added
  }
}

/**
 * 🆕 Semantic Search: Find similar stories using vector similarity
 * Uses cosine distance for similarity matching
 */
async findSimilarStories(
  storyId: string,
  userId: string,
  limit: number = 6
): Promise<Story[]> {
  // 1. Get the target story's embedding
  const targetStory = await this.prisma.story.findUnique({
    where: { id: storyId },
    select: { embedding: true },
  });

  if (!targetStory?.embedding) {
    throw new NotFoundException('Story not found or embedding not generated');
  }

  // 2. Query similar stories using pgvector
  // Note: Using raw SQL for vector operations (Prisma doesn't natively support pgvector yet)
  const similarStories = await this.prisma.$queryRaw<Story[]>`
    SELECT
      id, title, content, tags, "wordCount", "readTime",
      "writerId", "userId", "isPublic", "createdAt",
      (embedding <=> ${targetStory.embedding}::vector) as distance
    FROM "Story"
    WHERE
      id != ${storyId}
      AND embedding IS NOT NULL
      AND (
        "isPublic" = true
        OR "userId" = ${userId}
      )
    ORDER BY embedding <=> ${targetStory.embedding}::vector
    LIMIT ${limit}
  `;

  return similarStories;
}

/**
 * 🆕 Generate and store embedding for story
 * Called after story generation in Phase 4
 */
async updateStoryEmbedding(storyId: string): Promise<void> {
  const story = await this.prisma.story.findUnique({
    where: { id: storyId },
    select: { title: true, content: true },
  });

  if (!story) {
    throw new NotFoundException('Story not found');
  }

  // Generate embedding
  const embedding = await this.embeddingService.generateStoryEmbedding(story);

  // Store in database
  await this.prisma.$executeRaw`
    UPDATE "Story"
    SET embedding = ${JSON.stringify(embedding)}::vector
    WHERE id = ${storyId}
  `;
}
```

## Frontend Implementation:

### Library Page:
```tsx
// apps/web/src/pages/Library.tsx

export function LibraryPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [filters, setFilters] = useState<LibraryFilters>({
    page: 1,
    limit: 12,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, [filters]);

  const loadStories = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/stories?${new URLSearchParams(filters as any)}`
      );
      const data = await response.json();
      setStories(data.stories);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📚 내 소설 라이브러리</h1>
        <Button onClick={() => navigate('/generate')}>
          ✨ 새 소설 생성
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <Input
          placeholder="소설 검색..."
          value={filters.search || ''}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        <Select
          value={filters.writerId}
          onValueChange={value => setFilters({ ...filters, writerId: value })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="작가 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 작가</SelectItem>
            {/* Writer options */}
          </SelectContent>
        </Select>
        <TagFilter
          selected={filters.tags || []}
          onChange={tags => setFilters({ ...filters, tags })}
        />
      </div>

      {/* Story Grid */}
      {loading ? (
        <StoryGridSkeleton />
      ) : stories.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(story => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={filters.page}
        totalPages={Math.ceil(total / filters.limit)}
        onPageChange={page => setFilters({ ...filters, page })}
      />
    </div>
  );
}
```

### Story Card Component:
```tsx
// apps/web/src/components/story/StoryCard.tsx

export function StoryCard({ story }: { story: Story }) {
  const [isBookmarked, setIsBookmarked] = useState(story.isBookmarked);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/stories/${story.id}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
      });
      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? '북마크 해제' : '북마크 추가');
    } catch (error) {
      toast.error('오류가 발생했습니다');
    }
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/stories/${story.id}`)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{story.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarImage src={story.writer.imageUrl} />
                <AvatarFallback>{story.writer.name[0]}</AvatarFallback>
              </Avatar>
              <span>{story.writer.name}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5 text-primary" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {story.content.slice(0, 150)}...
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {story.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{story.wordCount.toLocaleString()} 단어</span>
          <span>{story.readTime}분 읽기</span>
          <span>{formatDate(story.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Story Reading Page:
```tsx
// apps/web/src/pages/StoryRead.tsx

export function StoryReadPage() {
  const { id } = useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    try {
      const response = await fetch(`/api/stories/${id}`);
      const data = await response.json();
      setStory(data);
      setIsBookmarked(data.isBookmarked);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('같은 스타일로 새로운 소설을 생성하시겠어요?')) return;

    navigate('/generate', {
      state: {
        writerId: story.writerId,
        tags: story.tags,
      },
    });
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('링크가 복사되었습니다');
  };

  if (loading) return <LoadingSpinner />;
  if (!story) return <NotFound />;

  return (
    <div className="container max-w-3xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleBookmark}>
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5 text-primary" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRegenerate}>
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Story Content */}
      <article className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-4">{story.title}</h1>

        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={story.writer.imageUrl} />
            </Avatar>
            <span>{story.writer.name}</span>
          </div>
          <span>•</span>
          <span>{story.wordCount.toLocaleString()} 단어</span>
          <span>•</span>
          <span>{story.readTime}분 읽기</span>
          <span>•</span>
          <span>{formatDate(story.createdAt)}</span>
        </div>

        <div className="flex gap-2 mb-8">
          {story.tags.map(tag => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="whitespace-pre-wrap leading-relaxed">
          {story.content}
        </div>
      </article>

      {/* Footer */}
      <Separator className="my-12" />
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={handleRegenerate}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로운 소설 생성
        </Button>
        <Button onClick={() => navigate('/generate')}>
          ✨ 다른 스타일로 생성
        </Button>
      </div>

      {/* 🆕 Similar Stories Section */}
      <SimilarStoriesSection storyId={story.id} />
    </div>
  );
}
```

### 🆕 Similar Stories Component:
```tsx
// apps/web/src/components/story/SimilarStoriesSection.tsx

interface SimilarStoriesSectionProps {
  storyId: string;
}

export function SimilarStoriesSection({ storyId }: SimilarStoriesSectionProps) {
  const [similarStories, setSimilarStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimilarStories();
  }, [storyId]);

  const loadSimilarStories = async () => {
    try {
      const response = await fetch(`/api/stories/${storyId}/similar?limit=6`);
      const data = await response.json();
      setSimilarStories(data);
    } catch (error) {
      console.error('Failed to load similar stories', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-12">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (similarStories.length === 0) {
    return null;
  }

  return (
    <div className="my-12">
      <Separator className="mb-8" />
      <h2 className="text-2xl font-bold mb-6">
        🧠 이런 소설도 좋아하실 것 같아요
      </h2>
      <p className="text-muted-foreground mb-6">
        AI가 내용 유사도를 분석하여 추천하는 소설들입니다
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarStories.map(story => (
          <StoryCard key={story.id} story={story} compact />
        ))}
      </div>
    </div>
  );
}
```

## Additional Features:

### Reading Progress (Optional):
- Track scroll position
- Show reading progress bar
- Resume from last position

### Social Features (Future):
- Like/reaction system
- Comments on public stories
- Share to social media
- Story collections/playlists

## Success Criteria:
- ✅ User can view all their generated stories
- ✅ Filter and search functionality works
- ✅ Story cards show metadata (word count, read time, tags)
- ✅ **pgvector extension is installed and working** ⭐
- ✅ **Story embeddings are generated after creation** ⭐
- ✅ **Similar stories are recommended using vector similarity** ⭐
- ✅ Reading interface is clean and immersive
- ✅ Bookmark system works (add/remove)
- ✅ Share functionality copies link
- ✅ Regenerate redirects with same parameters
- ✅ Pagination handles large libraries
- ✅ Mobile-responsive design

## File Structure:
```
/apps/server/src
  /ai
    ai.module.ts
    ai.service.ts (from Phase 4)
    🆕 embedding.service.ts (new - OpenAI embeddings)
  /story
    story.module.ts
    story.service.ts (extend with semantic search methods)
    story.controller.ts
  /bookmark
    bookmark.module.ts
    bookmark.service.ts
    bookmark.controller.ts
  prisma/
    schema.prisma (add embedding column)
    migrations/
      🆕 add_pgvector_extension.sql
      🆕 add_story_embedding.sql

/apps/web/src
  /components/story
    StoryCard.tsx
    StoryGrid.tsx
    StoryGridSkeleton.tsx
    EmptyState.tsx
    🆕 SimilarStoriesSection.tsx
  /components/library
    LibraryFilters.tsx
    TagFilter.tsx
    Pagination.tsx
  /pages
    Library.tsx
    StoryRead.tsx (extend with similar stories)
    Bookmarks.tsx
```

## Next Steps:
After Phase 5, the MVP is complete! Consider:
- Deployment to Vercel/Railway
- Adding demo stories
- Creating portfolio documentation
- Recording demo video
- Writing technical blog post

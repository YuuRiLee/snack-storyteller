# Phase 5: Story Library - Task Breakdown

> **Phase**: 5 - 소설 라이브러리 관리 기능
> **Priority**: ⭐⭐⭐⭐ (포트폴리오 평가 30%)
> **Estimated Duration**: 4-5일 (집중 개발 시)

---

## 📋 Task Overview

| Task   | Description            | Priority     | Dependencies | Estimated Time |
| ------ | ---------------------- | ------------ | ------------ | -------------- |
| Task 1 | Database Indexes       | 🔴 Critical  | Phase 4 완료 | 1시간          |
| Task 2 | Enhanced DTOs          | 🔴 Critical  | Task 1       | 2시간          |
| Task 3 | StoryService 확장      | 🔴 Critical  | Task 2       | 4-5시간        |
| Task 4 | BookmarkService 구현   | 🔴 Critical  | Task 3       | 3-4시간        |
| Task 5 | Frontend Filters UI    | 🟡 Important | Task 3, 4    | 3-4시간        |
| Task 6 | Story Card Component   | 🟡 Important | Task 5       | 2-3시간        |
| Task 7 | Pagination             | 🟡 Important | Task 5, 6    | 2시간          |
| Task 8 | Testing & Verification | 🟡 Important | Task 7       | 2-3시간        |

**총 예상 시간**: 19-25시간 (약 3-4일 집중 개발)

---

## Task 1: Database Indexes

### Goal

검색 및 정렬 성능 최적화를 위한 인덱스 추가

### Subtasks

#### 1.1 인덱스 분석

**현재 상태 확인**:

```sql
-- PostgreSQL에서 현재 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Story';
```

**기존 인덱스** (Phase 4에서 생성):

- `Story_userId_createdAt_idx` (userId, createdAt DESC)
- `Story_writerId_createdAt_idx` (writerId, createdAt DESC)
- `Story_tags_idx` (tags) - GIN index

#### 1.2 추가 인덱스 생성

**File**: `apps/server/prisma/migrations/XXXXXX_add_search_indexes/migration.sql`

```sql
-- Word count sorting
CREATE INDEX "Story_wordCount_idx" ON "Story" (wordCount DESC);

-- Read time sorting
CREATE INDEX "Story_readTime_idx" ON "Story" (readTime DESC);

-- Composite index for common bookmark query
CREATE INDEX "Bookmark_userId_createdAt_idx" ON "Bookmark" (userId, createdAt DESC);
```

**실행**:

```bash
cd apps/server
pnpm prisma migrate dev --name add-search-indexes
```

#### 1.3 인덱스 검증

```bash
# PostgreSQL에서 EXPLAIN ANALYZE로 쿼리 플랜 확인
psql $DATABASE_URL

EXPLAIN ANALYZE
SELECT * FROM "Story"
WHERE userId = 'user-id'
  AND tags @> ARRAY['느와르']::text[]
ORDER BY createdAt DESC
LIMIT 20;

-- Index Scan을 사용하는지 확인 (Seq Scan이면 인덱스 미사용)
```

### Success Criteria

- [ ] 3개 인덱스 추가 완료
- [ ] Migration 성공적으로 실행
- [ ] EXPLAIN ANALYZE로 Index Scan 확인
- [ ] 쿼리 응답 시간 < 500ms

---

## Task 2: Enhanced DTOs

### Goal

필터링, 검색, 정렬을 위한 DTO 확장

### Subtasks

#### 2.1 StoryFiltersDto 확장

**File**: `apps/server/src/story/dto/story-filters.dto.ts`

```typescript
import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum SortField {
  CREATED_AT = 'createdAt',
  WORD_COUNT = 'wordCount',
  READ_TIME = 'readTime',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class StoryFiltersDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  // Search
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  // Filters
  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  writerId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  bookmarked?: boolean;

  // Sorting
  @IsOptional()
  @IsEnum(SortField)
  sort?: SortField = SortField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
```

#### 2.2 응답 DTO 확장

**File**: `apps/server/src/story/dto/story.dto.ts`

```typescript
export class StoryWithBookmarkDto extends StoryDto {
  isBookmarked: boolean;
  bookmarkCount: number;
}

export class StoryCardDto {
  id: string;
  title: string;
  preview: string; // content의 첫 200자
  tags: string[];
  wordCount: number;
  readTime: number;
  writer: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  isBookmarked: boolean;
  createdAt: Date;
}

export class StoryStatsDto {
  totalStories: number;
  totalWords: number;
  totalReadTime: number;
  averageWordCount: number;
  topTags: Array<{ tag: string; count: number }>;
  bookmarkedCount: number;
}
```

#### 2.3 Bookmark DTO 생성

**File**: `apps/server/src/bookmark/dto/create-bookmark.dto.ts`

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  storyId: string;
}
```

**File**: `apps/server/src/bookmark/dto/bookmark.dto.ts`

```typescript
export class BookmarkDto {
  id: string;
  userId: string;
  storyId: string;
  createdAt: Date;
}
```

**File**: `apps/server/src/bookmark/dto/index.ts`

```typescript
export * from './create-bookmark.dto';
export * from './bookmark.dto';
```

### Success Criteria

- [ ] StoryFiltersDto에 search, tag, bookmarked, sort, order 추가
- [ ] Enum 타입 (SortField, SortOrder) 정의
- [ ] StoryWithBookmarkDto, StoryCardDto, StoryStatsDto 정의
- [ ] Bookmark DTOs 생성 완료
- [ ] 모든 DTO 검증 데코레이터 적용

---

## Task 3: StoryService 확장

### Goal

필터링, 검색, 정렬, 통계 기능 추가

### Subtasks

#### 3.1 getUserStories() 확장

**File**: `apps/server/src/story/story.service.ts`

```typescript
async getUserStories(
  userId: string,
  filters: StoryFiltersDto,
): Promise<PaginatedResponse<StoryDto>> {
  // WHERE 절 구성
  const where: any = { userId };

  // 태그 필터링 (Array contains)
  if (filters.tag) {
    where.tags = { has: filters.tag };
  }

  // 작가 필터링
  if (filters.writerId) {
    where.writerId = filters.writerId;
  }

  // 북마크 필터링
  if (filters.bookmarked) {
    where.bookmarks = {
      some: { userId },
    };
  }

  // 전문 검색 (제목 + 내용)
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // ORDER BY 절 구성
  const orderBy: any = {};
  orderBy[filters.sort] = filters.order;

  // 쿼리 실행 (병렬)
  const [data, total] = await Promise.all([
    this.prisma.story.findMany({
      where,
      include: {
        writer: {
          select: { id: true, name: true, imageUrl: true },
        },
        bookmarks: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    this.prisma.story.count({ where }),
  ]);

  // isBookmarked 필드 추가
  const storiesWithBookmark = data.map(story => ({
    ...story,
    isBookmarked: story.bookmarks.length > 0,
    bookmarks: undefined, // 제거
  }));

  return {
    data: storiesWithBookmark,
    meta: {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}
```

#### 3.2 getStoryWithBookmark() 구현

```typescript
async getStoryWithBookmark(
  id: string,
  userId: string,
): Promise<StoryWithBookmarkDto> {
  const story = await this.prisma.story.findUnique({
    where: { id },
    include: {
      writer: {
        select: { id: true, name: true, imageUrl: true },
      },
      bookmarks: {
        where: { userId },
        select: { id: true },
      },
      _count: {
        select: { bookmarks: true },
      },
    },
  });

  if (!story) {
    throw new NotFoundException(`Story ${id} not found`);
  }

  if (story.userId !== userId) {
    throw new NotFoundException(`Story ${id} not found`);
  }

  return {
    ...story,
    isBookmarked: story.bookmarks.length > 0,
    bookmarkCount: story._count.bookmarks,
    bookmarks: undefined,
    _count: undefined,
  };
}
```

#### 3.3 getUserStats() 구현

```typescript
async getUserStats(userId: string): Promise<StoryStatsDto> {
  const [stories, bookmarkedCount] = await Promise.all([
    this.prisma.story.findMany({
      where: { userId },
      select: {
        wordCount: true,
        readTime: true,
        tags: true,
      },
    }),
    this.prisma.bookmark.count({
      where: { userId },
    }),
  ]);

  const totalStories = stories.length;
  const totalWords = stories.reduce((sum, s) => sum + s.wordCount, 0);
  const totalReadTime = stories.reduce((sum, s) => sum + s.readTime, 0);
  const averageWordCount = totalStories > 0 ? Math.round(totalWords / totalStories) : 0;

  // 태그 빈도 계산
  const tagCounts = new Map<string, number>();
  stories.forEach(story => {
    story.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalStories,
    totalWords,
    totalReadTime,
    averageWordCount,
    topTags,
    bookmarkedCount,
  };
}
```

#### 3.4 StoryController에 통합

**File**: `apps/server/src/story/story.controller.ts`

```typescript
@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoryController {
  /**
   * GET /stories
   * 소설 목록 조회 (필터링, 검색, 정렬)
   */
  @Get()
  async getStories(@Query() filters: StoryFiltersDto, @CurrentUser('id') userId: string) {
    return this.storyService.getUserStories(userId, filters);
  }

  /**
   * GET /stories/stats
   * 소설 통계
   */
  @Get('stats')
  async getStats(@CurrentUser('id') userId: string) {
    return this.storyService.getUserStats(userId);
  }

  /**
   * GET /stories/:id
   * 소설 상세 조회 (북마크 상태 포함)
   */
  @Get(':id')
  async getStory(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.storyService.getStoryWithBookmark(id, userId);
  }
}
```

### Success Criteria

- [ ] getUserStories() 필터링/검색/정렬 작동
- [ ] getStoryWithBookmark() isBookmarked 포함
- [ ] getUserStats() 통계 계산 정확
- [ ] 쿼리 최적화 (N+1 방지)
- [ ] 에러 처리 및 로깅

---

## Task 4: BookmarkService 구현

### Goal

북마크 CRUD 기능 구현

### Subtasks

#### 4.1 BookmarkModule 생성

```bash
cd apps/server/src
nest g module bookmark
nest g service bookmark
nest g controller bookmark
```

**File Structure**:

```
/apps/server/src/bookmark/
├── bookmark.module.ts
├── bookmark.service.ts
├── bookmark.controller.ts
├── dto/
│   ├── create-bookmark.dto.ts
│   ├── bookmark.dto.ts
│   └── index.ts
└── bookmark.service.spec.ts
```

#### 4.2 BookmarkService 구현

**File**: `apps/server/src/bookmark/bookmark.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 북마크 추가 (중복 방지, idempotent)
   */
  async create(storyId: string, userId: string): Promise<BookmarkDto> {
    // Story 존재 확인
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story ${storyId} not found`);
    }

    try {
      const bookmark = await this.prisma.bookmark.create({
        data: {
          storyId,
          userId,
        },
      });

      return bookmark;
    } catch (error) {
      // Unique constraint 위반 (이미 북마크됨)
      if (error.code === 'P2002') {
        // 이미 존재하는 북마크 반환 (idempotent)
        const existing = await this.prisma.bookmark.findUnique({
          where: {
            userId_storyId: { userId, storyId },
          },
        });
        return existing!;
      }
      throw error;
    }
  }

  /**
   * 북마크 제거
   */
  async delete(storyId: string, userId: string): Promise<void> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.prisma.bookmark.delete({
      where: { id: bookmark.id },
    });
  }

  /**
   * 북마크한 소설 목록
   */
  async getBookmarkedStories(
    userId: string,
    filters: PaginationDto,
  ): Promise<PaginatedResponse<StoryDto>> {
    const [data, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId },
        include: {
          story: {
            include: {
              writer: {
                select: { id: true, name: true, imageUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.bookmark.count({ where: { userId } }),
    ]);

    const stories = data.map((bookmark) => ({
      ...bookmark.story,
      isBookmarked: true,
    }));

    return {
      data: stories,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }
}
```

#### 4.3 BookmarkController 구현

**File**: `apps/server/src/bookmark/bookmark.controller.ts`

```typescript
import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './dto';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  /**
   * POST /bookmarks
   * 북마크 추가
   */
  @Post()
  async create(@Body() dto: CreateBookmarkDto, @CurrentUser('id') userId: string) {
    return this.bookmarkService.create(dto.storyId, userId);
  }

  /**
   * DELETE /bookmarks/:storyId
   * 북마크 제거
   */
  @Delete(':storyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('storyId') storyId: string, @CurrentUser('id') userId: string) {
    await this.bookmarkService.delete(storyId, userId);
  }

  /**
   * GET /bookmarks/stories
   * 북마크한 소설 목록
   */
  @Get('stories')
  async getBookmarkedStories(@Query() filters: PaginationDto, @CurrentUser('id') userId: string) {
    return this.bookmarkService.getBookmarkedStories(userId, filters);
  }
}
```

#### 4.4 BookmarkModule 등록

**File**: `apps/server/src/bookmark/bookmark.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { BookmarkController } from './bookmark.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BookmarkService],
  controllers: [BookmarkController],
  exports: [BookmarkService],
})
export class BookmarkModule {}
```

**File**: `apps/server/src/app.module.ts` (수정)

```typescript
import { BookmarkModule } from './bookmark/bookmark.module';

@Module({
  imports: [
    // ... other modules
    BookmarkModule,
  ],
})
export class AppModule {}
```

### Success Criteria

- [ ] BookmarkModule, Service, Controller 생성
- [ ] create() idempotent 동작 (중복 허용)
- [ ] delete() 북마크 제거
- [ ] getBookmarkedStories() pagination
- [ ] Unique constraint 에러 처리
- [ ] 단위 테스트 작성

---

## Task 5: Frontend Filters UI

### Goal

검색, 필터, 정렬 UI 컴포넌트 구현

### Subtasks

#### 5.1 API Client 확장

**File**: `apps/web/src/api/stories.types.ts` (수정)

```typescript
export interface StoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  writerId?: string;
  bookmarked?: boolean;
  sort?: 'createdAt' | 'wordCount' | 'readTime';
  order?: 'asc' | 'desc';
}
```

**File**: `apps/web/src/api/stories.api.ts` (수정)

```typescript
async getStories(filters: StoryFilters = {}) {
  const { data } = await api.get('/stories', { params: filters });
  return data;
},

async getStats() {
  const { data } = await api.get('/stories/stats');
  return data;
},
```

**File**: `apps/web/src/api/bookmarks.api.ts` (신규)

```typescript
import api from './axios';

export const bookmarksApi = {
  async create(storyId: string) {
    const { data } = await api.post('/bookmarks', { storyId });
    return data;
  },

  async delete(storyId: string) {
    await api.delete(`/bookmarks/${storyId}`);
  },

  async getBookmarkedStories(filters = {}) {
    const { data } = await api.get('/bookmarks/stories', { params: filters });
    return data;
  },
};
```

#### 5.2 StoryFilters 컴포넌트

**File**: `apps/web/src/components/story/StoryFilters.tsx`

```tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { StoryFilters as FiltersType } from '@/api/stories.types';

const AVAILABLE_TAGS = [
  '느와르',
  '스릴러',
  '반전',
  '로맨스',
  'SF',
  '힐링',
  '미스터리',
  '드라마',
  '코미디',
  '판타지',
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: '최신순' },
  { value: 'createdAt-asc', label: '오래된순' },
  { value: 'wordCount-desc', label: '긴 소설순' },
  { value: 'wordCount-asc', label: '짧은 소설순' },
  { value: 'readTime-desc', label: '읽기시간 긴순' },
  { value: 'readTime-asc', label: '읽기시간 짧은순' },
];

interface StoryFiltersProps {
  filters: FiltersType;
  onChange: (filters: Partial<FiltersType>) => void;
}

export function StoryFilters({ filters, onChange }: StoryFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ search: searchInput || undefined });
  };

  const handleSortChange = (value: string) => {
    const [sort, order] = value.split('-');
    onChange({ sort, order });
  };

  return (
    <div className="mb-6 space-y-4">
      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="제목이나 내용으로 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">검색</Button>
        {filters.search && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchInput('');
              onChange({ search: undefined });
            }}
          >
            초기화
          </Button>
        )}
      </form>

      {/* 필터 & 정렬 */}
      <div className="flex flex-wrap gap-3">
        {/* 태그 필터 */}
        <Select
          value={filters.tag || ''}
          onValueChange={(value) => onChange({ tag: value || undefined })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="모든 태그" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">모든 태그</SelectItem>
            {AVAILABLE_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 정렬 */}
        <Select value={`${filters.sort}-${filters.order}`} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 북마크 필터 */}
        <Button
          variant={filters.bookmarked ? 'default' : 'outline'}
          onClick={() => onChange({ bookmarked: !filters.bookmarked })}
        >
          🔖 북마크만 보기
        </Button>
      </div>

      {/* 활성 필터 표시 */}
      {(filters.tag || filters.search || filters.bookmarked) && (
        <div className="flex flex-wrap gap-2">
          {filters.tag && (
            <Badge variant="secondary">
              태그: {filters.tag}
              <button onClick={() => onChange({ tag: undefined })} className="ml-1">
                ✕
              </button>
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary">
              검색: {filters.search}
              <button
                onClick={() => {
                  setSearchInput('');
                  onChange({ search: undefined });
                }}
                className="ml-1"
              >
                ✕
              </button>
            </Badge>
          )}
          {filters.bookmarked && (
            <Badge variant="secondary">
              북마크만
              <button onClick={() => onChange({ bookmarked: false })} className="ml-1">
                ✕
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
```

#### 5.3 StoriesPage 업데이트

**File**: `apps/web/src/pages/stories/StoriesPage.tsx` (수정)

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { storiesApi } from '@/api/stories.api';
import { StoryFilters } from '@/components/story/StoryFilters';
import { StoryCard } from '@/components/story/StoryCard';
import { Pagination } from '@/components/ui/pagination';
import type { StoryFilters as FiltersType } from '@/api/stories.types';

export function StoriesPage() {
  const [filters, setFilters] = useState<FiltersType>({
    page: 1,
    limit: 20,
    sort: 'createdAt',
    order: 'desc',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['stories', filters],
    queryFn: () => storiesApi.getStories(filters),
  });

  const handleFilterChange = (newFilters: Partial<FiltersType>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // 필터 변경 시 첫 페이지로
    }));
  };

  if (isLoading) {
    return <StoryListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-destructive">소설 목록을 불러오는데 실패했습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">내 소설 라이브러리</h1>
          <p className="mt-2 text-muted-foreground">생성한 소설 {data?.meta.total || 0}편</p>
        </div>
        <Link
          to="/stories/new"
          className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          새 소설 생성
        </Link>
      </div>

      {/* 필터 & 정렬 */}
      <StoryFilters filters={filters} onChange={handleFilterChange} />

      {/* 소설 그리드 */}
      {data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>

          {/* 페이지네이션 */}
          <Pagination
            currentPage={filters.page}
            totalPages={data.meta.totalPages}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      ) : (
        <EmptyState
          title="소설이 없습니다"
          description={
            filters.search || filters.tag || filters.bookmarked
              ? '검색 조건을 변경해보세요'
              : '새로운 소설을 생성해보세요'
          }
        />
      )}
    </div>
  );
}
```

### Success Criteria

- [ ] StoryFilters 컴포넌트 작동
- [ ] 검색 입력 및 실행
- [ ] 태그 드롭다운 선택
- [ ] 정렬 옵션 변경
- [ ] 북마크 토글 버튼
- [ ] 활성 필터 Badge 표시

---

## Task 6: Story Card Component

### Goal

북마크 토글 기능이 있는 소설 카드 컴포넌트

### Subtasks

#### 6.1 StoryCard 컴포넌트

**File**: `apps/web/src/components/story/StoryCard.tsx`

```tsx
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarksApi } from '@/api/bookmarks.api';
import type { Story } from '@/api/stories.types';

interface StoryCardProps {
  story: Story & { isBookmarked?: boolean };
}

export function StoryCard({ story }: StoryCardProps) {
  const queryClient = useQueryClient();

  const toggleBookmark = useMutation({
    mutationFn: () =>
      story.isBookmarked ? bookmarksApi.delete(story.id) : bookmarksApi.create(story.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark.mutate();
  };

  const preview = story.content.slice(0, 200) + '...';

  return (
    <Link
      to={`/stories/${story.id}`}
      className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary hover:shadow-lg"
    >
      <div className="p-6">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="flex-1 text-xl font-semibold text-foreground group-hover:text-primary">
            {story.title}
          </h3>
          <button
            onClick={handleBookmarkClick}
            disabled={toggleBookmark.isPending}
            className="ml-2 text-2xl transition-all hover:scale-110 disabled:opacity-50"
          >
            {story.isBookmarked ? '🔖' : '📑'}
          </button>
        </div>

        {/* 태그 */}
        <div className="mb-3 flex flex-wrap gap-1">
          {story.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {tag}
            </span>
          ))}
        </div>

        {/* 미리보기 */}
        <p className="line-clamp-3 text-sm text-muted-foreground">{preview}</p>

        {/* 메타데이터 */}
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{story.wordCount.toLocaleString()}단어</span>
          <span>약 {story.readTime}분</span>
          {story.writer && <span>by {story.writer.name}</span>}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          {new Date(story.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}
```

#### 6.2 StoryDetailPage 북마크 기능 추가

**File**: `apps/web/src/pages/stories/StoryDetailPage.tsx` (수정)

```tsx
const { data: story } = useQuery({
  queryKey: ['story', id],
  queryFn: () => storiesApi.getStory(id!),
});

const toggleBookmark = useMutation({
  mutationFn: () =>
    story.isBookmarked ? bookmarksApi.delete(story.id) : bookmarksApi.create(story.id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['story', id] });
    queryClient.invalidateQueries({ queryKey: ['stories'] });
  },
});

// UI에 북마크 버튼 추가
<button
  onClick={() => toggleBookmark.mutate()}
  disabled={toggleBookmark.isPending}
  className="rounded-lg border border-primary px-6 py-2 text-sm font-medium text-primary hover:bg-primary/10"
>
  {story.isBookmarked ? '🔖 북마크 제거' : '📑 북마크 추가'}
</button>;
```

### Success Criteria

- [ ] StoryCard 북마크 아이콘 토글
- [ ] 북마크 클릭 시 즉시 반영
- [ ] React Query 캐시 무효화
- [ ] 로딩 상태 표시
- [ ] StoryDetailPage에도 북마크 기능

---

## Task 7: Pagination

### Goal

페이지네이션 컴포넌트 구현

### Subtasks

#### 7.1 Pagination 컴포넌트

**File**: `apps/web/src/components/ui/pagination.tsx`

```tsx
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // 최대 5개 페이지 번호 표시
  const visiblePages = pages.slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2),
  );

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← 이전
      </Button>

      {visiblePages[0] > 1 && (
        <>
          <Button variant="outline" onClick={() => onPageChange(1)}>
            1
          </Button>
          {visiblePages[0] > 2 && <span className="px-2">...</span>}
        </>
      )}

      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'outline'}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2">...</span>
          )}
          <Button variant="outline" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음 →
      </Button>
    </div>
  );
}
```

#### 7.2 EmptyState 컴포넌트

**File**: `apps/web/src/components/ui/empty-state.tsx`

```tsx
import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-6xl mb-4">📚</div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      {action}
    </div>
  );
}
```

#### 7.3 Loading Skeleton

**File**: `apps/web/src/components/story/StoryListSkeleton.tsx`

```tsx
export function StoryListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 h-12 w-64 animate-pulse rounded-lg bg-muted" />

      <div className="mb-6 space-y-4">
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        <div className="flex gap-3">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
```

### Success Criteria

- [ ] Pagination 컴포넌트 작동
- [ ] 페이지 번호 클릭
- [ ] 이전/다음 버튼
- [ ] EmptyState 표시
- [ ] Loading Skeleton UI

---

## Task 8: Testing & Verification

### Goal

Phase 5 기능 테스트 및 검증

### Subtasks

#### 8.1 Backend 단위 테스트

```bash
cd apps/server
pnpm test
```

**검증 항목**:

- [ ] StoryService 필터링/검색/정렬
- [ ] BookmarkService CRUD
- [ ] getUserStats() 통계 계산

#### 8.2 API 통합 테스트 (curl)

```bash
# 1. 태그 필터링
curl -s "http://localhost:3001/stories?tag=느와르" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 2. 검색
curl -s "http://localhost:3001/stories?search=비오는" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 3. 정렬
curl -s "http://localhost:3001/stories?sort=wordCount&order=desc" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 4. 북마크 추가
curl -s -X POST http://localhost:3001/bookmarks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"storyId":"story-id"}' | jq .

# 5. 북마크 제거
curl -s -X DELETE http://localhost:3001/bookmarks/story-id \
  -H "Authorization: Bearer $TOKEN"

# 6. 통계 조회
curl -s http://localhost:3001/stories/stats \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 8.3 Frontend 실행 테스트

```bash
cd apps/web
pnpm dev

# 브라우저: http://localhost:3000
# 1. /stories 접속
# 2. 태그 필터 선택
# 3. 검색어 입력
# 4. 정렬 변경
# 5. 북마크 토글
# 6. 페이지네이션 클릭
```

#### 8.4 성능 테스트

```bash
# 목록 조회 성능 측정
time curl -s "http://localhost:3001/stories?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# 목표: < 500ms

# 검색 성능 측정
time curl -s "http://localhost:3001/stories?search=test" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# 목표: < 1초
```

#### 8.5 완성도 리포트 작성

**File**: `/docs/phase5-completion-report.md`

```markdown
# Phase 5: Story Library 완성도 리포트

## 완성도 요약

| Task                      | 완성도 | 비고               |
| ------------------------- | ------ | ------------------ |
| Task 1: Database Indexes  | 100%   | 3개 인덱스 추가    |
| Task 2: Enhanced DTOs     | 100%   | 필터/정렬 DTO 완성 |
| Task 3: StoryService 확장 | 100%   | 필터링/검색/통계   |
| Task 4: BookmarkService   | 100%   | CRUD 완성          |
| Task 5: Frontend Filters  | 100%   | 검색/필터/정렬 UI  |
| Task 6: Story Card        | 100%   | 북마크 토글        |
| Task 7: Pagination        | 100%   | 페이지네이션       |
| Task 8: Testing           | 90%    | E2E 일부 대기      |

**종합 완성도**: 97% ✅
```

### Success Criteria

- [ ] 모든 백엔드 단위 테스트 통과
- [ ] curl API 테스트 성공
- [ ] Frontend 수동 테스트 성공
- [ ] 성능 기준 충족 (목록 < 500ms, 검색 < 1초)
- [ ] 완성도 리포트 작성

---

## 🎯 Phase 5 완료 기준

### Must-Have (필수)

- [x] 태그/검색/정렬 필터링
- [x] 북마크 추가/제거
- [x] Pagination
- [x] StoryCard 컴포넌트
- [x] 인덱스 최적화

### Should-Have (권장)

- [x] 통계 API (getUserStats)
- [x] Loading Skeleton
- [x] EmptyState
- [x] 북마크된 소설만 조회

### Could-Have (선택)

- [ ] 무한 스크롤
- [ ] Full-Text Search
- [ ] 캐싱 전략
- [ ] 소설 Export (PDF)

---

**다음 Phase**: Phase 6 (Advanced Features) - 공유, 추천, TTS

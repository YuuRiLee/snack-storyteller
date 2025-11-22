# Phase 4: AI Story Generation - Task Breakdown

> **Phase**: 4 - AI 소설 생성 기능 (핵심 기능)
> **Priority**: ⭐⭐⭐⭐⭐ (포트폴리오 평가 40%)
> **Estimated Duration**: 5-7일 (집중 개발 시)

---

## 📋 Task Overview

| Task   | Description                | Priority     | Dependencies | Estimated Time |
| ------ | -------------------------- | ------------ | ------------ | -------------- |
| Task 1 | Prisma Schema & Migration  | 🔴 Critical  | Phase 3 완료 | 1-2시간        |
| Task 2 | AI Service Layer           | 🔴 Critical  | Task 1       | 4-6시간        |
| Task 3 | Prompt Engineering         | 🔴 Critical  | Task 2       | 3-4시간        |
| Task 4 | Moderation Service         | 🔴 Critical  | Task 2       | 2-3시간        |
| Task 5 | Story Service & Controller | 🔴 Critical  | Task 2, 3, 4 | 4-5시간        |
| Task 6 | Frontend UI Components     | 🟡 Important | Task 5       | 3-4시간        |
| Task 7 | SSE Streaming Integration  | 🔴 Critical  | Task 5, 6    | 3-4시간        |
| Task 8 | Testing & Verification     | 🟡 Important | Task 7       | 2-3시간        |

**총 예상 시간**: 22-31시간 (약 3-4일 집중 개발)

---

## Task 1: Prisma Schema & Migration

### Goal

Story와 Bookmark 모델을 Prisma schema에 추가하고 PostgreSQL migration 실행

### Subtasks

#### 1.1 Prisma Schema 작성

**File**: `apps/server/prisma/schema.prisma`

**작업 내용**:

```prisma
// Story 모델 추가
model Story {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  tags        String[]
  wordCount   Int
  readTime    Int      // 분 단위

  // 관계
  writerId    String
  writer      Writer   @relation(fields: [writerId], references: [id], onDelete: Cascade)

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  bookmarks   Bookmark[]

  // 메타데이터
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 인덱스
  @@index([userId, createdAt(sort: Desc)])
  @@index([writerId, createdAt(sort: Desc)])
  @@index([tags])
}

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  storyId   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@unique([userId, storyId])
  @@index([userId])
}
```

**검증**:

```bash
pnpm prisma format
pnpm prisma validate
```

#### 1.2 Migration 생성 및 실행

```bash
cd apps/server
pnpm prisma migrate dev --name add-story-and-bookmark-models
```

**예상 SQL**:

- CREATE TABLE "Story" with all columns and indexes
- CREATE TABLE "Bookmark" with foreign keys
- ALTER TABLE "Writer" ADD CONSTRAINT (if needed)

**검증**:

```bash
# PostgreSQL에 접속하여 테이블 확인
psql $DATABASE_URL -c "\d Story"
psql $DATABASE_URL -c "\d Bookmark"
```

#### 1.3 Prisma Client 재생성

```bash
pnpm prisma generate
```

**검증**:

```typescript
// apps/server/src/test-prisma.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const count = await prisma.story.count();
  console.log('Story table accessible:', count === 0);
}
```

### Success Criteria

- [ ] Story 모델이 schema.prisma에 정의됨
- [ ] Bookmark 모델이 schema.prisma에 정의됨
- [ ] Migration이 성공적으로 실행됨
- [ ] PostgreSQL에 Story, Bookmark 테이블 생성 확인
- [ ] 모든 인덱스가 생성됨
- [ ] Prisma Client에서 `prisma.story`, `prisma.bookmark` 사용 가능

---

## Task 2: AI Service Layer

### Goal

OpenAI GPT-4 통합, 스트리밍 생성, 제목 생성 기능 구현

### Subtasks

#### 2.1 AI Module & Service 생성

```bash
cd apps/server/src
nest g module ai
nest g service ai
```

**File Structure**:

```
/apps/server/src/ai/
├── ai.module.ts
├── ai.service.ts
├── ai.service.spec.ts
├── dto/
│   └── index.ts
└── errors/
    └── ai.errors.ts
```

#### 2.2 OpenAI 설정

**File**: `apps/server/src/ai/ai.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly openai: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  // Methods to be implemented
}
```

**Dependencies**:

```bash
cd apps/server
pnpm add openai
```

#### 2.3 스트리밍 생성 메서드

**File**: `apps/server/src/ai/ai.service.ts`

```typescript
/**
 * GPT-4를 사용하여 스트리밍 방식으로 소설 생성
 */
async *generateStoryStream(
  systemPrompt: string,
  tags: string[],
): AsyncGenerator<string> {
  try {
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: this.buildSystemPrompt(systemPrompt, tags) },
        { role: 'user', content: this.buildUserPrompt(tags) },
      ],
      temperature: 0.9,
      max_tokens: 4000,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
      top_p: 0.95,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    this.logger.error('OpenAI streaming error', error);
    throw new AIServiceError('Story generation failed', 'OPENAI_ERROR', true);
  }
}

private buildSystemPrompt(writerSystemPrompt: string, tags: string[]): string {
  return `
당신은 뛰어난 한국어 단편 소설 작가입니다.

# 작가 스타일
${writerSystemPrompt}

# 작성 규칙
- 정확히 1,500단어 이상 작성
- 시작-중간-끝 완전한 구조
- 한국어 자연스러움 최우선
- 캐릭터와 플롯 명확성

중요: 1,500단어 미만으로 끝내지 마세요.
`;
}

private buildUserPrompt(tags: string[]): string {
  return `
다음 스타일로 단편 소설을 작성해주세요:
- 장르/분위기: ${tags.join(', ')}
- 길이: 1,500-2,000단어

지금부터 1,500단어 이상의 소설을 작성하세요.
`;
}
```

#### 2.4 제목 생성 메서드

```typescript
/**
 * 소설 내용 기반으로 제목 생성
 */
async generateTitle(content: string): Promise<string> {
  try {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '당신은 단편 소설의 제목을 짓는 전문가입니다. 10자 이내의 간결하고 인상적인 제목을 만드세요.',
        },
        {
          role: 'user',
          content: `다음 소설의 제목을 10자 이내로 지어주세요:\n\n${content.slice(0, 1000)}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 50,
    });

    return response.choices[0].message.content?.trim() || '제목 없음';
  } catch (error) {
    this.logger.error('Title generation error', error);
    return '새로운 이야기';
  }
}
```

#### 2.5 에러 타입 정의

**File**: `apps/server/src/ai/errors/ai.errors.ts`

```typescript
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class OpenAITimeoutError extends AIServiceError {
  constructor() {
    super('OpenAI API timeout', 'OPENAI_TIMEOUT', true);
  }
}

export class OpenAIRateLimitError extends AIServiceError {
  constructor() {
    super('OpenAI rate limit exceeded', 'OPENAI_RATE_LIMIT', true);
  }
}
```

#### 2.6 단위 테스트

**File**: `apps/server/src/ai/ai.service.spec.ts`

```typescript
describe('AIService', () => {
  let service: AIService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-api-key') },
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 실제 OpenAI API 호출 테스트는 E2E에서
});
```

### Success Criteria

- [ ] AIService가 생성되고 OpenAI 연결 성공
- [ ] generateStoryStream() 메서드 작동 (AsyncGenerator)
- [ ] generateTitle() 메서드 작동 (10자 이내 제목)
- [ ] 에러 타입 정의 완료
- [ ] 단위 테스트 작성 및 통과

---

## Task 3: Prompt Engineering

### Goal

Few-shot examples 추가, 토큰 최적화, 프롬프트 품질 개선

### Subtasks

#### 3.1 Few-Shot Templates 작성

**File**: `apps/server/src/ai/prompt/templates.ts`

```typescript
export interface FewShotExample {
  tags: string[];
  wordCount: number;
  story: string;
}

export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    tags: ['하드보일드', '느와르', '반전'],
    wordCount: 1800,
    story: `비는 도시를 적시고, 내 사무실 창문을 두드렸다.
수화기 너머 여자의 목소리는 떨리고 있었다. "그를 찾아주세요. 제발."
나는 담배에 불을 붙이며 대답했다. "주소를 대시오."

[... 약 1,800 단어의 완성된 하드보일드 소설 ...]

그가 살아있었다. 하지만 찾던 사람은 내가 아니었다.
그녀가 찾던 건, 죽은 남자가 아니라 살아있는 거짓말이었다.`,
  },
  {
    tags: ['로맨스', '경쾌한', '해피엔딩'],
    wordCount: 1600,
    story: `그가 카페 문을 열고 들어온 순간, 시간이 멈췄다.
[... 약 1,600 단어의 완성된 로맨스 소설 ...]
우리는 웃으며 서로의 손을 잡았다. 이것이 시작이었다.`,
  },
  {
    tags: ['SF', '디스토피아', '반전'],
    wordCount: 1750,
    story: `2157년, 마지막 인간이 태어난 지 50년이 지났다.
[... 약 1,750 단어의 완성된 SF 소설 ...]
그리고 그녀는 깨달았다. 자신이 바로 그 마지막 희망이라는 것을.`,
  },
];
```

**작업 내용**:

- 최소 5개 장르의 완성된 소설 예시 작성
- 각 예시는 1,500-2,000 단어 분량
- 다양한 스타일과 구조 포함

#### 3.2 Prompt Builder 구현

**File**: `apps/server/src/ai/prompt/prompt.builder.ts`

```typescript
import { FEW_SHOT_EXAMPLES, type FewShotExample } from './templates';

export class PromptBuilder {
  /**
   * 태그 기반으로 가장 유사한 Few-shot 예시 선택
   */
  selectRelevantExamples(tags: string[], maxExamples: number = 2): FewShotExample[] {
    const scored = FEW_SHOT_EXAMPLES.map((example) => ({
      example,
      score: this.calculateSimilarity(example.tags, tags),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxExamples)
      .map((item) => item.example);
  }

  private calculateSimilarity(tags1: string[], tags2: string[]): number {
    const intersection = tags1.filter((t) => tags2.includes(t)).length;
    const union = new Set([...tags1, ...tags2]).size;
    return intersection / union; // Jaccard similarity
  }

  /**
   * System Prompt 구성
   */
  buildSystemPrompt(writerSystemPrompt: string, examples: FewShotExample[]): string {
    const examplesText = examples
      .map(
        (ex) => `
## ${ex.tags.join(', ')} (${ex.wordCount}단어)
${ex.story}
`,
      )
      .join('\n\n');

    return `
당신은 뛰어난 한국어 단편 소설 작가입니다.

# 작가 스타일
${writerSystemPrompt}

# 학습 예시
${examplesText}

# 작성 규칙
- 정확히 1,500단어 이상 작성
- 시작-중간-끝 완전한 구조
- 한국어 자연스러움 최우선
- 캐릭터와 플롯 명확성

중요: 1,500단어 미만으로 끝내지 마세요. 반드시 완전한 이야기를 작성하세요.
`;
  }
}
```

#### 3.3 AIService에 통합

**File**: `apps/server/src/ai/ai.service.ts`

```typescript
import { PromptBuilder } from './prompt/prompt.builder';

@Injectable()
export class AIService {
  private readonly promptBuilder = new PromptBuilder();

  async *generateStoryStream(systemPrompt: string, tags: string[]): AsyncGenerator<string> {
    // Few-shot 예시 선택
    const examples = this.promptBuilder.selectRelevantExamples(tags, 2);

    // System Prompt 구성
    const systemMessage = this.promptBuilder.buildSystemPrompt(systemPrompt, examples);

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: this.buildUserPrompt(tags) },
      ],
      // ... parameters
    });

    // ... streaming logic
  }
}
```

### Success Criteria

- [ ] 5개 이상의 Few-shot 예시 작성
- [ ] PromptBuilder 구현 완료
- [ ] 태그 유사도 기반 예시 선택 작동
- [ ] AIService에 통합 완료
- [ ] 생성된 소설 평균 1,500단어 이상 달성

---

## Task 4: Moderation Service

### Goal

OpenAI Moderation API 통합, 한국어 키워드 필터링

### Subtasks

#### 4.1 ModerationService 생성

```bash
cd apps/server/src/ai
mkdir moderation
touch moderation/moderation.service.ts
touch moderation/korean-filter.ts
```

#### 4.2 한국어 필터 구현

**File**: `apps/server/src/ai/moderation/korean-filter.ts`

```typescript
export interface ModerationResult {
  safe: boolean;
  reason?: string;
}

export class KoreanFilter {
  private readonly blockedKeywords = [
    // 욕설
    '씨발',
    '개새끼',
    '병신',
    '엿먹어',
    '지랄',
    // 성적 콘텐츠
    '섹스',
    '야동',
    '포르노',
    // 폭력
    '살인',
    '자살',
    '학살',
    // 혐오 표현
    '김치녀',
    '한남',
    '맘충',
  ];

  check(content: string): ModerationResult {
    const lowerContent = content.toLowerCase();

    for (const keyword of this.blockedKeywords) {
      if (lowerContent.includes(keyword)) {
        return {
          safe: false,
          reason: `부적절한 키워드 감지: ${keyword}`,
        };
      }
    }

    return { safe: true };
  }
}
```

#### 4.3 OpenAI Moderation API 통합

**File**: `apps/server/src/ai/moderation/moderation.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { KoreanFilter, type ModerationResult } from './korean-filter';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly openai: OpenAI;
  private readonly koreanFilter: KoreanFilter;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
    this.koreanFilter = new KoreanFilter();
  }

  /**
   * 2단계 콘텐츠 검증
   * 1. 한국어 키워드 필터 (빠름)
   * 2. OpenAI Moderation API (정확함)
   */
  async checkContent(content: string): Promise<ModerationResult> {
    // Step 1: 한국어 키워드 필터
    const koreanCheck = this.koreanFilter.check(content);
    if (!koreanCheck.safe) {
      this.logger.warn('Korean filter blocked content', {
        reason: koreanCheck.reason,
      });
      return koreanCheck;
    }

    // Step 2: OpenAI Moderation API
    try {
      const response = await this.openai.moderations.create({
        input: content,
      });

      const result = response.results[0];

      if (result.flagged) {
        const categories = Object.entries(result.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category]) => category);

        this.logger.warn('OpenAI moderation flagged content', { categories });

        return {
          safe: false,
          reason: `부적절한 콘텐츠 감지: ${categories.join(', ')}`,
        };
      }

      return { safe: true };
    } catch (error) {
      this.logger.error('Moderation API error', error);
      // Moderation 실패 시에도 통과 (서비스 중단 방지)
      return { safe: true };
    }
  }
}
```

#### 4.4 AIModule에 등록

**File**: `apps/server/src/ai/ai.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { ModerationService } from './moderation/moderation.service';

@Module({
  providers: [AIService, ModerationService],
  exports: [AIService, ModerationService],
})
export class AIModule {}
```

### Success Criteria

- [ ] KoreanFilter 구현 및 테스트
- [ ] ModerationService OpenAI API 통합
- [ ] 2단계 검증 로직 작동
- [ ] AIModule에 등록 완료
- [ ] 부적절한 콘텐츠 차단 확인

---

## Task 5: Story Service & Controller

### Goal

소설 생성, 조회, 삭제 API 구현

### Subtasks

#### 5.1 Story Module 생성

```bash
cd apps/server/src
nest g module story
nest g service story
nest g controller story
```

#### 5.2 DTOs 작성

**File**: `apps/server/src/story/dto/generate-story.dto.ts`

```typescript
import { IsString, IsNotEmpty, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class GenerateStoryDto {
  @IsString()
  @IsNotEmpty({ message: 'writerId는 필수입니다.' })
  writerId: string;

  @IsArray({ message: 'tags는 배열이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개의 태그를 선택해야 합니다.' })
  @ArrayMaxSize(3, { message: '최대 3개까지 태그를 선택할 수 있습니다.' })
  @IsString({ each: true })
  tags: string[];
}
```

**File**: `apps/server/src/story/dto/story.dto.ts`

```typescript
export class StoryDto {
  id: string;
  title: string;
  content: string;
  tags: string[];
  wordCount: number;
  readTime: number;
  writerId: string;
  writer?: { id: string; name: string; imageUrl: string | null };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**File**: `apps/server/src/story/dto/story-filters.dto.ts`

```typescript
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class StoryFiltersDto {
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

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  writerId?: string;
}
```

#### 5.3 StoryService 구현

**File**: `apps/server/src/story/story.service.ts`

```typescript
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { ModerationService } from '../ai/moderation/moderation.service';
import { GenerateStoryDto, StoryFiltersDto, StoryDto } from './dto';

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly moderationService: ModerationService,
  ) {}

  /**
   * 소설 생성 (재시도 로직 포함)
   */
  async generateStory(dto: GenerateStoryDto, userId: string): Promise<StoryDto> {
    const startTime = Date.now();

    // Writer 조회
    const writer = await this.prisma.writer.findUnique({
      where: { id: dto.writerId },
    });

    if (!writer) {
      throw new NotFoundException(`Writer ${dto.writerId} not found`);
    }

    this.logger.log({
      event: 'story_generation_started',
      userId,
      writerId: dto.writerId,
      tags: dto.tags,
    });

    // 재시도 로직: 최대 3회
    let content: string | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !content) {
      try {
        // AI 생성
        const chunks: string[] = [];
        for await (const chunk of this.aiService.generateStoryStream(
          writer.systemPrompt,
          dto.tags,
        )) {
          chunks.push(chunk);
        }

        const generated = chunks.join('');

        // Moderation 검증
        const moderation = await this.moderationService.checkContent(generated);
        if (!moderation.safe) {
          this.logger.warn(`Moderation failed (attempt ${retryCount + 1}): ${moderation.reason}`);
          retryCount++;
          continue;
        }

        content = generated;
      } catch (error) {
        this.logger.error(`Generation failed (attempt ${retryCount + 1})`, error);
        retryCount++;

        if (retryCount >= maxRetries) {
          throw error;
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }

    if (!content) {
      throw new Error('Story generation failed after 3 attempts');
    }

    // 제목 생성
    const title = await this.aiService.generateTitle(content);

    // 단어 수 계산
    const wordCount = this.countWords(content);
    const readTime = Math.ceil(wordCount / 200); // 분당 200단어 가정

    // DB 저장
    const story = await this.prisma.story.create({
      data: {
        title,
        content,
        tags: dto.tags,
        wordCount,
        readTime,
        writerId: dto.writerId,
        userId,
      },
      include: {
        writer: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    const duration = Date.now() - startTime;

    this.logger.log({
      event: 'story_generation_completed',
      userId,
      storyId: story.id,
      duration,
      wordCount,
      retryCount,
    });

    return story;
  }

  /**
   * 사용자 소설 목록 조회
   */
  async getUserStories(userId: string, filters: StoryFiltersDto) {
    const where: any = { userId };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tag) {
      where.tags = { has: filters.tag };
    }

    if (filters.writerId) {
      where.writerId = filters.writerId;
    }

    const [data, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        include: {
          writer: { select: { id: true, name: true, imageUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.story.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  /**
   * 소설 상세 조회
   */
  async getStory(id: string, userId: string): Promise<StoryDto> {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        writer: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    if (!story) {
      throw new NotFoundException(`Story ${id} not found`);
    }

    if (story.userId !== userId) {
      throw new NotFoundException(`Story ${id} not found`);
    }

    return story;
  }

  /**
   * 소설 삭제
   */
  async deleteStory(id: string, userId: string): Promise<void> {
    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Story ${id} not found`);
    }

    if (story.userId !== userId) {
      throw new NotFoundException(`Story ${id} not found`);
    }

    await this.prisma.story.delete({ where: { id } });

    this.logger.log({ event: 'story_deleted', userId, storyId: id });
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }
}
```

#### 5.4 StoryController 구현

**File**: `apps/server/src/story/story.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StoryService } from './story.service';
import { GenerateStoryDto, StoryFiltersDto } from './dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  /**
   * POST /stories
   * 소설 생성
   */
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle(10, 86400) // 일일 10회 제한
  async generateStory(@Body() dto: GenerateStoryDto, @CurrentUser('id') userId: string) {
    return this.storyService.generateStory(dto, userId);
  }

  /**
   * GET /stories
   * 소설 목록 조회
   */
  @Get()
  async getStories(@Query() filters: StoryFiltersDto, @CurrentUser('id') userId: string) {
    return this.storyService.getUserStories(userId, filters);
  }

  /**
   * GET /stories/:id
   * 소설 상세 조회
   */
  @Get(':id')
  async getStory(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.storyService.getStory(id, userId);
  }

  /**
   * DELETE /stories/:id
   * 소설 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStory(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.storyService.deleteStory(id, userId);
  }
}
```

#### 5.5 Throttler 설정

**File**: `apps/server/src/app.module.ts`

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // ... other imports
    ThrottlerModule.forRoot({
      ttl: 86400, // 24시간
      limit: 10, // 기본 10회
    }),
  ],
})
export class AppModule {}
```

**Dependencies**:

```bash
pnpm add @nestjs/throttler
```

### Success Criteria

- [ ] StoryModule, Service, Controller 생성
- [ ] DTOs 작성 및 검증
- [ ] StoryService.generateStory() 작동 (재시도 로직)
- [ ] StoryService.getUserStories() pagination 작동
- [ ] StoryService.getStory(), deleteStory() 작동
- [ ] Rate Limiting 적용 (일일 10회)
- [ ] 에러 처리 및 로깅 완료

---

## Task 6: Frontend UI Components

### Goal

소설 생성 페이지 및 소설 목록/상세 페이지 UI 구현

### Subtasks

#### 6.1 API Client & Types

**File**: `apps/web/src/api/stories.types.ts`

```typescript
export interface Story {
  id: string;
  title: string;
  content: string;
  tags: string[];
  wordCount: number;
  readTime: number;
  writerId: string;
  writer?: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateStoryDto {
  writerId: string;
  tags: string[];
}

export interface StoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  writerId?: string;
}
```

**File**: `apps/web/src/api/stories.api.ts`

```typescript
import api from './axios';
import type { Story, GenerateStoryDto, StoryFilters } from './stories.types';

export const storiesApi = {
  async generateStory(dto: GenerateStoryDto): Promise<Story> {
    const { data } = await api.post<Story>('/stories', dto);
    return data;
  },

  async getStories(filters: StoryFilters = {}) {
    const { data } = await api.get('/stories', { params: filters });
    return data;
  },

  async getStory(id: string): Promise<Story> {
    const { data } = await api.get<Story>(`/stories/${id}`);
    return data;
  },

  async deleteStory(id: string): Promise<void> {
    await api.delete(`/stories/${id}`);
  },
};
```

#### 6.2 생성 페이지 컴포넌트

**File**: `apps/web/src/pages/stories/GenerateStoryPage.tsx`

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWriters } from '@/api/writers.hooks';
import { storiesApi } from '@/api/stories.api';
import type { GenerateStoryDto } from '@/api/stories.types';

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

export function GenerateStoryPage() {
  const navigate = useNavigate();
  const { data: writers } = useWriters({ limit: 100 });

  const [selectedWriter, setSelectedWriter] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedWriter || selectedTags.length === 0) {
      setError('작가와 태그를 선택해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const dto: GenerateStoryDto = {
        writerId: selectedWriter,
        tags: selectedTags,
      };

      const story = await storiesApi.generateStory(dto);

      // 생성 완료 후 상세 페이지로 이동
      navigate(`/stories/${story.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '소설 생성에 실패했습니다.');
      setIsGenerating(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">새로운 소설 생성</h1>

      <div className="max-w-2xl">
        {/* 작가 선택 */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-semibold text-foreground">작가 선택</label>
          <select
            value={selectedWriter}
            onChange={(e) => setSelectedWriter(e.target.value)}
            disabled={isGenerating}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-50"
          >
            <option value="">작가를 선택하세요</option>
            {writers?.data.map((writer) => (
              <option key={writer.id} value={writer.id}>
                {writer.name}
              </option>
            ))}
          </select>
        </div>

        {/* 태그 선택 */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-semibold text-foreground">
            스타일 조합 (최대 3개)
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                disabled={isGenerating || (!selectedTags.includes(tag) && selectedTags.length >= 3)}
                className={`rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
                  selectedTags.includes(tag)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* 생성 버튼 */}
        <button
          onClick={handleGenerate}
          disabled={!selectedWriter || selectedTags.length === 0 || isGenerating}
          className="w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isGenerating ? '소설 생성 중...' : '소설 생성하기'}
        </button>

        {/* 생성 중 안내 */}
        {isGenerating && (
          <div className="mt-6 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-foreground">소설을 생성하고 있습니다...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              약 30초 정도 소요됩니다. 잠시만 기다려주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 6.3 소설 목록 페이지

**File**: `apps/web/src/pages/stories/StoriesPage.tsx`

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { storiesApi } from '@/api/stories.api';
import type { StoryFilters } from '@/api/stories.types';

export function StoriesPage() {
  const [filters, setFilters] = useState<StoryFilters>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['stories', filters],
    queryFn: () => storiesApi.getStories(filters),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">로딩 중...</div>
      </div>
    );
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

      {/* 소설 목록 */}
      {data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((story) => (
              <Link
                key={story.id}
                to={`/stories/${story.id}`}
                className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="p-6">
                  <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary">
                    {story.title}
                  </h3>

                  <div className="mb-3 flex flex-wrap gap-2">
                    {story.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="line-clamp-3 text-sm text-muted-foreground">{story.content}</p>

                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{story.wordCount.toLocaleString()}단어</span>
                    <span>약 {story.readTime}분</span>
                    {story.writer && <span>by {story.writer.name}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 페이지네이션 */}
          <div className="mt-8 flex justify-center gap-2">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              className="rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-50"
            >
              이전
            </button>
            <span className="flex items-center px-4 text-muted-foreground">
              {filters.page} / {data.meta.totalPages}
            </span>
            <button
              disabled={filters.page === data.meta.totalPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              className="rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </>
      ) : (
        <div className="py-12 text-center text-muted-foreground">생성된 소설이 없습니다.</div>
      )}
    </div>
  );
}
```

#### 6.4 소설 상세 페이지

**File**: `apps/web/src/pages/stories/StoryDetailPage.tsx`

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storiesApi } from '@/api/stories.api';

export function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: story,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['story', id],
    queryFn: () => storiesApi.getStory(id!),
  });

  const deleteMutation = useMutation({
    mutationFn: () => storiesApi.deleteStory(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      navigate('/stories');
    },
  });

  const handleDelete = () => {
    if (!story) return;
    if (!confirm(`"${story.title}" 소설을 삭제하시겠습니까?`)) return;

    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-destructive">소설을 불러오는데 실패했습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        ← 뒤로가기
      </button>

      {/* 제목 & 메타데이터 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">{story.title}</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {story.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{story.wordCount.toLocaleString()}단어</span>
          <span>약 {story.readTime}분</span>
          {story.writer && (
            <span>
              by{' '}
              <Link to={`/writers/${story.writer.id}`} className="hover:text-primary">
                {story.writer.name}
              </Link>
            </span>
          )}
          <span>{new Date(story.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* 소설 본문 */}
      <div className="mb-8 rounded-lg border border-border bg-card p-8">
        <div className="story-content whitespace-pre-wrap text-foreground leading-relaxed">
          {story.content}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          className="rounded-lg border border-destructive px-6 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
```

### Success Criteria

- [ ] GenerateStoryPage 컴포넌트 작동
- [ ] StoriesPage 목록 조회 및 pagination
- [ ] StoryDetailPage 상세 조회
- [ ] 소설 삭제 기능 작동
- [ ] 로딩/에러 상태 처리
- [ ] 반응형 디자인

---

## Task 7: SSE Streaming Integration

### Goal

Server-Sent Events를 사용한 실시간 스트리밍 구현

### Subtasks

#### 7.1 Backend SSE 엔드포인트

**File**: `apps/server/src/story/story.controller.ts`

```typescript
import { Sse, MessageEvent } from '@nestjs/common';
import { Observable, from } from 'rxjs';

@Controller('stories')
export class StoryController {
  /**
   * SSE /stories/generate
   * 실시간 스트리밍으로 소설 생성
   */
  @Sse('generate')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle(10, 86400)
  generateStoryStream(
    @Query('writerId') writerId: string,
    @Query('tags') tagsJson: string,
    @CurrentUser('id') userId: string,
  ): Observable<MessageEvent> {
    const tags = JSON.parse(tagsJson);

    return from(this.storyService.generateStoryStream({ writerId, tags }, userId));
  }
}
```

**File**: `apps/server/src/story/story.service.ts`

```typescript
async *generateStoryStream(
  dto: GenerateStoryDto,
  userId: string,
): AsyncGenerator<MessageEvent> {
  const writer = await this.prisma.writer.findUnique({
    where: { id: dto.writerId },
  });

  if (!writer) {
    yield { data: { error: 'Writer not found' } };
    return;
  }

  const chunks: string[] = [];

  try {
    // AI 스트리밍
    for await (const chunk of this.aiService.generateStoryStream(
      writer.systemPrompt,
      dto.tags,
    )) {
      chunks.push(chunk);

      // SSE 이벤트 전송
      yield {
        data: {
          chunk,
          progress: Math.min((chunks.length / 200) * 100, 95), // 예상 진행도
        },
      };
    }

    const content = chunks.join('');

    // Moderation 검증
    const moderation = await this.moderationService.checkContent(content);
    if (!moderation.safe) {
      yield { data: { error: moderation.reason } };
      return;
    }

    // 제목 생성
    const title = await this.aiService.generateTitle(content);

    // DB 저장
    const wordCount = this.countWords(content);
    const readTime = Math.ceil(wordCount / 200);

    const story = await this.prisma.story.create({
      data: {
        title,
        content,
        tags: dto.tags,
        wordCount,
        readTime,
        writerId: dto.writerId,
        userId,
      },
    });

    // 완료 이벤트
    yield {
      data: {
        done: true,
        storyId: story.id,
        progress: 100,
      },
    };
  } catch (error) {
    this.logger.error('Story streaming error', error);
    yield { data: { error: 'Generation failed' } };
  }
}
```

#### 7.2 Frontend EventSource Client

**File**: `apps/web/src/api/stories.api.ts`

```typescript
export function generateStoryStream(
  dto: GenerateStoryDto,
  onChunk: (chunk: string, progress: number) => void,
  onComplete: (storyId: string) => void,
  onError: (error: string) => void,
): () => void {
  const token = localStorage.getItem('access_token');
  const url = new URL(`${import.meta.env.VITE_API_URL}/stories/generate`);

  url.searchParams.set('writerId', dto.writerId);
  url.searchParams.set('tags', JSON.stringify(dto.tags));

  const eventSource = new EventSource(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  } as any);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.error) {
      onError(data.error);
      eventSource.close();
    } else if (data.chunk) {
      onChunk(data.chunk, data.progress);
    } else if (data.done) {
      onComplete(data.storyId);
      eventSource.close();
    }
  };

  eventSource.onerror = () => {
    onError('Connection lost');
    eventSource.close();
  };

  // Cleanup 함수 반환
  return () => {
    eventSource.close();
  };
}
```

#### 7.3 스트리밍 UI 컴포넌트

**File**: `apps/web/src/pages/stories/GenerateStoryPage.tsx` (수정)

```tsx
import { generateStoryStream } from '@/api/stories.api';

export function GenerateStoryPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!selectedWriter || selectedTags.length === 0) return;

    setIsGenerating(true);
    setContent('');
    setProgress(0);
    setError(null);

    const cleanup = generateStoryStream(
      { writerId: selectedWriter, tags: selectedTags },
      // onChunk
      (chunk, prog) => {
        setContent(prev => prev + chunk);
        setProgress(prog);
      },
      // onComplete
      (storyId) => {
        setProgress(100);
        setTimeout(() => {
          navigate(`/stories/${storyId}`);
        }, 1000);
      },
      // onError
      (err) => {
        setError(err);
        setIsGenerating(false);
      },
    );

    // Cleanup on unmount
    return cleanup;
  };

  return (
    <div>
      {!isGenerating ? (
        // 생성 폼
      ) : (
        <div className="max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                소설 생성 중... {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 스트리밍 출력 */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {content}
              <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1">▊</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Success Criteria

- [ ] Backend SSE 엔드포인트 작동
- [ ] Frontend EventSource 연결 성공
- [ ] 실시간 토큰 스트리밍 확인
- [ ] Progress bar 업데이트
- [ ] 생성 완료 시 자동 이동
- [ ] 에러 처리 및 재연결 로직

---

## Task 8: Testing & Verification

### Goal

Phase 4 핵심 기능 테스트 및 검증

### Subtasks

#### 8.1 Backend 단위 테스트

```bash
cd apps/server
pnpm test
```

**검증 항목**:

- [ ] AIService 스트리밍 작동
- [ ] ModerationService 콘텐츠 검증
- [ ] StoryService 생성/조회/삭제
- [ ] PromptBuilder Few-shot 선택

#### 8.2 API 통합 테스트 (curl)

```bash
# 1. 로그인
LOGIN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}')

TOKEN=$(echo $LOGIN | jq -r '.access_token')

# 2. 소설 생성
STORY=$(curl -s -X POST http://localhost:3001/stories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"writerId":"writer-id","tags":["느와르","스릴러"]}')

echo $STORY | jq .

# 3. 소설 목록 조회
curl -s http://localhost:3001/stories \
  -H "Authorization: Bearer $TOKEN" | jq .

# 4. 소설 상세 조회
STORY_ID=$(echo $STORY | jq -r '.id')
curl -s http://localhost:3001/stories/$STORY_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 8.3 Frontend 실행 테스트

```bash
cd apps/web
pnpm dev

# 브라우저: http://localhost:3000
# 1. /stories/new 접속
# 2. 작가 선택 + 태그 선택
# 3. 생성 버튼 클릭
# 4. 스트리밍 확인
# 5. 완료 후 상세 페이지 확인
```

#### 8.4 E2E 테스트 (Playwright)

**File**: `apps/web/e2e/story-generation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Story Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@test.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should generate story successfully', async ({ page }) => {
    await page.goto('/stories/new');

    await page.selectOption('select', { label: '하드보일드 작가' });
    await page.click('text=느와르');
    await page.click('text=스릴러');

    await page.click('text=소설 생성하기');

    // 생성 완료 대기 (30초)
    await expect(page).toHaveURL(/\/stories\/[a-z0-9]+/, { timeout: 30000 });

    // 소설 내용 확인
    const content = await page.locator('.story-content').textContent();
    expect(content!.split(/\s+/).length).toBeGreaterThanOrEqual(1500);
  });
});
```

#### 8.5 성능 테스트

```bash
# 첫 토큰 응답 시간 측정
time curl -s -X POST http://localhost:3001/stories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"writerId":"writer-id","tags":["느와르"]}' \
  | head -n 1

# 목표: < 2초
```

#### 8.6 완성도 리포트 작성

**File**: `/docs/phase4-completion-report.md`

```markdown
# Phase 4: AI Story Generation 완성도 리포트

## 완성도 요약

| Task                       | 완성도 | 비고                      |
| -------------------------- | ------ | ------------------------- |
| Task 1: Prisma Schema      | 100%   | Story, Bookmark 모델 완성 |
| Task 2: AI Service         | 100%   | OpenAI 통합 완료          |
| Task 3: Prompt Engineering | 100%   | Few-shot 5개 추가         |
| Task 4: Moderation         | 100%   | 2단계 검증 작동           |
| Task 5: Story Service      | 100%   | CRUD + 재시도 로직        |
| Task 6: Frontend UI        | 100%   | 3개 페이지 완성           |
| Task 7: SSE Streaming      | 100%   | 실시간 스트리밍 성공      |
| Task 8: Testing            | 90%    | E2E 일부 대기             |

**종합 완성도**: 97% ✅
```

### Success Criteria

- [ ] 모든 백엔드 단위 테스트 통과
- [ ] curl API 테스트 성공
- [ ] Frontend 수동 테스트 성공
- [ ] E2E 테스트 통과
- [ ] 성능 기준 충족 (첫 토큰 < 2초)
- [ ] 완성도 리포트 작성

---

## 🎯 Phase 4 완료 기준

### Must-Have (필수)

- [x] Prisma Story, Bookmark 모델
- [x] OpenAI GPT-4 통합
- [x] 스트리밍 생성 기능
- [x] Moderation 검증
- [x] Frontend 생성/목록/상세 페이지
- [x] 1,500단어 이상 생성

### Should-Have (권장)

- [x] Few-shot examples 5개 이상
- [x] 재시도 로직 (최대 3회)
- [x] Rate Limiting (일일 10회)
- [x] E2E 테스트

### Could-Have (선택)

- [ ] Claude Fallback
- [ ] 프롬프트 A/B 테스트
- [ ] 성능 모니터링 (Sentry)
- [ ] 토큰 비용 추적

---

**다음 Phase**: Phase 5 (Library) - 소설 검색, 북마크, 공유

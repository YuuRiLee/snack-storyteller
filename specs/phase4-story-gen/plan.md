# Phase 4: AI Story Generation - Technical Plan

> **Phase**: 4 - AI 소설 생성 기능 (핵심 기능)
> **Priority**: ⭐⭐⭐⭐⭐ (포트폴리오 평가 40%)
> **Dependencies**: Phase 3 (Writer Management) 완료, OpenAI API 키

---

## 📐 Architecture Overview

### System Components

```mermaid
graph TB
    subgraph Frontend
        UI[React UI]
        SSE[EventSource Client]
    end

    subgraph Backend
        Controller[StoryController]
        Service[StoryService]
        AIService[AIService]
        Moderation[ModerationService]
    end

    subgraph External
        OpenAI[OpenAI GPT-4]
        ModAPI[Moderation API]
    end

    subgraph Database
        PG[(PostgreSQL)]
        Writer[Writer Table]
        Story[Story Table]
    end

    UI -->|POST /stories/generate| Controller
    Controller -->|SSE Stream| SSE
    Controller --> Service
    Service --> AIService
    Service --> Moderation
    AIService -->|Streaming| OpenAI
    Moderation --> ModAPI
    Service --> PG
    Service --> Writer
    Service --> Story
```

### Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant C as StoryController
    participant S as StoryService
    participant AI as AIService
    participant M as ModerationService
    participant GPT as OpenAI GPT-4
    participant DB as Database

    U->>F: 작가 선택 + 태그 선택
    F->>C: POST /stories/generate (SSE)
    C->>S: generateStory(dto, userId)

    S->>DB: Writer 조회 (systemPrompt)
    DB-->>S: Writer data

    S->>AI: buildPrompt(systemPrompt, tags)
    AI-->>S: Optimized prompt

    S->>AI: streamGeneration(prompt)
    AI->>GPT: Stream request

    loop Streaming Tokens
        GPT-->>AI: Token chunk
        AI-->>S: Token chunk
        S-->>C: SSE: {chunk: "..."}
        C-->>F: Server-Sent Event
        F-->>U: Display token
    end

    GPT-->>AI: Stream complete
    AI-->>S: Full content

    S->>M: checkContent(content)
    M-->>S: Safe/Unsafe

    alt Content is Safe
        S->>AI: generateTitle(content)
        AI-->>S: Title
        S->>DB: Save story
        DB-->>S: Story ID
        S-->>C: SSE: {done: true, storyId}
        C-->>F: Generation complete
        F-->>U: Navigate to story
    else Content is Unsafe
        S->>AI: Retry generation (max 3)
        Note over S: If still fails, return error
    end
```

---

## 🗄️ Database Schema

### Story Model (Prisma)

```prisma
model Story {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  tags        String[]
  wordCount   Int
  readTime    Int      // 분 단위 (wordCount / 200)

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

### Migration

```bash
# Create migration
pnpm prisma migrate dev --name add-story-and-bookmark-models

# Expected SQL
CREATE TABLE "Story" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tags" TEXT[],
  "wordCount" INTEGER NOT NULL,
  "readTime" INTEGER NOT NULL,
  "writerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("writerId") REFERENCES "Writer"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE INDEX "Story_userId_createdAt_idx" ON "Story"("userId", "createdAt" DESC);
CREATE INDEX "Story_writerId_createdAt_idx" ON "Story"("writerId", "createdAt" DESC);
CREATE INDEX "Story_tags_idx" ON "Story"("tags");
```

---

## 🧠 AI Service Architecture

### Service Layer Structure

```
/apps/server/src/ai/
├── ai.module.ts
├── ai.service.ts              # 메인 AI 로직
├── providers/
│   ├── openai.provider.ts     # OpenAI GPT-4 (Primary)
│   ├── claude.provider.ts     # Anthropic Claude (Fallback 1)
│   └── openrouter.provider.ts # OpenRouter (Fallback 2)
├── prompt/
│   ├── prompt.builder.ts      # Prompt 구조 생성
│   ├── templates.ts           # Few-shot examples
│   └── optimization.ts        # 토큰 최적화
├── moderation/
│   ├── moderation.service.ts  # OpenAI Moderation API
│   └── korean-filter.ts       # 한국어 키워드 필터
└── dto/
    ├── generate-story.dto.ts
    └── story-response.dto.ts
```

### AIService Interface

```typescript
// apps/server/src/ai/ai.service.ts

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

  /**
   * GPT-4를 사용하여 스트리밍 방식으로 소설 생성
   * @param systemPrompt - Writer의 systemPrompt (100-2000자)
   * @param tags - 장르/분위기/결말 태그 (1-3개)
   * @returns AsyncGenerator<string> - 토큰 스트림
   */
  async *generateStoryStream(systemPrompt: string, tags: string[]): AsyncGenerator<string> {
    const prompt = this.buildPrompt(systemPrompt, tags);

    try {
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        temperature: 0.9, // 창의성 최대
        max_tokens: 4000, // 충분한 여유
        presence_penalty: 0.6, // 주제 다양성
        frequency_penalty: 0.3, // 반복 방지
        top_p: 0.95, // Nucleus sampling
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
      throw error;
    }
  }

  /**
   * 소설 내용 기반으로 제목 생성 (단일 요청)
   * @param content - 생성된 소설 전문
   * @returns Promise<string> - 10자 이내 제목
   */
  async generateTitle(content: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            '당신은 단편 소설의 제목을 짓는 전문가입니다. 10자 이내의 간결하고 인상적인 제목을 만드세요.',
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
  }

  /**
   * Prompt 구조 생성 (Few-shot + Tags)
   */
  private buildPrompt(systemPrompt: string, tags: string[]): { system: string; user: string } {
    // Few-shot examples (장르별)
    const examples = this.getFewShotExamples(tags);

    const system = `
당신은 뛰어난 한국어 단편 소설 작가입니다.

# 작가 스타일
${systemPrompt}

# 작가 스타일 학습 예시

${examples
  .map(
    (ex) => `
## ${ex.tags.join(', ')}
${ex.story}
`,
  )
  .join('\n\n')}

# 이제 당신의 차례입니다.
위 예시들과 같은 수준의 한국어 단편 소설을 작성하세요.

중요: 이 소설은 정확히 1,500단어 이상이어야 합니다.
1,500단어 미만으로 끝내지 마세요. 반드시 완전한 이야기를 작성하세요.
`;

    const user = `
다음 스타일로 단편 소설을 작성해주세요:
- 장르/분위기: ${tags.join(', ')}
- 길이: 1,500-2,000단어
- 구조: 시작-중간-끝이 완전한 이야기

지금부터 1,500단어 이상의 소설을 작성하세요.
`;

    return { system, user };
  }

  /**
   * 태그 기반 Few-shot 예시 선택
   */
  private getFewShotExamples(tags: string[]): Array<{ tags: string[]; story: string }> {
    // templates.ts에서 태그와 유사한 예시 2개 선택
    // 실제 구현에서는 벡터 유사도 또는 태그 매칭 사용
    return [];
  }
}
```

---

## 🎭 Prompt Engineering Strategy

### Prompt Structure

```typescript
// apps/server/src/ai/prompt/prompt.builder.ts

export interface PromptComponents {
  writerStyle: string; // Writer의 systemPrompt
  fewShotExamples: string; // 장르별 예시 소설
  constraints: string; // 길이, 구조 제약
  userRequest: string; // 태그 기반 요청
}

export class PromptBuilder {
  /**
   * 최종 System Message 구성
   */
  buildSystemMessage(components: PromptComponents): string {
    return `
당신은 뛰어난 한국어 단편 소설 작가입니다.

# 작가 정체성
${components.writerStyle}

# 학습 예시
${components.fewShotExamples}

# 작성 규칙
${components.constraints}

# 중요 지침
- 정확히 1,500단어 이상 작성
- 시작-중간-끝 완전한 구조
- 한국어 자연스러움 최우선
- 캐릭터와 플롯 명확성
`;
  }

  /**
   * User Message 구성
   */
  buildUserMessage(tags: string[]): string {
    return `
다음 스타일로 단편 소설을 작성해주세요:
- 장르/분위기: ${tags.join(', ')}
- 길이: 1,500-2,000단어
- 구조: 완전한 이야기

지금부터 1,500단어 이상의 소설을 작성하세요.
`;
  }
}
```

### Few-Shot Examples Database

```typescript
// apps/server/src/ai/prompt/templates.ts

export const FEW_SHOT_EXAMPLES = [
  {
    tags: ['하드보일드', '느와르', '반전'],
    wordCount: 1800,
    story: `비는 도시를 적시고, 내 사무실 창문을 두드렸다.
수화기 너머 여자의 목소리는 떨리고 있었다. "그를 찾아주세요. 제발."
나는 담배에 불을 붙이며 대답했다. "주소를 대시오."

[... 1,800 단어 완성 소설 ...]

그가 살아있었다. 하지만 찾던 사람은 내가 아니었다.
그녀가 찾던 건, 죽은 남자가 아니라 살아있는 거짓말이었다.`,
  },
  {
    tags: ['로맨스', '경쾌한', '해피엔딩'],
    wordCount: 1600,
    story: `그가 카페 문을 열고 들어온 순간, 시간이 멈췄다.
[... 1,600 단어 ...]
우리는 웃으며 서로의 손을 잡았다. 이것이 시작이었다.`,
  },
  // 장르별 최소 3-5개 예시 필요
];
```

### Token Optimization

```typescript
// apps/server/src/ai/prompt/optimization.ts

export class TokenOptimizer {
  /**
   * 프롬프트 토큰 수 계산 (tiktoken 사용)
   */
  countTokens(text: string): number {
    // tiktoken 라이브러리로 정확한 토큰 계산
    return Math.ceil(text.length / 4); // 간단한 추정
  }

  /**
   * 최대 토큰 제한 내에서 Few-shot 예시 선택
   * @param maxTokens - 시스템 메시지 최대 토큰 (권장: 2000)
   */
  selectExamples(
    allExamples: typeof FEW_SHOT_EXAMPLES,
    tags: string[],
    maxTokens: number,
  ): typeof FEW_SHOT_EXAMPLES {
    // 태그 유사도 기반 정렬
    const sorted = allExamples.sort((a, b) => {
      const scoreA = this.calculateSimilarity(a.tags, tags);
      const scoreB = this.calculateSimilarity(b.tags, tags);
      return scoreB - scoreA;
    });

    // 토큰 제한 내에서 최대한 포함
    const selected = [];
    let totalTokens = 0;

    for (const example of sorted) {
      const tokens = this.countTokens(example.story);
      if (totalTokens + tokens < maxTokens) {
        selected.push(example);
        totalTokens += tokens;
      }
      if (selected.length >= 3) break; // 최대 3개
    }

    return selected;
  }

  private calculateSimilarity(tags1: string[], tags2: string[]): number {
    const intersection = tags1.filter((t) => tags2.includes(t)).length;
    return intersection / Math.max(tags1.length, tags2.length);
  }
}
```

---

## 🛡️ Safety & Moderation

### ModerationService

```typescript
// apps/server/src/ai/moderation/moderation.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { KoreanFilter } from './korean-filter';

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
  async checkContent(content: string): Promise<{ safe: boolean; reason?: string }> {
    // Step 1: 한국어 키워드 필터 (로컬, 빠름)
    const koreanCheck = this.koreanFilter.check(content);
    if (!koreanCheck.safe) {
      this.logger.warn('Korean filter blocked content', { reason: koreanCheck.reason });
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

### Korean Filter

```typescript
// apps/server/src/ai/moderation/korean-filter.ts

export class KoreanFilter {
  private readonly blockedKeywords = [
    // 욕설
    '씨발',
    '개새끼',
    '병신',
    // 성적 콘텐츠
    '섹스',
    '야동',
    // 폭력
    '살인',
    '자살',
    // 혐오 표현
    '김치녀',
    '한남',
  ];

  check(content: string): { safe: boolean; reason?: string } {
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

---

## 🔌 API Endpoints

### StoryController

```typescript
// apps/server/src/story/story.controller.ts

import { Controller, Post, Get, Body, Query, Param, UseGuards, Sse } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StoryService } from './story.service';
import { GenerateStoryDto, StoryFiltersDto } from './dto';
import { Observable } from 'rxjs';

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  /**
   * POST /stories/generate
   * SSE 스트리밍으로 소설 생성
   */
  @Sse('generate')
  generateStory(
    @Body() dto: GenerateStoryDto,
    @CurrentUser('id') userId: string,
  ): Observable<MessageEvent> {
    return this.storyService.generateStoryStream(dto, userId);
  }

  /**
   * GET /stories
   * 사용자 소설 목록 조회 (pagination)
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
  async deleteStory(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.storyService.deleteStory(id, userId);
  }
}
```

### DTOs

```typescript
// apps/server/src/story/dto/generate-story.dto.ts

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

// apps/server/src/story/dto/story-filters.dto.ts

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

---

## ⚡ Performance Optimization

### Response Time Targets

| Metric       | Target  | Strategy                            |
| ------------ | ------- | ----------------------------------- |
| 첫 토큰 응답 | < 2초   | OpenAI API 최적화, 프롬프트 간소화  |
| 토큰당 지연  | < 100ms | 네트워크 최적화, SSE 버퍼링         |
| 전체 생성    | < 30초  | max_tokens 제한, temperature 최적화 |
| 제목 생성    | < 1초   | 짧은 프롬프트, 낮은 max_tokens      |
| DB 저장      | < 500ms | 인덱싱, 트랜잭션 최적화             |

### Caching Strategy

```typescript
// apps/server/src/ai/cache/prompt-cache.service.ts

import { Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class PromptCacheService {
  constructor(private readonly cacheManager: Cache) {}

  /**
   * Writer systemPrompt 캐싱 (자주 사용되는 작가)
   * TTL: 1시간
   */
  async getWriterPrompt(writerId: string): Promise<string | null> {
    return this.cacheManager.get(`writer-prompt:${writerId}`);
  }

  async setWriterPrompt(writerId: string, prompt: string): Promise<void> {
    await this.cacheManager.set(`writer-prompt:${writerId}`, prompt, 3600);
  }

  /**
   * Few-shot examples 캐싱 (태그 조합별)
   * TTL: 24시간
   */
  async getFewShotExamples(tags: string[]): Promise<any[] | null> {
    const key = `few-shot:${tags.sort().join(',')}`;
    return this.cacheManager.get(key);
  }
}
```

### Rate Limiting

```typescript
// apps/server/src/story/story.controller.ts

import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('stories')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class StoryController {
  @Sse('generate')
  @Throttle(10, 86400) // 일일 10회 제한
  generateStory(...) { ... }
}
```

---

## 🧪 Error Handling & Retry Logic

### Error Classification

```typescript
// apps/server/src/ai/errors/ai.errors.ts

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message);
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

export class ModerationFailedError extends AIServiceError {
  constructor(reason: string) {
    super(`Content moderation failed: ${reason}`, 'MODERATION_FAILED', true);
  }
}

export class ContentUnsafeError extends AIServiceError {
  constructor(reason: string) {
    super(`Unsafe content detected: ${reason}`, 'CONTENT_UNSAFE', false);
  }
}
```

### Retry Strategy

```typescript
// apps/server/src/ai/utils/retry.util.ts

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
  retryableErrors: string[];
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: Error;
  let delay = options.delayMs;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 재시도 불가능한 에러면 즉시 throw
      if (error instanceof AIServiceError && !error.retryable) {
        throw error;
      }

      // 마지막 시도면 throw
      if (attempt === options.maxAttempts) {
        throw error;
      }

      // 지수 백오프
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= options.backoffFactor;
    }
  }

  throw lastError!;
}
```

### StoryService with Retry

```typescript
// apps/server/src/story/story.service.ts

async generateStory(dto: GenerateStoryDto, userId: string): Promise<Story> {
  const writer = await this.prisma.writer.findUnique({
    where: { id: dto.writerId },
  });

  if (!writer) {
    throw new NotFoundException(`Writer ${dto.writerId} not found`);
  }

  // 재시도 로직: 최대 3회
  const content = await retryWithBackoff(
    async () => {
      // 1. AI 생성
      const generated = await this.generateWithStreaming(writer.systemPrompt, dto.tags);

      // 2. Moderation 검증
      const moderation = await this.moderationService.checkContent(generated);
      if (!moderation.safe) {
        throw new ModerationFailedError(moderation.reason!);
      }

      return generated;
    },
    {
      maxAttempts: 3,
      delayMs: 1000,
      backoffFactor: 2,
      retryableErrors: ['OPENAI_TIMEOUT', 'MODERATION_FAILED'],
    },
  );

  // 3. 제목 생성
  const title = await this.aiService.generateTitle(content);

  // 4. DB 저장
  const wordCount = this.countWords(content);
  const readTime = Math.ceil(wordCount / 200);

  return this.prisma.story.create({
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
}

private countWords(text: string): number {
  // 한국어는 공백 기준, 영어는 단어 기준
  return text.split(/\s+/).filter(w => w.length > 0).length;
}
```

---

## 🎨 Frontend Implementation

### SSE Client (EventSource)

```typescript
// apps/web/src/api/stories.api.ts

export async function generateStory(
  dto: GenerateStoryDto,
  onChunk: (chunk: string) => void,
  onComplete: (storyId: string) => void,
  onError: (error: Error) => void,
): Promise<void> {
  const token = localStorage.getItem('access_token');
  const url = new URL(`${API_BASE_URL}/stories/generate`);

  // DTO를 query params로 전달 (SSE는 POST body 불가)
  url.searchParams.set('writerId', dto.writerId);
  url.searchParams.set('tags', JSON.stringify(dto.tags));

  const eventSource = new EventSource(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.chunk) {
      onChunk(data.chunk);
    } else if (data.done) {
      onComplete(data.storyId);
      eventSource.close();
    }
  };

  eventSource.onerror = (error) => {
    onError(new Error('Story generation failed'));
    eventSource.close();
  };
}
```

### React Component

```tsx
// apps/web/src/pages/stories/GenerateStoryPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWriters } from '@/api/writers.hooks';
import { generateStory } from '@/api/stories.api';

export function GenerateStoryPage() {
  const navigate = useNavigate();
  const { data: writers } = useWriters({ limit: 100 });

  const [selectedWriter, setSelectedWriter] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    if (!selectedWriter || selectedTags.length === 0) return;

    setIsGenerating(true);
    setContent('');
    setProgress(0);

    try {
      await generateStory(
        { writerId: selectedWriter, tags: selectedTags },
        // onChunk
        (chunk) => {
          setContent((prev) => prev + chunk);
          setProgress((prev) => Math.min(prev + 1, 95));
        },
        // onComplete
        (storyId) => {
          setProgress(100);
          setTimeout(() => {
            navigate(`/stories/${storyId}`);
          }, 1000);
        },
        // onError
        (error) => {
          alert('소설 생성에 실패했습니다: ' + error.message);
          setIsGenerating(false);
        },
      );
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">새로운 소설 생성</h1>

      {!isGenerating ? (
        <div className="max-w-2xl">
          {/* 작가 선택 */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-semibold">작가 선택</label>
            <select
              value={selectedWriter}
              onChange={(e) => setSelectedWriter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2"
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
            <label className="block mb-2 text-sm font-semibold">스타일 조합 (최대 3개)</label>
            <div className="flex flex-wrap gap-2">
              {['느와르', '스릴러', '반전', '로맨스', 'SF', '힐링'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter((t) => t !== tag));
                    } else if (selectedTags.length < 3) {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className={`rounded-full px-4 py-2 text-sm ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={!selectedWriter || selectedTags.length === 0}
            className="w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
          >
            소설 생성하기
          </button>
        </div>
      ) : (
        <div className="max-w-4xl">
          {/* 생성 중 화면 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">소설 생성 중... {progress}%</span>
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
            <div className="whitespace-pre-wrap text-foreground">
              {content}
              <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1">▊</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Monitoring & Logging

### Metrics to Track

```typescript
// apps/server/src/story/metrics/story.metrics.ts

export interface StoryGenerationMetrics {
  storyId: string;
  userId: string;
  writerId: string;

  // 성능
  totalDuration: number; // 전체 생성 시간 (ms)
  firstTokenLatency: number; // 첫 토큰까지 (ms)
  tokensPerSecond: number; // 토큰 생성 속도

  // 품질
  wordCount: number;
  retryCount: number;
  moderationPassed: boolean;

  // 비용
  promptTokens: number;
  completionTokens: number;
  totalCost: number; // USD

  // 타임스탬프
  createdAt: Date;
}
```

### Logging Strategy

```typescript
// apps/server/src/story/story.service.ts

async generateStory(dto: GenerateStoryDto, userId: string): Promise<Story> {
  const startTime = Date.now();
  let firstTokenTime: number | null = null;
  let retryCount = 0;

  this.logger.log({
    event: 'story_generation_started',
    userId,
    writerId: dto.writerId,
    tags: dto.tags,
  });

  try {
    // ... 생성 로직 ...

    const duration = Date.now() - startTime;

    this.logger.log({
      event: 'story_generation_completed',
      userId,
      storyId: story.id,
      duration,
      wordCount: story.wordCount,
      retryCount,
      firstTokenLatency: firstTokenTime ? firstTokenTime - startTime : null,
    });

    // Metrics 저장 (PostHog, Sentry 등)
    await this.metricsService.record({
      event: 'story_generated',
      properties: {
        duration,
        wordCount: story.wordCount,
        retryCount,
      },
    });

    return story;
  } catch (error) {
    const duration = Date.now() - startTime;

    this.logger.error({
      event: 'story_generation_failed',
      userId,
      error: error.message,
      duration,
      retryCount,
    });

    // Sentry 리포트
    Sentry.captureException(error, {
      tags: {
        operation: 'story_generation',
        userId,
        writerId: dto.writerId,
      },
    });

    throw error;
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// apps/server/src/ai/ai.service.spec.ts

describe('AIService', () => {
  let service: AIService;
  let openaiMock: jest.Mocked<OpenAI>;

  beforeEach(() => {
    openaiMock = createMock<OpenAI>();
    service = new AIService(mockConfigService);
    (service as any).openai = openaiMock;
  });

  describe('generateStoryStream', () => {
    it('should stream tokens from GPT-4', async () => {
      const mockStream = createMockStream([
        { choices: [{ delta: { content: '비는' } }] },
        { choices: [{ delta: { content: ' 도시를' } }] },
      ]);

      openaiMock.chat.completions.create.mockResolvedValue(mockStream);

      const chunks: string[] = [];
      for await (const chunk of service.generateStoryStream('systemPrompt', ['느와르'])) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['비는', ' 도시를']);
    });

    it('should handle OpenAI API errors', async () => {
      openaiMock.chat.completions.create.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(async () => {
        for await (const _ of service.generateStoryStream('', [])) {
          // consume stream
        }
      }).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('generateTitle', () => {
    it('should generate title under 10 characters', async () => {
      openaiMock.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '비 오는 밤' } }],
      });

      const title = await service.generateTitle('소설 내용...');

      expect(title).toBe('비 오는 밤');
      expect(title.length).toBeLessThanOrEqual(10);
    });
  });
});
```

### Integration Tests

```typescript
// apps/server/test/story.e2e-spec.ts

describe('StoryController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 로그인하여 토큰 획득
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'test123' });

    accessToken = loginRes.body.access_token;
  });

  it('POST /stories/generate - should generate story with streaming', (done) => {
    const writerId = 'test-writer-id';
    const tags = ['느와르', '스릴러'];

    const chunks: string[] = [];

    const eventSource = new EventSource(
      `http://localhost:3001/stories/generate?writerId=${writerId}&tags=${JSON.stringify(tags)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.chunk) {
        chunks.push(data.chunk);
      } else if (data.done) {
        expect(data.storyId).toBeDefined();
        expect(chunks.length).toBeGreaterThan(0);

        const fullContent = chunks.join('');
        const wordCount = fullContent.split(/\s+/).length;
        expect(wordCount).toBeGreaterThanOrEqual(1500);

        eventSource.close();
        done();
      }
    };

    eventSource.onerror = () => {
      fail('SSE connection failed');
      done();
    };
  }, 60000); // 60초 타임아웃
});
```

### E2E Tests (Playwright)

```typescript
// apps/web/e2e/story-generation.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Story Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@test.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should generate story with streaming', async ({ page }) => {
    // 생성 페이지 이동
    await page.goto('/stories/new');

    // 작가 선택
    await page.selectOption('select', { label: '하드보일드 작가' });

    // 태그 선택
    await page.click('text=느와르');
    await page.click('text=스릴러');
    await page.click('text=반전');

    // 생성 시작
    await page.click('text=소설 생성하기');

    // 스트리밍 확인 (첫 토큰 2초 이내)
    await expect(page.locator('.whitespace-pre-wrap')).toContainText(/.+/, {
      timeout: 2000,
    });

    // 완료 대기 (30초 이내)
    await expect(page).toHaveURL(/\/stories\/[a-z0-9]+/, { timeout: 30000 });

    // 소설 내용 확인
    const content = await page.locator('.story-content').textContent();
    const wordCount = content!.split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(1500);
  });

  test('should show error on generation failure', async ({ page }) => {
    // 잘못된 작가 ID로 생성 시도 (모의)
    await page.goto('/stories/new');

    // ... 에러 시나리오 테스트
  });
});
```

---

## 🔐 Environment Configuration

```bash
# apps/server/.env

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/snack_storyteller

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Rate Limiting
THROTTLE_TTL=86400
THROTTLE_LIMIT=10

# Monitoring
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB
```

---

## ✅ Success Criteria Checklist

### Functional Requirements

- [ ] **F1**: Writer 선택 가능 (dropdown)
- [ ] **F1**: 태그 선택 가능 (장르, 분위기, 결말 중 최대 3개)
- [ ] **F1**: "생성하기" 버튼 클릭 시 소설 생성 시작
- [ ] **F2**: GPT-4 토큰이 실시간으로 화면에 표시
- [ ] **F2**: 타자기 효과 (typewriter animation)
- [ ] **F2**: 스트리밍 중 끊김 없음
- [ ] **F3**: 1,500-2,000 단어 분량
- [ ] **F3**: Writer의 `systemPrompt` 스타일 반영
- [ ] **F3**: 한국어 자연스러움
- [ ] **F3**: 시작-중간-끝 완전한 구조
- [ ] **F4**: AI가 소설 내용 기반으로 제목 생성
- [ ] **F4**: 10자 이내 간결한 제목
- [ ] **F5**: 생성된 소설 자동 저장
- [ ] **F5**: 단어 수 (wordCount) 계산
- [ ] **F5**: 예상 읽기 시간 (readTime) 계산
- [ ] **F5**: 태그 정보 저장

### Non-Functional Requirements

- [ ] **N1**: 첫 토큰 응답 시간 < 2초
- [ ] **N1**: 전체 생성 시간 < 30초
- [ ] **N1**: API 응답 시간 < 500ms (메타데이터 조회)
- [ ] **N2**: 생성 성공률 > 95%
- [ ] **N2**: 에러 발생 시 자동 재시도 (최대 3회)
- [ ] **N2**: OpenAI API 실패 시 Fallback (Claude)
- [ ] **N3**: OpenAI Moderation API 통과
- [ ] **N3**: 한국어 부적절한 키워드 필터링
- [ ] **N3**: 14세 미만 유해 콘텐츠 차단
- [ ] **N4**: 동시 생성 요청 100건 처리
- [ ] **N4**: Rate Limiting: 사용자당 일일 10회
- [ ] **N5**: 소설 1건당 비용 < $0.10
- [ ] **N5**: 토큰 최적화 (불필요한 프롬프트 제거)
- [ ] **N5**: Caching 전략 (Writer systemPrompt)

---

**다음 단계**: `tasks.md`에서 구현 작업 분해

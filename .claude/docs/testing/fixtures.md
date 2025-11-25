# Test Fixtures: Phase 3-4-5 통합 테스트 데이터

> **Purpose**: TDD를 위한 재사용 가능한 테스트 데이터 정의
> **Scope**: Phase 3 (Writers), Phase 4 (AI Story Generation), Phase 5 (Story Library)
> **Created**: 2025-01-08

---

## 📚 Table of Contents

- [User Fixtures](#user-fixtures)
- [Writer Fixtures](#writer-fixtures)
- [Story Fixtures](#story-fixtures)
- [Bookmark Fixtures](#bookmark-fixtures)
- [Mock API Responses](#mock-api-responses)
  - [OpenAI Responses](#openai-responses)
  - [Moderation Responses](#moderation-responses)
- [File Fixtures](#file-fixtures)
- [Database Seed](#database-seed)
- [Test Helpers](#test-helpers)

---

# User Fixtures

## Basic Users

```typescript
// apps/server/test/fixtures/users.fixture.ts

import { User } from '@prisma/client';

export const testUsers: Partial<User>[] = [
  {
    id: 'user-1',
    email: 'test1@test.com',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7fIvCCXZ6q', // 'test123'
    name: '테스트 유저 1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'user-2',
    email: 'test2@test.com',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7fIvCCXZ6q', // 'test123'
    name: '테스트 유저 2',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  },
  {
    id: 'user-3',
    email: 'test3@test.com',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7fIvCCXZ6q', // 'test123'
    name: '테스트 유저 3',
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03'),
  },
];

export const getTestUser = (index: number = 0): Partial<User> => {
  return testUsers[index];
};

export const createTestUserDto = (overrides?: Partial<User>) => {
  return {
    ...testUsers[0],
    ...overrides,
  };
};
```

---

# Writer Fixtures

## Writer Templates

```typescript
// apps/server/test/fixtures/writers.fixture.ts

import { Writer, Visibility } from '@prisma/client';

export const writerTemplates = {
  hardboiledDetective: {
    id: 'writer-hardboiled',
    name: '하드보일드 탐정',
    systemPrompt: `당신은 1940년대 느와르 소설 전문 작가입니다.

**문체 특징**:
- 간결하고 힘있는 문장
- 비유와 은유를 통한 분위기 조성
- 냉소적이고 현실적인 톤

**스토리 요소**:
- 도시의 어두운 면 탐구
- 복잡한 인간 관계
- 예상치 못한 반전

**예시 문장**:
"비는 도시를 적시고, 내 사무실 창문을 두드렸다. 수화기 너머 여자의 목소리는 떨리고 있었다."

이제 1,500-2,000단어의 하드보일드 느와르 소설을 작성하세요.`,
    description: '도시의 어둠을 파헤치는 냉소적 작가',
    genre: ['느와르', '스릴러', '미스터리'],
    visibility: Visibility.PUBLIC,
    imageUrl: 'uploads/writers/hardboiled.jpg',
    ownerId: 'user-1',
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-05'),
  },

  romanticDreamer: {
    id: 'writer-romance',
    name: '로맨스 드리머',
    systemPrompt: `당신은 감성적인 로맨스 소설 전문 작가입니다.

**문체 특징**:
- 따뜻하고 감성적인 문장
- 섬세한 감정 묘사
- 희망적이고 긍정적인 톤

**스토리 요소**:
- 우연한 만남과 운명적 사랑
- 장애물을 극복하는 과정
- 해피엔딩

**예시 문장**:
"그가 카페 문을 열고 들어온 순간, 시간이 멈췄다. 그의 눈과 마주친 순간, 내 심장은 미친 듯이 뛰기 시작했다."

이제 1,500-2,000단어의 감성 로맨스 소설을 작성하세요.`,
    description: '운명적 사랑을 믿는 감성 작가',
    genre: ['로맨스', '현대물', '드라마'],
    visibility: Visibility.PUBLIC,
    imageUrl: 'uploads/writers/romance.jpg',
    ownerId: 'user-1',
    createdAt: new Date('2025-01-06'),
    updatedAt: new Date('2025-01-06'),
  },

  fantasyEpic: {
    id: 'writer-fantasy',
    name: '판타지 에픽',
    systemPrompt: `당신은 웅장한 판타지 소설 전문 작가입니다.

**문체 특징**:
- 서사적이고 웅장한 문장
- 상세한 세계관 묘사
- 장대한 스케일의 모험

**스토리 요소**:
- 마법과 전설의 세계
- 영웅의 여정
- 선과 악의 대결

**예시 문장**:
"고대의 예언이 깨어나는 순간, 세계는 빛과 어둠으로 갈라졌다. 용의 불꽃이 하늘을 가르고, 전설의 검이 주인을 찾기 시작했다."

이제 1,500-2,000단어의 판타지 모험 소설을 작성하세요.`,
    description: '웅장한 판타지 세계를 창조하는 작가',
    genre: ['판타지', '모험', '액션'],
    visibility: Visibility.PUBLIC,
    imageUrl: 'uploads/writers/fantasy.jpg',
    ownerId: 'user-2',
    createdAt: new Date('2025-01-07'),
    updatedAt: new Date('2025-01-07'),
  },

  privateWriter: {
    id: 'writer-private',
    name: '개인 작가',
    systemPrompt: `당신은 개인적인 일기 스타일 작가입니다.

**문체 특징**:
- 일상적이고 편안한 문장
- 내면의 독백
- 솔직한 감정 표현

이제 1,500-2,000단어의 일기 스타일 소설을 작성하세요.`,
    description: '개인적인 이야기를 쓰는 작가',
    genre: ['일상', '드라마'],
    visibility: Visibility.PRIVATE,
    imageUrl: null,
    ownerId: 'user-1',
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-08'),
  },
};

export const testWriters: Partial<Writer>[] = Object.values(writerTemplates);

export const getTestWriter = (key: keyof typeof writerTemplates): Partial<Writer> => {
  return writerTemplates[key];
};

export const createWriterDto = (overrides?: Partial<Writer>) => {
  return {
    ...writerTemplates.romanticDreamer,
    ...overrides,
  };
};

// CreateWriterDto fixture
export const createWriterDtoFixture = {
  valid: {
    name: '테스트 작가',
    systemPrompt: '당신은 테스트용 작가입니다. '.repeat(10), // 150자
    description: '테스트를 위한 작가 설명입니다.',
    genre: ['로맨스', '판타지'],
    visibility: Visibility.PUBLIC,
  },
  minimal: {
    name: '최소 작가',
    systemPrompt: '최소한의 프롬프트입니다. '.repeat(7), // 100자+
    description: '최소 설명입니다.',
    genre: ['로맨스'],
    visibility: Visibility.PUBLIC,
  },
  invalid: {
    tooShortName: {
      name: 'A', // 1자 (최소 2자)
      systemPrompt: '...'.repeat(50),
      description: '설명',
      genre: ['로맨스'],
      visibility: Visibility.PUBLIC,
    },
    tooShortSystemPrompt: {
      name: '작가',
      systemPrompt: '짧은 프롬프트', // 8자 (최소 100자)
      description: '설명',
      genre: ['로맨스'],
      visibility: Visibility.PUBLIC,
    },
    tooManyGenres: {
      name: '작가',
      systemPrompt: '...'.repeat(50),
      description: '설명',
      genre: ['로맨스', '스릴러', '판타지', 'SF', '공포', '코미디'], // 6개 (최대 5개)
      visibility: Visibility.PUBLIC,
    },
  },
};
```

---

# Story Fixtures

## Story Templates

```typescript
// apps/server/test/fixtures/stories.fixture.ts

import { Story } from '@prisma/client';

export const storyTemplates = {
  hardboiledStory: {
    id: 'story-hardboiled-1',
    title: '빗속의 탐정',
    content: `비는 도시를 적시고, 내 사무실 창문을 두드렸다.
    수화기 너머 여자의 목소리는 떨리고 있었다. "그를 찾아주세요. 제발."
    나는 담배에 불을 붙이며 대답했다. "주소를 대시오."

    그녀는 주소를 알려주었다. 이스트사이드의 허름한 아파트.
    내가 자주 가던 곳은 아니었지만, 낯선 곳도 아니었다.

    문을 열고 들어간 순간, 나는 알았다. 이 사건은 단순하지 않다는 것을.
    바닥에는 피가 흐르고 있었고, 창문은 열려 있었다.

    ${'이것은 긴 소설 내용입니다. '.repeat(250)}

    결국 그는 살아있었다. 하지만 그녀가 찾던 사람은 그가 아니었다.
    진실은 언제나 아이러니하다. 이 도시에서는 특히 그렇다.`,
    wordCount: 1847,
    readTime: 8, // 1847 / 250 ≈ 7.4분
    tags: ['느와르', '스릴러', '반전'],
    writerId: 'writer-hardboiled',
    userId: 'user-1',
    createdAt: new Date('2025-01-06T10:00:00Z'),
    updatedAt: new Date('2025-01-06T10:00:00Z'),
  },

  romanceStory: {
    id: 'story-romance-1',
    title: '봄날의 만남',
    content: `그가 카페 문을 열고 들어온 순간, 시간이 멈췄다.

    4월의 따스한 햇살이 그의 어깨 너머로 쏟아져 들어왔다.
    나는 무심코 들고 있던 커피잔을 내려놓았다.

    그의 눈과 마주친 순간, 내 심장은 미친 듯이 뛰기 시작했다.
    이런 감정은 처음이었다. 설레고, 두렵고, 행복했다.

    ${'로맨스 소설의 감성적인 장면들이 계속됩니다. '.repeat(240)}

    우리는 웃으며 서로의 손을 잡았다.
    이것이 시작이었다. 우리의 아름다운 이야기의.`,
    wordCount: 1623,
    readTime: 7,
    tags: ['로맨스', '현대물', '해피엔딩'],
    writerId: 'writer-romance',
    userId: 'user-1',
    createdAt: new Date('2025-01-06T14:30:00Z'),
    updatedAt: new Date('2025-01-06T14:30:00Z'),
  },

  fantasyStory: {
    id: 'story-fantasy-1',
    title: '용의 귀환',
    content: `고대의 예언이 깨어나는 순간, 세계는 빛과 어둠으로 갈라졌다.

    용의 불꽃이 하늘을 가르고, 전설의 검이 주인을 찾기 시작했다.
    수천 년 동안 잠들어 있던 마법의 힘이 다시 깨어났다.

    젊은 전사는 운명의 부름을 받았다.
    세계를 구할 수 있는 유일한 존재로 선택된 것이다.

    ${'판타지 세계의 모험이 펼쳐집니다. '.repeat(260)}

    드디어 용은 하늘로 날아올랐다.
    세계에 평화가 찾아왔고, 전설은 계속되었다.`,
    wordCount: 1789,
    readTime: 8,
    tags: ['판타지', '모험', '액션'],
    writerId: 'writer-fantasy',
    userId: 'user-2',
    createdAt: new Date('2025-01-07T09:15:00Z'),
    updatedAt: new Date('2025-01-07T09:15:00Z'),
  },

  shortStory: {
    id: 'story-short',
    title: '짧은 소설',
    content: '이것은 테스트를 위한 짧은 소설입니다. '.repeat(50), // 1000단어 (기준 미달)
    wordCount: 1000,
    readTime: 4,
    tags: ['테스트'],
    writerId: 'writer-romance',
    userId: 'user-1',
    createdAt: new Date('2025-01-08T08:00:00Z'),
    updatedAt: new Date('2025-01-08T08:00:00Z'),
  },
};

export const testStories: Partial<Story>[] = Object.values(storyTemplates);

export const getTestStory = (key: keyof typeof storyTemplates): Partial<Story> => {
  return storyTemplates[key];
};

export const createStoryDto = (overrides?: Partial<Story>) => {
  return {
    ...storyTemplates.romanceStory,
    ...overrides,
  };
};

// GenerateStoryDto fixture
export const generateStoryDtoFixture = {
  valid: {
    writerId: 'writer-romance',
    tags: ['로맨스', '해피엔딩'],
  },
  minimal: {
    writerId: 'writer-hardboiled',
    tags: ['느와르'],
  },
  multiple: [
    {
      writerId: 'writer-romance',
      tags: ['로맨스', '현대물'],
    },
    {
      writerId: 'writer-hardboiled',
      tags: ['느와르', '스릴러'],
    },
    {
      writerId: 'writer-fantasy',
      tags: ['판타지', '모험'],
    },
  ],
};

// Batch story creation helper
export const createMultipleStories = (
  count: number,
  userId: string,
  writerId: string,
): Partial<Story>[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `story-batch-${i + 1}`,
    title: `소설 ${i + 1}`,
    content: `이것은 ${i + 1}번째 소설입니다. `.repeat(300),
    wordCount: 1500 + Math.floor(Math.random() * 500),
    readTime: 6 + Math.floor(Math.random() * 3),
    tags: ['테스트', '자동생성'],
    writerId,
    userId,
    createdAt: new Date(Date.now() - (count - i) * 60000), // 1분 간격
    updatedAt: new Date(Date.now() - (count - i) * 60000),
  }));
};
```

---

# Bookmark Fixtures

## Bookmark Templates

```typescript
// apps/server/test/fixtures/bookmarks.fixture.ts

import { Bookmark } from '@prisma/client';

export const bookmarkTemplates = {
  user1Story1: {
    id: 'bookmark-1',
    userId: 'user-1',
    storyId: 'story-hardboiled-1',
    createdAt: new Date('2025-01-06T11:00:00Z'),
  },
  user1Story2: {
    id: 'bookmark-2',
    userId: 'user-1',
    storyId: 'story-romance-1',
    createdAt: new Date('2025-01-06T15:00:00Z'),
  },
  user2Story1: {
    id: 'bookmark-3',
    userId: 'user-2',
    storyId: 'story-fantasy-1',
    createdAt: new Date('2025-01-07T10:00:00Z'),
  },
};

export const testBookmarks: Partial<Bookmark>[] = Object.values(bookmarkTemplates);

export const getTestBookmark = (key: keyof typeof bookmarkTemplates): Partial<Bookmark> => {
  return bookmarkTemplates[key];
};

export const createBookmarkDto = (overrides?: Partial<Bookmark>) => {
  return {
    ...bookmarkTemplates.user1Story1,
    ...overrides,
  };
};

// Batch bookmark creation helper
export const createMultipleBookmarks = (
  userId: string,
  storyIds: string[],
): Partial<Bookmark>[] => {
  return storyIds.map((storyId, i) => ({
    id: `bookmark-batch-${i + 1}`,
    userId,
    storyId,
    createdAt: new Date(Date.now() - (storyIds.length - i) * 30000), // 30초 간격
  }));
};
```

---

# Mock API Responses

## OpenAI Responses

```typescript
// apps/server/test/fixtures/openai.fixture.ts

export const mockOpenAIResponses = {
  // 정상 소설 생성 (1800단어)
  validStoryGeneration: {
    id: 'chatcmpl-mock-123',
    object: 'chat.completion',
    created: 1704700800,
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: `비는 도시를 적시고, 내 사무실 창문을 두드렸다.

수화기 너머 여자의 목소리는 떨리고 있었다. "그를 찾아주세요. 제발."
나는 담배에 불을 붙이며 대답했다. "주소를 대시오."

${'이것은 AI가 생성한 소설입니다. '.repeat(300)}

결국 진실은 밝혀졌다. 하지만 그것이 행복한 결말을 의미하지는 않았다.
이 도시에서는 진실조차 아이러니하다.`,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 450,
      completion_tokens: 1200,
      total_tokens: 1650,
    },
  },

  // 짧은 소설 (1000단어 - 재생성 필요)
  shortStoryGeneration: {
    id: 'chatcmpl-mock-124',
    object: 'chat.completion',
    created: 1704700800,
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: '짧은 소설입니다. '.repeat(167), // 1000단어
        },
        finish_reason: 'length', // max_tokens 도달
      },
    ],
    usage: {
      prompt_tokens: 450,
      completion_tokens: 800,
      total_tokens: 1250,
    },
  },

  // 제목 생성
  titleGeneration: {
    id: 'chatcmpl-mock-125',
    object: 'chat.completion',
    created: 1704700800,
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: '빗속의 탐정',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 550,
      completion_tokens: 5,
      total_tokens: 555,
    },
  },

  // 로맨스 소설
  romanceStory: {
    id: 'chatcmpl-mock-126',
    object: 'chat.completion',
    created: 1704700800,
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: `그가 카페 문을 열고 들어온 순간, 시간이 멈췄다.

${'로맨스 소설의 감성적인 장면들이 펼쳐집니다. '.repeat(290)}

우리는 웃으며 서로의 손을 잡았다. 이것이 시작이었다.`,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 480,
      completion_tokens: 1150,
      total_tokens: 1630,
    },
  },
};

// OpenAI Error Responses
export const mockOpenAIErrors = {
  timeout: new Error('Request timeout'),
  rateLimit: {
    error: {
      message: 'Rate limit exceeded',
      type: 'rate_limit_error',
      param: null,
      code: 'rate_limit_exceeded',
    },
  },
  serverError: {
    error: {
      message: 'Internal server error',
      type: 'server_error',
      param: null,
      code: 'internal_error',
    },
  },
  invalidRequest: {
    error: {
      message: 'Invalid request',
      type: 'invalid_request_error',
      param: 'messages',
      code: 'invalid_value',
    },
  },
};

// Helper to create mock OpenAI instance
export const createMockOpenAI = () => {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue(mockOpenAIResponses.validStoryGeneration),
      },
    },
    moderations: {
      create: jest.fn().mockResolvedValue({
        id: 'modr-mock-123',
        model: 'text-moderation-007',
        results: [
          {
            flagged: false,
            categories: {
              sexual: false,
              hate: false,
              harassment: false,
              'self-harm': false,
              'sexual/minors': false,
              'hate/threatening': false,
              'violence/graphic': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              'harassment/threatening': false,
              violence: false,
            },
            category_scores: {
              sexual: 0.000001,
              hate: 0.000001,
              harassment: 0.000001,
              'self-harm': 0.000001,
              'sexual/minors': 0.000001,
              'hate/threatening': 0.000001,
              'violence/graphic': 0.000001,
              'self-harm/intent': 0.000001,
              'self-harm/instructions': 0.000001,
              'harassment/threatening': 0.000001,
              violence: 0.000001,
            },
          },
        ],
      }),
    },
  };
};
```

---

## Moderation Responses

```typescript
// apps/server/test/fixtures/moderation.fixture.ts

export const mockModerationResponses = {
  // 안전한 프롬프트
  safe: {
    id: 'modr-safe-123',
    model: 'text-moderation-007',
    results: [
      {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          'self-harm': false,
          'sexual/minors': false,
          'hate/threatening': false,
          'violence/graphic': false,
          'self-harm/intent': false,
          'self-harm/instructions': false,
          'harassment/threatening': false,
          violence: false,
        },
        category_scores: {
          sexual: 0.000001,
          hate: 0.000001,
          harassment: 0.000001,
          'self-harm': 0.000001,
          'sexual/minors': 0.000001,
          'hate/threatening': 0.000001,
          'violence/graphic': 0.000001,
          'self-harm/intent': 0.000001,
          'self-harm/instructions': 0.000001,
          'harassment/threatening': 0.000001,
          violence: 0.000001,
        },
      },
    ],
  },

  // 폭력적 내용 감지
  violent: {
    id: 'modr-violent-123',
    model: 'text-moderation-007',
    results: [
      {
        flagged: true,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          'self-harm': false,
          'sexual/minors': false,
          'hate/threatening': false,
          'violence/graphic': true,
          'self-harm/intent': false,
          'self-harm/instructions': false,
          'harassment/threatening': false,
          violence: true,
        },
        category_scores: {
          sexual: 0.000001,
          hate: 0.000001,
          harassment: 0.000001,
          'self-harm': 0.000001,
          'sexual/minors': 0.000001,
          'hate/threatening': 0.000001,
          'violence/graphic': 0.89,
          'self-harm/intent': 0.000001,
          'self-harm/instructions': 0.000001,
          'harassment/threatening': 0.000001,
          violence: 0.92,
        },
      },
    ],
  },

  // 성적 내용 감지
  sexual: {
    id: 'modr-sexual-123',
    model: 'text-moderation-007',
    results: [
      {
        flagged: true,
        categories: {
          sexual: true,
          hate: false,
          harassment: false,
          'self-harm': false,
          'sexual/minors': false,
          'hate/threatening': false,
          'violence/graphic': false,
          'self-harm/intent': false,
          'self-harm/instructions': false,
          'harassment/threatening': false,
          violence: false,
        },
        category_scores: {
          sexual: 0.95,
          hate: 0.000001,
          harassment: 0.000001,
          'self-harm': 0.000001,
          'sexual/minors': 0.000001,
          'hate/threatening': 0.000001,
          'violence/graphic': 0.000001,
          'self-harm/intent': 0.000001,
          'self-harm/instructions': 0.000001,
          'harassment/threatening': 0.000001,
          violence: 0.000001,
        },
      },
    ],
  },
};

// 한국어 부적절 키워드 목록
export const koreanInappropriateKeywords = [
  '19금',
  '성인물',
  '야설',
  '음란',
  '선정적',
  '폭력적',
  '잔인한',
  '혐오',
];

export const testModerationPrompts = {
  safe: [
    '로맨스 소설을 작성해주세요. 주인공은 카페에서 만난 사람과 사랑에 빠집니다.',
    '하드보일드 느와르 소설을 써주세요. 탐정이 실종 사건을 조사합니다.',
    '판타지 모험 소설을 작성해주세요. 용사가 마왕을 물리칩니다.',
  ],
  unsafe: [
    '이 소설은 19금 성인물입니다...',
    '폭력적이고 잔인한 장면이 포함됩니다...',
    '혐오 발언이 포함된 내용...',
  ],
};
```

---

# File Fixtures

## Image Files

```typescript
// apps/server/test/fixtures/files.fixture.ts

import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';

// Mock image buffer generator
export const createMockImageBuffer = (width: number, height: number): Buffer => {
  // 실제 이미지가 아닌 mock 데이터
  const header = `Mock Image ${width}x${height}`;
  return Buffer.from(header);
};

// Mock file fixtures
export const mockFiles = {
  validJpg: {
    fieldname: 'image',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 3 * 1024 * 1024, // 3MB
    buffer: createMockImageBuffer(2000, 2000),
  } as Express.Multer.File,

  validPng: {
    fieldname: 'image',
    originalname: 'test-image.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 2 * 1024 * 1024, // 2MB
    buffer: createMockImageBuffer(1500, 1500),
  } as Express.Multer.File,

  tooLarge: {
    fieldname: 'image',
    originalname: 'large-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 6 * 1024 * 1024, // 6MB (초과)
    buffer: Buffer.alloc(6 * 1024 * 1024),
  } as Express.Multer.File,

  invalidMimeType: {
    fieldname: 'image',
    originalname: 'document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1 * 1024 * 1024,
    buffer: Buffer.from('PDF content'),
  } as Express.Multer.File,

  corruptedImage: {
    fieldname: 'image',
    originalname: 'corrupted.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1 * 1024 * 1024,
    buffer: Buffer.from('Not an image'),
  } as Express.Multer.File,
};

export const getMockFile = (key: keyof typeof mockFiles): Express.Multer.File => {
  return mockFiles[key];
};

// Helper to create temporary test files
export const createTempTestFile = async (filename: string, content: Buffer): Promise<string> => {
  const tempDir = path.join(__dirname, '../../temp-test-files');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, filename);
  await fs.promises.writeFile(filePath, content);
  return filePath;
};

// Helper to cleanup temp files
export const cleanupTempTestFiles = async (): Promise<void> => {
  const tempDir = path.join(__dirname, '../../temp-test-files');
  if (fs.existsSync(tempDir)) {
    await fs.promises.rm(tempDir, { recursive: true });
  }
};
```

---

# Database Seed

## Seed Script

```typescript
// apps/server/prisma/seed.test.ts

import { PrismaClient } from '@prisma/client';
import { testUsers } from '../test/fixtures/users.fixture';
import { testWriters } from '../test/fixtures/writers.fixture';
import { testStories } from '../test/fixtures/stories.fixture';
import { testBookmarks } from '../test/fixtures/bookmarks.fixture';

const prisma = new PrismaClient();

export async function seedTestDatabase() {
  console.log('🌱 Seeding test database...');

  try {
    // Clear existing data
    await prisma.bookmark.deleteMany();
    await prisma.story.deleteMany();
    await prisma.writer.deleteMany();
    await prisma.user.deleteMany();

    // Seed users
    console.log('  Creating test users...');
    await prisma.user.createMany({
      data: testUsers,
    });

    // Seed writers
    console.log('  Creating test writers...');
    await prisma.writer.createMany({
      data: testWriters,
    });

    // Seed stories
    console.log('  Creating test stories...');
    await prisma.story.createMany({
      data: testStories,
    });

    // Seed bookmarks
    console.log('  Creating test bookmarks...');
    await prisma.bookmark.createMany({
      data: testBookmarks,
    });

    console.log('✅ Test database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if called directly
if (require.main === module) {
  seedTestDatabase();
}
```

## Seed Data Summary

```typescript
// apps/server/test/fixtures/seed-summary.ts

export const seedDataSummary = {
  users: {
    total: 3,
    ids: ['user-1', 'user-2', 'user-3'],
    emails: ['test1@test.com', 'test2@test.com', 'test3@test.com'],
  },
  writers: {
    total: 4,
    public: 3,
    private: 1,
    genres: {
      느와르: 1,
      로맨스: 1,
      판타지: 1,
      일상: 1,
    },
    byOwner: {
      'user-1': 3, // hardboiled, romance, private
      'user-2': 1, // fantasy
    },
  },
  stories: {
    total: 4,
    byWriter: {
      'writer-hardboiled': 1,
      'writer-romance': 2, // romance + short
      'writer-fantasy': 1,
    },
    byUser: {
      'user-1': 3,
      'user-2': 1,
    },
    wordCountRange: {
      min: 1000,
      max: 1847,
      avg: 1564,
    },
  },
  bookmarks: {
    total: 3,
    byUser: {
      'user-1': 2, // hardboiled, romance
      'user-2': 1, // fantasy
    },
  },
};
```

---

# Test Helpers

## Database Helpers

```typescript
// apps/server/test/helpers/database.helper.ts

import { PrismaClient } from '@prisma/client';
import { seedTestDatabase } from '../../prisma/seed.test';

const prisma = new PrismaClient();

/**
 * 각 테스트 전에 DB 초기화 및 시드
 */
export async function setupTestDatabase() {
  await seedTestDatabase();
}

/**
 * 각 테스트 후 DB 정리
 */
export async function cleanupTestDatabase() {
  await prisma.bookmark.deleteMany();
  await prisma.story.deleteMany();
  await prisma.writer.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * 테스트 종료 후 Prisma 연결 해제
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/**
 * 특정 테이블만 초기화
 */
export async function resetTable(tableName: string) {
  await prisma[tableName].deleteMany();
}

/**
 * 트랜잭션 테스트 헬퍼
 */
export async function runInTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await fn(tx as PrismaClient);
  });
}
```

---

## Auth Helpers

```typescript
// apps/server/test/helpers/auth.helper.ts

import { JwtService } from '@nestjs/jwt';
import { testUsers } from '../fixtures/users.fixture';

/**
 * 테스트용 JWT 토큰 생성
 */
export function generateTestToken(userId: string = 'user-1'): string {
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET || 'test-secret',
  });

  return jwtService.sign({
    sub: userId,
    email: testUsers.find((u) => u.id === userId)?.email,
  });
}

/**
 * 여러 사용자 토큰 생성
 */
export function generateMultipleTokens(userIds: string[]): Record<string, string> {
  return userIds.reduce(
    (acc, userId) => {
      acc[userId] = generateTestToken(userId);
      return acc;
    },
    {} as Record<string, string>,
  );
}

/**
 * Authorization 헤더 생성
 */
export function createAuthHeader(userId: string = 'user-1'): { Authorization: string } {
  return {
    Authorization: `Bearer ${generateTestToken(userId)}`,
  };
}
```

---

## Factory Helpers

```typescript
// apps/server/test/helpers/factory.helper.ts

import { PrismaClient } from '@prisma/client';
import { createWriterDto, createStoryDto, createBookmarkDto } from '../fixtures';

const prisma = new PrismaClient();

/**
 * 테스트 작가 생성 팩토리
 */
export async function createTestWriter(overrides?: any) {
  return await prisma.writer.create({
    data: createWriterDto(overrides),
  });
}

/**
 * 테스트 소설 생성 팩토리
 */
export async function createTestStory(overrides?: any) {
  return await prisma.story.create({
    data: createStoryDto(overrides),
  });
}

/**
 * 테스트 북마크 생성 팩토리
 */
export async function createTestBookmark(overrides?: any) {
  return await prisma.bookmark.create({
    data: createBookmarkDto(overrides),
  });
}

/**
 * 완전한 테스트 데이터 세트 생성
 */
export async function createCompleteTestDataSet(userId: string = 'user-1') {
  const writer = await createTestWriter({ ownerId: userId });
  const story = await createTestStory({ userId, writerId: writer.id });
  const bookmark = await createTestBookmark({ userId, storyId: story.id });

  return { writer, story, bookmark };
}
```

---

## Assertion Helpers

```typescript
// apps/server/test/helpers/assertion.helper.ts

/**
 * DTO 구조 검증
 */
export function expectValidWriterDto(writer: any) {
  expect(writer).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    systemPrompt: expect.any(String),
    description: expect.any(String),
    genre: expect.any(Array),
    visibility: expect.stringMatching(/^(PUBLIC|PRIVATE)$/),
    ownerId: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
}

export function expectValidStoryDto(story: any) {
  expect(story).toMatchObject({
    id: expect.any(String),
    title: expect.any(String),
    content: expect.any(String),
    wordCount: expect.any(Number),
    readTime: expect.any(Number),
    tags: expect.any(Array),
    writerId: expect.any(String),
    userId: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });

  expect(story.wordCount).toBeGreaterThanOrEqual(0);
  expect(story.readTime).toBeGreaterThanOrEqual(0);
}

export function expectValidBookmarkDto(bookmark: any) {
  expect(bookmark).toMatchObject({
    id: expect.any(String),
    userId: expect.any(String),
    storyId: expect.any(String),
    createdAt: expect.any(Date),
  });
}

/**
 * Pagination 응답 검증
 */
export function expectValidPaginatedResponse(response: any, expectedTotal: number) {
  expect(response).toHaveProperty('data');
  expect(response).toHaveProperty('meta');

  expect(response.meta).toMatchObject({
    total: expectedTotal,
    page: expect.any(Number),
    limit: expect.any(Number),
    totalPages: expect.any(Number),
  });

  expect(response.data).toBeInstanceOf(Array);
}
```

---

## Mock Service Helpers

```typescript
// apps/server/test/helpers/mock-service.helper.ts

import { createMockOpenAI } from '../fixtures/openai.fixture';
import { mockModerationResponses } from '../fixtures/moderation.fixture';

/**
 * AIService Mock 생성
 */
export function createMockAIService() {
  return {
    generateStory: jest.fn().mockResolvedValue({
      content: '...'.repeat(600),
      wordCount: 1800,
      title: '생성된 소설',
    }),
    generateTitle: jest.fn().mockResolvedValue('생성된 제목'),
  };
}

/**
 * ModerationService Mock 생성
 */
export function createMockModerationService() {
  return {
    check: jest.fn().mockResolvedValue(undefined), // 통과
  };
}

/**
 * FileService Mock 생성
 */
export function createMockFileService() {
  return {
    saveWriterImage: jest.fn().mockResolvedValue('uploads/writers/mock-image.jpg'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * PrismaService Mock 생성
 */
export function createMockPrismaService() {
  return {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    writer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    story: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bookmark: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn()),
  };
}
```

---

## Usage Example

```typescript
// apps/server/test/writer.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { WriterService } from '../src/writer/writer.service';
import { setupTestDatabase, cleanupTestDatabase } from './helpers/database.helper';
import { createTestWriter } from './helpers/factory.helper';
import { expectValidWriterDto } from './helpers/assertion.helper';
import { testUsers } from './fixtures/users.fixture';
import { createWriterDtoFixture } from './fixtures/writers.fixture';

describe('WriterService', () => {
  let service: WriterService;

  beforeAll(async () => {
    await setupTestDatabase();

    const module: TestingModule = await Test.createTestingModule({
      providers: [WriterService],
    }).compile();

    service = module.get<WriterService>(WriterService);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('create', () => {
    it('should create writer successfully', async () => {
      // Given
      const createDto = createWriterDtoFixture.valid;
      const userId = testUsers[0].id!;

      // When
      const result = await service.create(createDto, null, userId);

      // Then
      expectValidWriterDto(result);
      expect(result.name).toBe(createDto.name);
    });
  });
});
```

---

## 📝 Fixture Summary

### Fixture Counts

| Category           | Count | Description                              |
| ------------------ | ----- | ---------------------------------------- |
| Users              | 3     | 기본 테스트 사용자                       |
| Writers            | 4     | 다양한 장르의 작가 (PUBLIC 3, PRIVATE 1) |
| Stories            | 4     | 단어 수 다양한 소설 (1000-1847단어)      |
| Bookmarks          | 3     | 사용자별 북마크                          |
| Mock API Responses | 6     | OpenAI 응답 시나리오                     |
| Mock Files         | 5     | 이미지 파일 테스트 케이스                |

### Helpers Summary

- **Database Helpers**: 5 functions (setup, cleanup, reset, transaction)
- **Auth Helpers**: 3 functions (token generation, headers)
- **Factory Helpers**: 4 functions (writer, story, bookmark, complete set)
- **Assertion Helpers**: 4 functions (DTO validation, pagination)
- **Mock Service Helpers**: 4 functions (AI, Moderation, File, Prisma)

---

**Next Steps**:

1. ✅ Fixtures 완료
2. ⏭️ Test Strategy (Mocking 전략, 테스트 격리, 실행 순서) 작성

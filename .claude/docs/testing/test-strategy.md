# Test Strategy: Phase 3-4-5 통합 테스트 전략

> **Purpose**: TDD를 위한 Mocking 전략, 테스트 격리, 실행 순서 정의
> **Scope**: Phase 3 (Writers), Phase 4 (AI Story Generation), Phase 5 (Story Library)
> **Created**: 2025-01-08

---

## 📚 Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Pyramid Strategy](#test-pyramid-strategy)
- [Mocking Strategy](#mocking-strategy)
  - [OpenAI API Mocking](#openai-api-mocking)
  - [Prisma Mocking](#prisma-mocking)
  - [File System Mocking](#file-system-mocking)
- [Test Isolation](#test-isolation)
- [Test Execution Order](#test-execution-order)
- [Coverage Goals](#coverage-goals)
- [CI/CD Integration](#cicd-integration)
- [Performance Benchmarks](#performance-benchmarks)

---

# Testing Philosophy

## Core Principles

```yaml
principles:
  - 'Fast Feedback': 단위 테스트는 1초 이내 실행
  - 'Isolation': 각 테스트는 독립적으로 실행 가능
  - 'Repeatability': 동일한 입력은 항상 동일한 결과
  - 'Real Behavior': 가능한 한 실제 환경과 유사하게
  - 'TDD First': Red → Green → Refactor 사이클 준수

test_types:
  unit_tests:
    purpose: '단일 함수/메서드의 로직 검증'
    speed: '매우 빠름 (<1초)'
    mocking: '외부 의존성 모두 Mock'
    coverage_target: '90%+'

  integration_tests:
    purpose: '여러 모듈 간 상호작용 검증'
    speed: '빠름 (<5초)'
    mocking: '외부 API만 Mock, DB는 실제 사용'
    coverage_target: '80%+'

  e2e_tests:
    purpose: '전체 사용자 플로우 검증'
    speed: '느림 (<30초)'
    mocking: '최소화 (OpenAI만 Mock)'
    coverage_target: '핵심 플로우 100%'
```

---

# Test Pyramid Strategy

## Pyramid Distribution

```
        /\
       /  \      E2E Tests (5%)
      /____\     - 2-3개 핵심 플로우
     /      \    - 전체 시스템 검증
    /        \
   /          \  Integration Tests (25%)
  /____________\ - 3-4개 모듈 통합
 /              \- DB + Service 통합
/________________\
                  Unit Tests (70%)
                  - 54개 함수/메서드 테스트
                  - 빠른 피드백
```

## Test Count by Layer

| Layer       | Test Count   | Execution Time  | Mock Level              |
| ----------- | ------------ | --------------- | ----------------------- |
| Unit        | 54 tests     | ~10 seconds     | High (모든 외부 의존성) |
| Integration | 3 tests      | ~5 seconds      | Medium (외부 API만)     |
| E2E         | 2 tests      | ~20 seconds     | Low (OpenAI만)          |
| **Total**   | **59 tests** | **~35 seconds** | -                       |

---

# Mocking Strategy

## OpenAI API Mocking

### Unit Test Level

```typescript
// apps/server/test/ai.service.spec.ts

import { createMockOpenAI, mockOpenAIResponses } from './fixtures/openai.fixture';

describe('AIService', () => {
  let service: AIService;
  let mockOpenAI: any;

  beforeEach(() => {
    // OpenAI 완전히 Mock
    mockOpenAI = createMockOpenAI();
    service = new AIService(mockOpenAI);
  });

  it('should generate story', async () => {
    // Given: Mock 응답 설정
    mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponses.validStoryGeneration);

    // When
    const result = await service.generateStory('systemPrompt', ['느와르'], 'user-1');

    // Then
    expect(result.wordCount).toBeGreaterThanOrEqual(1500);
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-4-turbo-preview',
      messages: expect.any(Array),
      temperature: 0.9,
      max_tokens: 4000,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });
  });
});
```

### Mock Setup Strategy

```typescript
// apps/server/test/setup/mock-openai.ts

import { OpenAI } from 'openai';
import { mockOpenAIResponses } from '../fixtures/openai.fixture';

export class MockOpenAIBuilder {
  private mockInstance: any;

  constructor() {
    this.mockInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      moderations: {
        create: jest.fn(),
      },
    };
  }

  /**
   * 정상 소설 생성 시나리오
   */
  withValidStoryGeneration() {
    this.mockInstance.chat.completions.create.mockResolvedValue(
      mockOpenAIResponses.validStoryGeneration,
    );
    return this;
  }

  /**
   * 짧은 소설 생성 (재시도 트리거)
   */
  withShortStoryThenValid() {
    this.mockInstance.chat.completions.create
      .mockResolvedValueOnce(mockOpenAIResponses.shortStoryGeneration)
      .mockResolvedValueOnce(mockOpenAIResponses.validStoryGeneration);
    return this;
  }

  /**
   * API 실패 (재시도 트리거)
   */
  withFailureThenSuccess(failCount: number = 2) {
    for (let i = 0; i < failCount; i++) {
      this.mockInstance.chat.completions.create.mockRejectedValueOnce(new Error('Timeout'));
    }
    this.mockInstance.chat.completions.create.mockResolvedValueOnce(
      mockOpenAIResponses.validStoryGeneration,
    );
    return this;
  }

  /**
   * Moderation 통과
   */
  withSafeModeration() {
    this.mockInstance.moderations.create.mockResolvedValue({
      results: [{ flagged: false }],
    });
    return this;
  }

  /**
   * Moderation 실패
   */
  withUnsafeModeration() {
    this.mockInstance.moderations.create.mockResolvedValue({
      results: [{ flagged: true, categories: { violence: true } }],
    });
    return this;
  }

  build(): OpenAI {
    return this.mockInstance as OpenAI;
  }
}

// Usage:
const mockOpenAI = new MockOpenAIBuilder().withValidStoryGeneration().withSafeModeration().build();
```

---

## Prisma Mocking

### Unit Test: Prisma 완전히 Mock

```typescript
// apps/server/test/writer.service.spec.ts

describe('WriterService (Unit)', () => {
  let service: WriterService;
  let mockPrisma: any;

  beforeEach(() => {
    // Prisma 완전히 Mock
    mockPrisma = {
      writer: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    service = new WriterService(mockPrisma);
  });

  it('should create writer', async () => {
    // Given
    const createDto = { name: '작가', systemPrompt: '...' /* ... */ };
    const expectedWriter = { id: 'writer-1', ...createDto };

    mockPrisma.writer.create.mockResolvedValue(expectedWriter);

    // When
    const result = await service.create(createDto, null, 'user-1');

    // Then
    expect(result).toEqual(expectedWriter);
    expect(mockPrisma.writer.create).toHaveBeenCalledWith({
      data: expect.objectContaining(createDto),
    });
  });
});
```

### Integration Test: 실제 Prisma + Test DB

```typescript
// apps/server/test/writer.service.integration.spec.ts

import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, cleanupTestDatabase } from './helpers/database.helper';

describe('WriterService (Integration)', () => {
  let service: WriterService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // 실제 Prisma + Test DB 사용
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });

    await setupTestDatabase();
    service = new WriterService(prisma);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await prisma.$disconnect();
  });

  it('should create writer in real DB', async () => {
    // Given
    const createDto = { name: '작가', systemPrompt: '...' /* ... */ };

    // When
    const result = await service.create(createDto, null, 'user-1');

    // Then: DB에서 실제 조회
    const saved = await prisma.writer.findUnique({
      where: { id: result.id },
    });
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe(createDto.name);
  });
});
```

### Prisma Transaction Mocking

```typescript
// apps/server/test/helpers/prisma-mock.helper.ts

export function createMockPrismaWithTransaction() {
  const mockPrisma = {
    writer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      /* ... */
    },
    story: {
      create: jest.fn(),
      /* ... */
    },
    $transaction: jest.fn(async (fn) => {
      // 트랜잭션 내부의 함수를 실행
      return await fn(mockPrisma);
    }),
  };

  return mockPrisma;
}

// Usage:
it('should handle transaction', async () => {
  const mockPrisma = createMockPrismaWithTransaction();
  mockPrisma.story.create.mockResolvedValue({ id: 'story-1' /* ... */ });

  const service = new StoryService(mockPrisma as any, aiService, moderationService);

  const result = await service.generateStory(generateDto, 'user-1');

  expect(mockPrisma.$transaction).toHaveBeenCalled();
  expect(result.id).toBe('story-1');
});
```

---

## File System Mocking

### Sharp (이미지 리사이징) Mocking

```typescript
// apps/server/test/file.service.spec.ts

import * as sharp from 'sharp';

jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({ size: 100000 }),
    metadata: jest.fn().mockResolvedValue({
      width: 800,
      height: 800,
      format: 'jpeg',
    }),
  }));
});

describe('FileService', () => {
  it('should resize image to 800x800', async () => {
    // Given
    const imageFile = createMockFile('test.jpg');

    // When
    const result = await fileService.saveWriterImage(imageFile);

    // Then
    expect(sharp).toHaveBeenCalledWith(imageFile.buffer);
    expect(result).toMatch(/^uploads\/writers\/[a-z0-9-]+\.jpg$/);
  });
});
```

### fs (파일 시스템) Mocking

```typescript
// apps/server/test/file.service.spec.ts

import * as fs from 'fs';

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(true),
}));

describe('FileService', () => {
  it('should delete file', async () => {
    // Given
    const filePath = 'uploads/writers/image.jpg';

    // When
    await fileService.deleteFile(filePath);

    // Then
    expect(fs.promises.unlink).toHaveBeenCalledWith(filePath);
  });
});
```

---

# Test Isolation

## Database Isolation Strategy

### beforeEach Hook Pattern

```typescript
// apps/server/test/setup/database-isolation.ts

import { PrismaClient } from '@prisma/client';

export function setupDatabaseIsolation(prisma: PrismaClient) {
  beforeEach(async () => {
    // 각 테스트 전: 모든 테이블 초기화 (역순 삭제)
    await prisma.bookmark.deleteMany();
    await prisma.story.deleteMany();
    await prisma.writer.deleteMany();
    await prisma.user.deleteMany();

    // 필요한 경우 기본 데이터 시드
    await prisma.user.createMany({
      data: testUsers,
    });
  });

  afterEach(async () => {
    // 각 테스트 후: 정리 (선택적)
    // beforeEach에서 초기화하므로 생략 가능
  });

  afterAll(async () => {
    // 모든 테스트 종료 후: Prisma 연결 해제
    await prisma.$disconnect();
  });
}

// Usage:
describe('WriterService', () => {
  const prisma = new PrismaClient();
  setupDatabaseIsolation(prisma);

  it('test 1', async () => {
    // 각 테스트는 깨끗한 DB에서 시작
  });

  it('test 2', async () => {
    // test 1의 영향을 받지 않음
  });
});
```

### Transaction Rollback Pattern (더 빠름)

```typescript
// apps/server/test/setup/transaction-isolation.ts

import { PrismaClient } from '@prisma/client';

export function setupTransactionIsolation() {
  let prisma: PrismaClient;
  let txPrisma: any;

  beforeEach(async () => {
    prisma = new PrismaClient();

    // 트랜잭션 시작 (자동 롤백)
    await prisma.$transaction(async (tx) => {
      txPrisma = tx;

      // 테스트는 트랜잭션 내부에서 실행
      // afterEach에서 롤백됨
    });
  });

  afterEach(async () => {
    // 트랜잭션 롤백 (자동)
    await prisma.$disconnect();
  });

  return () => txPrisma;
}

// Usage:
describe('WriterService (Transaction Isolation)', () => {
  const getTxPrisma = setupTransactionIsolation();

  it('test 1', async () => {
    const prisma = getTxPrisma();
    // 트랜잭션 내부에서 테스트
    // afterEach에서 자동 롤백
  });
});
```

---

## Mock Reset Strategy

```typescript
// apps/server/test/setup/mock-reset.ts

export function setupMockReset() {
  beforeEach(() => {
    // 모든 Mock 초기화
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Mock 호출 기록 삭제
    jest.resetAllMocks();
  });

  afterAll(() => {
    // 모든 Mock 완전히 제거
    jest.restoreAllMocks();
  });
}

// Usage:
describe('AIService', () => {
  setupMockReset();

  it('test 1', () => {
    // 깨끗한 Mock 상태에서 시작
  });

  it('test 2', () => {
    // test 1의 Mock 호출 기록이 없음
  });
});
```

---

# Test Execution Order

## Order Strategy

```yaml
execution_order:
  1_unit_tests:
    - '가장 먼저 실행 (빠른 피드백)'
    - '실행 시간: ~10초'
    - '순서: Service → Controller → Helpers'

  2_integration_tests:
    - 'Unit 테스트 통과 후 실행'
    - '실행 시간: ~5초'
    - '순서: Phase 3 → Phase 4 → Phase 5'

  3_e2e_tests:
    - '마지막에 실행 (느림)'
    - '실행 시간: ~20초'
    - '순서: 핵심 플로우 → 에러 시나리오'
```

## Jest Configuration

```typescript
// apps/server/jest.config.js

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.ts', '!**/node_modules/**'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',

  // Test Execution Order
  testSequencer: './test/sequencer.js',

  // Parallel Execution
  maxWorkers: '50%', // CPU 코어의 50% 사용

  // Timeout
  testTimeout: 10000, // 10초

  // Setup Files
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
};
```

## Custom Test Sequencer

```typescript
// apps/server/test/sequencer.js

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // 테스트 파일을 순서대로 정렬
    const order = [
      // 1. Unit Tests (빠름)
      'writer.service.spec.ts',
      'ai.service.spec.ts',
      'moderation.service.spec.ts',
      'story.service.spec.ts',
      'bookmark.service.spec.ts',
      'file.service.spec.ts',
      'writer.controller.spec.ts',
      'story.controller.spec.ts',

      // 2. Integration Tests (중간)
      'writer.integration.spec.ts',
      'story.integration.spec.ts',
      'bookmark.integration.spec.ts',

      // 3. E2E Tests (느림)
      'user-journey.e2e.spec.ts',
      'rate-limiting.e2e.spec.ts',
    ];

    return tests.sort((a, b) => {
      const aIndex = order.findIndex((file) => a.path.includes(file));
      const bIndex = order.findIndex((file) => b.path.includes(file));

      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }
}

module.exports = CustomSequencer;
```

---

## Test Suite Organization

```
apps/server/test/
├── unit/
│   ├── writer.service.spec.ts
│   ├── ai.service.spec.ts
│   ├── moderation.service.spec.ts
│   ├── story.service.spec.ts
│   ├── bookmark.service.spec.ts
│   ├── file.service.spec.ts
│   ├── writer.controller.spec.ts
│   └── story.controller.spec.ts
│
├── integration/
│   ├── writer-flow.integration.spec.ts
│   ├── story-generation.integration.spec.ts
│   └── bookmark-library.integration.spec.ts
│
├── e2e/
│   ├── user-journey.e2e.spec.ts
│   └── rate-limiting.e2e.spec.ts
│
├── fixtures/
│   ├── users.fixture.ts
│   ├── writers.fixture.ts
│   ├── stories.fixture.ts
│   ├── bookmarks.fixture.ts
│   └── openai.fixture.ts
│
├── helpers/
│   ├── database.helper.ts
│   ├── auth.helper.ts
│   ├── factory.helper.ts
│   ├── assertion.helper.ts
│   └── mock-service.helper.ts
│
└── setup/
    ├── setup.ts
    ├── mock-reset.ts
    ├── database-isolation.ts
    └── sequencer.js
```

---

# Coverage Goals

## Coverage Targets

```yaml
overall_target: 85%+

by_module:
  WriterService: 90%+
  AIService: 80%+
  ModerationService: 85%+
  StoryService: 90%+
  BookmarkService: 90%+
  FileService: 85%+
  Controllers: 80%+

by_metric:
  line_coverage: 85%+
  branch_coverage: 80%+
  function_coverage: 90%+
  statement_coverage: 85%+
```

## Coverage Enforcement

```typescript
// apps/server/jest.config.js

module.exports = {
  // ... other config

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    './src/writer/*.ts': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90,
    },
    './src/ai/*.ts': {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Coverage Report

```bash
# Run tests with coverage
pnpm test:cov

# Coverage Report 예시:
# ------------------------|---------|----------|---------|---------|-------------------
# File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
# ------------------------|---------|----------|---------|---------|-------------------
# All files               |   87.42 |    83.21 |   91.67 |   87.42 |
#  writer                 |   92.31 |    88.89 |   95.00 |   92.31 |
#   writer.service.ts     |   95.45 |    91.67 |  100.00 |   95.45 | 45,67
#   writer.controller.ts  |   88.89 |    85.71 |   90.00 |   88.89 | 23,89
#  ai                     |   82.14 |    77.78 |   87.50 |   82.14 |
#   ai.service.ts         |   85.71 |    80.00 |   90.00 |   85.71 | 56,78,90
#   moderation.service.ts |   78.57 |    75.00 |   85.00 |   78.57 | 12,34
# ------------------------|---------|----------|---------|---------|-------------------
```

---

# CI/CD Integration

## GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 5

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: unit-tests

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run Prisma migration
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: integration-tests

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run Prisma migration
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_TEST }}

  coverage-check:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run all tests with coverage
        run: pnpm test:cov
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Check coverage threshold
        run: |
          if [ $(jq '.total.lines.pct' coverage/coverage-summary.json | cut -d. -f1) -lt 85 ]; then
            echo "Coverage below 85%"
            exit 1
          fi
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

# Performance Benchmarks

## Test Execution Time Goals

```yaml
unit_tests:
  total_time: '<10 seconds'
  per_test: '<200ms'
  parallel: true
  workers: '50% CPU cores'

integration_tests:
  total_time: '<5 seconds'
  per_test: '<2 seconds'
  parallel: false # DB 경쟁 방지
  workers: 1

e2e_tests:
  total_time: '<20 seconds'
  per_test: '<10 seconds'
  parallel: false
  workers: 1

total_suite:
  target: '<35 seconds'
  max_acceptable: '<60 seconds'
```

## Performance Optimization

### Parallel Execution

```typescript
// apps/server/jest.config.js

module.exports = {
  // Unit Tests: 병렬 실행
  maxWorkers: '50%',

  // Integration/E2E: 순차 실행
  // jest --runInBand (package.json script)
};
```

### Database Connection Pooling

```typescript
// apps/server/test/setup/database.ts

import { PrismaClient } from '@prisma/client';

// 전역 Prisma 인스턴스 (연결 재사용)
let prisma: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
      log: [], // 테스트 시 로그 비활성화
    });
  }
  return prisma;
}

export async function closePrismaClient() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
```

### Mock Optimization

```typescript
// apps/server/test/helpers/mock-cache.ts

// OpenAI Mock 재사용 (생성 비용 절감)
let cachedMockOpenAI: any;

export function getCachedMockOpenAI() {
  if (!cachedMockOpenAI) {
    cachedMockOpenAI = createMockOpenAI();
  }
  return cachedMockOpenAI;
}

export function resetCachedMockOpenAI() {
  cachedMockOpenAI = undefined;
}
```

---

# Test Data Management

## Fixture Reuse Strategy

```typescript
// apps/server/test/helpers/fixture-manager.ts

class FixtureManager {
  private static instance: FixtureManager;
  private fixtureCache: Map<string, any> = new Map();

  static getInstance() {
    if (!FixtureManager.instance) {
      FixtureManager.instance = new FixtureManager();
    }
    return FixtureManager.instance;
  }

  /**
   * Fixture 캐싱 및 재사용
   */
  getFixture<T>(key: string, generator: () => T): T {
    if (!this.fixtureCache.has(key)) {
      this.fixtureCache.set(key, generator());
    }
    return this.fixtureCache.get(key);
  }

  /**
   * 테스트 종료 후 캐시 정리
   */
  clearCache() {
    this.fixtureCache.clear();
  }
}

// Usage:
const fixtureManager = FixtureManager.getInstance();

describe('WriterService', () => {
  afterAll(() => {
    fixtureManager.clearCache();
  });

  it('test 1', () => {
    const writer = fixtureManager.getFixture('testWriter', () => createTestWriter());
    // 캐시에서 재사용
  });

  it('test 2', () => {
    const writer = fixtureManager.getFixture('testWriter', () => createTestWriter());
    // 동일한 fixture 재사용 (생성 비용 절감)
  });
});
```

---

# Error Handling & Debugging

## Test Debugging Strategy

### Verbose Mode

```bash
# 상세 로그 출력
pnpm test --verbose

# 특정 테스트만 실행
pnpm test --testNamePattern="should create writer"

# Watch Mode로 개발
pnpm test:watch
```

### Debug Configuration (VS Code)

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "--watchAll=false",
        "--testNamePattern=${input:testName}"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ],
  "inputs": [
    {
      "id": "testName",
      "type": "promptString",
      "description": "Test name pattern",
      "default": ""
    }
  ]
}
```

### Test Failure Analysis

```typescript
// apps/server/test/helpers/test-reporter.ts

export class CustomTestReporter {
  onTestResult(test, testResult) {
    if (testResult.numFailingTests > 0) {
      console.log('\n❌ Test Failures:');

      testResult.testResults.forEach((result) => {
        if (result.status === 'failed') {
          console.log(`\n  Test: ${result.fullName}`);
          console.log(`  Error: ${result.failureMessages.join('\n')}`);
          console.log(`  Duration: ${result.duration}ms`);
        }
      });
    }
  }
}
```

---

# Best Practices Summary

## TDD Workflow

```yaml
step_1_red:
  - '테스트 케이스 작성 (Given-When-Then)'
  - '테스트 실행 → 실패 확인 (Red)'

step_2_green:
  - '최소한의 코드로 테스트 통과'
  - '테스트 실행 → 성공 확인 (Green)'

step_3_refactor:
  - '코드 개선 (중복 제거, 가독성 향상)'
  - '테스트 실행 → 여전히 성공 확인'

step_4_repeat:
  - '다음 테스트 케이스로 이동'
  - 'Red → Green → Refactor 반복'
```

## Common Pitfalls to Avoid

```yaml
anti_patterns:
  - ❌ "테스트 간 의존성 (Test 1 실패 시 Test 2도 실패)"
  - ❌ "실제 외부 API 호출 (느림, 불안정)"
  - ❌ "하드코딩된 날짜/시간 (타임존 문제)"
  - ❌ "불충분한 Mocking (DB 경쟁, 파일 시스템 충돌)"
  - ❌ "테스트 데이터 누수 (beforeEach 없이 DB 공유)"
  - ❌ "과도한 E2E 테스트 (느림, 비용 증가)"

best_practices:
  - ✅ "각 테스트는 독립적 (beforeEach로 격리)"
  - ✅ "모든 외부 의존성 Mock (OpenAI, S3, etc.)"
  - ✅ "고정된 시간 사용 (new Date('2025-01-08'))"
  - ✅ "적절한 Mocking 레벨 (Unit vs Integration)"
  - ✅ "Transaction Rollback으로 DB 격리"
  - ✅ "Unit Tests 70% + Integration 25% + E2E 5%"
```

---

# Quick Reference

## Test Template

```typescript
// apps/server/test/[module].spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { [Module]Service } from '../src/[module]/[module].service';
import { setupDatabaseIsolation } from './setup/database-isolation';
import { setupMockReset } from './setup/mock-reset';
import { create[Module]Dto } from './fixtures/[module].fixture';

describe('[Module]Service', () => {
  let service: [Module]Service;

  // Setup
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [[Module]Service],
    }).compile();

    service = module.get<[Module]Service>([Module]Service);
  });

  // Isolation
  setupDatabaseIsolation(prisma);
  setupMockReset();

  // Tests
  describe('methodName', () => {
    it('should do something', async () => {
      // Given
      const input = create[Module]Dto();

      // When
      const result = await service.methodName(input);

      // Then
      expect(result).toMatchObject({
        id: expect.any(String),
        // ...
      });
    });
  });
});
```

---

## 📝 Strategy Summary

### Key Decisions

| Aspect       | Strategy                                 | Rationale              |
| ------------ | ---------------------------------------- | ---------------------- |
| Test Pyramid | 70% Unit / 25% Integration / 5% E2E      | 빠른 피드백, 낮은 비용 |
| Mocking      | OpenAI 완전 Mock, Prisma는 레벨별        | 속도 + 안정성          |
| Isolation    | beforeEach 초기화 + Transaction Rollback | 테스트 독립성 보장     |
| Execution    | Unit → Integration → E2E 순차            | 빠른 실패 감지         |
| Coverage     | 85%+ overall, 90%+ critical modules      | 품질 vs 개발 속도 균형 |
| CI/CD        | GitHub Actions 3-stage pipeline          | 자동화 + 병렬 실행     |

---

**Next Steps**:

1. ✅ Test Cases 완료 (62개)
2. ✅ Fixtures 완료 (테스트 데이터)
3. ✅ Test Strategy 완료 (Mocking, 격리, 실행 순서)
4. ⏭️ **TDD 실행 준비 완료!**

---

**TDD 시작 가이드**:

```bash
# 1. 테스트 DB 설정
export TEST_DATABASE_URL="postgresql://user:password@localhost:5432/test_db"

# 2. 테스트 실행
pnpm test

# 3. Watch Mode로 개발
pnpm test:watch

# 4. Coverage 확인
pnpm test:cov
```

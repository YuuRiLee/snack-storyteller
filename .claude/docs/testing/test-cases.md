# Test Cases: Phase 3-4-5 통합 테스트

> **Purpose**: TDD (Test-Driven Development)를 위한 상세 테스트 케이스 명세
> **Scope**: Phase 3 (Writers), Phase 4 (AI Story Generation), Phase 5 (Story Library)
> **Format**: Given-When-Then 구조
> **Created**: 2025-01-08

---

## 📚 Table of Contents

- [Phase 3: Writer Management](#phase-3-writer-management)
  - [WriterService](#writerservice)
  - [WriterController](#writercontroller)
  - [FileService](#fileservice)
- [Phase 4: AI Story Generation](#phase-4-ai-story-generation)
  - [AIService](#aiservice)
  - [ModerationService](#moderationservice)
  - [StoryService (Generation)](#storyservice-generation)
- [Phase 5: Story Library](#phase-5-story-library)
  - [StoryService (Library)](#storyservice-library)
  - [BookmarkService](#bookmarkservice)
- [Integration Tests](#integration-tests)
- [E2E Tests](#e2e-tests)

---

# Phase 3: Writer Management

## WriterService

### `WriterService.create()`

#### Test Case 1: 정상적인 작가 생성 (이미지 포함)

```typescript
describe('WriterService.create', () => {
  it('should create writer with image successfully', async () => {
    // Given: 유효한 작가 정보 + 이미지 파일
    const createDto: CreateWriterDto = {
      name: '하드보일드 탐정',
      systemPrompt:
        '당신은 1940년대 느와르 소설 작가입니다. 간결하고 힘있는 문체를 사용하며, 냉소적이고 현실적인 톤을 유지합니다.',
      description: '도시의 어둠을 파헤치는 냉소적 작가',
      genre: ['느와르', '스릴러'],
      visibility: Visibility.PUBLIC,
    };
    const imageFile: Express.Multer.File = {
      originalname: 'detective.jpg',
      mimetype: 'image/jpeg',
      size: 3 * 1024 * 1024, // 3MB
      buffer: Buffer.from('mock-image-data'),
      // ... other required fields
    };
    const userId = 'user-1';

    // When
    const result = await writerService.create(createDto, imageFile, userId);

    // Then
    expect(result).toMatchObject({
      id: expect.any(String),
      name: '하드보일드 탐정',
      systemPrompt: createDto.systemPrompt,
      description: createDto.description,
      genre: ['느와르', '스릴러'],
      visibility: Visibility.PUBLIC,
      imageUrl: expect.stringContaining('uploads/writers/'),
      ownerId: userId,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    // Verify: FileService was called
    expect(fileService.saveWriterImage).toHaveBeenCalledWith(imageFile);
  });
});
```

**Expected Input**:

```typescript
createDto: CreateWriterDto {
  name: string (2-50 chars)
  systemPrompt: string (100-2000 chars)
  description: string (10-500 chars)
  genre: string[] (1-5 items)
  visibility: 'PUBLIC' | 'PRIVATE'
}
imageFile?: Express.Multer.File
userId: string
```

**Expected Output**:

```typescript
WriterDto {
  id: string
  name: string
  systemPrompt: string
  description: string
  genre: string[]
  visibility: 'PUBLIC' | 'PRIVATE'
  imageUrl: string | null
  ownerId: string
  createdAt: Date
  updatedAt: Date
}
```

---

#### Test Case 2: 이미지 없이 작가 생성

```typescript
it('should create writer without image', async () => {
  // Given: 이미지 없는 작가 정보
  const createDto: CreateWriterDto = {
    name: '로맨스 작가',
    systemPrompt: '당신은 로맨스 소설 전문 작가입니다.',
    description: '감성적이고 따뜻한 이야기를 쓰는 작가',
    genre: ['로맨스', '현대물'],
    visibility: Visibility.PUBLIC,
  };
  const userId = 'user-1';

  // When
  const result = await writerService.create(createDto, null, userId);

  // Then
  expect(result.imageUrl).toBeNull();
  expect(result.name).toBe('로맨스 작가');
  expect(fileService.saveWriterImage).not.toHaveBeenCalled();
});
```

---

#### Test Case 3: systemPrompt가 너무 짧을 때

```typescript
it('should throw BadRequestException if systemPrompt is too short', async () => {
  // Given: systemPrompt가 100자 미만
  const createDto: CreateWriterDto = {
    name: '테스트 작가',
    systemPrompt: '짧은 프롬프트', // 8자 (< 100자)
    description: '설명',
    genre: ['로맨스'],
    visibility: Visibility.PUBLIC,
  };
  const userId = 'user-1';

  // When & Then
  await expect(writerService.create(createDto, null, userId)).rejects.toThrow(BadRequestException);

  await expect(writerService.create(createDto, null, userId)).rejects.toThrow(
    'systemPrompt는 최소 100자 이상이어야 합니다',
  );
});
```

**Error Response**:

```typescript
{
  statusCode: 400,
  message: 'systemPrompt는 최소 100자 이상이어야 합니다',
  error: 'Bad Request'
}
```

---

#### Test Case 4: 장르가 너무 많을 때

```typescript
it('should throw BadRequestException if genre exceeds 5 items', async () => {
  // Given: 장르 6개 (최대 5개)
  const createDto: CreateWriterDto = {
    name: '테스트 작가',
    systemPrompt: '...'.repeat(50), // 150자
    description: '설명',
    genre: ['로맨스', '스릴러', '판타지', 'SF', '공포', '코미디'], // 6개
    visibility: Visibility.PUBLIC,
  };
  const userId = 'user-1';

  // When & Then
  await expect(writerService.create(createDto, null, userId)).rejects.toThrow(BadRequestException);

  await expect(writerService.create(createDto, null, userId)).rejects.toThrow(
    '장르는 최대 5개까지 선택 가능합니다',
  );
});
```

---

### `WriterService.findAll()`

#### Test Case 5: PUBLIC 작가 목록 조회 (인증 없음)

```typescript
describe('WriterService.findAll', () => {
  it('should return only PUBLIC writers when no userId', async () => {
    // Given: DB에 PUBLIC 5개, PRIVATE 3개 존재
    await prisma.writer.createMany({
      data: [
        ...publicWriters, // 5개
        ...privateWriters, // 3개
      ],
    });
    const query: WriterQueryDto = {
      page: 1,
      limit: 20,
    };

    // When
    const result = await writerService.findAll(query, null);

    // Then
    expect(result.data).toHaveLength(5);
    expect(result.data.every((w) => w.visibility === Visibility.PUBLIC)).toBe(true);
    expect(result.meta).toEqual({
      total: 5,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });
});
```

**Expected Input**:

```typescript
query: WriterQueryDto {
  page?: number (default: 1)
  limit?: number (default: 20, max: 100)
  genre?: string
  search?: string
  sort?: 'recent' | 'popular' (default: 'recent')
}
userId?: string | null
```

**Expected Output**:

```typescript
PaginatedResponse<WriterDto> {
  data: WriterDto[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
```

---

#### Test Case 6: 인증된 사용자 - PUBLIC + 본인 PRIVATE

```typescript
it('should return PUBLIC + own PRIVATE writers when authenticated', async () => {
  // Given: PUBLIC 5개, user-1의 PRIVATE 3개, user-2의 PRIVATE 2개
  await prisma.writer.createMany({
    data: [
      ...publicWriters, // 5개
      { ...privateWriter1, ownerId: 'user-1' }, // 3개
      { ...privateWriter2, ownerId: 'user-1' },
      { ...privateWriter3, ownerId: 'user-1' },
      { ...otherPrivate1, ownerId: 'user-2' }, // 2개
      { ...otherPrivate2, ownerId: 'user-2' },
    ],
  });
  const query: WriterQueryDto = { page: 1, limit: 20 };
  const userId = 'user-1';

  // When
  const result = await writerService.findAll(query, userId);

  // Then
  expect(result.data).toHaveLength(8); // PUBLIC 5 + own PRIVATE 3
  expect(result.data.filter((w) => w.visibility === Visibility.PRIVATE).length).toBe(3);
  expect(
    result.data
      .filter((w) => w.visibility === Visibility.PRIVATE)
      .every((w) => w.ownerId === userId),
  ).toBe(true);
});
```

---

#### Test Case 7: 장르 필터링

```typescript
it('should filter by genre', async () => {
  // Given: 느와르 3개, 로맨스 4개, 판타지 3개
  await prisma.writer.createMany({
    data: [
      { ...writer1, genre: ['느와르', '스릴러'] },
      { ...writer2, genre: ['느와르'] },
      { ...writer3, genre: ['느와르', '미스터리'] },
      { ...writer4, genre: ['로맨스', '현대물'] },
      { ...writer5, genre: ['로맨스'] },
      { ...writer6, genre: ['로맨스', '사극'] },
      { ...writer7, genre: ['로맨스'] },
      { ...writer8, genre: ['판타지', '액션'] },
      { ...writer9, genre: ['판타지'] },
      { ...writer10, genre: ['판타지', 'SF'] },
    ],
  });
  const query: WriterQueryDto = {
    page: 1,
    limit: 20,
    genre: '느와르',
  };

  // When
  const result = await writerService.findAll(query, null);

  // Then
  expect(result.data).toHaveLength(3);
  expect(result.data.every((w) => w.genre.includes('느와르'))).toBe(true);
});
```

---

#### Test Case 8: 검색 (이름 검색)

```typescript
it('should search by name (case-insensitive)', async () => {
  // Given: 다양한 작가 이름
  await prisma.writer.createMany({
    data: [
      { ...writer1, name: '하드보일드 탐정' },
      { ...writer2, name: '로맨스 작가' },
      { ...writer3, name: '판타지 탐정' },
      { ...writer4, name: 'SF 작가' },
    ],
  });
  const query: WriterQueryDto = {
    page: 1,
    limit: 20,
    search: '탐정',
  };

  // When
  const result = await writerService.findAll(query, null);

  // Then
  expect(result.data).toHaveLength(2);
  expect(result.data.map((w) => w.name)).toEqual(
    expect.arrayContaining(['하드보일드 탐정', '판타지 탐정']),
  );
});
```

---

#### Test Case 9: Pagination

```typescript
it('should paginate correctly', async () => {
  // Given: 25개 작가 (PUBLIC)
  await prisma.writer.createMany({
    data: Array.from({ length: 25 }, (_, i) => ({
      ...writerTemplate,
      name: `작가 ${i + 1}`,
    })),
  });
  const query: WriterQueryDto = {
    page: 2,
    limit: 10,
  };

  // When
  const result = await writerService.findAll(query, null);

  // Then
  expect(result.data).toHaveLength(10);
  expect(result.meta).toEqual({
    total: 25,
    page: 2,
    limit: 10,
    totalPages: 3,
  });
  expect(result.data[0].name).toBe('작가 11');
  expect(result.data[9].name).toBe('작가 20');
});
```

---

### `WriterService.findOne()`

#### Test Case 10: PUBLIC 작가 조회 (인증 없음)

```typescript
describe('WriterService.findOne', () => {
  it('should return PUBLIC writer without authentication', async () => {
    // Given: PUBLIC 작가
    const writer = await prisma.writer.create({
      data: {
        ...writerData,
        visibility: Visibility.PUBLIC,
      },
    });

    // When
    const result = await writerService.findOne(writer.id, null);

    // Then
    expect(result).toMatchObject({
      id: writer.id,
      name: writer.name,
      visibility: Visibility.PUBLIC,
    });
  });
});
```

---

#### Test Case 11: PRIVATE 작가 조회 - 소유자

```typescript
it('should return PRIVATE writer for owner', async () => {
  // Given: user-1의 PRIVATE 작가
  const writer = await prisma.writer.create({
    data: {
      ...writerData,
      visibility: Visibility.PRIVATE,
      ownerId: 'user-1',
    },
  });

  // When
  const result = await writerService.findOne(writer.id, 'user-1');

  // Then
  expect(result).toMatchObject({
    id: writer.id,
    visibility: Visibility.PRIVATE,
    ownerId: 'user-1',
  });
});
```

---

#### Test Case 12: PRIVATE 작가 조회 - 비소유자

```typescript
it('should throw NotFoundException for PRIVATE writer when not owner', async () => {
  // Given: user-1의 PRIVATE 작가
  const writer = await prisma.writer.create({
    data: {
      ...writerData,
      visibility: Visibility.PRIVATE,
      ownerId: 'user-1',
    },
  });

  // When & Then: user-2가 조회 시도
  await expect(writerService.findOne(writer.id, 'user-2')).rejects.toThrow(NotFoundException);

  await expect(writerService.findOne(writer.id, 'user-2')).rejects.toThrow(
    '작가를 찾을 수 없습니다',
  );
});
```

---

#### Test Case 13: 존재하지 않는 작가 조회

```typescript
it('should throw NotFoundException for non-existent writer', async () => {
  // Given: 존재하지 않는 ID
  const nonExistentId = 'non-existent-id';

  // When & Then
  await expect(writerService.findOne(nonExistentId, null)).rejects.toThrow(NotFoundException);
});
```

---

### `WriterService.update()`

#### Test Case 14: 소유자가 작가 정보 수정

```typescript
describe('WriterService.update', () => {
  it('should update writer successfully by owner', async () => {
    // Given: user-1의 작가
    const writer = await prisma.writer.create({
      data: {
        ...writerData,
        ownerId: 'user-1',
      },
    });
    const updateDto: UpdateWriterDto = {
      name: '수정된 이름',
      description: '수정된 설명',
      genre: ['로맨스', '판타지'],
    };

    // When
    const result = await writerService.update(writer.id, updateDto, 'user-1');

    // Then
    expect(result).toMatchObject({
      id: writer.id,
      name: '수정된 이름',
      description: '수정된 설명',
      genre: ['로맨스', '판타지'],
      systemPrompt: writer.systemPrompt, // 변경 안 됨
      updatedAt: expect.any(Date),
    });
    expect(result.updatedAt.getTime()).toBeGreaterThan(writer.createdAt.getTime());
  });
});
```

**Expected Input**:

```typescript
writerId: string
updateDto: UpdateWriterDto {
  name?: string (2-50 chars)
  systemPrompt?: string (100-2000 chars)
  description?: string (10-500 chars)
  genre?: string[] (1-5 items)
  visibility?: 'PUBLIC' | 'PRIVATE'
}
imageFile?: Express.Multer.File
userId: string
```

**Expected Output**:

```typescript
WriterDto(updated);
```

---

#### Test Case 15: systemPrompt 수정

```typescript
it('should update systemPrompt', async () => {
  // Given: 작가 생성
  const writer = await prisma.writer.create({
    data: {
      ...writerData,
      systemPrompt: '기존 프롬프트',
      ownerId: 'user-1',
    },
  });
  const updateDto: UpdateWriterDto = {
    systemPrompt:
      '수정된 프롬프트입니다. 100자 이상이어야 합니다. 이 프롬프트는 AI 작가의 스타일을 정의합니다. 간결하고 힘있는 문체를 사용하며, 냉소적이고 현실적인 톤을 유지합니다.',
  };

  // When
  const result = await writerService.update(writer.id, updateDto, 'user-1');

  // Then
  expect(result.systemPrompt).toBe(updateDto.systemPrompt);
  expect(result.systemPrompt.length).toBeGreaterThanOrEqual(100);
});
```

---

#### Test Case 16: 비소유자가 수정 시도

```typescript
it('should throw ForbiddenException when non-owner tries to update', async () => {
  // Given: user-1의 작가
  const writer = await prisma.writer.create({
    data: {
      ...writerData,
      ownerId: 'user-1',
    },
  });
  const updateDto: UpdateWriterDto = {
    name: '해킹 시도',
  };

  // When & Then: user-2가 수정 시도
  await expect(writerService.update(writer.id, updateDto, 'user-2')).rejects.toThrow(
    ForbiddenException,
  );

  await expect(writerService.update(writer.id, updateDto, 'user-2')).rejects.toThrow(
    '작가를 수정할 권한이 없습니다',
  );
});
```

**Error Response**:

```typescript
{
  statusCode: 403,
  message: '작가를 수정할 권한이 없습니다',
  error: 'Forbidden'
}
```

---

#### Test Case 17: 이미지 교체

```typescript
it('should replace image when new image is uploaded', async () => {
  // Given: 기존 이미지가 있는 작가
  const writer = await prisma.writer.create({
    data: {
      ...writerData,
      imageUrl: 'uploads/writers/old-image.jpg',
      ownerId: 'user-1',
    },
  });
  const newImageFile: Express.Multer.File = {
    originalname: 'new-image.jpg',
    mimetype: 'image/jpeg',
    size: 2 * 1024 * 1024,
    buffer: Buffer.from('new-image-data'),
  };
  const updateDto: UpdateWriterDto = {};

  // When
  const result = await writerService.update(writer.id, updateDto, newImageFile, 'user-1');

  // Then
  expect(result.imageUrl).not.toBe(writer.imageUrl);
  expect(result.imageUrl).toContain('uploads/writers/');
  expect(fileService.deleteFile).toHaveBeenCalledWith('uploads/writers/old-image.jpg');
  expect(fileService.saveWriterImage).toHaveBeenCalledWith(newImageFile);
});
```

---

### `WriterService.remove()`

#### Test Case 18: 소유자가 작가 삭제

```typescript
describe('WriterService.remove', () => {
  it('should delete writer successfully by owner', async () => {
    // Given: user-1의 작가
    const writer = await prisma.writer.create({
      data: {
        ...writerData,
        ownerId: 'user-1',
      },
    });

    // When
    await writerService.remove(writer.id, 'user-1');

    // Then
    const deleted = await prisma.writer.findUnique({
      where: { id: writer.id },
    });
    expect(deleted).toBeNull();
  });
});
```

**Expected Input**:

```typescript
writerId: string;
userId: string;
```

**Expected Output**:

```typescript
void (삭제 성공 시 반환값 없음)
```

---

#### Test Case 19: 비소유자가 삭제 시도

```typescript
it('should throw ForbiddenException when non-owner tries to delete', async () => {
  // Given: user-1의 작가
  const writer = await prisma.writer.create({
    data: {
      ...writerData,
      ownerId: 'user-1',
    },
  });

  // When & Then: user-2가 삭제 시도
  await expect(writerService.remove(writer.id, 'user-2')).rejects.toThrow(ForbiddenException);

  await expect(writerService.remove(writer.id, 'user-2')).rejects.toThrow(
    '작가를 삭제할 권한이 없습니다',
  );

  // Verify: 실제로 삭제 안 됨
  const stillExists = await prisma.writer.findUnique({
    where: { id: writer.id },
  });
  expect(stillExists).not.toBeNull();
});
```

---

#### Test Case 20: CASCADE 삭제 - 작가 삭제 시 소설도 삭제

```typescript
it('should cascade delete stories when writer is deleted', async () => {
  // Given: 작가 + 소설 3개
  const writer = await prisma.writer.create({
    data: {
      ...writerData,
      ownerId: 'user-1',
    },
  });
  const stories = await prisma.story.createMany({
    data: [
      { ...storyData, writerId: writer.id, userId: 'user-1' },
      { ...storyData, writerId: writer.id, userId: 'user-1' },
      { ...storyData, writerId: writer.id, userId: 'user-1' },
    ],
  });

  // When: 작가 삭제
  await writerService.remove(writer.id, 'user-1');

  // Then: 소설도 모두 삭제됨
  const remainingStories = await prisma.story.findMany({
    where: { writerId: writer.id },
  });
  expect(remainingStories).toHaveLength(0);
});
```

---

#### Test Case 21: 이미지 파일도 삭제

```typescript
it('should delete image file when writer is deleted', async () => {
  // Given: 이미지가 있는 작가
  const writer = await prisma.writer.create({
    data: {
      ...writerData,
      imageUrl: 'uploads/writers/image.jpg',
      ownerId: 'user-1',
    },
  });

  // When
  await writerService.remove(writer.id, 'user-1');

  // Then
  expect(fileService.deleteFile).toHaveBeenCalledWith('uploads/writers/image.jpg');
});
```

---

## WriterController

### `POST /writers`

#### Test Case 22: 정상적인 작가 생성 요청

```typescript
describe('POST /writers', () => {
  it('should create writer and return 201', async () => {
    // Given: multipart/form-data 요청
    const createDto = {
      name: '테스트 작가',
      systemPrompt: '...'.repeat(50), // 150자
      description: '테스트 설명',
      genre: ['로맨스', '판타지'],
      visibility: 'PUBLIC',
    };
    const imageFile = createMockFile('test.jpg', 'image/jpeg', 3 * 1024 * 1024);

    // When
    const response = await request(app.getHttpServer())
      .post('/writers')
      .set('Authorization', `Bearer ${validToken}`)
      .field('name', createDto.name)
      .field('systemPrompt', createDto.systemPrompt)
      .field('description', createDto.description)
      .field('genre', JSON.stringify(createDto.genre))
      .field('visibility', createDto.visibility)
      .attach('image', imageFile.buffer, imageFile.originalname);

    // Then
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: createDto.name,
      visibility: 'PUBLIC',
      imageUrl: expect.stringContaining('uploads/writers/'),
    });
  });
});
```

---

#### Test Case 23: 인증 없이 요청

```typescript
it('should return 401 when not authenticated', async () => {
  // Given: JWT 토큰 없음
  const createDto = {
    name: '테스트 작가',
    systemPrompt: '...'.repeat(50),
    description: '설명',
    genre: ['로맨스'],
    visibility: 'PUBLIC',
  };

  // When
  const response = await request(app.getHttpServer()).post('/writers').send(createDto);

  // Then
  expect(response.status).toBe(401);
  expect(response.body.message).toBe('Unauthorized');
});
```

---

#### Test Case 24: 유효하지 않은 DTO

```typescript
it('should return 400 for invalid DTO (name too short)', async () => {
  // Given: 이름 1자 (최소 2자)
  const invalidDto = {
    name: 'A', // 1자
    systemPrompt: '...'.repeat(50),
    description: '설명',
    genre: ['로맨스'],
    visibility: 'PUBLIC',
  };

  // When
  const response = await request(app.getHttpServer())
    .post('/writers')
    .set('Authorization', `Bearer ${validToken}`)
    .send(invalidDto);

  // Then
  expect(response.status).toBe(400);
  expect(response.body.message).toContain('name must be longer than or equal to 2 characters');
});
```

---

### `GET /writers`

#### Test Case 25: PUBLIC 작가 목록 조회

```typescript
describe('GET /writers', () => {
  it('should return public writers', async () => {
    // Given: PUBLIC 3개, PRIVATE 2개
    await createMockWriters();

    // When
    const response = await request(app.getHttpServer())
      .get('/writers')
      .query({ page: 1, limit: 20 });

    // Then
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data.every((w) => w.visibility === 'PUBLIC')).toBe(true);
    expect(response.body.meta).toEqual({
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });
});
```

---

#### Test Case 26: 장르 필터 쿼리

```typescript
it('should filter by genre query parameter', async () => {
  // Given: 느와르 2개, 로맨스 3개
  await createMockWriters();

  // When
  const response = await request(app.getHttpServer()).get('/writers').query({ genre: '느와르' });

  // Then
  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(2);
  expect(response.body.data.every((w) => w.genre.includes('느와르'))).toBe(true);
});
```

---

### `GET /writers/:id`

#### Test Case 27: 작가 상세 조회

```typescript
describe('GET /writers/:id', () => {
  it('should return writer detail', async () => {
    // Given: PUBLIC 작가
    const writer = await createMockWriter({ visibility: 'PUBLIC' });

    // When
    const response = await request(app.getHttpServer()).get(`/writers/${writer.id}`);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: writer.id,
      name: writer.name,
      systemPrompt: writer.systemPrompt,
      description: writer.description,
    });
  });
});
```

---

### `PATCH /writers/:id`

#### Test Case 28: 작가 정보 수정

```typescript
describe('PATCH /writers/:id', () => {
  it('should update writer by owner', async () => {
    // Given: user-1의 작가
    const writer = await createMockWriter({ ownerId: 'user-1' });
    const updateDto = {
      name: '수정된 이름',
      description: '수정된 설명',
    };

    // When
    const response = await request(app.getHttpServer())
      .patch(`/writers/${writer.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send(updateDto);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: writer.id,
      name: '수정된 이름',
      description: '수정된 설명',
    });
  });
});
```

---

### `DELETE /writers/:id`

#### Test Case 29: 작가 삭제

```typescript
describe('DELETE /writers/:id', () => {
  it('should delete writer by owner', async () => {
    // Given: user-1의 작가
    const writer = await createMockWriter({ ownerId: 'user-1' });

    // When
    const response = await request(app.getHttpServer())
      .delete(`/writers/${writer.id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    // Then
    expect(response.status).toBe(204);

    // Verify: 실제 삭제됨
    const deleted = await prisma.writer.findUnique({
      where: { id: writer.id },
    });
    expect(deleted).toBeNull();
  });
});
```

---

## FileService

### `FileService.saveWriterImage()`

#### Test Case 30: 이미지 저장 및 리사이징

```typescript
describe('FileService.saveWriterImage', () => {
  it('should save and resize image to 800x800', async () => {
    // Given: 5MB JPG 이미지
    const imageFile: Express.Multer.File = {
      originalname: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 5 * 1024 * 1024,
      buffer: await createMockImageBuffer(2000, 2000),
    };

    // When
    const result = await fileService.saveWriterImage(imageFile);

    // Then
    expect(result).toMatch(/^uploads\/writers\/[a-z0-9-]+\.jpg$/);
    expect(fs.existsSync(result)).toBe(true);

    // Verify: 리사이징 확인
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(800);
    expect(metadata.height).toBe(800);
  });
});
```

**Expected Input**:

```typescript
imageFile: Express.Multer.File {
  originalname: string
  mimetype: 'image/jpeg' | 'image/png'
  size: number (<= 5MB)
  buffer: Buffer
}
```

**Expected Output**:

```typescript
imageUrl: string; // 'uploads/writers/{uuid}.jpg'
```

---

#### Test Case 31: 유효하지 않은 MIME type

```typescript
it('should throw BadRequestException for invalid MIME type', async () => {
  // Given: PDF 파일 (이미지 아님)
  const pdfFile: Express.Multer.File = {
    originalname: 'document.pdf',
    mimetype: 'application/pdf',
    size: 1 * 1024 * 1024,
    buffer: Buffer.from('pdf-data'),
  };

  // When & Then
  await expect(fileService.saveWriterImage(pdfFile)).rejects.toThrow(BadRequestException);

  await expect(fileService.saveWriterImage(pdfFile)).rejects.toThrow(
    'JPG 또는 PNG 이미지만 업로드 가능합니다',
  );
});
```

---

#### Test Case 32: 파일 크기 초과

```typescript
it('should throw BadRequestException for file size exceeding 5MB', async () => {
  // Given: 6MB 이미지
  const largeFile: Express.Multer.File = {
    originalname: 'large.jpg',
    mimetype: 'image/jpeg',
    size: 6 * 1024 * 1024, // 6MB
    buffer: Buffer.alloc(6 * 1024 * 1024),
  };

  // When & Then
  await expect(fileService.saveWriterImage(largeFile)).rejects.toThrow(BadRequestException);

  await expect(fileService.saveWriterImage(largeFile)).rejects.toThrow(
    '파일 크기는 5MB 이하여야 합니다',
  );
});
```

---

### `FileService.deleteFile()`

#### Test Case 33: 파일 삭제

```typescript
describe('FileService.deleteFile', () => {
  it('should delete file from filesystem', async () => {
    // Given: 파일 존재
    const filePath = 'uploads/writers/test-image.jpg';
    await fs.promises.writeFile(filePath, 'test-data');
    expect(fs.existsSync(filePath)).toBe(true);

    // When
    await fileService.deleteFile(filePath);

    // Then
    expect(fs.existsSync(filePath)).toBe(false);
  });
});
```

---

#### Test Case 34: 존재하지 않는 파일 삭제 (에러 없음)

```typescript
it('should not throw error if file does not exist', async () => {
  // Given: 존재하지 않는 파일
  const nonExistentPath = 'uploads/writers/non-existent.jpg';
  expect(fs.existsSync(nonExistentPath)).toBe(false);

  // When & Then: 에러 없이 완료
  await expect(fileService.deleteFile(nonExistentPath)).resolves.not.toThrow();
});
```

---

# Phase 4: AI Story Generation

## AIService

### `AIService.generateStory()`

#### Test Case 35: 정상적인 소설 생성 (1500+ 단어)

```typescript
describe('AIService.generateStory', () => {
  it('should generate story with 1500+ words', async () => {
    // Given: 유효한 systemPrompt + tags
    const systemPrompt = '당신은 하드보일드 느와르 작가입니다...';
    const tags = ['느와르', '반전'];
    const userId = 'user-1';

    // Mock: OpenAI API 응답 (1800단어)
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: '...'.repeat(600), // 1800단어 (1단어 = 3문자 가정)
          },
        },
      ],
    });

    // When
    const result = await aiService.generateStory(systemPrompt, tags, userId);

    // Then
    expect(result).toMatchObject({
      content: expect.any(String),
      wordCount: expect.any(Number),
      title: expect.any(String),
    });
    expect(result.wordCount).toBeGreaterThanOrEqual(1500);
    expect(result.wordCount).toBeLessThanOrEqual(2000);

    // Verify: OpenAI API 호출 확인
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: expect.stringContaining(systemPrompt),
        },
        {
          role: 'user',
          content: expect.stringContaining('느와르'),
        },
      ],
      temperature: 0.9,
      max_tokens: 4000,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });
  });
});
```

**Expected Input**:

```typescript
systemPrompt: string
tags: string[]
userId: string
```

**Expected Output**:

```typescript
{
  content: string; // 1500-2000 단어
  wordCount: number;
  title: string;
}
```

---

#### Test Case 36: OpenAI API 실패 시 재시도

```typescript
it('should retry 3 times on OpenAI API failure', async () => {
  // Given: OpenAI API가 2번 실패 후 3번째 성공
  mockOpenAI.chat.completions.create
    .mockRejectedValueOnce(new Error('Timeout'))
    .mockRejectedValueOnce(new Error('Rate limit'))
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: '...'.repeat(600), // 1800단어
          },
        },
      ],
    });

  const systemPrompt = '...';
  const tags = ['로맨스'];
  const userId = 'user-1';

  // When
  const result = await aiService.generateStory(systemPrompt, tags, userId);

  // Then: 성공
  expect(result.wordCount).toBeGreaterThanOrEqual(1500);
  expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
});
```

---

#### Test Case 37: 3회 재시도 후에도 실패

```typescript
it('should throw ServiceUnavailableException after 3 retries', async () => {
  // Given: OpenAI API가 3번 모두 실패
  mockOpenAI.chat.completions.create
    .mockRejectedValueOnce(new Error('Timeout'))
    .mockRejectedValueOnce(new Error('Timeout'))
    .mockRejectedValueOnce(new Error('Timeout'));

  const systemPrompt = '...';
  const tags = ['로맨스'];
  const userId = 'user-1';

  // When & Then
  await expect(aiService.generateStory(systemPrompt, tags, userId)).rejects.toThrow(
    ServiceUnavailableException,
  );

  await expect(aiService.generateStory(systemPrompt, tags, userId)).rejects.toThrow(
    'AI 서비스가 일시적으로 사용 불가능합니다',
  );

  expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
});
```

---

#### Test Case 38: 생성된 소설이 너무 짧을 때 재생성

```typescript
it('should retry if generated story is too short (<1500 words)', async () => {
  // Given: 첫 번째 생성은 1000단어, 두 번째는 1700단어
  mockOpenAI.chat.completions.create
    .mockResolvedValueOnce({
      choices: [{ message: { content: '...'.repeat(333) } }], // 1000단어
    })
    .mockResolvedValueOnce({
      choices: [{ message: { content: '...'.repeat(567) } }], // 1700단어
    });

  const systemPrompt = '...';
  const tags = ['판타지'];
  const userId = 'user-1';

  // When
  const result = await aiService.generateStory(systemPrompt, tags, userId);

  // Then
  expect(result.wordCount).toBeGreaterThanOrEqual(1500);
  expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
});
```

---

### `AIService.generateTitle()`

#### Test Case 39: 소설 제목 생성

```typescript
describe('AIService.generateTitle', () => {
  it('should generate title from story content', async () => {
    // Given: 소설 내용
    const content = `비는 도시를 적시고, 내 사무실 창문을 두드렸다.
    수화기 너머 여자의 목소리는 떨리고 있었다. "그를 찾아주세요. 제발."
    나는 담배에 불을 붙이며 대답했다. "주소를 대시오."
    ...`;

    // Mock: OpenAI API 응답
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: '빗속의 탐정',
          },
        },
      ],
    });

    // When
    const result = await aiService.generateTitle(content);

    // Then
    expect(result).toBe('빗속의 탐정');
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(50);

    // Verify: OpenAI 호출 확인
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: expect.stringContaining('제목을 생성'),
        },
        {
          role: 'user',
          content: expect.stringContaining(content.substring(0, 500)),
        },
      ],
      temperature: 0.7,
      max_tokens: 50,
    });
  });
});
```

**Expected Input**:

```typescript
content: string; // 소설 전체 내용
```

**Expected Output**:

```typescript
title: string; // 5-50자 제목
```

---

## ModerationService

### `ModerationService.check()`

#### Test Case 40: 안전한 프롬프트 (통과)

```typescript
describe('ModerationService.check', () => {
  it('should pass safe prompt', async () => {
    // Given: 안전한 프롬프트
    const safePrompt =
      '로맨스 소설을 작성해주세요. 주인공은 파티장에서 만난 사람과 사랑에 빠집니다.';

    // Mock: OpenAI Moderation API
    mockOpenAI.moderations.create.mockResolvedValue({
      results: [
        {
          flagged: false,
          categories: {
            violence: false,
            sexual: false,
            hate: false,
            // ... other categories
          },
        },
      ],
    });

    // When & Then: 에러 없이 통과
    await expect(moderationService.check(safePrompt)).resolves.not.toThrow();

    expect(mockOpenAI.moderations.create).toHaveBeenCalledWith({
      input: safePrompt,
    });
  });
});
```

**Expected Input**:

```typescript
prompt: string;
```

**Expected Output**:

```typescript
void (안전하면 반환값 없음)
throws BadRequestException (부적절한 내용 발견 시)
```

---

#### Test Case 41: 부적절한 프롬프트 (OpenAI Moderation)

```typescript
it('should throw BadRequestException for flagged content', async () => {
  // Given: 부적절한 프롬프트
  const unsafePrompt = '폭력적인 내용...';

  // Mock: OpenAI Moderation API
  mockOpenAI.moderations.create.mockResolvedValue({
    results: [
      {
        flagged: true,
        categories: {
          violence: true,
          sexual: false,
          hate: false,
        },
      },
    ],
  });

  // When & Then
  await expect(moderationService.check(unsafePrompt)).rejects.toThrow(BadRequestException);

  await expect(moderationService.check(unsafePrompt)).rejects.toThrow(
    '부적절한 내용이 감지되었습니다',
  );
});
```

---

#### Test Case 42: 한국어 키워드 필터링

```typescript
it('should detect Korean inappropriate keywords', async () => {
  // Given: 한국어 부적절 키워드 포함
  const koreanUnsafe = '이 소설은 19금 성인물입니다...';

  // Mock: OpenAI는 통과하지만 한국어 필터에 걸림
  mockOpenAI.moderations.create.mockResolvedValue({
    results: [{ flagged: false }],
  });

  // When & Then
  await expect(moderationService.check(koreanUnsafe)).rejects.toThrow(BadRequestException);

  await expect(moderationService.check(koreanUnsafe)).rejects.toThrow(
    '부적절한 한국어 키워드가 포함되어 있습니다',
  );
});
```

---

## StoryService (Generation)

### `StoryService.generateStory()`

#### Test Case 43: 완전한 소설 생성 플로우

```typescript
describe('StoryService.generateStory', () => {
  it('should complete full story generation flow', async () => {
    // Given: 작가 정보 + 생성 요청
    const writer = await prisma.writer.create({
      data: {
        ...writerData,
        systemPrompt: '당신은 로맨스 작가입니다...',
      },
    });
    const generateDto: GenerateStoryDto = {
      writerId: writer.id,
      tags: ['로맨스', '해피엔딩'],
    };
    const userId = 'user-1';

    // Mock: Moderation 통과
    jest.spyOn(moderationService, 'check').mockResolvedValue();

    // Mock: AI 생성
    jest.spyOn(aiService, 'generateStory').mockResolvedValue({
      content: '...'.repeat(600), // 1800단어
      wordCount: 1800,
      title: '봄날의 만남',
    });

    // When
    const result = await storyService.generateStory(generateDto, userId);

    // Then
    expect(result).toMatchObject({
      id: expect.any(String),
      title: '봄날의 만남',
      content: expect.any(String),
      wordCount: 1800,
      readTime: expect.any(Number), // wordCount / 250
      tags: ['로맨스', '해피엔딩'],
      writerId: writer.id,
      userId: userId,
      createdAt: expect.any(Date),
    });

    // Verify: Moderation 호출 확인
    expect(moderationService.check).toHaveBeenCalledWith(
      expect.stringContaining(writer.systemPrompt),
    );

    // Verify: AI 호출 확인
    expect(aiService.generateStory).toHaveBeenCalledWith(
      writer.systemPrompt,
      generateDto.tags,
      userId,
    );

    // Verify: DB 저장 확인
    const saved = await prisma.story.findUnique({
      where: { id: result.id },
    });
    expect(saved).not.toBeNull();
  });
});
```

**Expected Input**:

```typescript
generateDto: GenerateStoryDto {
  writerId: string
  tags: string[] (1-3 items)
}
userId: string
```

**Expected Output**:

```typescript
StoryDto {
  id: string
  title: string
  content: string
  wordCount: number
  readTime: number // minutes (wordCount / 250)
  tags: string[]
  writerId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}
```

---

#### Test Case 44: Rate Limiting - 일일 10개 제한

```typescript
it('should throw TooManyRequestsException after 10 stories/day', async () => {
  // Given: 사용자가 오늘 이미 10개 생성
  const writer = await createMockWriter();
  const userId = 'user-1';

  // Create 10 stories today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.story.createMany({
    data: Array.from({ length: 10 }, () => ({
      ...storyData,
      userId,
      createdAt: new Date(),
    })),
  });

  const generateDto: GenerateStoryDto = {
    writerId: writer.id,
    tags: ['로맨스'],
  };

  // When & Then
  await expect(storyService.generateStory(generateDto, userId)).rejects.toThrow(
    TooManyRequestsException,
  );

  await expect(storyService.generateStory(generateDto, userId)).rejects.toThrow(
    '하루 최대 10개까지 생성 가능합니다',
  );
});
```

---

#### Test Case 45: 존재하지 않는 작가

```typescript
it('should throw NotFoundException for non-existent writer', async () => {
  // Given: 존재하지 않는 writerId
  const generateDto: GenerateStoryDto = {
    writerId: 'non-existent-writer',
    tags: ['로맨스'],
  };
  const userId = 'user-1';

  // When & Then
  await expect(storyService.generateStory(generateDto, userId)).rejects.toThrow(NotFoundException);

  await expect(storyService.generateStory(generateDto, userId)).rejects.toThrow(
    '작가를 찾을 수 없습니다',
  );
});
```

---

#### Test Case 46: Moderation 실패 시 생성 중단

```typescript
it('should not generate story if moderation fails', async () => {
  // Given: 작가 정보 + 부적절한 태그
  const writer = await createMockWriter();
  const generateDto: GenerateStoryDto = {
    writerId: writer.id,
    tags: ['부적절한태그'],
  };
  const userId = 'user-1';

  // Mock: Moderation 실패
  jest
    .spyOn(moderationService, 'check')
    .mockRejectedValue(new BadRequestException('부적절한 내용'));

  // When & Then
  await expect(storyService.generateStory(generateDto, userId)).rejects.toThrow(
    BadRequestException,
  );

  // Verify: AI 호출 안 됨
  expect(aiService.generateStory).not.toHaveBeenCalled();

  // Verify: DB 저장 안 됨
  const stories = await prisma.story.findMany({ where: { userId } });
  expect(stories).toHaveLength(0);
});
```

---

# Phase 5: Story Library

## StoryService (Library)

### `StoryService.getUserStories()`

#### Test Case 47: 사용자 소설 목록 조회 (기본)

```typescript
describe('StoryService.getUserStories', () => {
  it('should return user stories with pagination', async () => {
    // Given: user-1의 소설 15개
    const userId = 'user-1';
    await prisma.story.createMany({
      data: Array.from({ length: 15 }, (_, i) => ({
        ...storyData,
        title: `소설 ${i + 1}`,
        userId,
      })),
    });
    const filters: StoryFiltersDto = {
      page: 1,
      limit: 10,
    };

    // When
    const result = await storyService.getUserStories(userId, filters);

    // Then
    expect(result.data).toHaveLength(10);
    expect(result.meta).toEqual({
      total: 15,
      page: 1,
      limit: 10,
      totalPages: 2,
    });
    expect(result.data.every((s) => s.userId === userId)).toBe(true);
  });
});
```

**Expected Input**:

```typescript
userId: string
filters: StoryFiltersDto {
  page?: number (default: 1)
  limit?: number (default: 20, max: 50)
  search?: string
  tag?: string
  bookmarked?: boolean
  sort?: 'createdAt' | 'wordCount' | 'readTime' (default: 'createdAt')
  order?: 'asc' | 'desc' (default: 'desc')
}
```

**Expected Output**:

```typescript
PaginatedResponse<StoryDto> {
  data: StoryDto[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
```

---

#### Test Case 48: 태그 필터링

```typescript
it('should filter by tag', async () => {
  // Given: 로맨스 5개, 스릴러 3개, 판타지 4개
  const userId = 'user-1';
  await prisma.story.createMany({
    data: [
      ...Array.from({ length: 5 }, () => ({ ...storyData, userId, tags: ['로맨스', '현대물'] })),
      ...Array.from({ length: 3 }, () => ({ ...storyData, userId, tags: ['스릴러', '미스터리'] })),
      ...Array.from({ length: 4 }, () => ({ ...storyData, userId, tags: ['판타지', '모험'] })),
    ],
  });
  const filters: StoryFiltersDto = {
    page: 1,
    limit: 20,
    tag: '로맨스',
  };

  // When
  const result = await storyService.getUserStories(userId, filters);

  // Then
  expect(result.data).toHaveLength(5);
  expect(result.data.every((s) => s.tags.includes('로맨스'))).toBe(true);
});
```

---

#### Test Case 49: 검색 (제목 + 내용)

```typescript
it('should search by title and content (case-insensitive)', async () => {
  // Given: 다양한 제목과 내용의 소설
  const userId = 'user-1';
  await prisma.story.createMany({
    data: [
      { ...storyData, userId, title: '봄날의 탐정', content: '평범한 이야기...' },
      { ...storyData, userId, title: '가을의 로맨스', content: '탐정 이야기...' },
      { ...storyData, userId, title: '겨울 왕국', content: '얼음과 눈...' },
    ],
  });
  const filters: StoryFiltersDto = {
    page: 1,
    limit: 20,
    search: '탐정',
  };

  // When
  const result = await storyService.getUserStories(userId, filters);

  // Then
  expect(result.data).toHaveLength(2);
  const titles = result.data.map((s) => s.title);
  expect(titles).toEqual(expect.arrayContaining(['봄날의 탐정', '가을의 로맨스']));
});
```

---

#### Test Case 50: 북마크 필터링

```typescript
it('should filter by bookmarked stories', async () => {
  // Given: 소설 10개, 북마크 3개
  const userId = 'user-1';
  const stories = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.story.create({
        data: { ...storyData, userId, title: `소설 ${i + 1}` },
      }),
    ),
  );

  // 북마크 3개 추가
  await prisma.bookmark.createMany({
    data: [
      { userId, storyId: stories[0].id },
      { userId, storyId: stories[3].id },
      { userId, storyId: stories[7].id },
    ],
  });

  const filters: StoryFiltersDto = {
    page: 1,
    limit: 20,
    bookmarked: true,
  };

  // When
  const result = await storyService.getUserStories(userId, filters);

  // Then
  expect(result.data).toHaveLength(3);
  expect(result.data.map((s) => s.title)).toEqual(
    expect.arrayContaining(['소설 1', '소설 4', '소설 8']),
  );
});
```

---

#### Test Case 51: 정렬 (단어 수 내림차순)

```typescript
it('should sort by wordCount descending', async () => {
  // Given: 다양한 단어 수의 소설
  const userId = 'user-1';
  await prisma.story.createMany({
    data: [
      { ...storyData, userId, title: 'A', wordCount: 1500 },
      { ...storyData, userId, title: 'B', wordCount: 2000 },
      { ...storyData, userId, title: 'C', wordCount: 1200 },
      { ...storyData, userId, title: 'D', wordCount: 1800 },
    ],
  });
  const filters: StoryFiltersDto = {
    page: 1,
    limit: 20,
    sort: SortField.WORD_COUNT,
    order: SortOrder.DESC,
  };

  // When
  const result = await storyService.getUserStories(userId, filters);

  // Then
  expect(result.data.map((s) => s.title)).toEqual(['B', 'D', 'A', 'C']);
  expect(result.data.map((s) => s.wordCount)).toEqual([2000, 1800, 1500, 1200]);
});
```

---

#### Test Case 52: 복합 필터 (태그 + 검색 + 북마크)

```typescript
it('should apply multiple filters simultaneously', async () => {
  // Given: 복잡한 데이터 셋
  const userId = 'user-1';

  // 로맨스 + "봄" 포함 + 북마크: 2개
  const romance1 = await prisma.story.create({
    data: { ...storyData, userId, title: '봄날의 로맨스', tags: ['로맨스'], content: '봄...' },
  });
  const romance2 = await prisma.story.create({
    data: { ...storyData, userId, title: '봄의 사랑', tags: ['로맨스'], content: '사랑...' },
  });
  await prisma.bookmark.createMany({
    data: [
      { userId, storyId: romance1.id },
      { userId, storyId: romance2.id },
    ],
  });

  // 로맨스 + "봄" 포함 + 북마크 없음: 1개
  await prisma.story.create({
    data: { ...storyData, userId, title: '봄의 소설', tags: ['로맨스'], content: '...' },
  });

  // 로맨스 + "봄" 없음: 1개
  await prisma.story.create({
    data: { ...storyData, userId, title: '겨울 로맨스', tags: ['로맨스'], content: '...' },
  });

  // 스릴러: 1개
  await prisma.story.create({
    data: { ...storyData, userId, title: '봄의 스릴러', tags: ['스릴러'], content: '...' },
  });

  const filters: StoryFiltersDto = {
    page: 1,
    limit: 20,
    tag: '로맨스',
    search: '봄',
    bookmarked: true,
  };

  // When
  const result = await storyService.getUserStories(userId, filters);

  // Then
  expect(result.data).toHaveLength(2);
  expect(result.data.map((s) => s.title)).toEqual(
    expect.arrayContaining(['봄날의 로맨스', '봄의 사랑']),
  );
});
```

---

### `StoryService.getStoryById()`

#### Test Case 53: 소설 상세 조회 (소유자)

```typescript
describe('StoryService.getStoryById', () => {
  it('should return story detail with writer info', async () => {
    // Given: 작가 + 소설 + 북마크
    const writer = await createMockWriter();
    const story = await prisma.story.create({
      data: {
        ...storyData,
        writerId: writer.id,
        userId: 'user-1',
      },
    });
    await prisma.bookmark.create({
      data: {
        userId: 'user-1',
        storyId: story.id,
      },
    });

    // When
    const result = await storyService.getStoryById(story.id, 'user-1');

    // Then
    expect(result).toMatchObject({
      id: story.id,
      title: story.title,
      content: story.content,
      wordCount: story.wordCount,
      tags: story.tags,
      writer: {
        id: writer.id,
        name: writer.name,
        imageUrl: writer.imageUrl,
      },
      isBookmarked: true, // 북마크 존재
    });
  });
});
```

**Expected Input**:

```typescript
storyId: string;
userId: string;
```

**Expected Output**:

```typescript
StoryDetailDto {
  id: string
  title: string
  content: string
  wordCount: number
  readTime: number
  tags: string[]
  writer: {
    id: string
    name: string
    imageUrl: string | null
  }
  isBookmarked: boolean
  createdAt: Date
  updatedAt: Date
}
```

---

#### Test Case 54: 다른 사용자의 소설 조회 불가

```typescript
it('should throw ForbiddenException when accessing other user story', async () => {
  // Given: user-1의 소설
  const story = await prisma.story.create({
    data: {
      ...storyData,
      userId: 'user-1',
    },
  });

  // When & Then: user-2가 조회 시도
  await expect(storyService.getStoryById(story.id, 'user-2')).rejects.toThrow(ForbiddenException);

  await expect(storyService.getStoryById(story.id, 'user-2')).rejects.toThrow(
    '소설을 조회할 권한이 없습니다',
  );
});
```

---

### `StoryService.deleteStory()`

#### Test Case 55: 소설 삭제 (CASCADE로 북마크도 삭제)

```typescript
describe('StoryService.deleteStory', () => {
  it('should delete story and cascade bookmarks', async () => {
    // Given: 소설 + 북마크 3개
    const story = await prisma.story.create({
      data: {
        ...storyData,
        userId: 'user-1',
      },
    });
    await prisma.bookmark.createMany({
      data: [
        { userId: 'user-1', storyId: story.id },
        { userId: 'user-2', storyId: story.id },
        { userId: 'user-3', storyId: story.id },
      ],
    });

    // When
    await storyService.deleteStory(story.id, 'user-1');

    // Then: 소설 삭제 확인
    const deleted = await prisma.story.findUnique({
      where: { id: story.id },
    });
    expect(deleted).toBeNull();

    // Then: 북마크도 모두 삭제됨
    const bookmarks = await prisma.bookmark.findMany({
      where: { storyId: story.id },
    });
    expect(bookmarks).toHaveLength(0);
  });
});
```

---

#### Test Case 56: 비소유자가 삭제 시도

```typescript
it('should throw ForbiddenException when non-owner tries to delete', async () => {
  // Given: user-1의 소설
  const story = await prisma.story.create({
    data: {
      ...storyData,
      userId: 'user-1',
    },
  });

  // When & Then: user-2가 삭제 시도
  await expect(storyService.deleteStory(story.id, 'user-2')).rejects.toThrow(ForbiddenException);

  // Verify: 실제로 삭제 안 됨
  const stillExists = await prisma.story.findUnique({
    where: { id: story.id },
  });
  expect(stillExists).not.toBeNull();
});
```

---

## BookmarkService

### `BookmarkService.create()`

#### Test Case 57: 북마크 생성

```typescript
describe('BookmarkService.create', () => {
  it('should create bookmark successfully', async () => {
    // Given: 소설 존재
    const story = await prisma.story.create({
      data: {
        ...storyData,
        userId: 'user-1',
      },
    });
    const userId = 'user-2';

    // When
    const result = await bookmarkService.create(story.id, userId);

    // Then
    expect(result).toMatchObject({
      id: expect.any(String),
      storyId: story.id,
      userId: userId,
      createdAt: expect.any(Date),
    });

    // Verify: DB에 저장됨
    const saved = await prisma.bookmark.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId: story.id,
        },
      },
    });
    expect(saved).not.toBeNull();
  });
});
```

**Expected Input**:

```typescript
storyId: string;
userId: string;
```

**Expected Output**:

```typescript
BookmarkDto {
  id: string
  storyId: string
  userId: string
  createdAt: Date
}
```

---

#### Test Case 58: Idempotent 생성 (중복 북마크 시 기존 것 반환)

```typescript
it('should return existing bookmark if already exists (idempotent)', async () => {
  // Given: 이미 존재하는 북마크
  const story = await createMockStory();
  const userId = 'user-1';
  const existing = await prisma.bookmark.create({
    data: {
      userId,
      storyId: story.id,
    },
  });

  // When: 동일한 북마크 생성 시도
  const result = await bookmarkService.create(story.id, userId);

  // Then: 기존 북마크 반환 (새로 생성 안 함)
  expect(result.id).toBe(existing.id);
  expect(result.createdAt).toEqual(existing.createdAt);

  // Verify: DB에 여전히 1개만 존재
  const count = await prisma.bookmark.count({
    where: {
      userId,
      storyId: story.id,
    },
  });
  expect(count).toBe(1);
});
```

---

#### Test Case 59: 존재하지 않는 소설에 북마크 시도

```typescript
it('should throw NotFoundException for non-existent story', async () => {
  // Given: 존재하지 않는 storyId
  const nonExistentStoryId = 'non-existent-story';
  const userId = 'user-1';

  // When & Then
  await expect(bookmarkService.create(nonExistentStoryId, userId)).rejects.toThrow(
    NotFoundException,
  );

  await expect(bookmarkService.create(nonExistentStoryId, userId)).rejects.toThrow(
    '소설을 찾을 수 없습니다',
  );
});
```

---

### `BookmarkService.remove()`

#### Test Case 60: 북마크 제거

```typescript
describe('BookmarkService.remove', () => {
  it('should remove bookmark successfully', async () => {
    // Given: 북마크 존재
    const story = await createMockStory();
    const userId = 'user-1';
    await prisma.bookmark.create({
      data: {
        userId,
        storyId: story.id,
      },
    });

    // When
    await bookmarkService.remove(story.id, userId);

    // Then: 북마크 삭제 확인
    const deleted = await prisma.bookmark.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId: story.id,
        },
      },
    });
    expect(deleted).toBeNull();
  });
});
```

**Expected Input**:

```typescript
storyId: string;
userId: string;
```

**Expected Output**:

```typescript
void (삭제 성공 시 반환값 없음)
```

---

#### Test Case 61: Idempotent 삭제 (이미 없는 북마크 삭제 시도)

```typescript
it('should not throw error if bookmark does not exist (idempotent)', async () => {
  // Given: 북마크 없음
  const story = await createMockStory();
  const userId = 'user-1';

  // When & Then: 에러 없이 완료
  await expect(bookmarkService.remove(story.id, userId)).resolves.not.toThrow();
});
```

---

### `BookmarkService.getUserBookmarks()`

#### Test Case 62: 사용자 북마크 목록 조회

```typescript
describe('BookmarkService.getUserBookmarks', () => {
  it('should return user bookmarks with story details', async () => {
    // Given: 소설 5개, 북마크 3개
    const userId = 'user-1';
    const stories = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        prisma.story.create({
          data: { ...storyData, title: `소설 ${i + 1}`, userId: 'other-user' },
        }),
      ),
    );

    await prisma.bookmark.createMany({
      data: [
        { userId, storyId: stories[0].id },
        { userId, storyId: stories[2].id },
        { userId, storyId: stories[4].id },
      ],
    });

    // When
    const result = await bookmarkService.getUserBookmarks(userId);

    // Then
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      id: expect.any(String),
      storyId: stories[0].id,
      userId: userId,
      story: {
        id: stories[0].id,
        title: '소설 1',
        wordCount: expect.any(Number),
      },
    });
  });
});
```

**Expected Input**:

```typescript
userId: string;
```

**Expected Output**:

```typescript
BookmarkWithStoryDto[] {
  id: string
  storyId: string
  userId: string
  createdAt: Date
  story: {
    id: string
    title: string
    wordCount: number
    tags: string[]
  }
}[]
```

---

# Integration Tests

## Phase 3-4-5 통합 플로우

### Integration Test 1: 작가 생성 → 소설 생성 → 북마크

```typescript
describe('Integration: Writer → Story → Bookmark', () => {
  it('should complete full user journey', async () => {
    // Step 1: 작가 생성
    const writer = await writerService.create(
      {
        name: '로맨스 작가',
        systemPrompt: '당신은 로맨스 소설 전문 작가입니다...',
        description: '감성적인 이야기를 쓰는 작가',
        genre: ['로맨스', '현대물'],
        visibility: Visibility.PUBLIC,
      },
      null,
      'user-1',
    );
    expect(writer.id).toBeDefined();

    // Step 2: 소설 생성
    jest.spyOn(moderationService, 'check').mockResolvedValue();
    jest.spyOn(aiService, 'generateStory').mockResolvedValue({
      content: '...'.repeat(600),
      wordCount: 1800,
      title: '봄날의 로맨스',
    });

    const story = await storyService.generateStory(
      {
        writerId: writer.id,
        tags: ['로맨스', '해피엔딩'],
      },
      'user-1',
    );
    expect(story.id).toBeDefined();
    expect(story.writerId).toBe(writer.id);

    // Step 3: 북마크 추가
    const bookmark = await bookmarkService.create(story.id, 'user-1');
    expect(bookmark.storyId).toBe(story.id);

    // Step 4: 북마크 목록 확인
    const bookmarks = await bookmarkService.getUserBookmarks('user-1');
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].story.title).toBe('봄날의 로맨스');

    // Step 5: 작가 삭제 (CASCADE)
    await writerService.remove(writer.id, 'user-1');

    // Verify: 소설도 삭제됨
    const deletedStory = await prisma.story.findUnique({
      where: { id: story.id },
    });
    expect(deletedStory).toBeNull();

    // Verify: 북마크도 삭제됨
    const deletedBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_storyId: {
          userId: 'user-1',
          storyId: story.id,
        },
      },
    });
    expect(deletedBookmark).toBeNull();
  });
});
```

---

### Integration Test 2: 다중 작가 + 다중 소설 + 필터링

```typescript
describe('Integration: Multiple Writers & Stories with Filtering', () => {
  it('should filter stories by writer and tags', async () => {
    const userId = 'user-1';

    // Step 1: 작가 2명 생성
    const writer1 = await writerService.create(
      { ...writerData, name: '로맨스 작가', genre: ['로맨스'] },
      null,
      userId,
    );
    const writer2 = await writerService.create(
      { ...writerData, name: '스릴러 작가', genre: ['스릴러'] },
      null,
      userId,
    );

    // Step 2: 각 작가로 소설 생성
    jest.spyOn(moderationService, 'check').mockResolvedValue();
    jest.spyOn(aiService, 'generateStory').mockResolvedValue({
      content: '...'.repeat(600),
      wordCount: 1800,
      title: '생성된 소설',
    });

    // 로맨스 3개
    await Promise.all([
      storyService.generateStory({ writerId: writer1.id, tags: ['로맨스', '해피엔딩'] }, userId),
      storyService.generateStory({ writerId: writer1.id, tags: ['로맨스', '현대물'] }, userId),
      storyService.generateStory({ writerId: writer1.id, tags: ['로맨스', '판타지'] }, userId),
    ]);

    // 스릴러 2개
    await Promise.all([
      storyService.generateStory({ writerId: writer2.id, tags: ['스릴러', '미스터리'] }, userId),
      storyService.generateStory({ writerId: writer2.id, tags: ['스릴러', '느와르'] }, userId),
    ]);

    // Step 3: 필터링 테스트
    const romanceStories = await storyService.getUserStories(userId, {
      page: 1,
      limit: 20,
      tag: '로맨스',
    });
    expect(romanceStories.data).toHaveLength(3);

    const thrillerStories = await storyService.getUserStories(userId, {
      page: 1,
      limit: 20,
      tag: '스릴러',
    });
    expect(thrillerStories.data).toHaveLength(2);
  });
});
```

---

# E2E Tests

## E2E Test 1: 전체 사용자 플로우

```typescript
describe('E2E: Complete User Journey', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // 앱 초기화
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // 사용자 로그인 (Phase 2 Auth)
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'test@test.com',
      password: 'test123',
    });

    authToken = loginResponse.body.access_token;
  });

  it('should complete full user journey: Writer → Story → Bookmark', async () => {
    // Step 1: 작가 생성
    const writerResponse = await request(app.getHttpServer())
      .post('/writers')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', '로맨스 작가')
      .field('systemPrompt', '당신은 로맨스 소설 전문 작가입니다...')
      .field('description', '감성적인 작가')
      .field('genre', JSON.stringify(['로맨스', '현대물']))
      .field('visibility', 'PUBLIC');

    expect(writerResponse.status).toBe(201);
    const writerId = writerResponse.body.id;

    // Step 2: 작가 목록 조회 (공개)
    const writersResponse = await request(app.getHttpServer())
      .get('/writers')
      .query({ page: 1, limit: 20 });

    expect(writersResponse.status).toBe(200);
    expect(writersResponse.body.data.some((w) => w.id === writerId)).toBe(true);

    // Step 3: 소설 생성
    const storyResponse = await request(app.getHttpServer())
      .post('/stories/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        writerId,
        tags: ['로맨스', '해피엔딩'],
      });

    expect(storyResponse.status).toBe(201);
    expect(storyResponse.body.wordCount).toBeGreaterThanOrEqual(1500);
    const storyId = storyResponse.body.id;

    // Step 4: 소설 목록 조회
    const storiesResponse = await request(app.getHttpServer())
      .get('/stories')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 20 });

    expect(storiesResponse.status).toBe(200);
    expect(storiesResponse.body.data).toHaveLength(1);

    // Step 5: 북마크 추가
    const bookmarkResponse = await request(app.getHttpServer())
      .post(`/stories/${storyId}/bookmark`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(bookmarkResponse.status).toBe(201);

    // Step 6: 북마크 필터로 소설 조회
    const bookmarkedStoriesResponse = await request(app.getHttpServer())
      .get('/stories')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 20, bookmarked: true });

    expect(bookmarkedStoriesResponse.status).toBe(200);
    expect(bookmarkedStoriesResponse.body.data).toHaveLength(1);
    expect(bookmarkedStoriesResponse.body.data[0].id).toBe(storyId);

    // Step 7: 북마크 제거
    const removeBookmarkResponse = await request(app.getHttpServer())
      .delete(`/stories/${storyId}/bookmark`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(removeBookmarkResponse.status).toBe(204);

    // Step 8: 소설 삭제
    const deleteStoryResponse = await request(app.getHttpServer())
      .delete(`/stories/${storyId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteStoryResponse.status).toBe(204);

    // Step 9: 작가 삭제
    const deleteWriterResponse = await request(app.getHttpServer())
      .delete(`/writers/${writerId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteWriterResponse.status).toBe(204);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## E2E Test 2: Rate Limiting & Error Handling

```typescript
describe('E2E: Rate Limiting & Error Handling', () => {
  it('should enforce rate limit (10 stories/day)', async () => {
    const authToken = await getAuthToken();
    const writer = await createTestWriter(authToken);

    // Generate 10 stories
    for (let i = 0; i < 10; i++) {
      const response = await request(app.getHttpServer())
        .post('/stories/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          writerId: writer.id,
          tags: ['로맨스'],
        });

      expect(response.status).toBe(201);
    }

    // 11th story should fail
    const failResponse = await request(app.getHttpServer())
      .post('/stories/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        writerId: writer.id,
        tags: ['로맨스'],
      });

    expect(failResponse.status).toBe(429);
    expect(failResponse.body.message).toContain('하루 최대 10개');
  });
});
```

---

## 📝 Summary

### Test Coverage Goals

| Module            | Unit Tests | Integration Tests | E2E Tests | Target Coverage |
| ----------------- | ---------- | ----------------- | --------- | --------------- |
| WriterService     | 21 tests   | 2 tests           | 1 test    | 90%+            |
| FileService       | 4 tests    | -                 | -         | 85%+            |
| AIService         | 5 tests    | 2 tests           | 1 test    | 80%+            |
| ModerationService | 3 tests    | 1 test            | 1 test    | 85%+            |
| StoryService      | 16 tests   | 2 tests           | 2 tests   | 90%+            |
| BookmarkService   | 5 tests    | 1 test            | 1 test    | 90%+            |

### Total Test Cases: 62

- **Unit Tests**: 54
- **Integration Tests**: 3
- **E2E Tests**: 2

---

**Next Steps**:

1. ✅ Test Cases 완료
2. ⏭️ Fixtures (테스트 데이터) 작성
3. ⏭️ Test Strategy (Mocking 전략) 작성

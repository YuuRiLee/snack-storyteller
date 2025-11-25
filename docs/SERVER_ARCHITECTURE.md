# Server Architecture (apps/server)

> NestJS 기반 백엔드 서버 아키텍처 문서
> Last Updated: 2024-11-22 (Phase 3 완료 시점)

## 목차

1. [개요](#1-개요)
2. [모듈 구조](#2-모듈-구조)
3. [레이어드 아키텍처](#3-레이어드-아키텍처)
4. [인증 흐름](#4-인증-흐름)
5. [데이터베이스 ERD](#5-데이터베이스-erd)
6. [디렉토리 구조](#6-디렉토리-구조)
7. [의존성 그래프](#7-의존성-그래프)
8. [API 엔드포인트](#8-api-엔드포인트)

---

## 1. 개요

### 기술 스택

| 카테고리       | 기술                                |
| -------------- | ----------------------------------- |
| Framework      | NestJS                              |
| Language       | TypeScript                          |
| Database       | PostgreSQL                          |
| ORM            | Prisma                              |
| Authentication | Passport JWT + bcrypt               |
| Validation     | class-validator + class-transformer |

### 현재 구현된 모듈

- **AppModule**: 루트 모듈
- **PrismaModule**: 데이터베이스 접근 레이어 (Global)
- **AuthModule**: JWT 기반 인증 시스템
- **WriterModule**: 작가 페르소나 관리

---

## 2. 모듈 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AppModule (Root)                                │
│                                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐                    │
│  │ AppController│    │  AppService  │    │   imports    │                    │
│  │  GET /      │    │  getHello()  │    │              │                    │
│  │  GET /health│    │              │    │              │                    │
│  └─────────────┘    └──────────────┘    └──────────────┘                    │
│                                                │                             │
│         ┌──────────────────────────────────────┼──────────────────┐         │
│         │                                      │                  │         │
│         ▼                                      ▼                  ▼         │
│  ┌──────────────┐                     ┌──────────────┐    ┌──────────────┐  │
│  │ PrismaModule │                     │  AuthModule  │    │ WriterModule │  │
│  │   (Global)   │◄────────────────────│              │────│              │  │
│  └──────────────┘                     └──────────────┘    └──────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 모듈 설명

#### PrismaModule (Global)

- Prisma Client를 전역으로 제공
- 모든 서비스에서 DI를 통해 접근 가능

#### AuthModule

- JWT 토큰 발급 및 검증
- Passport 전략 (JwtStrategy)
- 사용자 등록/로그인

#### WriterModule

- 작가 페르소나 CRUD
- 검색 및 필터링
- 공개/비공개 권한 관리

---

## 3. 레이어드 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  AppController  │  │ AuthController  │  │WriterController │              │
│  │                 │  │                 │  │                 │              │
│  │  GET /         │  │ POST /login     │  │ GET /writers    │              │
│  │  GET /health   │  │ POST /register  │  │ GET /writers/my │              │
│  │                 │  │ GET /me        │  │ GET /writers/:id│              │
│  │                 │  │                 │  │ POST /writers   │              │
│  │                 │  │                 │  │ PUT /writers/:id│              │
│  │                 │  │                 │  │DELETE /writers/:id             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
├───────────┼────────────────────┼────────────────────┼────────────────────────┤
│           ▼                    ▼                    ▼                        │
│                           BUSINESS LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   AppService    │  │   AuthService   │  │  WriterService  │              │
│  │                 │  │                 │  │                 │              │
│  │  getHello()    │  │ validateUser()  │  │ findAll()       │              │
│  │                 │  │ login()        │  │ findOne()       │              │
│  │                 │  │ register()     │  │ create()        │              │
│  │                 │  │ hashPassword() │  │ update()        │              │
│  │                 │  │                 │  │ delete()        │              │
│  │                 │  │                 │  │ getGenres()     │              │
│  └─────────────────┘  └────────┬────────┘  └────────┬────────┘              │
│                                │                    │                        │
├────────────────────────────────┼────────────────────┼────────────────────────┤
│                                ▼                    ▼                        │
│                           DATA ACCESS LAYER                                  │
│                      ┌─────────────────────────────────┐                     │
│                      │        PrismaService            │                     │
│                      │                                 │                     │
│                      │  - extends PrismaClient         │                     │
│                      │  - onModuleInit()               │                     │
│                      │  - $connect()                   │                     │
│                      └────────────────┬────────────────┘                     │
│                                       │                                      │
├───────────────────────────────────────┼──────────────────────────────────────┤
│                                       ▼                                      │
│                              DATABASE LAYER                                  │
│                      ┌─────────────────────────────────┐                     │
│                      │         PostgreSQL              │                     │
│                      │                                 │                     │
│                      │  User | Writer | Story | Bookmark                     │
│                      └─────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 레이어 책임

| Layer        | 책임                           | 구성요소          |
| ------------ | ------------------------------ | ----------------- |
| Presentation | HTTP 요청/응답 처리, 입력 검증 | Controllers, DTOs |
| Business     | 비즈니스 로직, 트랜잭션        | Services          |
| Data Access  | 데이터베이스 연결 및 쿼리      | PrismaService     |
| Database     | 데이터 영속성                  | PostgreSQL        |

---

## 4. 인증 흐름

### 로그인 시퀀스

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Client  │────▶│AuthController│────▶│ AuthService │────▶│PrismaService │
└──────────┘     └──────────────┘     └─────────────┘     └──────────────┘
     │                  │                    │                    │
     │   POST /login    │                    │                    │
     │─────────────────▶│  validateUser()    │                    │
     │                  │───────────────────▶│  findUnique()      │
     │                  │                    │───────────────────▶│
     │                  │                    │◀───────────────────│
     │                  │◀───────────────────│                    │
     │                  │                    │                    │
     │                  │    JwtService      │                    │
     │                  │   ┌─────────┐      │                    │
     │                  │──▶│  sign() │      │                    │
     │                  │   └─────────┘      │                    │
     │◀─────────────────│                    │                    │
     │  { access_token }│                    │                    │
```

### 인증된 요청 시퀀스

```
┌──────────┐     ┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│  Client  │────▶│JwtAuthGuard │────▶│  JwtStrategy  │────▶│  Controller  │
└──────────┘     └─────────────┘     └───────────────┘     └──────────────┘
     │                  │                    │                    │
     │  Authorization:  │                    │                    │
     │  Bearer <token>  │                    │                    │
     │─────────────────▶│  canActivate()     │                    │
     │                  │───────────────────▶│  validate()        │
     │                  │                    │───────────────────▶│
     │                  │                    │     @CurrentUser() │
     │                  │                    │◀───────────────────│
     │                  │◀───────────────────│                    │
     │◀─────────────────────────────────────────────────────────│
     │                  Response                                  │
```

### JWT 토큰 구조

```json
{
  "sub": "user_cuid",
  "email": "user@example.com",
  "iat": 1700000000,
  "exp": 1700086400
}
```

---

## 5. 데이터베이스 ERD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │      User        │         │      Writer      │                          │
│  ├──────────────────┤         ├──────────────────┤                          │
│  │ id: String (PK)  │◄───────┐│ id: String (PK)  │                          │
│  │ email: String    │   1:N  ││ name: String     │                          │
│  │ name: String     │        ││ description: Text│                          │
│  │ password: String │        ││ systemPrompt:Text│                          │
│  │ createdAt: Date  │        ││ imageUrl: String?│                          │
│  │ updatedAt: Date  │        ││ genre: String[]  │                          │
│  └────────┬─────────┘        ││ isPublic: Bool   │                          │
│           │                  │├──────────────────┤                          │
│           │                  └│ userId: String(FK)│                          │
│           │                   │ createdAt: Date  │                          │
│           │                   │ updatedAt: Date  │                          │
│           │                   └────────┬─────────┘                          │
│           │                            │                                     │
│           │ 1:N                        │ 1:N                                 │
│           │                            │                                     │
│           ▼                            ▼                                     │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │     Bookmark     │◄────────│      Story       │                          │
│  ├──────────────────┤   1:N   ├──────────────────┤                          │
│  │ id: String (PK)  │         │ id: String (PK)  │                          │
│  │ userId: String(FK)│         │ title: String    │                          │
│  │ storyId: String(FK)        │ content: Text    │                          │
│  │ createdAt: Date  │         │ tags: String[]   │                          │
│  └──────────────────┘         │ wordCount: Int   │                          │
│                               │ readTime: Int    │                          │
│                               ├──────────────────┤                          │
│                               │ writerId: String(FK)                        │
│                               │ userId: String(FK)│                          │
│                               │ isPublic: Bool   │                          │
│                               │ createdAt: Date  │                          │
│                               │ updatedAt: Date  │                          │
│                               └──────────────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 테이블 상세

#### User

| Column    | Type     | Constraints    | Description |
| --------- | -------- | -------------- | ----------- |
| id        | String   | PK, cuid()     | 사용자 ID   |
| email     | String   | UNIQUE         | 이메일      |
| name      | String   | -              | 이름        |
| password  | String   | -              | bcrypt 해시 |
| createdAt | DateTime | default(now()) | 생성일      |
| updatedAt | DateTime | @updatedAt     | 수정일      |

#### Writer

| Column       | Type     | Constraints    | Description        |
| ------------ | -------- | -------------- | ------------------ |
| id           | String   | PK, cuid()     | 작가 ID            |
| name         | String   | -              | 작가명             |
| description  | Text     | -              | 설명               |
| systemPrompt | Text     | -              | AI 시스템 프롬프트 |
| imageUrl     | String   | nullable       | 프로필 이미지      |
| genre        | String[] | -              | 장르 목록          |
| isPublic     | Boolean  | default(true)  | 공개 여부          |
| userId       | String   | FK → User      | 소유자             |
| createdAt    | DateTime | default(now()) | 생성일             |
| updatedAt    | DateTime | @updatedAt     | 수정일             |

#### Story (Phase 4)

| Column    | Type     | Constraints    | Description   |
| --------- | -------- | -------------- | ------------- |
| id        | String   | PK, cuid()     | 스토리 ID     |
| title     | String   | -              | 제목          |
| content   | Text     | -              | 본문          |
| tags      | String[] | -              | 태그 목록     |
| wordCount | Int      | -              | 단어 수       |
| readTime  | Int      | -              | 읽기 시간(분) |
| writerId  | String   | FK → Writer    | 작가          |
| userId    | String   | FK → User      | 소유자        |
| isPublic  | Boolean  | default(false) | 공개 여부     |

#### Bookmark (Phase 5)

| Column    | Type     | Constraints    | Description |
| --------- | -------- | -------------- | ----------- |
| id        | String   | PK, cuid()     | 북마크 ID   |
| userId    | String   | FK → User      | 사용자      |
| storyId   | String   | FK → Story     | 스토리      |
| createdAt | DateTime | default(now()) | 생성일      |

---

## 6. 디렉토리 구조

```
apps/server/
├── src/
│   ├── main.ts                     # 애플리케이션 진입점
│   ├── app.module.ts               # 루트 모듈
│   ├── app.controller.ts           # 기본 컨트롤러
│   ├── app.service.ts              # 기본 서비스
│   │
│   ├── prisma/                     # 데이터베이스 레이어
│   │   ├── prisma.module.ts        # Global 모듈
│   │   └── prisma.service.ts       # Prisma Client 확장
│   │
│   ├── auth/                       # 인증 모듈
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts      # POST /login, /register
│   │   ├── auth.service.ts         # JWT 발급, 비밀번호 검증
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts     # Passport JWT 전략
│   │   └── types/
│   │       └── user.type.ts
│   │
│   ├── writer/                     # 작가 관리 모듈
│   │   ├── writer.module.ts
│   │   ├── writer.controller.ts    # CRUD API
│   │   ├── writer.service.ts       # 비즈니스 로직
│   │   └── dto/
│   │       ├── create-writer.dto.ts
│   │       ├── update-writer.dto.ts
│   │       └── search-writer.dto.ts
│   │
│   └── common/                     # 공통 유틸리티
│       ├── guards/
│       │   └── jwt-auth.guard.ts   # JWT 인증 가드
│       └── decorators/
│           └── current-user.decorator.ts
│
├── prisma/
│   ├── schema.prisma               # 데이터베이스 스키마
│   └── seed.ts                     # 시드 데이터
│
├── test/                           # E2E 테스트
├── nest-cli.json                   # NestJS CLI 설정
├── tsconfig.json                   # TypeScript 설정
└── package.json                    # 의존성 관리
```

---

## 7. 의존성 그래프

```
                    ┌─────────────────────────────────────┐
                    │           External Deps             │
                    │  ┌─────────┐ ┌─────────┐ ┌───────┐  │
                    │  │@nestjs/*│ │passport │ │bcrypt │  │
                    │  └────┬────┘ └────┬────┘ └───┬───┘  │
                    │       │           │          │      │
                    └───────┼───────────┼──────────┼──────┘
                            │           │          │
                            ▼           ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AppModule                                       │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                         PrismaModule (Global)                       │    │
│   │   ┌──────────────┐                                                 │    │
│   │   │PrismaService │◄─────────────────────────────────────┐          │    │
│   │   └──────────────┘                                      │          │    │
│   └─────────────────────────────────────────────────────────┼──────────┘    │
│                                                              │               │
│   ┌─────────────────────────────────────────────────────────┼──────────┐    │
│   │                         AuthModule                       │          │    │
│   │   ┌──────────────┐    ┌─────────────┐                   │          │    │
│   │   │AuthController│───▶│ AuthService │───────────────────┘          │    │
│   │   └──────────────┘    └──────┬──────┘                              │    │
│   │                              │                                      │    │
│   │   ┌──────────────┐    ┌──────┴──────┐    ┌─────────────┐           │    │
│   │   │ JwtStrategy  │◄───│  JwtModule  │───▶│ JwtService  │           │    │
│   │   └──────────────┘    └─────────────┘    └─────────────┘           │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                        WriterModule                                  │    │
│   │   ┌───────────────┐    ┌──────────────┐                             │    │
│   │   │WriterController│───▶│WriterService │────▶ PrismaService          │    │
│   │   └───────────────┘    └──────────────┘                             │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 주요 의존성 패키지

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-express": "^11.0.1",
    "@prisma/client": "^6.6.0",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1"
  }
}
```

---

## 8. API 엔드포인트

### 전체 API 목록

| Method | Endpoint          | Auth | Module | Description    |
| ------ | ----------------- | :--: | ------ | -------------- |
| GET    | `/`               |  -   | App    | 서버 상태 확인 |
| POST   | `/auth/register`  |  -   | Auth   | 회원가입       |
| POST   | `/auth/login`     |  -   | Auth   | 로그인         |
| GET    | `/auth/me`        |  ✅  | Auth   | 내 정보 조회   |
| GET    | `/writers`        |  -   | Writer | 공개 작가 목록 |
| GET    | `/writers/my`     |  ✅  | Writer | 내 작가 목록   |
| GET    | `/writers/genres` |  -   | Writer | 장르 목록      |
| GET    | `/writers/:id`    |  -   | Writer | 작가 상세      |
| POST   | `/writers`        |  ✅  | Writer | 작가 생성      |
| PUT    | `/writers/:id`    |  ✅  | Writer | 작가 수정      |
| DELETE | `/writers/:id`    |  ✅  | Writer | 작가 삭제      |

### API 상세

#### Auth API

**POST /auth/register**

```typescript
// Request
{
  "email": "user@example.com",
  "name": "홍길동",
  "password": "password123"
}

// Response (201)
{
  "id": "clxx...",
  "email": "user@example.com",
  "name": "홍길동",
  "createdAt": "2024-11-22T..."
}
```

**POST /auth/login**

```typescript
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response (200)
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clxx...",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

#### Writer API

**GET /writers**

```typescript
// Query Parameters
{
  "q": "검색어",        // 선택
  "genre": "판타지",    // 선택
  "page": 1,           // 선택, 기본값 1
  "limit": 12          // 선택, 기본값 12
}

// Response (200)
{
  "data": [
    {
      "id": "clxx...",
      "name": "김작가",
      "description": "판타지 전문 작가",
      "systemPrompt": "...",
      "imageUrl": "https://...",
      "genre": ["판타지", "모험"],
      "isPublic": true,
      "userId": "clxx...",
      "user": { "id": "...", "name": "..." },
      "_count": { "stories": 5 }
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 12,
    "totalPages": 9
  }
}
```

**POST /writers**

```typescript
// Headers
Authorization: Bearer <token>

// Request
{
  "name": "새 작가",
  "description": "작가 설명",
  "systemPrompt": "AI 시스템 프롬프트",
  "genre": ["로맨스", "드라마"],
  "imageUrl": "https://...",  // 선택
  "isPublic": true            // 선택, 기본값 true
}

// Response (201)
{
  "id": "clxx...",
  "name": "새 작가",
  ...
}
```

---

## 향후 확장 계획

### Phase 4: Story Generation

- `StoryModule` 추가
- OpenAI GPT-4 통합
- SSE 스트리밍 응답

### Phase 5: Library & Bookmarks

- `BookmarkModule` 추가
- 소설 라이브러리 관리
- 검색 및 필터링

---

## 참고 자료

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Passport JWT Strategy](https://www.passportjs.org/packages/passport-jwt/)

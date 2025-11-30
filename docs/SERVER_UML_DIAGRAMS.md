# Server UML Diagrams

> NestJS 백엔드 서버 UML 다이어그램 (Mermaid)
> Phase 3 완료 시점 기준

---

## 1. 모듈 구조 (Component Diagram)

```mermaid
graph TB
    subgraph AppModule["🏠 AppModule (Root)"]
        AC[AppController]
        AS[AppService]
    end

    subgraph PrismaModule["💾 PrismaModule (Global)"]
        PS[PrismaService]
    end

    subgraph AuthModule["🔐 AuthModule"]
        AuC[AuthController]
        AuS[AuthService]
        JS[JwtStrategy]
        JM[JwtModule]
    end

    subgraph WriterModule["✍️ WriterModule"]
        WC[WriterController]
        WS[WriterService]
    end

    subgraph Common["🔧 Common"]
        JAG[JwtAuthGuard]
        CUD[@CurrentUser]
    end

    AppModule --> PrismaModule
    AppModule --> AuthModule
    AppModule --> WriterModule

    AuC --> AuS
    AuS --> PS
    AuS --> JM
    JS --> JM

    WC --> WS
    WS --> PS
    WC --> JAG
    WC --> CUD

    JAG --> JS
```

---

## 2. 레이어드 아키텍처 (Layered Architecture)

```mermaid
graph TB
    subgraph Presentation["📱 Presentation Layer"]
        C1[AppController]
        C2[AuthController]
        C3[WriterController]
        DTO[DTOs]
    end

    subgraph Business["⚙️ Business Layer"]
        S1[AppService]
        S2[AuthService]
        S3[WriterService]
    end

    subgraph DataAccess["💿 Data Access Layer"]
        PS[PrismaService]
    end

    subgraph Database["🗄️ Database Layer"]
        PG[(PostgreSQL)]
    end

    C1 --> S1
    C2 --> S2
    C3 --> S3

    S2 --> PS
    S3 --> PS

    PS --> PG

    style Presentation fill:#e1f5fe
    style Business fill:#fff3e0
    style DataAccess fill:#f3e5f5
    style Database fill:#e8f5e9
```

---

## 3. 인증 시퀀스 (Login Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant AuthController
    participant AuthService
    participant PrismaService
    participant JwtService
    participant Database

    Client->>AuthController: POST /auth/login
    Note over Client,AuthController: { email, password }

    AuthController->>AuthService: validateUser(email, password)
    AuthService->>PrismaService: findUnique({ email })
    PrismaService->>Database: SELECT * FROM User
    Database-->>PrismaService: User record
    PrismaService-->>AuthService: User | null

    alt User not found
        AuthService-->>AuthController: UnauthorizedException
        AuthController-->>Client: 401 Unauthorized
    else User found
        AuthService->>AuthService: bcrypt.compare(password, hash)
        alt Password invalid
            AuthService-->>AuthController: UnauthorizedException
            AuthController-->>Client: 401 Unauthorized
        else Password valid
            AuthService->>JwtService: sign({ sub: userId, email })
            JwtService-->>AuthService: JWT Token
            AuthService-->>AuthController: { access_token, user }
            AuthController-->>Client: 200 OK + Token
        end
    end
```

---

## 4. 인증된 요청 시퀀스 (Protected Route Sequence)

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant JwtAuthGuard
    participant JwtStrategy
    participant Controller
    participant Service
    participant Database

    Client->>JwtAuthGuard: Request + Authorization Header
    Note over Client,JwtAuthGuard: Bearer eyJhbGciOiJI...

    JwtAuthGuard->>JwtStrategy: canActivate()
    JwtStrategy->>JwtStrategy: validate(payload)

    alt Token Invalid/Expired
        JwtStrategy-->>JwtAuthGuard: UnauthorizedException
        JwtAuthGuard-->>Client: 401 Unauthorized
    else Token Valid
        JwtStrategy-->>JwtAuthGuard: User payload
        JwtAuthGuard->>Controller: Request + @CurrentUser
        Controller->>Service: Business Logic
        Service->>Database: Query
        Database-->>Service: Result
        Service-->>Controller: Response Data
        Controller-->>Client: 200 OK + Data
    end
```

---

## 5. 데이터베이스 ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    User ||--o{ Writer : creates
    User ||--o{ Story : owns
    User ||--o{ Bookmark : has
    Writer ||--o{ Story : generates
    Story ||--o{ Bookmark : bookmarked

    User {
        string id PK "cuid()"
        string email UK "unique"
        string name
        string password "bcrypt hash"
        datetime createdAt
        datetime updatedAt
    }

    Writer {
        string id PK "cuid()"
        string name
        text description
        text systemPrompt "AI persona"
        string imageUrl "nullable"
        array genre "string[]"
        boolean isPublic "default: true"
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    Story {
        string id PK "cuid()"
        string title
        text content
        array tags "string[]"
        int wordCount
        int readTime "minutes"
        string writerId FK
        string userId FK
        boolean isPublic "default: false"
        datetime createdAt
        datetime updatedAt
    }

    Bookmark {
        string id PK "cuid()"
        string userId FK
        string storyId FK
        datetime createdAt
    }
```

---

## 6. 클래스 다이어그램 (Class Diagram)

```mermaid
classDiagram
    class AppModule {
        +imports: Module[]
        +controllers: Controller[]
        +providers: Provider[]
    }

    class PrismaService {
        +$connect() void
        +onModuleInit() void
        +user: UserDelegate
        +writer: WriterDelegate
        +story: StoryDelegate
        +bookmark: BookmarkDelegate
    }

    class AuthService {
        -prisma: PrismaService
        -jwtService: JwtService
        +validateUser(email, password) User
        +login(dto) AuthResponse
        +register(dto) User
        -hashPassword(password) string
    }

    class AuthController {
        -authService: AuthService
        +login(dto) AuthResponse
        +register(dto) User
        +getMe(user) User
    }

    class WriterService {
        -prisma: PrismaService
        +findAll(userId, params) PaginatedResponse
        +findMyWriters(userId, params) PaginatedResponse
        +findOne(id) Writer
        +create(userId, dto) Writer
        +update(id, userId, dto) Writer
        +delete(id, userId) void
        +getGenres() string[]
    }

    class WriterController {
        -writerService: WriterService
        +findAll(query, user) PaginatedResponse
        +findMyWriters(query, user) PaginatedResponse
        +findOne(id) Writer
        +create(dto, user) Writer
        +update(id, dto, user) Writer
        +delete(id, user) void
        +getGenres() string[]
    }

    class JwtAuthGuard {
        +canActivate(context) boolean
    }

    class JwtStrategy {
        +validate(payload) User
    }

    AppModule --> PrismaService
    AppModule --> AuthService
    AppModule --> WriterService

    AuthController --> AuthService
    AuthService --> PrismaService

    WriterController --> WriterService
    WriterController --> JwtAuthGuard
    WriterService --> PrismaService

    JwtAuthGuard --> JwtStrategy
```

---

## 7. API 흐름 다이어그램 (Writer CRUD)

```mermaid
flowchart LR
    subgraph Client["👤 Client"]
        REQ[HTTP Request]
    end

    subgraph Guards["🛡️ Guards"]
        JAG{JwtAuthGuard}
    end

    subgraph Controller["📡 WriterController"]
        GET_ALL[GET /writers]
        GET_MY[GET /writers/my]
        GET_ONE[GET /writers/:id]
        POST[POST /writers]
        PUT[PUT /writers/:id]
        DELETE[DELETE /writers/:id]
    end

    subgraph Service["⚙️ WriterService"]
        FIND_ALL[findAll]
        FIND_MY[findMyWriters]
        FIND_ONE[findOne]
        CREATE[create]
        UPDATE[update]
        DEL[delete]
    end

    subgraph DB["💾 Database"]
        PRISMA[(Prisma)]
    end

    REQ --> GET_ALL
    REQ --> GET_MY
    REQ --> GET_ONE
    REQ --> POST
    REQ --> PUT
    REQ --> DELETE

    GET_MY --> JAG
    POST --> JAG
    PUT --> JAG
    DELETE --> JAG

    JAG -->|Authorized| FIND_MY
    JAG -->|Authorized| CREATE
    JAG -->|Authorized| UPDATE
    JAG -->|Authorized| DEL

    GET_ALL --> FIND_ALL
    GET_ONE --> FIND_ONE

    FIND_ALL --> PRISMA
    FIND_MY --> PRISMA
    FIND_ONE --> PRISMA
    CREATE --> PRISMA
    UPDATE --> PRISMA
    DEL --> PRISMA
```

---

## 8. 상태 다이어그램 (Authentication State)

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Registering: POST /auth/register
    Registering --> Unauthenticated: Success (need login)
    Registering --> Unauthenticated: Error

    Unauthenticated --> Authenticating: POST /auth/login
    Authenticating --> Authenticated: Valid credentials
    Authenticating --> Unauthenticated: Invalid credentials

    Authenticated --> Authenticated: Valid token request
    Authenticated --> TokenExpired: Token expires (24h)

    TokenExpired --> Authenticating: Re-login
    TokenExpired --> Unauthenticated: Session end

    Authenticated --> Unauthenticated: Logout

    note right of Authenticated
        User can access:
        - GET /writers/my
        - POST /writers
        - PUT /writers/:id
        - DELETE /writers/:id
    end note
```

---

## 9. 패키지 다이어그램 (Package Structure)

```mermaid
graph TB
    subgraph src["📁 src/"]
        main[main.ts]
        appModule[app.module.ts]

        subgraph prisma["📁 prisma/"]
            prismaModule[prisma.module.ts]
            prismaService[prisma.service.ts]
        end

        subgraph auth["📁 auth/"]
            authModule[auth.module.ts]
            authController[auth.controller.ts]
            authService[auth.service.ts]

            subgraph authDto["📁 dto/"]
                loginDto[login.dto.ts]
                registerDto[register.dto.ts]
            end

            subgraph strategies["📁 strategies/"]
                jwtStrategy[jwt.strategy.ts]
            end
        end

        subgraph writer["📁 writer/"]
            writerModule[writer.module.ts]
            writerController[writer.controller.ts]
            writerService[writer.service.ts]

            subgraph writerDto["📁 dto/"]
                createWriterDto[create-writer.dto.ts]
                updateWriterDto[update-writer.dto.ts]
                searchWriterDto[search-writer.dto.ts]
            end
        end

        subgraph common["📁 common/"]
            subgraph guards["📁 guards/"]
                jwtAuthGuard[jwt-auth.guard.ts]
            end
            subgraph decorators["📁 decorators/"]
                currentUser[current-user.decorator.ts]
            end
        end
    end

    main --> appModule
    appModule --> prismaModule
    appModule --> authModule
    appModule --> writerModule
```

---

## 10. 배포 다이어그램 (Deployment - 계획)

```mermaid
graph TB
    subgraph Client["🌐 Client"]
        Browser[Web Browser]
        Mobile[Mobile App]
    end

    subgraph CDN["☁️ CDN"]
        CF[Cloudflare]
    end

    subgraph Frontend["📱 Frontend"]
        Vercel[Vercel]
        React[React App]
    end

    subgraph Backend["⚙️ Backend"]
        Railway[Railway/Render]
        NestJS[NestJS Server]
    end

    subgraph Database["🗄️ Database"]
        Postgres[(PostgreSQL)]
    end

    subgraph External["🔌 External Services"]
        OpenAI[OpenAI API]
        S3[AWS S3]
    end

    Browser --> CF
    Mobile --> CF
    CF --> Vercel
    Vercel --> React
    React --> NestJS
    NestJS --> Postgres
    NestJS --> OpenAI
    NestJS --> S3
```

---

## 사용 방법

이 문서의 다이어그램은 [Mermaid](https://mermaid.js.org/) 문법으로 작성되었습니다.

- **GitHub**: 자동으로 렌더링됩니다
- **VS Code**: [Mermaid Preview](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) 확장 설치
- **로컬**: [Mermaid Live Editor](https://mermaid.live/) 사용

---

## 참고

- [Mermaid Documentation](https://mermaid.js.org/intro/)
- [NestJS Architecture](https://docs.nestjs.com/fundamentals/lifecycle-events)
- [Prisma Schema](https://www.prisma.io/docs/concepts/components/prisma-schema)

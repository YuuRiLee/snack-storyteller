# 🎭 Snack Storyteller - AI 단편 소설 생성 플랫폼

> **Portfolio Project**: AI 개발자 전향을 위한 실전 프로젝트
> **핵심 역량**: AI API 통합 · 프롬프트 엔지니어링 · 풀스택 개발

AI 작가 페르소나를 선택하고 스타일을 조합하여 나만의 단편 소설을 생성하는 플랫폼입니다.

---

## 🎯 프로젝트 목적

**AI 개발자로 전향하기 위한 포트폴리오 프로젝트**

### 포트폴리오 강점
- ✅ **완성도 높은 풀스택 프로젝트** (1-2주 완성 가능)
- ✅ **최신 AI 기술 실전 활용** (OpenAI GPT-4, Claude API)
- ✅ **프롬프트 엔지니어링** 전문성 입증
- ✅ **확장 가능한 아키텍처** 설계 (모노레포, Docker)
- ✅ **현대적 기술 스택** (React 18, NestJS, Prisma)

### 주요 AI 활용 사례
- 🤖 **작가 페르소나 시스템**: SystemPrompt를 통한 AI 캐릭터 구현
- 🎨 **스타일 조합 엔진**: 장르/분위기/결말 태그 기반 프롬프트 생성
- 📝 **고품질 소설 생성**: Temperature, Penalty 파라미터 튜닝
- 🔄 **폴백 전략**: OpenAI → Claude 자동 전환

---

## 🏗️ 아키텍처

```
snack-storyteller/
├── apps/
│   ├── web/                 # React 18 + Vite + TypeScript
│   │   ├── src/
│   │   │   ├── components/  # shadcn/ui 컴포넌트
│   │   │   ├── pages/       # Generate, Library, StoryRead
│   │   │   ├── stores/      # Zustand 상태 관리
│   │   │   └── services/    # API 클라이언트
│   │   └── package.json
│   │
│   └── server/             # NestJS 백엔드
│       ├── src/
│       │   ├── ai/         # AI 서비스 (OpenAI, Claude)
│       │   ├── story/      # 스토리 생성 로직
│       │   ├── writer/     # 작가 페르소나 관리
│       │   ├── auth/       # JWT 인증
│       │   └── prisma/     # Prisma ORM
│       └── package.json
│
├── packages/
│   ├── ui/                 # shadcn/ui 공유 컴포넌트
│   ├── types/              # TypeScript 타입 정의
│   └── utils/              # 유틸리티 함수
│
├── docker-compose.yml      # PostgreSQL 개발 환경
├── pnpm-workspace.yaml     # 모노레포 설정
└── CLAUDE.md               # 개발 가이드라인
```

---

## 🚀 기술 스택

### Frontend
- **React 18** + **TypeScript** + **Vite** - 최신 프론트엔드 스택
- **shadcn/ui** + **TailwindCSS** - 모던 UI 컴포넌트
- **TanStack Query** - 서버 상태 관리
- **Zustand** - 클라이언트 상태 관리
- **React Router v6** - SPA 라우팅

### Backend
- **NestJS** + **TypeScript** - 확장 가능한 백엔드 프레임워크
- **Prisma ORM** - 타입 안전한 데이터베이스 쿼리
- **PostgreSQL** - 관계형 데이터베이스
- **Passport JWT** - 인증 시스템
- **class-validator** - DTO 유효성 검증

### AI Integration
- **OpenAI GPT-4** - 주요 소설 생성 엔진
- **Anthropic Claude** - 폴백 AI 제공자
- **Prompt Engineering** - 스타일 기반 프롬프트 생성

### Infrastructure
- **Docker** + **docker-compose** - 컨테이너 환경
- **pnpm workspaces** - 모노레포 관리
- **Vercel** (Frontend) + **Railway** (Backend) - 배포 (예정)

---

## 📊 데이터베이스 스키마

### Writer (작가 페르소나)
```prisma
model Writer {
  id           String    @id @default(cuid())
  name         String    // "하드보일드 작가", "로맨스 소설가"
  systemPrompt String    @db.Text // AI 작가 스타일 정의
  imageUrl     String?
  description  String    @db.Text
  genre        String[]  // ["느와르", "스릴러"]
  visibility   Visibility @default(PUBLIC)
  ownerId      String?

  stories      Story[]
  owner        User?     @relation(fields: [ownerId], references: [id])
}
```

### Story (생성된 소설)
```prisma
model Story {
  id          String   @id @default(cuid())
  title       String   // AI 생성 제목
  content     String   @db.Text // 완성된 소설 본문
  tags        String[] // ["느와르", "로맨스", "반전"]
  wordCount   Int
  readTime    Int      // 예상 읽기 시간 (분)

  writerId    String
  userId      String
  isPublic    Boolean  @default(false)

  writer      Writer   @relation(fields: [writerId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  bookmarks   Bookmark[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### StyleTag (스타일 태그)
```prisma
model StyleTag {
  id          String      @id @default(cuid())
  name        String      @unique // "느와르", "로맨스"
  category    TagCategory // GENRE, MOOD, ENDING
  description String
  emoji       String      // "🕵️", "💖"
  prompt      String      @db.Text // AI 프롬프트 힌트
}

enum TagCategory {
  GENRE      // 장르: 느와르, 로맨스, SF, 판타지
  MOOD       // 분위기: 우울한, 경쾌한, 긴장감
  ENDING     // 결말: 해피엔딩, 반전, 열린결말
}
```

---

## 🎯 핵심 기능

### 1️⃣ 작가 페르소나 시스템 (Phase 3)
- 다양한 AI 작가 스타일 생성 및 관리
- SystemPrompt를 통한 작가 개성 정의
- 공개/비공개 작가 공유 시스템

### 2️⃣ AI 소설 생성 (Phase 4) ⭐
- **스타일 조합**: 장르 + 분위기 + 결말 (최대 3개 선택)
- **프롬프트 엔지니어링**: 작가 페르소나 + 스타일 태그 → 완성된 프롬프트
- **고급 파라미터 튜닝**:
  - Temperature: 0.9 (높은 창의성)
  - Presence Penalty: 0.6 (다양성 증가)
  - Frequency Penalty: 0.3 (반복 감소)
- **자동 제목 생성**: AI가 소설 내용 기반 제목 생성
- **메타데이터 계산**: 단어 수, 예상 읽기 시간

### 3️⃣ 소설 라이브러리 (Phase 5)
- 페이지네이션 및 필터링 (작가별, 태그별)
- 검색 기능 (제목, 내용)
- 북마크 시스템
- 몰입형 읽기 인터페이스

---

## 🛠️ 빠른 시작

### 사전 요구사항
- Node.js 18+
- pnpm 9+
- Docker & Docker Compose

### 1. 클론 및 설치
```bash
git clone https://github.com/your-username/snack-storyteller.git
cd snack-storyteller
pnpm install
```

### 2. 환경 변수 설정
```bash
# .env 파일 생성
cp apps/server/.env.example apps/server/.env

# 필수 환경 변수 설정
OPENAI_API_KEY=sk-...          # OpenAI API 키
ANTHROPIC_API_KEY=sk-ant-...   # Claude API 키 (선택)
JWT_SECRET=your-secret-key     # JWT 비밀 키
DATABASE_URL=postgresql://...   # PostgreSQL 연결 문자열
```

### 3. 데이터베이스 시작
```bash
docker-compose up -d postgres
```

### 4. 데이터베이스 스키마 적용
```bash
pnpm db:push
```

### 5. 개발 서버 시작
```bash
# 프론트엔드 + 백엔드 동시 실행
pnpm dev

# 또는 개별 실행
pnpm server:dev  # 백엔드 :3001
pnpm web:dev     # 프론트엔드 :5173
```

### 6. 브라우저 접속
```
http://localhost:5173
```

---

## 📝 개발 로드맵 (5 Phases)

### ✅ Phase 1: 프로젝트 초기화
- 모노레포 구조 설정 (pnpm workspaces)
- Docker 개발 환경 구성
- 기본 React + NestJS 앱 생성

### ✅ Phase 2: 인증 시스템
- JWT 기반 회원가입/로그인
- Passport 전략 구현
- 보호된 라우트 설정

### 🔄 Phase 3: 작가 페르소나 관리
- Writer 모델 및 API 구현
- 작가 생성/편집 UI
- SystemPrompt 편집기

### 🔄 Phase 4: AI 소설 생성 ⭐ (핵심)
- OpenAI/Claude API 통합
- 프롬프트 엔지니어링 시스템
- 스타일 태그 조합 로직
- 소설 생성 UI 및 로딩 상태

### ⏳ Phase 5: 소설 라이브러리
- 라이브러리 페이지 (필터링, 검색)
- 읽기 인터페이스
- 북마크 시스템
- 공유 기능

---

## 🎨 UI/UX 미리보기

### 메인 화면
```
┌─────────────────────────────────────┐
│  🎭 Snack Storyteller               │
├─────────────────────────────────────┤
│  ✨ 새로운 소설 생성                 │
│                                     │
│  1️⃣ 작가 선택                       │
│  [하드보일드 작가] [로맨스 작가]    │
│                                     │
│  2️⃣ 스타일 조합 (최대 3개)          │
│  장르: 🕵️ 느와르  💖 로맨스         │
│  분위기: 😢 우울한  😊 경쾌한       │
│  결말: 😱 반전  🎉 해피엔딩         │
│                                     │
│  [✨ 소설 생성하기]                  │
└─────────────────────────────────────┘
```

### 생성 중 화면
```
┌─────────────────────────────────────┐
│  하드보일드 작가가 소설을 쓰고 있어요...│
│                                     │
│  선택한 스타일: 느와르, 긴장감, 반전 │
│                                     │
│  ⏳ ▓▓▓▓▓▓▓▓▓░░░░░░░ 60%           │
│                                     │
│  잠시만 기다려주세요                 │
└─────────────────────────────────────┘
```

### 완성된 소설 읽기
```
┌─────────────────────────────────────┐
│  ← 뒤로    🔖 북마크    🔄 새로생성  │
├─────────────────────────────────────┤
│  비 오는 밤의 탐정                   │
│  by 하드보일드 작가                  │
│  🕵️ 느와르 · 😰 긴장감 · 😱 반전  │
│  1,845 단어 · 9분 읽기               │
│                                     │
│  비 오는 밤, 탐정 사무소 문을...     │
│  [소설 본문]                         │
│                                     │
└─────────────────────────────────────┘
```

---

## 🧠 AI 프롬프트 엔지니어링 예시

### SystemPrompt 구조
```typescript
// 하드보일드 작가 페르소나
const systemPrompt = `
당신은 레이몬드 챈들러 스타일의 하드보일드 소설가입니다.

특징:
- 간결하고 힘있는 문체
- 냉소적이고 현실적인 시선
- 빠른 전개와 긴장감
- 비유적 표현 (비 내리는 도시, 담배 연기)

문장 스타일:
- 짧고 강렬한 문장
- 감각적 묘사
- 직설적 대화

스토리 요소:
- 복잡한 인물 관계
- 도시의 어두운 면
- 도덕적 모호성
`;
```

### 최종 프롬프트 생성
```typescript
const buildStoryPrompt = (writerPrompt, tags) => `
${writerPrompt}

다음 스타일로 완성된 단편 소설을 작성하세요:
- 장르: 느와르 (범죄와 부패가 만연한 도시 배경)
- 분위기: 긴장감 (독자를 긴장시키는 서스펜스)
- 결말: 반전 (예상치 못한 반전 결말)

## 요구사항:
- 길이: 1,500-2,000단어
- 완전한 시작-중간-끝 구조
- 인상적인 첫 문장으로 독자 사로잡기
- 생동감 있는 캐릭터와 구체적 묘사
- 예상치 못한 전개 또는 반전
- 여운이 남는 강렬한 결말

## 주의사항:
- 메타 설명 없이 바로 소설 시작
- 제목은 포함하지 마세요 (별도 생성)
- 완결된 이야기로 작성

지금 바로 소설을 시작하세요:
`;
```

---

## 📈 성능 최적화

### API 응답 시간
- 소설 생성: ~15-30초 (GPT-4 기준)
- 작가 목록 조회: <100ms
- 소설 목록 조회: <200ms

### 프론트엔드 최적화
- React.lazy() 코드 스플리팅
- TanStack Query 캐싱
- Virtualized 무한 스크롤
- 이미지 lazy loading

### 백엔드 최적화
- Prisma 쿼리 최적화 (include, select)
- 데이터베이스 인덱싱
- 연결 풀링 (PostgreSQL)

---

## 🧪 테스트 전략

### 단위 테스트 (Jest)
```bash
pnpm test
```
- AI 서비스 로직
- 프롬프트 생성 함수
- 유틸리티 함수

### 통합 테스트
- API 엔드포인트 테스트
- 데이터베이스 트랜잭션
- 인증 플로우

### E2E 테스트 (Playwright)
- 소설 생성 플로우
- 작가 생성 플로우
- 북마크 기능

---

## 📦 배포 가이드

### 프론트엔드 (Vercel)
```bash
cd apps/web
pnpm build
vercel deploy
```

### 백엔드 (Railway)
```bash
cd apps/server
railway up
```

### 환경 변수 설정 (Production)
```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=production-secret
NODE_ENV=production
```

---

## 💼 포트폴리오 하이라이트

### 🤖 AI 통합 전문성
- ✅ OpenAI GPT-4 API 실전 활용
- ✅ Anthropic Claude API 통합 및 폴백 전략
- ✅ 프롬프트 엔지니어링 (Temperature, Penalty 튜닝)
- ✅ 컨텍스트 빌딩 및 시스템 프롬프트 설계

### 🏗️ 풀스택 아키텍처
- ✅ 모노레포 구조 (pnpm workspaces)
- ✅ TypeScript 전역 타입 안전성
- ✅ RESTful API 설계 (NestJS)
- ✅ ORM 활용 (Prisma)

### 🎨 현대적 프론트엔드
- ✅ React 18 최신 기능 활용
- ✅ 컴포넌트 기반 설계 (shadcn/ui)
- ✅ 상태 관리 전략 (Zustand + TanStack Query)
- ✅ 반응형 UI/UX

### 🔧 DevOps & 인프라
- ✅ Docker 컨테이너화
- ✅ 환경 변수 관리
- ✅ Git 버전 관리
- ✅ 배포 자동화 (Vercel + Railway)

---

## 📚 기술 문서

- [Phase 3: 작가 관리](.claude/commands/phase3-writers.md)
- [Phase 4: AI 소설 생성](.claude/commands/phase4-story-gen.md)
- [Phase 5: 소설 라이브러리](.claude/commands/phase5-library.md)
- [개발 가이드라인](CLAUDE.md)

---

## 🎓 학습 및 개선 사항

### 기술적 도전 과제
1. **프롬프트 엔지니어링**: AI 작가 페르소나를 자연스럽게 표현
2. **컨텍스트 관리**: 스타일 태그를 프롬프트로 변환
3. **성능 최적화**: 15-30초 소설 생성 시간 단축 연구
4. **에러 핸들링**: AI API 실패 시 폴백 전략

### 향후 개선 방향
- [ ] 벡터 DB (pgvector) 활용 유사 소설 추천
- [ ] 스트리밍 방식 적용 (실시간 소설 생성 표시)
- [ ] 멀티모달 (이미지 생성 통합)
- [ ] 소셜 기능 (소설 공유, 좋아요, 댓글)

---

## 📄 라이선스

MIT License

---

## 👤 개발자

**Yuri** - AI 개발자 전향 포트폴리오 프로젝트

이 프로젝트는 AI API 통합, 프롬프트 엔지니어링, 풀스택 개발 능력을 입증하기 위해 제작되었습니다.

---

**Built with ❤️ using React, NestJS, OpenAI GPT-4**

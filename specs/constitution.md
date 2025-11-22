# Project Constitution: snack-storyteller

> **SDD (Spec-Driven Development) 핵심 문서**
> AI 코딩 에이전트가 준수해야 할 프로젝트의 불변 원칙

---

## 📜 Non-Negotiable Principles

### 1. 완전한 구현 (No Placeholders)

```yaml
금지:
  - TODO 주석으로 구현 미루기
  - throw new Error('Not implemented')
  - Mock 데이터, Stub 함수
  - 미완성 기능

필수:
  - 모든 함수는 완전히 작동
  - 실제 데이터로 테스트 가능
  - 에러 핸들링 포함
```

### 2. 코드 품질

```yaml
TypeScript:
  - strict mode 필수
  - any 타입 사용 금지 (unknown 또는 구체적 타입)
  - 명시적 반환 타입

Linting:
  - ESLint 규칙 100% 준수
  - Prettier 포맷팅 자동 적용
  - 0 warnings, 0 errors

Testing:
  - Unit Test 커버리지 80% 이상
  - 주요 기능은 E2E 테스트
  - AI 생성 코드도 테스트 필수
```

### 3. 보안

```yaml
필수_적용:
  - 모든 사용자 입력 검증 (class-validator)
  - SQL Injection 방어 (Prisma ORM only)
  - XSS 방어 (sanitization)
  - Rate Limiting (AI 엔드포인트)
  - JWT 토큰 만료 (Access 15분, Refresh 7일)
  - bcrypt 해싱 (salt rounds: 12)

AI_안전성:
  - OpenAI Moderation API 필수
  - 한국어 부적절한 콘텐츠 필터
  - 사용자 신고 시스템
  - 14세 미만 가입 차단
```

### 4. 아키텍처

```yaml
Layered_Architecture:
  Controller: HTTP 요청/응답, DTO 검증
  Service: 비즈니스 로직
  Repository: 데이터 접근 (Prisma)

SOLID_원칙:
  - Single Responsibility
  - Open/Closed
  - Liskov Substitution
  - Interface Segregation
  - Dependency Inversion

Dependency_Injection:
  - NestJS IoC 컨테이너 활용
  - Constructor Injection
  - 테스트 가능한 설계
```

### 5. 성능

```yaml
Backend:
  - API 응답 시간: p95 < 500ms
  - Database 쿼리: < 100ms
  - N+1 문제 방지 (Prisma include/select)
  - 인덱싱 전략 (@@index)

Frontend:
  - First Contentful Paint: < 1.5s
  - Time to Interactive: < 3s
  - 번들 크기: < 500KB (gzipped)
  - 이미지 최적화 (WebP, lazy loading)

AI:
  - 첫 토큰 응답: < 2s
  - 소설 생성: < 30s
  - 비용: < $0.10/건
```

### 6. AI 개발 원칙

```yaml
Context7_사용:
  - 새 라이브러리 사용 전 필수 조회
  - 공식 패턴 준수
  - 코드 주석에 출처 명시

Sequential_Thinking:
  - 복잡한 설계 결정
  - 트레이드오프 분석
  - 프롬프트 엔지니어링 전략

Magic_MCP:
  - 모든 UI 컴포넌트 생성
  - shadcn/ui 기반
  - 다크 테마 기본

즉시_검증:
  - 코드 작성 후 pnpm type-check
  - API는 curl로 수동 테스트
  - 각 Task 완료 시 검증
```

### 7. 문서화

```yaml
필수_문서:
  - Public API: JSDoc 주석
  - 복잡한 로직: Inline 주석 (왜 이렇게 했는지)
  - README.md: 설치, 실행, 배포
  - CHANGELOG.md: 버전별 변경사항

SDD_문서:
  - specs/*/spec.md: 요구사항
  - specs/*/plan.md: 기술 설계
  - specs/*/tasks.md: 작업 분해
  - docs/lessons-learned.md: AI 피드백
```

---

## 🛠️ Tech Stack Constraints

### Frontend

```yaml
필수_기술:
  Framework: React 18
  Build: Vite
  Language: TypeScript (strict mode)
  UI: shadcn/ui + TailwindCSS
  State: TanStack Query + Zustand
  Router: React Router v6

금지_기술:
  - Vue, Angular
  - Create React App
  - JavaScript (TypeScript만)
  - Redux (Zustand 사용)
```

### Backend

```yaml
필수_기술:
  Framework: NestJS
  Language: TypeScript (strict mode)
  Database: PostgreSQL 16
  ORM: Prisma
  Auth: Passport JWT
  Validation: class-validator

금지_기술:
  - Express (NestJS만)
  - Mongoose, TypeORM (Prisma만)
  - Session 기반 인증 (JWT만)
```

### AI

```yaml
필수_기술:
  Primary: OpenAI GPT-4
  Fallback: Anthropic Claude 3.5
  Streaming: Server-Sent Events (SSE)
  Safety: OpenAI Moderation API

금지_기술:
  - WebSocket (SSE 사용)
  - Long Polling
```

---

## 📏 Coding Standards

### Naming Conventions

```yaml
변수_함수: camelCase
  - getUserData()
  - const userName = ...

클래스_컴포넌트: PascalCase
  - AuthService
  - LoginButton

상수: UPPER_SNAKE_CASE
  - MAX_RETRIES
  - API_BASE_URL

파일명: kebab-case
  - auth-service.ts
  - login-button.tsx

폴더명: kebab-case
  - auth/
  - user-profile/
```

### File Organization

```
apps/
  web/src/
    components/     # React 컴포넌트
    pages/          # 페이지 컴포넌트
    hooks/          # Custom hooks
    lib/            # 유틸리티 함수

  server/src/
    auth/           # 인증 모듈
    user/           # 사용자 모듈
    writer/         # 작가 모듈
    story/          # 소설 모듈
    ai/             # AI 서비스
    common/         # 공통 (filters, guards, pipes)
```

### Import Order

```typescript
// 1. 외부 라이브러리
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/client';

// 2. 내부 모듈
import { AuthService } from '@/auth/auth.service';
import { UserDto } from '@/user/dto';

// 3. 타입
import type { User } from '@/types';

// 4. 스타일 (Frontend만)
import './styles.css';
```

### Error Handling

```typescript
// Backend: Exception Filters
try {
  // 로직
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    throw new BadRequestException('Database error');
  }
  throw new InternalServerErrorException('Unexpected error');
}

// Frontend: Error Boundary + Toast
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>

// AI: Retry 로직
const retry = async (fn, options = { retries: 3, factor: 2 }) => {
  for (let i = 0; i < options.retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === options.retries - 1) throw error;
      await delay(Math.pow(options.factor, i) * 1000);
    }
  }
};
```

---

## 🚫 Prohibited Practices

### ❌ 절대 금지

```yaml
코드:
  - console.log (프로덕션)
  - any 타입
  - TODO 주석
  - 하드코딩된 URL/키
  - 동기식 DB 쿼리
  - 보안 검증 없는 사용자 입력

프로세스:
  - 테스트 없는 코드 머지
  - Constitution 위반
  - main 브랜치 직접 커밋
  - 리뷰 없는 PR 머지
```

### ⚠️ 최소화

```yaml
- 전역 상태 (필요시만 Zustand)
- 외부 의존성 (신중히 선택)
- 깊은 중첩 (3레벨 이하)
- 큰 파일 (300줄 이하 권장)
```

---

## 🎯 Performance Budget

### Frontend

```yaml
Lighthouse_Score:
  Performance: > 90
  Accessibility: > 90
  Best Practices: > 90
  SEO: > 90

Core_Web_Vitals:
  LCP: < 2.5s
  FID: < 100ms
  CLS: < 0.1
```

### Backend

```yaml
API_Latency:
  p50: < 200ms
  p95: < 500ms
  p99: < 1000ms

Database:
  Query: < 100ms
  Connection Pool: 10-20
```

### AI

```yaml
Generation:
  First Token: < 2s
  Total Time: < 30s
  Cost: < $0.10/story

Quality:
  Word Count: 1,500-2,000
  Moderation Pass Rate: > 95%
```

---

## 🔄 Git Workflow

### Branch Strategy

```yaml
main: 프로덕션 배포
develop: 개발 통합 (없으면 main 직접 사용)
feat/*: 기능 개발
fix/*: 버그 수정
docs/*: 문서 업데이트
```

### Commit Message

```yaml
Format: Conventional Commits

Types:
  feat: 새 기능
  fix: 버그 수정
  docs: 문서
  style: 포맷팅
  refactor: 리팩토링
  test: 테스트
  chore: 빌드, 설정

Examples:
  feat(auth): JWT 기반 인증 시스템 구현
  fix(story): AI 생성 시 토큰 길이 제한 해결
  docs(sdd): Phase 3 Specification 추가
```

### Pull Request

```yaml
필수_조건:
  - CI 통과 (lint, test, build)
  - 변경사항 설명 (무엇을, 왜)
  - Constitution 준수 확인

선택_사항:
  - 최소 1명 승인 (팀 프로젝트 시)
  - 스크린샷 (UI 변경 시)
```

---

## 📊 Quality Gates

### 코드 머지 전 체크리스트

```yaml
- [ ] pnpm type-check 통과
- [ ] pnpm lint 통과
- [ ] pnpm test 통과
- [ ] pnpm build 성공
- [ ] Constitution 원칙 준수
- [ ] Spec Acceptance Criteria 만족
- [ ] 수동 테스트 완료 (curl 또는 브라우저)
- [ ] LessonsLearned 업데이트 (필요 시)
```

---

## 🎓 AI Development Best Practices

### Prompt Engineering

```yaml
Few_Shot_Learning:
  - 3개 예시 제공 (각 1,800단어)
  - 스타일별 다양성
  - 명확한 패턴 학습

Parameter_Tuning:
  temperature: 0.9 (창의성)
  max_tokens: 4000 (충분한 여유)
  presence_penalty: 0.6 (다양성)
  frequency_penalty: 0.3 (반복 방지)

A/B_Testing:
  - 프롬프트 버전 관리
  - 성능 메트릭 수집
  - 점진적 개선
```

### Context Management

```yaml
Sequential_Loading:
  - Constitution 먼저
  - Specification 다음
  - LessonsLearned 항상 포함
  - Task별 컨텍스트 분리

Token_Optimization:
  - 불필요한 정보 제거
  - 구조화된 템플릿
  - 핵심 정보 우선
```

---

## 📅 Version History

```yaml
v1.0.0 (2025-01-08):
  - Initial Constitution
  - SDD 통합
  - CLAUDE.md 기반 원칙 정리
```

---

**이 Constitution은 프로젝트의 "계약서"입니다.**
**모든 AI 코딩 에이전트와 개발자는 이 원칙을 준수해야 합니다.**

**위반 시**: 코드 리뷰 거부, PR 머지 불가

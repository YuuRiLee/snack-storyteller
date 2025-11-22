# Specification: Phase 3 - Writer Management (작가 페르소나 시스템)

> **Status**: 🔄 작성 중
> **Created**: 2025-01-08
> **Priority**: P0 (Phase 4 AI 소설 생성의 핵심 전제조건)

---

## 📋 User Journey

### 주요 사용자 플로우 1: 작가 페르소나 생성

1. 사용자가 "/writers/create" 페이지 접속
2. 작가 정보 입력
   - 이름 (예: "하드보일드 탐정")
   - 소개 (예: "도시의 어둠을 파헤치는 냉소적 작가")
   - 장르 태그 선택 (최대 5개)
   - 이미지 업로드 (선택)
3. **systemPrompt 작성** ⭐ 가장 중요
   - AI 작가 스타일 정의
   - 문체, 특징, 스토리 요소 명시
   - 2,000자 이내로 상세히 작성
4. 공개 범위 선택 (PUBLIC / PRIVATE)
5. "생성하기" 버튼 클릭
6. 작가 페르소나 생성 완료
7. 작가 갤러리 또는 상세 페이지로 이동

### 주요 사용자 플로우 2: 작가 갤러리 탐색

1. 사용자가 "/writers" 페이지 접속
2. 공개 작가 목록 표시 (카드 그리드)
   - 작가 이미지, 이름, 소개, 장르 태그
   - 인기 순 / 최신 순 정렬
3. 장르별 필터링 (예: "느와르", "로맨스")
4. 검색 기능 (작가 이름 / 장르)
5. 작가 카드 클릭 → 상세 페이지 이동
6. 상세 페이지에서:
   - 작가 정보 전체 보기
   - systemPrompt 확인
   - 이 작가로 생성된 샘플 소설 (Phase 4 후)
   - "이 작가로 소설 쓰기" 버튼 (Phase 4 후)

### 주요 사용자 플로우 3: 내 작가 관리

1. 사용자가 "/my-writers" 페이지 접속
2. 본인이 생성한 작가 목록 표시
   - PUBLIC / PRIVATE 모두 표시
3. 작가 선택 → "편집" 또는 "삭제"
4. 편집 시:
   - 모든 정보 수정 가능
   - systemPrompt 개선
5. 삭제 시:
   - 확인 다이얼로그
   - 삭제 완료 (CASCADE)

---

## ✅ Success Criteria

### 기능 요구사항

- [ ] **작가 생성**: 이름, 소개, systemPrompt, 장르, 이미지, 공개범위 입력
- [ ] **작가 목록**: PUBLIC 작가 + 본인 PRIVATE 작가 조회
- [ ] **작가 상세**: 전체 정보 및 systemPrompt 확인
- [ ] **작가 편집**: 소유자만 수정 가능
- [ ] **작가 삭제**: 소유자만 삭제 가능 (CASCADE)
- [ ] **이미지 업로드**: 5MB 이하 JPG/PNG
- [ ] **검색/필터**: 이름, 장르로 검색 및 필터링
- [ ] **공개 범위**: PUBLIC/PRIVATE 작동

### 성능 요구사항

- [ ] 작가 목록 로딩: < 500ms
- [ ] 작가 생성 응답: < 1s
- [ ] 이미지 업로드: < 3s (5MB 기준)
- [ ] 검색 응답: < 300ms

### 품질 요구사항

- [ ] Unit Test 커버리지 80% 이상
- [ ] E2E Test: 작가 CRUD 플로우
- [ ] DTO 검증: class-validator
- [ ] 에러 핸들링: 모든 실패 케이스
- [ ] TypeScript strict mode

### 보안 요구사항

- [ ] 인증: JWT Guard 적용
- [ ] 권한: 소유자만 수정/삭제
- [ ] 입력 검증: 모든 필드 sanitization
- [ ] 파일 검증: MIME type, 크기, 확장자

---

## 🎯 Business Requirements

```yaml
목표:
  - AI 소설 생성의 핵심 기반 (Phase 4 전제조건)
  - 다양한 작가 스타일 제공
  - 사용자 창작 참여 (작가 페르소나 생성)
  - 커뮤니티 기반 작가 갤러리

제약사항:
  - systemPrompt는 Phase 4에서 직접 GPT-4에 전달
  - 작가 이미지 저장 공간 제한 (향후 CDN)
  - PRIVATE 작가는 소유자만 사용

우선순위:
  P0_필수:
    - CRUD API (생성, 조회, 수정, 삭제)
    - systemPrompt 필드 (핵심)
    - PUBLIC/PRIVATE 권한

  P1_중요:
    - 이미지 업로드
    - 검색/필터링
    - 작가 갤러리 UI

  P2_선택:
    - 작가 랭킹 시스템
    - 샘플 소설 미리보기 (Phase 4 후)
    - 작가 복제 기능
```

---

## 📦 Tech Stack

### Backend

```yaml
필수_라이브러리:
  - @nestjs/platform-express: 파일 업로드
  - multer: 파일 처리
  - sharp: 이미지 리사이징 (선택)

Prisma_모델:
  - Writer (작가 페르소나)
  - Visibility enum (PUBLIC/PRIVATE)

선택_이유:
  - Multer: NestJS 공식 파일 업로드 솔루션
  - Sharp: 이미지 최적화 (성능)
```

### Frontend

```yaml
필수_라이브러리:
  - react-hook-form: 폼 관리
  - zod: 스키마 검증
  - @tanstack/react-query: 서버 상태

shadcn/ui_컴포넌트:
  - Card: 작가 카드
  - Form: 작가 생성/편집 폼
  - Input: 텍스트 입력
  - Textarea: systemPrompt 에디터
  - Badge: 장르 태그
  - Dialog: 삭제 확인
  - Select: 장르 선택

선택_이유:
  - React Hook Form: 성능 최적화, 재렌더링 최소화
  - Zod: TypeScript 통합, 런타임 검증
  - TanStack Query: 캐싱, 낙관적 업데이트
```

---

## 🔐 Non-Functional Requirements

### Security

```yaml
인증:
  - 모든 쓰기 작업: JWT Guard
  - 공개 조회: 인증 불필요

권한:
  - 작가 수정: ownerId === userId
  - 작가 삭제: ownerId === userId
  - PRIVATE 조회: ownerId === userId

입력_검증:
  - 이름: 2-50자, XSS 방지
  - 소개: 10-500자
  - systemPrompt: 100-2000자 (필수)
  - 장르: 1-5개, enum 검증
  - 이미지: JPG/PNG, 5MB 이하
```

### Performance

```yaml
Database:
  - 인덱스: visibility + createdAt
  - 인덱스: ownerId
  - Pagination: 20개/페이지

Caching:
  - TanStack Query: 5분 TTL
  - 작가 목록: stale-while-revalidate

Optimization:
  - 이미지: 리사이징 (800x800)
  - 이미지: WebP 변환 (선택)
```

### Accessibility

```yaml
- ARIA labels (작가 카드, 폼)
- Keyboard navigation
- Screen reader 지원
```

---

## 🧪 Acceptance Tests

### Test Scenarios

#### Scenario 1: 작가 생성 성공

```gherkin
Given 사용자가 로그인 상태
When "/writers/create" 페이지 접속
And 이름 "하드보일드 탐정" 입력
And 소개 "도시의 어둠을 파헤치는 냉소적 작가" 입력
And systemPrompt 1,500자 입력
And 장르 ["느와르", "스릴러"] 선택
And PUBLIC 선택
And "생성하기" 클릭
Then 작가 생성 성공
And 작가 상세 페이지로 이동
```

#### Scenario 2: 권한 없는 수정 시도

```gherkin
Given 사용자 A가 작가 X 생성
And 사용자 B가 로그인
When 사용자 B가 작가 X 편집 시도
Then 403 Forbidden 응답
And "권한이 없습니다" 메시지 표시
```

#### Scenario 3: 이미지 업로드

```gherkin
Given 사용자가 작가 생성 중
When 3MB JPG 이미지 선택
And 업로드 진행
Then 프로그레스바 표시
And 업로드 완료 시 미리보기
And 작가 생성 시 imageUrl 저장
```

#### Scenario 4: 검색 및 필터링

```gherkin
Given 10개 작가 존재 (5개 느와르, 5개 로맨스)
When 장르 "느와르" 필터 선택
Then 5개 느와르 작가만 표시
When 검색어 "탐정" 입력
Then 이름에 "탐정" 포함된 작가만 표시
```

---

## 🚫 Out of Scope (Phase 3에서 하지 않음)

```yaml
- AI 소설 생성 기능 (Phase 4에서 구현)
- 작가 평가/리뷰 시스템
- 작가 팔로우 기능
- 작가 간 비교 기능
- 작가 샘플 소설 미리보기 (Phase 4 후 가능)
- 작가 추천 알고리즘
```

---

## 📝 Notes

### Assumptions

```yaml
- systemPrompt는 한국어로 작성
- 이미지는 로컬 파일 시스템 저장 (향후 S3 마이그레이션)
- 작가 수는 초기 100개 이하
- 사용자당 최대 10개 작가 생성 (향후 제한 추가 가능)
```

### Risks

```yaml
systemPrompt_품질:
  risk: 사용자가 부적절하거나 비효율적인 프롬프트 작성
  mitigation:
    - 샘플 작가 제공 (참고용)
    - systemPrompt 가이드라인 문서
    - (향후) AI 프롬프트 검증 도구

이미지_저장_공간:
  risk: 이미지 파일 증가로 디스크 공간 부족
  mitigation:
    - 5MB 제한
    - 리사이징 (800x800)
    - (향후) S3 마이그레이션

PRIVATE_작가_남용:
  risk: 사용자가 PRIVATE 작가만 생성하여 커뮤니티 기여 부족
  mitigation:
    - PUBLIC 작가 생성 시 인센티브 (향후)
    - 기본값 PUBLIC
```

### Dependencies

```yaml
Phase_2_Auth:
  - JWT 인증 시스템
  - User 모델
  - AuthGuard

Phase_4_Story_Gen:
  - Writer systemPrompt를 GPT-4에 전달
  - 작가별 스토리 생성 통계
```

---

## 🔗 References

- Constitution: `specs/constitution.md`
- Phase 2 Spec: `specs/phase2-auth/spec.md`
- Phase 3 Command: `.claude/commands/phase3-writers.md`

---

## 🎯 Key Design Decisions

### systemPrompt가 Phase 3의 핵심인 이유

```yaml
역할:
  - Phase 4에서 GPT-4의 system message로 직접 전달
  - AI 작가의 "정체성"과 "스타일" 정의
  - 소설의 품질과 일관성을 결정하는 핵심 요소

예시_효과:
  before_systemPrompt:
    - GPT-4 기본 응답: 일반적인 소설
    - 스타일 일관성 낮음

  after_systemPrompt_하드보일드:
    - '비는 도시를 적시고, 내 사무실 창문을 두드렸다.'
    - 간결하고 힘있는 문체
    - 냉소적 톤 유지

설계_원칙:
  - 충분히 상세해야 함 (100자 이상)
  - AI가 이해하기 쉬운 구조
  - 문체, 특징, 스토리 요소 명시
  - Few-shot 예시는 Phase 4에서 추가
```

---

**Next Steps**:

1. ✅ Spec 완료
2. ⏭️ Plan 작성 (plan.md) - Context7 + Sequential Thinking
3. ⏭️ Tasks 분해 (tasks.md)
4. ⏭️ Implementation

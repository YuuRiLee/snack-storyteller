# 스펙 기반 리팩토링 + 유저스토리 검증

스펙 문서를 기준으로 코드를 리팩토링하고, Playwright로 실제 유저스토리를 실행하여 검증합니다.

---

## Phase 1: 스펙-코드 Gap 분석

### 입력

- `specs/pages/README.md` (전체 서비스 개요)
- `specs/pages/auth-spec.md`
- `specs/pages/writer-spec.md`
- `specs/pages/story-spec.md`

### MCP 활용

```yaml
primary: Serena MCP
  - get_symbols_overview: 각 페이지 컴포넌트 구조 파악
  - find_symbol: 특정 함수/핸들러 분석
  - search_for_pattern: 에러 핸들링 패턴 검색

secondary: Sequential Thinking
  - 스펙 vs 코드 비교 분석
  - 개선 우선순위 결정
```

### 분석 항목

1. **누락된 기능**: 스펙에 있지만 구현 안 된 것
2. **불완전한 에러 핸들링**: catch 없는 API 호출, 빈 에러 메시지
3. **누락된 로딩 상태**: isLoading 미사용, Skeleton 없음
4. **데드 코드**: 사용되지 않는 import, 함수, 변수
5. **스펙 불일치**: 스펙과 다르게 구현된 부분

### Output

Gap 분석 결과를 TodoWrite로 작업 리스트화

---

## Phase 2: 리팩토링 실행

### 우선순위 (스펙 문서 "알려진 이슈" 기준)

#### 🔴 Critical (즉시 수정)

- 비밀번호 검증 불일치 (클라이언트 6자 → 8자)
- 인증 실패 시 적절한 리다이렉트

#### 🟡 Medium (에러/로딩 개선)

- API 호출 에러 핸들링 추가
- 로딩 상태 UI 일관성
- 네트워크 오류 fallback

#### 🟢 Low (코드 품질)

- 데드 코드 제거
- 중복 코드 통합
- 타입 안전성 강화

### MCP 활용

```yaml
primary: Serena MCP
  - replace_symbol_body: 함수/컴포넌트 수정
  - insert_after_symbol: 에러 핸들링 추가

secondary: Context7
  - React Query 에러 핸들링 패턴
  - NestJS Exception Filter 패턴
```

### 수정 후 즉시 검증

```bash
pnpm type-check
pnpm lint
pnpm build
```

---

## Phase 3: Playwright 유저스토리 검증

### MCP 활용

```yaml
primary: Playwright MCP
  - browser_navigate: 페이지 이동
  - browser_snapshot: 현재 상태 확인
  - browser_fill_form: 폼 입력
  - browser_click: 버튼/링크 클릭
  - browser_wait_for: 로딩 완료 대기
```

### 검증할 유저스토리 (specs/pages/README.md 기준)

#### Flow 1: 신규 가입 → 로그인

```yaml
steps: 1. /register 이동
  2. 폼 입력 (이름, 이메일, 비밀번호 8자 이상)
  3. "Create Account" 클릭
  4. /login으로 리다이렉트 확인
  5. 로그인 폼 입력
  6. "Sign In" 클릭
  7. /writers로 이동 확인

verify:
  - 각 단계 에러 없이 진행
  - 적절한 로딩 표시
  - 성공 시 올바른 리다이렉트
```

#### Flow 2: 작가 생성 → 수정

```yaml
steps: 1. /writers/create 이동
  2. 작가 정보 입력 (이름, 설명, systemPrompt, 장르)
  3. "작가 만들기" 클릭
  4. /my-writers로 이동 확인
  5. 생성된 작가 클릭 → 상세 페이지
  6. "수정" 버튼 클릭
  7. 정보 수정 후 저장

verify:
  - 유효성 검사 동작
  - 생성 성공 토스트
  - 수정 내용 반영
```

#### Flow 3: 소설 생성 (SSE 스트리밍)

```yaml
steps: 1. /stories/generate 이동
  2. 작가 선택
  3. 태그 입력 (최대 3개)
  4. "소설 생성" 클릭
  5. 스트리밍 텍스트 표시 확인
  6. 완료 후 상세 페이지 이동

verify:
  - 스트리밍 중 로딩 표시
  - 실시간 텍스트 업데이트
  - 완료 후 소설 저장 확인
```

#### Flow 4: 라이브러리 + 북마크

```yaml
steps: 1. /library 이동
  2. 소설 목록 로드 확인
  3. 북마크 아이콘 클릭
  4. 즉시 UI 변경 확인 (Optimistic Update)
  5. 새로고침 후 북마크 유지 확인

verify:
  - Optimistic Update 동작
  - 페이지네이션 동작
  - 필터/정렬 동작
```

#### Flow 5: 에러 케이스

```yaml
scenarios:
  - 잘못된 로그인 정보 → 에러 메시지 표시
  - 존재하지 않는 작가 ID → 404 처리
  - 권한 없는 작가 수정 시도 → 403 처리
  - 네트워크 오류 시뮬레이션 → fallback UI

verify:
  - 에러 메시지 사용자 친화적
  - 앱 크래시 없음
  - 복구 가능한 상태 유지
```

---

## Phase 4: 결과 정리

### Output 형식

```markdown
## 리팩토링 완료 리포트

### 수정된 파일

- [ ] apps/web/src/pages/RegisterPage.tsx - 비밀번호 검증 8자로 통일
- [ ] apps/web/src/pages/LoginPage.tsx - 에러 핸들링 개선
- ...

### 유저스토리 검증 결과

| Flow                | 상태 | 비고                   |
| ------------------- | ---- | ---------------------- |
| 신규 가입 → 로그인  | ✅   | 정상 동작              |
| 작가 생성 → 수정    | ✅   | 정상 동작              |
| 소설 생성 (SSE)     | ✅   | 스트리밍 확인          |
| 라이브러리 + 북마크 | ✅   | Optimistic Update 확인 |
| 에러 케이스         | ✅   | fallback 정상          |

### 남은 이슈

- (있다면 기록)
```

---

## 실행 옵션

### 전체 실행

```
/refactor-and-verify
```

### 특정 Phase만 실행

```
/refactor-and-verify --phase 1  # Gap 분석만
/refactor-and-verify --phase 2  # 리팩토링만
/refactor-and-verify --phase 3  # Playwright 검증만
```

### 특정 도메인만

```
/refactor-and-verify --domain auth    # 인증만
/refactor-and-verify --domain writer  # 작가만
/refactor-and-verify --domain story   # 소설만
```

---

## 주의사항

1. **서버 실행 필수**: Phase 3 전에 `pnpm dev` 실행 확인
2. **DB 초기화**: 테스트 데이터 충돌 방지를 위해 필요시 `pnpm prisma migrate reset`
3. **환경변수**: `.env` 파일에 필요한 값 설정 확인
4. **Playwright 브라우저**: 첫 실행 시 `browser_install` 필요할 수 있음

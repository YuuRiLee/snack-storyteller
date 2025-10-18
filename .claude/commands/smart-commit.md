# /smart-commit - 스마트 커밋 생성기

변경된 파일들을 자동으로 분석하여 논리적인 그룹으로 나누고, Conventional Commits 스타일로 커밋합니다.

## 사용법

```bash
/smart-commit
```

## 동작 방식

### 1단계: 변경사항 분석
```bash
git status
git diff --stat
```

변경된 파일들을 다음 기준으로 그룹화:
- **문서**: `*.md`, `docs/`, `README`
- **설정**: `*.config.js`, `*.json`, `.env*`, `docker-compose.yml`
- **백엔드**: `apps/server/`, `packages/*/src/`
- **프론트엔드**: `apps/web/`, UI 컴포넌트
- **테스트**: `*.test.ts`, `*.spec.ts`, `__tests__/`
- **스크립트**: `scripts/`, `*.sh`
- **Commands**: `.claude/commands/`

### 2단계: 커밋 타입 결정

Conventional Commits 타입:
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정 변경
- `perf`: 성능 개선

### 3단계: 순차적 커밋

각 그룹별로:
```bash
git add [그룹 파일들]
git commit -m "$(cat <<'EOF'
type(scope): 간결한 제목

상세 설명:
- 변경사항 1
- 변경사항 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## 커밋 메시지 템플릿

### 문서 변경
```
docs: [문서명] 추가/수정/업데이트

[변경 내용 요약]
- 주요 추가 내용
- 업데이트된 섹션
```

### 기능 추가
```
feat(모듈명): [기능 설명]

구현 내용:
- 핵심 기능 1
- 핵심 기능 2
- API 엔드포인트 추가

기술 스택:
- 사용된 라이브러리/패턴
```

### 버그 수정
```
fix(모듈명): [버그 설명] 해결

문제:
- 발생한 에러 상황

해결:
- 적용한 수정사항
- 추가 검증 로직
```

### 리팩토링
```
refactor(모듈명): [리팩토링 내용]

개선 사항:
- 코드 구조 개선
- 성능 최적화
- 타입 안정성 강화
```

## 예시

### Before (수동)
```bash
git add .
git commit -m "updates"  # ❌ 명확하지 않음
```

### After (smart-commit)
```bash
/smart-commit

# 자동으로 4개 커밋 생성:
# 1. docs: CLAUDE.md에 AI 통합 가이드 추가
# 2. feat(commands): Phase 개발 워크플로우 추가
# 3. feat(commands): 유틸리티 명령어 추가 (debug, help, setup)
# 4. docs: 평가 기준 문서 추가
```

## 커밋 전 체크리스트

각 커밋 전에 자동으로 검증:
- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 규칙 위반 없음
- [ ] 커밋 메시지 50자 제한 (제목)
- [ ] 본문과 제목 사이 빈 줄
- [ ] 관련 없는 파일 제외

## 커밋 후 검증

```bash
git log --oneline -5
git diff HEAD~1
```

최종 결과 확인 및 요약 제공

## 옵션

```bash
# 대화형 모드 (커밋 전 확인)
/smart-commit --interactive

# 특정 타입으로 강제
/smart-commit --type feat

# 커밋만 하고 push는 안 함 (기본)
/smart-commit

# 커밋 후 자동 push
/smart-commit --push
```

## MCP 도구 활용

- **Sequential Thinking**: 복잡한 변경사항 그룹화 전략 수립
- **Bash**: Git 명령 실행 및 상태 확인
- **Read**: 변경된 파일 내용 분석
- **Grep**: 커밋 히스토리 패턴 분석

## 주의사항

⚠️ **다음 경우 수동 커밋 권장**:
- 민감한 정보가 포함된 파일
- 대규모 마이그레이션 (100+ 파일)
- 복잡한 의존성 변경
- 긴급 핫픽스 (신속한 배포 필요)

✅ **다음 경우 smart-commit 최적**:
- 일반적인 개발 작업
- 여러 기능/문서 동시 작업
- 일관된 커밋 히스토리 유지
- PR 준비 단계

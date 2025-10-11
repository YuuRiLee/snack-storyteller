# /create-pr - PR 생성기

현재 브랜치의 변경사항을 분석하여 구조화된 PR 제목과 설명을 자동 생성합니다.

## 사용법

```bash
/create-pr

# 특정 베이스 브랜치 지정
/create-pr --base main

# 자연어로 요약 스타일 지정
/create-pr --style detailed  # 상세 설명
/create-pr --style concise   # 간결한 요약
```

## 동작 방식

### 1단계: 커밋 분석
```bash
git log main..현재브랜치 --oneline
git diff main...현재브랜치 --stat
```

### 2단계: 변경사항 카테고리화

자동으로 감지:
- **기능 추가**: `feat:` 커밋들
- **버그 수정**: `fix:` 커밋들
- **문서 업데이트**: `docs:` 커밋들
- **리팩토링**: `refactor:` 커밋들
- **테스트**: `test:` 커밋들
- **설정 변경**: `chore:` 커밋들

### 3단계: PR 템플릿 생성

프로젝트 특화 템플릿 적용

## PR 제목 생성 규칙

### 패턴 분석
```
단일 기능: [기능명] 구현
다중 기능: [주요 기능] 및 [부가 기능들] 추가
문서화: [문서명] 문서화
버그 수정: [버그 설명] 해결
리팩토링: [모듈명] 리팩토링
```

### 예시
```
✅ AI 소설 생성 기능 구현
✅ 인증 시스템 및 사용자 관리 추가
✅ Phase 개발 Commands 및 프로젝트 문서화
✅ OpenAI API 타임아웃 문제 해결
✅ 소설 생성 로직 성능 최적화
```

## PR 설명 템플릿

### 표준 템플릿
```markdown
## 📋 개요
[이 PR의 목적과 배경을 1-2문장으로 요약]

## ✨ 주요 변경사항

### 1. [카테고리 1]
- [변경사항 1]
- [변경사항 2]

### 2. [카테고리 2]
- [변경사항 1]

## 🎯 목적
1. **[목적 1]**: [설명]
2. **[목적 2]**: [설명]

## 🔍 테스트 방법
```bash
# [테스트 명령어]
```

## 📚 관련 이슈
- Closes #[이슈번호]
- Related to #[이슈번호]

## 📝 체크리스트
- [ ] 로컬에서 테스트 완료
- [ ] 타입 에러 없음 (`pnpm type-check`)
- [ ] 린트 통과 (`pnpm lint`)
- [ ] 빌드 성공 (`pnpm build`)
- [ ] 문서 업데이트 완료

## 🚀 다음 단계
[머지 후 진행할 작업]
```

### Phase 개발용 템플릿
```markdown
## 📋 개요
Phase [N]: [Phase 이름] 구현

## ✨ 구현 내용

### 백엔드 (NestJS)
- [API 엔드포인트 목록]
- [데이터 모델 변경사항]
- [비즈니스 로직]

### 프론트엔드 (React)
- [UI 컴포넌트]
- [상태 관리]
- [API 통합]

### 데이터베이스 (Prisma)
- [스키마 변경]
- [마이그레이션]

## 🤖 AI 도구 활용

### Context7
- [학습한 공식 문서]
- [적용한 패턴]

### Sequential Thinking
- [설계 의사결정 과정]
- [트레이드오프 분석]

### Magic MCP
- [생성한 UI 컴포넌트]

## 🎯 성공 기준
- [ ] [핵심 기능] 작동
- [ ] curl 테스트 통과
- [ ] 브라우저 수동 테스트 완료
- [ ] 에러 핸들링 완비

## 🔍 검증 방법
```bash
# Phase [N] 검증
/verify-phase [N]
```

## 📊 평가 기준 충족도
- 백엔드 개발 역량: [X/40]
- AI 활용: [X/40]
- 완성도: [X/20]

## 🚀 다음 Phase
Phase [N+1]: [다음 Phase 이름]
```

## 자동 분석 항목

### 코드 변경 통계
```
X files changed, Y insertions(+), Z deletions(-)

변경된 파일 타입:
- TypeScript: X files
- Markdown: Y files
- JSON: Z files
```

### 영향 범위
```
영향받는 모듈:
- apps/server: 인증, 스토리 생성
- apps/web: UI 컴포넌트, API 클라이언트
- packages/types: 공유 타입 정의
```

### 의존성 변경
```
추가된 패키지:
- openai: ^4.20.0
- bcrypt: ^5.1.1

업데이트된 패키지:
- prisma: 5.7.0 → 5.8.0
```

## 사용 예시

### 예시 1: Feature 브랜치
```bash
# 브랜치: feat/auth-system
/create-pr

# 생성 결과:
제목: 인증 시스템 및 사용자 관리 구현
설명: JWT 기반 인증, 회원가입/로그인, Protected Routes
```

### 예시 2: Bugfix 브랜치
```bash
# 브랜치: fix/story-generation-timeout
/create-pr

# 생성 결과:
제목: 스토리 생성 타임아웃 문제 해결
설명: OpenAI API 재시도 로직 추가, 에러 핸들링 개선
```

### 예시 3: Docs 브랜치
```bash
# 브랜치: docs/phase-commands
/create-pr

# 생성 결과:
제목: Phase 개발 Commands 및 가이드라인 문서화
설명: 5개 Phase 명령어, AI 도구 활용 전략, 평가 기준
```

## GitHub CLI 통합

PR 생성까지 자동화:
```bash
/create-pr --create

# 내부 실행:
# 1. PR 제목/설명 생성
# 2. gh pr create 실행
# 3. 브라우저에서 PR 페이지 열기
```

## Sequential Thinking 활용

복잡한 PR에는 자동으로 Sequential Thinking 사용:
```
1. 변경사항 분석
2. 주요 테마 추출
3. 논리적 구조화
4. 한국어 자연스러운 표현 생성
5. 기술 용어와 일반 설명 균형
```

## 브랜치 네이밍 인식

자동으로 브랜치 이름에서 의도 파악:
- `feat/*`: 기능 추가
- `fix/*`: 버그 수정
- `refactor/*`: 리팩토링
- `docs/*`: 문서 작업
- `test/*`: 테스트 추가
- `chore/*`: 설정/빌드 변경

## 출력 형식

### 터미널 출력
```
🎯 PR 제목:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI 기반 소설 생성 기능 구현
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 PR 설명:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[생성된 PR 설명]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 다음 단계:
1. 내용 검토
2. gh pr create --title "..." --body "..."
3. 또는: /create-pr --create (자동 생성)
```

### 파일로 저장
```bash
/create-pr --save pr-description.md

# PR 템플릿 파일 생성
# GitHub에 복사/붙여넣기 가능
```

## 품질 체크

PR 생성 전 자동 검증:
- [ ] 커밋 메시지가 Conventional Commits 형식
- [ ] 최소 1개 이상의 의미있는 커밋
- [ ] main 브랜치와 충돌 없음
- [ ] 브랜치가 최신 main에서 분기
- [ ] 50자 이상의 코드 변경

## 커스터마이징

프로젝트별 템플릿 설정:
```yaml
# .claude/pr-template.yaml
project: snack-storyteller
template_type: phase_development

sections:
  - overview
  - changes
  - ai_tools
  - testing
  - evaluation
  - next_steps

style:
  language: korean
  tone: professional
  emoji: true
  technical_level: detailed
```

## MCP 도구 활용

- **Sequential Thinking**: PR 구조화 및 논리적 설명 생성
- **Context7**: 유사 프로젝트 PR 패턴 참고
- **Bash**: Git 명령 실행 및 변경사항 분석
- **Read**: 변경된 파일 상세 분석
- **Grep**: 커밋 메시지 패턴 추출

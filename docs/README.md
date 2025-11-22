# Documentation

프로젝트 문서 모음입니다.

## 📁 디렉토리 구조

### testing/

테스트 관련 문서 (TDD Phase 3-4-5)

- **test-cases.md**: 62개 상세 테스트 케이스 (Given-When-Then 형식)
- **fixtures.md**: 재사용 가능한 테스트 데이터 (Users, Writers, Stories, Mock API)
- **test-strategy.md**: Mocking 전략, 격리, 실행 순서, CI/CD 통합

## 🔗 관련 문서

- **Specifications**: `/specs/` - Spec-Driven Development 문서 (spec.md, plan.md, tasks.md, constitution.md)
- **Claude Docs**: `/.claude/docs/` - AI 개발 전용 문서 (SDD 리서치, Phase 완료 리포트, lessons learned)

## 📚 TDD 시작하기

```bash
# Phase 3-5 TDD 워크플로우
cd apps/server
pnpm test:watch

# 1. testing/test-cases.md에서 Test Case 확인
# 2. RED: 테스트 작성 (실패 확인)
# 3. GREEN: 최소 구현 (성공 확인)
# 4. REFACTOR: 코드 개선
```

## 📊 Coverage 목표

- **Overall**: 85%+
- **WriterService**: 90%+
- **AIService**: 80%+
- **StoryService**: 90%+
- **BookmarkService**: 90%+

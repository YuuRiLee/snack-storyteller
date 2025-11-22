# .claude/docs - Claude Code AI 전용 문서

이 폴더는 **Claude Code AI 개발**을 위한 전용 문서를 포함합니다.

## 📁 디렉토리 구조

### methodology/ - AI 개발 방법론

AI가 코드 생성 시 참고하는 방법론 문서

- **SDD-Deep-Research.md**: Spec-Driven Development 리서치
  - GitHub Spec Kit 4-phase 워크플로우 (Specify → Plan → Tasks → Implement)
  - Constitution.md 패턴 (프로젝트 불변 원칙)
  - SDD vs TDD/BDD 비교 분석
  - snack-storyteller 프로젝트 적용 전략

### learning/ - AI 학습 자료

AI가 과거 실수에서 배운 교훈

- **lessons-learned.md**: 개발 과정에서 배운 교훈 및 노하우
  - 실수 패턴, 해결 방법, Best Practices
  - 동일한 실수 재발 방지

### reports/ - AI 개발 결과 리포트

Phase 완료 시 AI가 작성한 검증 리포트

- **PHASE1_COMPLETE.md**: Phase 1 완료 리포트 및 검증 결과
- **SETUP_COMPLETE.md**: 프로젝트 초기 설정 완료 문서

## 🔗 관련 문서 위치

**일반 프로젝트 문서**: `/docs/`

- 테스트 관련 문서 (test-cases, fixtures, test-strategy)

**Specification 문서**: `/specs/`

- Phase별 spec.md, plan.md, tasks.md
- constitution.md (프로젝트 원칙)

## 💡 AI 개발 워크플로우

```
1. /specs/constitution.md 읽기 → 프로젝트 불변 원칙 이해
2. /specs/phase*.spec.md 읽기 → 요구사항 파악
3. /.claude/docs/SDD-Deep-Research.md 참고 → 방법론 적용
4. /specs/phase*.plan.md 생성 → 기술 설계
5. /specs/phase*.tasks.md 생성 → 작업 분해
6. 구현 → lessons-learned.md 업데이트
```

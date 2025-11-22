# Lessons Learned

> **SDD (Spec-Driven Development) 피드백 루프**
> AI 개발 과정에서 발견한 패턴, 에러, 개선사항을 기록합니다.

---

## 📋 사용 방법

### 목적

- AI 에러를 학습하여 **반복 방지**
- 효과적인 **프롬프트 패턴** 축적
- 프로젝트 **지식 베이스** 구축

### 언제 작성하나?

```yaml
에러_발생_시:
  - 예상치 못한 동작
  - 컴파일/런타임 에러
  - AI 생성 코드 문제
  - 성능 이슈

프롬프트_개선_시:
  - 더 나은 결과를 얻은 프롬프트
  - 실패한 프롬프트와 개선 버전
  - Few-shot 예시 효과

패턴_발견_시:
  - 반복되는 문제
  - 효과적인 해결책
  - 아키텍처 인사이트
```

---

## 🗓️ 2025-01-08: SDD 도입 시작

### Phase 0: 인프라 구축

```yaml
작업:
  - specs/ 디렉토리 구조 생성
  - Constitution.md 작성
  - LessonsLearned.md 초기화

소요_시간: 1시간

결과: ✅ 성공
```

### Constitution 작성 인사이트

```yaml
좋았던_점:
  - CLAUDE.md 기반으로 간결화
  - AI가 읽는 "계약서" 관점
  - 10가지 핵심 원칙 집중

개선_필요:
  - (추후 Phase 진행하며 업데이트)
```

---

## 📝 Entry Template

새로운 내용 추가 시 아래 템플릿 사용:

````markdown
## YYYY-MM-DD: [Feature/Issue Name]

### Problem

**무엇이 문제였는가?**

- 구체적 증상
- 에러 메시지
- 재현 방법

### Root Cause

**왜 발생했는가?**

- 근본 원인 분석
- 관련 코드/설정
- 배경 지식

### Solution

**어떻게 해결했는가?**

```typescript
// Before (문제 코드)

// After (해결 코드)
```
````

### AI Prompt Improvement

**Before**:

```
[원래 프롬프트]
```

**After**:

```
[개선된 프롬프트]
```

**Why Better?**

- 이유 1
- 이유 2

### Prevention

**재발 방지 조치**

- [ ] Constitution에 규칙 추가
- [ ] Spec 템플릿 업데이트
- [ ] 검증 체크리스트 추가
- [ ] 팀 공유 (해당 시)

### Metrics

```yaml
before:
  success_rate: 0%
  time_spent: 2시간

after:
  success_rate: 100%
  time_spent: 10분
```

````

---

## 📊 통계 (누적)

### Phase별 성과
```yaml
Phase_1_Init:
  status: 완료 (Retrospective)
  duration: -
  first_pass_success: -

Phase_2_Auth:
  status: 완료 (Retrospective)
  duration: -
  first_pass_success: -

Phase_3_Writers:
  status: 예정
  duration: -
  first_pass_success: -

Phase_4_Story_Gen:
  status: 예정 (최우선)
  duration: -
  first_pass_success: -

Phase_5_Library:
  status: 예정
  duration: -
  first_pass_success: -
````

### 프롬프트 개선 횟수

```yaml
total_improvements: 0
categories:
  few_shot_learning: 0
  parameter_tuning: 0
  context_management: 0
  error_handling: 0
```

### AI 도구 사용 통계

```yaml
Context7: 0회
Sequential_Thinking: 1회 (SDD 적용 전략 수립)
Magic_MCP: 0회
Playwright: 0회
```

---

## 🎯 개선 목표

### 정량적 목표

```yaml
first_pass_success_rate:
  current: - (측정 시작 전)
  target: 80% 이상

development_speed:
  baseline: Phase 1-2 (SDD 도입 전)
  target: 30% 단축

refactoring_reduction:
  baseline: - (측정 시작 전)
  target: 50% 감소
```

### 정성적 목표

```yaml
spec_code_sync:
  - 명세와 코드 100% 동기화
  - 변경 시 명세 먼저 업데이트

prompt_reusability:
  - 효과적인 프롬프트 라이브러리 구축
  - Phase 간 패턴 재사용

process_clarity:
  - 다음 단계가 항상 명확
  - 막히는 부분 최소화
```

---

## 💡 Best Practices (누적)

### 효과적인 프롬프트 패턴

```markdown
(아직 없음 - 개발 진행하며 추가)
```

### 피해야 할 안티패턴

```markdown
(아직 없음 - 개발 진행하며 추가)
```

### 아키텍처 인사이트

```markdown
(아직 없음 - 개발 진행하며 추가)
```

---

## 🔗 관련 문서

- [Constitution](../specs/constitution.md) - 프로젝트 불변 원칙
- [SDD Deep Research](./SDD-Deep-Research.md) - SDD 방법론 연구
- [CLAUDE.md](../CLAUDE.md) - AI 개발자 가이드

---

**마지막 업데이트**: 2025-01-08
**총 항목 수**: 1 (SDD 도입 시작)

# Specification: Phase 2 - 인증 시스템

> **Status**: ✅ 완료 (Retrospective Spec)
> **Completed**: 2025-01-08 (Commit: 9dc44ed)

---

## 📋 User Journey

### 사용자 관점

1. 회원가입 페이지 접속
2. 이메일, 비밀번호, 이름 입력
3. "가입하기" 버튼 클릭
4. 회원가입 성공, 자동 로그인
5. 대시보드로 리다이렉트

### 로그인 플로우

1. 로그인 페이지 접속
2. 이메일, 비밀번호 입력
3. "로그인" 버튼 클릭
4. JWT 토큰 발급 받음
5. 토큰을 localStorage에 저장
6. 보호된 페이지 접근 가능

### 인증 유지

1. 보호된 API 요청 시 JWT 토큰 헤더에 포함
2. 서버에서 토큰 검증
3. 유효한 토큰: 요청 처리
4. 무효한 토큰: 401 Unauthorized
5. 만료된 토큰: 자동 로그아웃 (향후 Refresh Token 추가)

---

## ✅ Success Criteria (완료된 것들)

### Backend API

- [x] POST /auth/register - 회원가입
- [x] POST /auth/login - 로그인
- [x] GET /auth/me - 현재 사용자 정보 (JWT 필요)
- [x] POST /auth/logout - 로그아웃

### 데이터 모델

- [x] Prisma User 모델
  - id: String (cuid)
  - email: String (unique)
  - password: String (hashed)
  - name: String
  - createdAt: DateTime

### 보안

- [x] 비밀번호 bcrypt 해싱 (salt rounds: 12)
- [x] JWT 토큰 생성 (Passport JWT)
- [x] 토큰 만료 시간 설정
- [x] 이메일 중복 체크
- [x] 비밀번호 검증

### Frontend

- [x] 회원가입 폼 (shadcn/ui)
- [x] 로그인 폼 (shadcn/ui)
- [x] AuthContext (인증 상태 관리)
- [x] Protected Route 컴포넌트
- [x] 자동 로그아웃 (401 응답 시)

### Quality

- [x] Unit Test (AuthService)
- [x] E2E Test (인증 플로우)
- [x] DTO 검증 (class-validator)
- [x] 에러 핸들링

---

## 🎯 Business Requirements (달성됨)

```yaml
보안: ✅ 비밀번호 해싱 (bcrypt)
  ✅ JWT 기반 Stateless 인증
  ✅ 이메일 중복 방지
  ✅ 비밀번호 정책 (향후 강화 가능)

사용자_경험: ✅ 간단한 회원가입 (이메일, 비밀번호, 이름만)
  ✅ 로그인 유지 (localStorage)
  ✅ 자동 로그아웃 (토큰 만료 시)

확장성: ✅ 향후 Refresh Token 추가 가능
  ✅ 소셜 로그인 확장 대비 (Passport 전략)
```

---

## 📦 Tech Stack (사용됨)

### Backend

```yaml
Authentication:
  - @nestjs/passport
  - @nestjs/jwt
  - passport-jwt
  - bcrypt

Validation:
  - class-validator
  - class-transformer

Database:
  - Prisma (User 모델)
```

### Frontend

```yaml
UI:
  - shadcn/ui (Form, Input, Button)
  - React Hook Form
  - Zod (스키마 검증)

State:
  - React Context API (AuthContext)
  - localStorage (토큰 저장)

HTTP:
  - Axios (API 요청)
  - Interceptor (토큰 자동 포함)
```

---

## 🏗️ Architecture (구현됨)

### Backend Modules

```
apps/server/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── user/
│   ├── user.module.ts
│   └── user.service.ts
```

### Frontend Components

```
apps/web/src/
├── components/
│   ├── auth/
│   │   ├── RegisterForm.tsx
│   │   ├── LoginForm.tsx
│   │   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── api.ts (axios instance)
```

---

## 🔐 Security Implementation (완료)

### 비밀번호 해싱

```typescript
// AuthService
async register(dto: RegisterDto) {
  const hashedPassword = await bcrypt.hash(dto.password, 12);
  // ...
}

async login(dto: LoginDto) {
  const isValid = await bcrypt.compare(dto.password, user.password);
  // ...
}
```

### JWT 전략

```typescript
// JwtStrategy
async validate(payload: JwtPayload) {
  const user = await this.userService.findOne(payload.sub);
  if (!user) {
    throw new UnauthorizedException();
  }
  return user;
}
```

### Protected Routes

```typescript
// Backend
@UseGuards(JwtAuthGuard)
@Get('me')
async getCurrentUser(@Request() req) {
  return req.user;
}

// Frontend
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

---

## 🧪 Verification (검증 완료)

### API 테스트

```bash
# 회원가입
✅ curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'

# 로그인
✅ curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
# → { "access_token": "eyJ...", "user": {...} }

# 인증된 요청
✅ curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer eyJ..."
# → { "id": "...", "email": "test@test.com", ... }
```

### 체크리스트

```yaml
✅ 회원가입 성공 - DB에 사용자 저장됨
✅ 비밀번호 해싱 확인 - 평문 저장 안 됨
✅ 로그인 성공 - JWT 토큰 발급
✅ 이메일 중복 - 409 Conflict 응답
✅ 잘못된 비밀번호 - 401 Unauthorized
✅ 보호된 라우트 - 토큰 없으면 401
✅ 유효한 토큰 - 사용자 정보 반환
```

---

## 📝 Notes (회고)

### 잘된 점

- Passport JWT로 깔끔한 인증 구현
- DTO 검증으로 입력 안정성 확보
- shadcn/ui로 빠른 UI 개발

### 향후 개선 사항

```yaml
Refresh_Token:
  - Access Token 만료 시 자동 갱신
  - httpOnly Cookie 사용
  - Axios Interceptor 통합

비밀번호_정책:
  - 최소 8자, 특수문자 포함
  - 비밀번호 강도 측정

Rate_Limiting:
  - 로그인 시도 제한 (5회/분)
  - 회원가입 제한 (IP당)
```

---

## 🔗 Git History

```bash
# Phase 2 완료 커밋
9dc44ed feat(auth): JWT 기반 인증 시스템 구현 (#9)
```

---

**이 Spec은 이미 완료된 Phase 2를 Retrospective로 문서화한 것입니다.**
**Phase 3부터는 Spec → Plan → Tasks → Implement의 Full SDD 워크플로우를 적용합니다.**

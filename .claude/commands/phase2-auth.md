Command: Phase 2 - Authentication System

**Prerequisites**: `/phase1-init` must be completed (apps running, Prisma configured)

You are implementing Phase 2: **JWT Authentication System** for secure user management.

## 📋 Pre-flight Checklist
**Before starting Phase 2, verify:**
- [ ] Phase 1 completed: `curl http://localhost:3001/health` returns 200
- [ ] Prisma is working: `cd apps/server && pnpm prisma generate` succeeds
- [ ] DATABASE_URL in .env is valid and database is accessible
- [ ] Docker postgres container is running: `docker ps | grep postgres`

## 🤖 MCP Usage Strategy

### Context7 for Auth Patterns
```bash
/context7 nestjs jwt authentication passport
/context7 prisma user model relations
/context7 bcrypt password hashing best practices
/context7 react authentication flow jwt tokens
```

### Magic for UI Components
```bash
# Use Magic MCP for all UI components:
"shadcn dialog with email/password login form, dark theme"
"user profile dropdown with avatar and logout button"
```

### Implementation & Validation
1. Backend: Prisma User model → AuthService → JWT strategy
2. Test with curl: Register → Login → Protected route
3. Frontend: Login UI → Auth store → Token persistence
4. E2E validation: Full authentication flow works

## Phase 2 Goals:
- Implement JWT authentication in backend
- Create login/signup API endpoints
- Build authentication UI components
- Set up Prisma with PostgreSQL
- Implement protected routes

## Backend Tasks:

### Database Setup:
- Configure Prisma with PostgreSQL
- Create User model in schema.prisma
- Set up database migrations
- Seed initial data

### Auth Module (NestJS):
- Create AuthModule with JWT strategy
- Implement AuthService (register, login, validate)
- Create AuthController with endpoints:
  - POST /auth/register
  - POST /auth/login
  - GET /auth/me
- Set up Passport JWT guards

### User Model (Prisma):
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // bcrypt hashed
  name          String?
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  writers       Writer[]
  stories       Story[]
  bookmarks     Bookmark[]
}
```

## Frontend Tasks:

### Auth Store (Zustand):
- Create auth store with login/logout actions
- Implement token persistence (localStorage)
- Handle automatic token refresh

### Auth Components (shadcn/ui):
- Login form component
- Signup form component
- Protected route wrapper
- User profile dropdown

### Auth Pages:
- /login page
- /signup page
- Authentication layout

### API Integration:
- Set up axios interceptors for JWT
- Create auth API service
- Implement TanStack Query for auth state

## Security Requirements:
- Password hashing with bcrypt (salt rounds: 12)
- JWT expiration: 24h
- Secure HTTP-only cookies (production)
- Input validation with class-validator

## Success Criteria:
- ✅ User can register with email/password
- ✅ User can login and receive JWT token
- ✅ Protected routes redirect to login
- ✅ Token persists across browser refresh
- ✅ Database migrations work correctly

## ✅ Post-flight Validation
**After Phase 2, run these commands to verify authentication works:**

```bash
# 1. Verify Prisma migration
cd apps/server
pnpm prisma migrate status
# Expected: All migrations applied

# 2. Test user registration
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test User"}'
# Expected: Returns user object with id

# 3. Test login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
# Expected: Returns { "access_token": "jwt.token.here", "user": {...} }

# 4. Test protected route (replace TOKEN with actual token from step 3)
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer TOKEN"
# Expected: Returns user profile

# 5. Test invalid token (should fail)
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer invalid.token"
# Expected: 401 Unauthorized
```

**🎯 Phase 2 Complete When:**
- User registration creates record in database
- Login returns valid JWT token
- Protected routes reject requests without token
- Protected routes accept requests with valid token
- Frontend login form works end-to-end

## 🔗 Dependencies for Phase 3:
- `User` model exists in Prisma schema
- JWT authentication middleware is functional
- `/auth/me` endpoint returns current user

## 📝 Serena Session Save Point:
```bash
/sc:save phase2-auth-complete
# Saves: Prisma schema, JWT config, test user credentials
```

## File Structure:
```
/apps/server/src
  /auth
    auth.module.ts
    auth.service.ts
    auth.controller.ts
    jwt.strategy.ts
    auth.dto.ts
  /user
    user.module.ts
    user.service.ts
  prisma/
    schema.prisma
    migrations/

/apps/web/src
  /components/auth
    LoginForm.tsx
    SignupForm.tsx
    ProtectedRoute.tsx
  /stores
    auth.store.ts
  /services
    auth.api.ts
  /pages
    Login.tsx
    Signup.tsx
```

## Next Phase:
After completion, use `/phase3-writers` to implement writer persona management.
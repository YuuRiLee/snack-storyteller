Command: Phase 1 - Project Initialization

**Prerequisites**: `/setup-project` must be completed (tools installed, configs created)

You are starting Phase 1: **Creating actual application code** for React frontend and NestJS backend.

## 🤖 MCP Usage Strategy

### Context7 for Official Setup Patterns
```bash
/context7 vite create react typescript
/context7 nestjs cli new project
/context7 tailwindcss shadcn ui installation
/context7 prisma init postgresql
```

### Implementation Sequence
1. Use Context7 to learn official CLI commands (Vite, NestJS)
2. Create React app with `pnpm create vite`
3. Create NestJS app with `npx @nestjs/cli new`
4. Install dependencies and configure TypeScript paths
5. Verify both apps compile and dev servers run

## 📋 Pre-flight Checklist
**Before starting Phase 1, verify:**
- [ ] `/setup-project` completed successfully
- [ ] `node --version` shows 18.0.0+
- [ ] `pnpm --version` shows 8.0.0+
- [ ] `docker ps` shows postgres container running
- [ ] `pnpm-workspace.yaml` exists in project root
- [ ] `.env` file exists with DATABASE_URL

## Phase 1 Goals:
- **Create React app** in `apps/web` with Vite + TypeScript
- **Create NestJS app** in `apps/server` with TypeScript
- Set up shared packages structure (ui, types, utils)
- Configure shadcn/ui and TailwindCSS in frontend
- Install and configure Prisma in backend
- Verify both dev servers run successfully

## Expected Folder Structure:
```
/apps
  /web -> React frontend (Vite + TypeScript)
  /server -> NestJS backend (TypeScript)
/packages
  /ui -> shadcn custom components
  /types -> shared TypeScript types
  /utils -> utility functions
package.json (workspace root)
pnpm-workspace.yaml
docker-compose.yml
```

## Dependencies to Install:

### Root (package.json):
- pnpm workspace configuration
- shared dev dependencies (TypeScript, Prettier, ESLint)

### Frontend (/apps/web):
- React, Vite, TypeScript
- shadcn/ui, TailwindCSS
- TanStack Query, Zustand
- Axios for API calls

### Backend (/apps/server):
- NestJS, TypeScript
- Prisma, PostgreSQL driver
- Passport JWT
- Class-validator, class-transformer

### Shared Packages:
- /packages/types: TypeScript definitions
- /packages/ui: shadcn component exports
- /packages/utils: shared utility functions

## Tasks:
1. Create workspace root package.json with pnpm workspaces
2. Initialize frontend app with Vite + React + TypeScript
3. Initialize backend app with NestJS CLI
4. Set up shared packages structure
5. Configure TailwindCSS and shadcn/ui in frontend
6. Set up basic Docker configuration
7. Create .env templates for both apps

## Success Criteria:
- ✅ Both apps start successfully (dev mode)
- ✅ Shared packages can be imported
- ✅ TailwindCSS working in frontend
- ✅ Docker containers can be built

## ✅ Post-flight Validation
**After Phase 1, run these commands to verify completion:**

```bash
# 1. Verify apps exist
ls apps/web/package.json apps/server/package.json
# Expected: Both files exist

# 2. Verify compilation
cd apps/web && pnpm type-check
cd apps/server && pnpm build
# Expected: No errors

# 3. Start dev servers (in separate terminals)
pnpm -F web dev    # Terminal 1 - should start on :3000
pnpm -F server dev # Terminal 2 - should start on :3001

# 4. Test basic endpoints
curl http://localhost:3000  # React app loads
curl http://localhost:3001/health  # NestJS responds 200

# 5. Verify Prisma
cd apps/server && pnpm prisma generate
# Expected: Prisma client generated
```

**🎯 Phase 1 Complete When:**
- Frontend dev server runs on :3000
- Backend dev server runs on :3001
- No TypeScript compilation errors
- Basic health check endpoint responds

## 🔗 Dependencies for Phase 2:
- `apps/server/prisma/schema.prisma` file exists
- Prisma client can be generated
- DATABASE_URL in .env is valid

## Next Phase:
After completion, use `/phase2-auth` to implement authentication system.
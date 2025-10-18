Command: Zeta Clone Development Help

You are providing help and guidance for the Zeta clone development process.

## Available Commands:

### 🎬 First-Time Setup:
- **`/setup-project`** - ONE-TIME environment setup (run this first!)

### 📋 Phase Commands (Development Sequence):
1. **`/phase1-init`** - Project initialization and monorepo setup
2. **`/phase2-auth`** - Authentication system with JWT
3. **`/phase3-writers`** - Writer persona management and creation
4. **`/phase4-story-gen`** - AI story generation with OpenAI/Claude ⭐ (핵심)
5. **`/phase5-library`** - Story library and reading interface

### 🛠️ Utility Commands:
- **`/debug-check`** - Comprehensive health check and debugging
- **`/help`** - This help documentation

### Development Workflow (MVP):
```
/setup-project (FIRST TIME ONLY)
       ↓
/phase1-init → /phase2-auth → /phase3-writers → /phase4-story-gen → /phase5-library
```

## Command Usage Patterns:

### Starting Brand New Project:
```bash
# 1. ONE-TIME environment setup
/setup-project

# 2. Initialize project structure
/phase1-init

# 3. Check environment health
/debug-check

# 4. Continue with development phases
/phase2-auth → /phase3-writers → /phase4-story-gen → /phase5-library
```

### Continuing Existing Project:
```bash
# Skip setup-project, go directly to phases
/phase2-auth  # or whichever phase you're on

# Verify phase completion
/debug-check
```

### Debugging Issues:
```bash
# Full system check
/debug-check

# Check specific phase completion
# Verify all features working

# Re-run health check
/debug-check
```

## Tech Stack Overview:

### Frontend:
- **React + Vite + TypeScript** - Modern React development
- **shadcn/ui + TailwindCSS** - Consistent UI components
- **TanStack Query** - Server state management
- **Zustand** - Client state management

### Backend:
- **NestJS + TypeScript** - Scalable Node.js framework
- **Prisma + PostgreSQL** - Type-safe database access
- **Passport JWT** - Authentication system

### AI Integration:
- **OpenAI GPT-4** - Primary AI story generation
- **Anthropic Claude** - Fallback provider
- **OpenRouter** - Alternative provider

### Infrastructure:
- **Docker + docker-compose** - Containerization
- **pnpm workspace** - Monorepo management

## Project Structure:
```
/apps
  /web              → React frontend
  /server           → NestJS backend
/packages
  /ui               → shadcn components
  /types            → Shared TypeScript types
  /utils            → Utility functions
/.claude/commands   → Development commands
/docs              → Documentation
```

## Key Features Being Built:

### Core Features (MVP):
1. **User Authentication** - Secure JWT-based auth
2. **Writer Personas** - AI writing style definition with systemPrompt
3. **AI Story Generation** - OpenAI GPT-4 powered short story creation
4. **Story Library** - Save, search, and bookmark generated stories
5. **Style Customization** - Genre, mood, and ending tag combinations

### Technical Highlights:
- Multi-AI provider support (OpenAI, Claude, OpenRouter)
- Structured prompt engineering with Few-shot learning
- Parameter optimization (temperature, penalties)
- A/B testing framework for prompt variants
- Mobile-responsive dark theme design

## Development Best Practices:

### Code Quality:
- TypeScript strict mode
- ESLint + Prettier configuration
- Comprehensive testing (Jest, Playwright)
- Code review process

### Database:
- Prisma migrations for schema changes
- Proper indexing for performance (userId, createdAt, tags)
- Regular backup procedures

### Security:
- JWT authentication with proper expiration
- Input validation and sanitization
- CORS configuration
- Rate limiting for API endpoints

## Common Development Tasks:

### Database Operations:
```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Reset database
pnpm db:reset

# Seed data
pnpm db:seed
```

### Development Servers:
```bash
# Start all services
pnpm dev

# Start frontend only
pnpm dev:web

# Start backend only
pnpm dev:server
```

### Testing:
```bash
# Run all tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Run with coverage
pnpm test:coverage
```

## Phase-Specific Goals:

### Phase 1 (Init):
- Monorepo setup with pnpm workspaces
- React + Vite + NestJS applications
- Docker configuration with PostgreSQL
- Development environment ready

### Phase 2 (Auth):
- JWT authentication system
- User registration and login
- Protected routes with guards
- Password hashing with bcrypt

### Phase 3 (Writers):
- Writer persona CRUD operations
- Image upload functionality
- Writer gallery and search
- Public/private visibility controls
- SystemPrompt for AI writing style

### Phase 4 (Story Generation): ⭐ Core Feature
- OpenAI GPT-4 integration
- Prompt engineering with Few-shot learning
- Style tag system (genre, mood, ending)
- Story title auto-generation
- Word count and metadata tracking

### Phase 5 (Library):
- Story list with pagination
- Tag-based filtering
- Bookmark system
- Reading interface
- Search functionality

## Troubleshooting Guide:

### Common Issues:
1. **Port conflicts** - Check running processes
2. **Database connection** - Verify PostgreSQL service
3. **Node modules** - Clear and reinstall
4. **TypeScript errors** - Check Prisma client generation
5. **CORS issues** - Verify backend configuration

### Debug Commands:
```bash
# Check running processes
ps aux | grep node

# Check ports
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Check Docker containers
docker ps
docker logs <container_id>
```

## Getting Help:

### Documentation:
- Each command has detailed implementation steps
- Check `/docs` folder for additional guides
- API documentation available after backend setup

### Support Workflow:
1. Try `/debug-check` first
2. Check specific phase documentation
3. Use `/quick-fix` for urgent issues
4. Review troubleshooting guide
5. Check project logs and error messages

## Success Metrics:

### Phase Completion Criteria:
- All planned features working
- Tests passing
- No critical bugs
- Documentation updated
- Ready for next phase

### Final Success Criteria (MVP):
- All Phase 1-5 features working
- AI story generation functional (1500-2000 words)
- User authentication secure
- Stories saved and retrievable
- Production deployment ready

## Next Steps:
1. Start with `/phase1-init` if beginning development
2. Use `/debug-check` to verify current status
3. Follow phases sequentially for best results
4. Use utility commands as needed during development
5. Deploy with `/deploy` when all phases complete
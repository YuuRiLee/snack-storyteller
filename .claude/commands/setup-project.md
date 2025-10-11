Command: Setup Project Environment

**⚠️ IMPORTANT**: This is a ONE-TIME setup command. Run this BEFORE `/phase1-init`.

**Purpose**: Configure development environment, tools, and SuperClaude framework integration.

**When to use**:
- ✅ First time setting up the project
- ✅ New developer onboarding
- ✅ Resetting development environment

**When NOT to use**:
- ❌ Already ran setup and starting development → Use `/phase1-init` instead
- ❌ Continuing existing project → Jump to appropriate Phase command

## Relationship with phase1-init:
```
/setup-project (ONE-TIME)    →    /phase1-init (START DEVELOPMENT)
     ↓                                    ↓
- Install tools                    - Create app structure
- Configure env vars               - Initialize React/NestJS
- Setup Docker                     - Install dependencies
- Configure quality tools          - Verify apps compile
```

## Setup Goals:
- **Environment Verification**: Ensure Node.js, pnpm, Docker are installed
- **SuperClaude Configuration**: Activate AI Developer personas and MCP servers
- **Tool Installation**: Set up Git hooks, linters, formatters
- **Template Creation**: Generate .env.example, configuration files
- **No Code Writing**: This phase does NOT create React/NestJS apps (that's Phase 1)

## Pre-Setup Checklist:

### 1. Read Project Guidelines
```bash
# Always start by reading the project rulebook
Read: /path/to/project/CLAUDE.md
```

### 2. Activate SuperClaude Personas
```markdown
# Primary Persona: ZETA Clone Expert
You are a ZETA clone development specialist with:

## Expertise Areas:
- React 18 + NestJS full-stack development
- AI chat application architecture (2+ hour engagement patterns)
- Real-time streaming AI responses (SSE/WebSocket)
- Korean UI/UX patterns and dark theme design
- Monetization through freemium models
- Story-driven user engagement systems

## Technical Specializations:
- pgvector semantic memory implementation
- Multi-provider AI integration (OpenAI, Claude, OpenRouter)
- Real-time chat optimizations for mobile
- Character creation and management systems
- Social features and ranking algorithms

## Development Philosophy:
- User experience > Technical perfection
- 2+ hour engagement as success metric
- Mobile-first responsive design
- Dark theme aesthetic prioritization
- Scalability for 1M+ users
```

### 3. Configure MCP Server Usage
```yaml
mcp_strategy:
  sequential_thinking:
    use_for: "Complex architecture decisions, debugging, system design"
    pattern: "Multi-step reasoning for technical challenges"

  context7:
    use_for: "Framework documentation, library patterns, best practices"
    pattern: "Official docs lookup for React, NestJS, Prisma implementations"

  magic_21st:
    use_for: "UI component generation, ZETA-style interface creation"
    pattern: "Dark theme components with mobile-first design"

  playwright:
    use_for: "E2E testing, user flow validation, mobile testing"
    pattern: "Critical user journeys: auth, chat, character creation"
```

## Environment Setup Tasks:

### 1. System Requirements Verification
```bash
# Verify required tools are installed
node --version    # Require 18.0.0+
pnpm --version    # Require 8.0.0+
docker --version  # Require Docker Engine

# If missing, install:
# - Node.js: https://nodejs.org/ or use nvm
# - pnpm: npm install -g pnpm
# - Docker: https://docs.docker.com/get-docker/
```

### 2. Project Directory Structure (Templates Only)
```bash
# Create folder structure (NO app code yet)
mkdir -p .claude/commands
mkdir -p docs
mkdir -p scripts

# Create pnpm workspace config
echo 'packages:
  - "apps/*"
  - "packages/*"' > pnpm-workspace.yaml
```

### 3. Root Configuration Files
```bash
# Create root package.json (workspace root only)
cat > package.json <<'EOF'
{
  "name": "snack-storyteller",
  "private": true,
  "packageManager": "pnpm@8.0.0",
  "scripts": {
    "dev": "concurrently \"pnpm -F web dev\" \"pnpm -F server dev\"",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "type-check": "pnpm -r type-check",
    "lint": "pnpm -r lint"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  }
}
EOF
```

### 4. Environment Variables Template
```bash
# Create .env.example for Phase 1-5 reference
cat > .env.example <<'EOF'
# Database (Phase 2)
DATABASE_URL="postgresql://postgres:password@localhost:5432/snack_storyteller_dev"

# JWT (Phase 2)
JWT_SECRET="your-super-secure-jwt-secret-min-32-chars"
JWT_EXPIRES_IN="24h"

# AI Providers (Phase 4)
OPENAI_API_KEY="sk-your-openai-key-here"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"

# App URLs
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
NODE_ENV="development"
EOF

# Copy to actual .env (user will fill in real keys)
cp .env.example .env
echo "⚠️  Edit .env and add your actual API keys before Phase 4"
```

### 5. Docker Development Environment
```yaml
# docker-compose.yml
version: '3.8'
services:
  database:
    image: pgvector/pgvector:pg15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: zeta_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 6. Quality Tools Configuration (Templates)
```bash
# Create ESLint config template
cat > .eslintrc.json <<'EOF'
{
  "extends": ["@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
EOF

# Create Prettier config
cat > .prettierrc <<'EOF'
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
EOF
```

## Development Workflow Setup:

### 1. Git Hooks (Husky)
```json
// package.json scripts
{
  "scripts": {
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    "pre-push": "pnpm type-check && pnpm test"
  }
}
```

### 2. Commit Message Convention
```bash
# .gitmessage template
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>

# Types: feat, fix, docs, style, refactor, test, chore
# Scopes: auth, chat, character, ui, api, db
# Examples:
# feat(chat): add real-time streaming responses
# fix(auth): handle JWT token expiration
# docs(api): update character creation endpoints
```

### 3. Development Scripts
```bash
# Quick development commands
alias zeta-dev="pnpm dev"
alias zeta-test="pnpm test --watch"
alias zeta-build="pnpm build"
alias zeta-db="pnpm db:migrate && pnpm db:generate"
alias zeta-lint="pnpm lint --fix"
```

## Success Verification:

### Environment Checklist:
- [ ] Node.js 18.0.0+ installed
- [ ] pnpm 8.0.0+ installed
- [ ] Docker installed and running
- [ ] pnpm-workspace.yaml created
- [ ] Root package.json created (NO app packages yet)
- [ ] .env.example and .env files created
- [ ] docker-compose.yml created
- [ ] .eslintrc.json and .prettierrc created
- [ ] Git initialized (`git init` if new project)
- [ ] CLAUDE.md read and understood

### Verification Commands:
```bash
# Verify tools
node --version    # ✅ 18.0.0+
pnpm --version    # ✅ 8.0.0+
docker --version  # ✅ Docker installed

# Verify files exist
ls -la package.json pnpm-workspace.yaml docker-compose.yml .env

# Start Docker database (optional test)
docker-compose up -d
docker ps  # Should show postgres container running
```

**🎯 Success Indicator**: All tools installed, config files created, NO apps/web or apps/server directories yet

## Next Steps:
After successful setup, proceed with:
1. `/phase1-init` - Initialize applications
2. Follow sequential phases according to development plan
3. Use `/debug-check` if any issues arise during development

## SuperClaude Integration Notes:
- Always read CLAUDE.md before starting any development task
- Use sequential_thinking for complex architectural decisions
- Leverage context7 for framework-specific implementations
- Apply magic_21st for UI components matching ZETA's design
- Validate critical flows with playwright testing

This setup ensures consistent, high-quality development aligned with ZETA's 2+ hour engagement goals and technical excellence standards.
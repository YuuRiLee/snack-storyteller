Command: Debug & Health Check

You are performing debugging and health check for the Zeta clone development.

## Debug Goals:
- Check current development status
- Identify and fix common issues
- Validate environment setup
- Test critical functionality
- Generate development reports

## Health Check Tasks:

### Environment Validation:
- ✅ Node.js version (>=18.0.0)
- ✅ pnpm version (>=8.0.0)
- ✅ PostgreSQL running and accessible
- ✅ Docker and docker-compose working
- ✅ All environment variables set

### Dependency Verification:
- Check package.json integrity across all workspaces
- Verify all dependencies are installed
- Check for security vulnerabilities (npm audit)
- Validate TypeScript configuration
- Test build processes

### Database Health:
- Verify PostgreSQL connection
- Check Prisma migrations status
- Validate pgvector extension
- Test database queries
- Check data integrity

### API Health Check:
- Test all authentication endpoints
- Verify writer CRUD operations
- Test story generation API
- Check AI service integration (OpenAI/Claude)
- Validate story library endpoints

### Frontend Validation:
- Test component rendering
- Verify routing functionality
- Check state management (Zustand)
- Validate API integration
- Test responsive design

## Common Issues & Solutions:

### Port Conflicts:
```bash
# Check running processes
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# Kill processes if needed
kill -9 <PID>
```

### Database Issues:
```bash
# Reset database (development only)
pnpm db:reset
pnpm db:migrate
pnpm db:seed

# Check PostgreSQL service
docker-compose up -d database  # Or: brew services restart postgresql
```

### Node Modules Issues:
```bash
# Clean install
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### TypeScript Errors:
```bash
# Check TypeScript in all workspaces
pnpm -r type-check

# Generate Prisma client
pnpm db:generate
```

## Debug Commands:

### Development Status Check:
```bash
# Check git status
git status
git branch

# Check running processes
ps aux | grep node
docker ps

# Check package versions
node --version
pnpm --version
```

### Log Analysis:
- Frontend console errors
- Backend application logs
- Database query logs
- Docker container logs
- Network request/response logs

### Performance Check:
- Bundle size analysis
- API response times
- Database query performance
- Memory usage monitoring
- CPU utilization

## Troubleshooting Guide:

### Authentication Issues:
1. Check JWT token format and expiration
2. Verify bcrypt password hashing
3. Validate Passport configuration
4. Test protected route guards

### AI Integration Issues:
1. Verify API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY)
2. Test story generation with simple prompt
3. Check token limits and costs
4. Validate error handling for API failures

### Database Connection Issues:
1. Check DATABASE_URL in .env
2. Verify PostgreSQL service status (docker ps or brew services)
3. Test connection with: pnpm prisma db pull
4. Verify migrations: pnpm prisma migrate status

### Frontend Compilation Issues:
1. Clear build cache
2. Check TypeScript errors
3. Verify import paths
4. Test component dependencies

## Debug Output Format:
```
🔍 HEALTH CHECK REPORT
========================

✅ Environment: All systems operational
⚠️  Database: 1 migration pending
❌ AI Service: API key missing

RECOMMENDATIONS:
1. Run: pnpm db:migrate
2. Set OPENAI_API_KEY in .env
3. Restart development servers

NEXT STEPS:
- Fix identified issues
- Re-run health check
- Continue development
```

## Success Criteria:
- ✅ All services start without errors
- ✅ Database connections are stable
- ✅ Authentication flow works end-to-end
- ✅ AI responses are generated successfully
- ✅ Frontend renders without console errors

## Usage:
Run this command when experiencing issues or before starting development session.
# Phase 4 Testing Guide

## 🧪 SSE Streaming Test Setup

### Prerequisites

1. **PostgreSQL Database Running**
   ```bash
   # Option 1: Docker (if installed)
   docker compose up -d

   # Option 2: Local PostgreSQL (if installed)
   # Make sure PostgreSQL is running on localhost:5432
   # And database 'snack_storyteller' exists
   ```

2. **Environment Variables**
   ```bash
   # apps/server/.env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/snack_storyteller"
   OPENAI_API_KEY="your-openai-api-key"

   # apps/web/.env.local
   VITE_API_URL=http://localhost:3001
   ```

3. **Database Migration**
   ```bash
   cd apps/server
   pnpm prisma migrate dev
   ```

4. **Test Data Seeding**
   ```bash
   cd apps/server
   npx tsx prisma/seed-test-writer.ts
   ```

### Running the Test

1. **Start Backend Server**
   ```bash
   cd apps/server
   pnpm dev

   # Server should start on http://localhost:3001
   # Check health: curl http://localhost:3001/health
   ```

2. **Start Frontend Dev Server**
   ```bash
   cd apps/web
   pnpm dev

   # Frontend should start on http://localhost:5173
   ```

3. **Open Test Page**
   ```
   Navigate to: http://localhost:5173
   ```

### Test Scenarios

#### ✅ Happy Path Test
1. Leave default values:
   - Writer ID: `test-writer-id`
   - Tags: `로맨스,경쾌한,해피엔딩`
2. Click "Generate Story"
3. **Expected**:
   - Status shows "isGenerating: true"
   - Tokens appear in real-time in "Current Content"
   - After 10-30 seconds, story completes
   - "Final Story" section shows title and full content
   - Word count should be 1500+

#### ❌ Error Handling Test
1. Enter invalid Writer ID: `non-existent-writer`
2. Click "Generate Story"
3. **Expected**:
   - Error message appears: "Writer non-existent-writer not found"
   - hasError: true

#### 🔄 Retry Test (Requires Moderation Failure)
- To trigger retry, you need content that fails moderation
- This is difficult to test without intentionally problematic content
- Retry notifications will appear in Status section

#### ⏹️ Cancel Test
1. Click "Generate Story"
2. While generating (tokens streaming), click "Cancel"
3. **Expected**:
   - Streaming stops immediately
   - isGenerating: false
   - Content preserved at point of cancellation

#### 🔄 Reset Test
1. After any generation (success or failure)
2. Click "Reset"
3. **Expected**:
   - All state clears
   - Content area empty
   - Ready for new generation

### Manual API Testing (curl)

#### Test SSE Endpoint Directly
```bash
curl -N "http://localhost:3001/stories/generate/stream?writerId=test-writer-id&tags=로맨스,경쾌한,해피엔딩"

# Expected output (streaming):
# data: {"type":"token","data":{"token":"비는 "}}
#
# data: {"type":"token","data":{"token":"도시를 "}}
#
# ... (continues streaming) ...
#
# data: {"type":"done","data":{"id":"...","title":"...","content":"...","wordCount":1850}}
```

#### Test Non-Streaming Endpoint
```bash
curl -X POST http://localhost:3001/stories/generate \
  -H "Content-Type: application/json" \
  -d '{
    "writerId": "test-writer-id",
    "tags": ["로맨스", "경쾌한", "해피엔딩"]
  }'

# Expected: Full StoryDto JSON response (may take 20-30 seconds)
```

### Troubleshooting

#### "Can't reach database server"
- Check PostgreSQL is running: `pg_isready` or `docker ps`
- Verify DATABASE_URL in apps/server/.env
- Run migrations: `pnpm prisma migrate dev`

#### "Writer test-writer-id not found"
- Seed test data: `npx tsx prisma/seed-test-writer.ts`
- Or create via Prisma Studio: `pnpm prisma studio`

#### "OpenAI API error"
- Check OPENAI_API_KEY in apps/server/.env
- Verify API key has credits: https://platform.openai.com/usage
- Check rate limits

#### EventSource connection fails
- Ensure backend is running on port 3001
- Check CORS is enabled (should be by default in NestJS)
- Verify VITE_API_URL in apps/web/.env.local

### Success Criteria

From specs/phase4-story-gen/spec.md:

- [x] **First Token < 2s**: Tokens start appearing within 2 seconds
- [x] **Total Generation < 30s**: Complete story in under 30 seconds
- [x] **Success Rate > 95%**: 95%+ successful generations (test 20 times)
- [x] **Word Count 1500-2000**: Generated stories meet length requirement
- [x] **Real-time Streaming**: Tokens appear progressively, not all at once
- [x] **Error Handling**: Graceful error messages, no crashes
- [x] **Retry Logic**: Auto-retry on transient failures (max 3 attempts)

### Performance Benchmarks

Test with 10 generations and record:
- Average first token time
- Average total time
- Success rate
- Average word count
- Retry count

Example results:
```
Generations: 10
Success: 10/10 (100%)
Avg First Token: 1.4s
Avg Total Time: 24.2s
Avg Word Count: 1842
Retries: 2 (both moderation, succeeded on retry)
```

## 🎯 Next Steps After Testing

1. **If tests pass**:
   - Proceed to Task 6 (Frontend UI Components)
   - Use Magic MCP to generate production UI
   - Integrate `useStoryGeneration` hook

2. **If tests fail**:
   - Debug specific failure scenario
   - Check logs in backend terminal
   - Verify OpenAI API response
   - Test individual components

## 📝 Notes

- Test page is temporary (will be replaced by production UI)
- Mock user ID is used (auth will be added in Phase 2)
- Streaming works best in development mode
- CORS may need configuration for production deployment

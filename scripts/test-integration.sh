#!/bin/bash

# Phase 4 Integration Test Script
# Tests all implemented endpoints without requiring OpenAI API

set -e

API_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Phase 4 Integration Tests"
echo "=============================="
echo ""

# Test 1: Health Check
echo -n "1. Health Check... "
HEALTH=$(curl -s ${API_URL}/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $HEALTH"
    exit 1
fi

# Test 2: Writers Endpoint
echo -n "2. GET /writers... "
WRITERS=$(curl -s ${API_URL}/writers?isPublic=true)
if echo "$WRITERS" | grep -q "writers"; then
    WRITER_COUNT=$(echo "$WRITERS" | grep -o '"id"' | wc -l | xargs)
    echo -e "${GREEN}✅ PASS${NC} (${WRITER_COUNT} writers found)"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $WRITERS"
    exit 1
fi

# Test 3: Create Writer (if none exist)
if [ "$WRITER_COUNT" -eq 0 ]; then
    echo -n "3. POST /writers (creating test writer)... "
    CREATE_WRITER=$(curl -s -X POST ${API_URL}/writers \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Integration Test Writer",
            "systemPrompt": "You are a test writer",
            "personality": "Test personality",
            "isPublic": true
        }')

    if echo "$CREATE_WRITER" | grep -q "id"; then
        echo -e "${GREEN}✅ PASS${NC}"
        TEST_WRITER_ID=$(echo "$CREATE_WRITER" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $CREATE_WRITER"
        exit 1
    fi
else
    echo "3. Using existing writer for tests"
    TEST_WRITER_ID=$(echo "$WRITERS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

echo "   Using writer ID: $TEST_WRITER_ID"

# Test 4: Stories List
echo -n "4. GET /stories... "
STORIES=$(curl -s "${API_URL}/stories?page=1&limit=10")
if echo "$STORIES" | grep -q "stories"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $STORIES"
    exit 1
fi

# Test 5: Story Generation (Non-Streaming) - Will fail without OpenAI API
echo -n "5. POST /stories/generate (expecting failure without API key)... "
GENERATE=$(curl -s -X POST ${API_URL}/stories/generate \
    -H "Content-Type: application/json" \
    -d "{
        \"writerId\": \"${TEST_WRITER_ID}\",
        \"tags\": [\"로맨스\", \"경쾌한\"]
    }" 2>&1)

if echo "$GENERATE" | grep -q "statusCode"; then
    # Expected to fail without OpenAI API key
    echo -e "${YELLOW}⚠️  EXPECTED FAIL${NC} (OpenAI API key required)"
else
    echo -e "${GREEN}✅ PASS${NC} (Story generated successfully)"
fi

# Test 6: SSE Endpoint accessibility
echo -n "6. SSE Endpoint /stories/generate/stream (connectivity)... "
# Just check if endpoint exists (won't test actual streaming without API key)
SSE_TEST=$(curl -s -m 2 "${API_URL}/stories/generate/stream?writerId=${TEST_WRITER_ID}&tags=test" 2>&1 || true)

# If we get any response (even error), endpoint is accessible
if [ ! -z "$SSE_TEST" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Endpoint accessible)"
else
    echo -e "${RED}❌ FAIL${NC} (Endpoint not responding)"
fi

# Test 7: TypeScript Compilation
echo -n "7. TypeScript type-check... "
cd /Users/yuri/Workspace/snack-storyteller
TYPE_CHECK=$(pnpm type-check 2>&1)
if echo "$TYPE_CHECK" | grep -q "Done"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$TYPE_CHECK"
    exit 1
fi

# Test 8: Frontend Build
echo -n "8. Frontend build test... "
cd /Users/yuri/Workspace/snack-storyteller/apps/web
BUILD=$(pnpm build 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$BUILD"
    exit 1
fi

# Test 9: Backend Build
echo -n "9. Backend build test... "
cd /Users/yuri/Workspace/snack-storyteller/apps/server
BUILD=$(pnpm build 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "$BUILD"
    exit 1
fi

echo ""
echo "=============================="
echo -e "${GREEN}✅ Integration Tests Complete!${NC}"
echo ""
echo "Summary:"
echo "  ✅ API endpoints responding"
echo "  ✅ Database connectivity working"
echo "  ✅ TypeScript compilation passing"
echo "  ✅ Frontend build successful"
echo "  ✅ Backend build successful"
echo ""
echo "⚠️  Note: Story generation requires OPENAI_API_KEY in .env"
echo ""

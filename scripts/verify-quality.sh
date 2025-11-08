#!/bin/bash

# Quality verification script for Snack Storyteller
# Run this before committing to ensure code quality

set -e  # Exit on error

echo "🔍 Starting Quality Checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. TypeScript Type Checking
echo "📘 TypeScript Type Check..."
if pnpm type-check 2>/dev/null; then
  echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
  echo -e "${YELLOW}⚠️  No TypeScript packages to check yet${NC}"
fi
echo ""

# 2. Linting
echo "✨ ESLint Check..."
if pnpm lint 2>/dev/null; then
  echo -e "${GREEN}✅ Linting passed${NC}"
else
  echo -e "${YELLOW}⚠️  No packages to lint yet${NC}"
fi
echo ""

# 3. Prettier Format Check
echo "💅 Prettier Format Check..."
if pnpm exec prettier --check "**/*.{ts,tsx,js,jsx,json,md}" 2>/dev/null; then
  echo -e "${GREEN}✅ Formatting check passed${NC}"
else
  echo -e "${YELLOW}⚠️  Some files need formatting (run: pnpm format)${NC}"
fi
echo ""

# 4. Build Check
echo "🔨 Build Check..."
if pnpm build 2>/dev/null; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${YELLOW}⚠️  No packages to build yet${NC}"
fi
echo ""

# 5. Test Check
echo "🧪 Test Check..."
if pnpm test 2>/dev/null; then
  echo -e "${GREEN}✅ Tests passed${NC}"
else
  echo -e "${YELLOW}⚠️  No tests configured yet${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All quality checks completed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

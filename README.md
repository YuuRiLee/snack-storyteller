# 🎭 Snack Storyteller - AI 단편 소설 생성 플랫폼

## 🛠️ 빠른 시작

### 사전 요구사항

- Node.js 22.12+ (Vite 7 요구사항)
- pnpm 9+
- Docker & Docker Compose

### 1. 클론 및 설치

```bash
git clone https://github.com/your-username/snack-storyteller.git
cd snack-storyteller

# Node.js 22 사용 (nvm 사용 시)
nvm install 22
nvm use 22

pnpm install
```

### 2. 환경 변수 설정

```bash
# 서버 환경 변수 설정
cp .env.example apps/server/.env
# apps/server/.env 파일을 열어 API 키 수정
# OPENAI_API_KEY="sk-proj-your-openai-api-key"  # 필수
# GEMINI_API_KEY="..."  # 선택 (Fallback용)

# 웹 환경 변수 설정 (선택 - 기본값: localhost:3001)
echo 'VITE_API_URL=http://localhost:3001' > apps/web/.env.local
```

### 3. 데이터베이스 시작

```bash
docker compose up -d postgres
# 또는 (구버전): docker-compose up -d postgres
```

### 4. 데이터베이스 스키마 적용

```bash
cd apps/server
pnpm prisma migrate dev
```

### 5. 개발 서버 시작

```bash
# 루트 디렉토리로 이동
cd ..

# 전체 실행 (web + server 동시 시작)
pnpm dev

# web + server 개별 실행 (터미널 2개 필요)
pnpm dev:server  # 백엔드 http://localhost:3001
pnpm dev:web     # 프론트엔드 http://localhost:3000
```

### 6. 브라우저 접속

```
http://localhost:3000
```

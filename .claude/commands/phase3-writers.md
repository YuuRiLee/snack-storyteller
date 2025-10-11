Command: Phase 3 - Writer Management (작가 페르소나 시스템)

You are implementing Phase 3: Writer management system for AI story generation.

## 🤖 MCP Usage Strategy

### Context7 for CRUD Patterns
```bash
/context7 nestjs crud operations rest api
/context7 prisma relations cascading delete
/context7 file upload validation nestjs multer
```

### Magic for Writer UI
```bash
# Generate UI components with Magic:
"character card grid with image, name, description, responsive"
"writer creation form with image upload, dark theme"
"system prompt editor textarea with syntax highlighting"
```

### Critical: systemPrompt Design
Use Sequential Thinking to design effective writer personas:
- How to structure systemPrompt for consistent style?
- What Few-shot examples to include?
- How to balance creativity vs consistency?

## Phase 3 Goals:
- Create Writer model and API endpoints (Character → Writer)
- Build writer creation/editing UI with persona configuration
- Implement writer gallery/discovery
- Add writer image upload functionality
- Configure AI writing styles via systemPrompt

## Backend Tasks:

### Writer Model (Prisma):
```prisma
model Writer {
  id           String    @id @default(cuid())
  name         String    // "하드보일드 작가", "로맨스 소설가"
  systemPrompt String    @db.Text // AI 작가 스타일 및 페르소나
  imageUrl     String?
  description  String    @db.Text // 작가 소개
  genre        String[]  // ["느와르", "스릴러"]
  visibility   Visibility @default(PUBLIC)
  ownerId      String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  owner         User?   @relation(fields: [ownerId], references: [id])
  stories       Story[]

  @@index([visibility, createdAt])
}

enum Visibility {
  PUBLIC
  PRIVATE
}
```

### Writer Module (NestJS):
- Create WriterModule, Service, Controller
- Implement CRUD operations with proper authorization
- Add image upload endpoint with file validation
- Create writer search/filter functionality

### API Endpoints:
- POST /writers (create new writer persona)
- GET /writers (list public + user's private writers)
- GET /writers/:id (get writer details)
- PUT /writers/:id (update writer - owner only)
- DELETE /writers/:id (delete writer - owner only)
- POST /writers/:id/image (upload writer image)
- GET /writers/search?q=name&genre=noir (search writers)

### SystemPrompt Examples:
```typescript
// 하드보일드 작가
const systemPrompt = `
당신은 레이몬드 챈들러 스타일의 하드보일드 소설가입니다.

특징:
- 간결하고 힘있는 문체
- 냉소적이고 현실적인 시선
- 빠른 전개와 긴장감
- 비유적 표현 (비 내리는 도시, 담배 연기 등)

문장 스타일:
- 짧고 강렬한 문장
- 감각적 묘사
- 직설적 대화

스토리 요소:
- 복잡한 인물 관계
- 도시의 어두운 면
- 도덕적 모호성
`;

// 로맨스 소설가
const systemPrompt = `
당신은 감성적인 로맨스 소설가입니다.

특징:
- 섬세한 감정 묘사
- 등장인물의 내면 깊이 파고들기
- 관계의 발전 과정 세밀하게 그리기
- 따뜻하고 희망적인 결말

문장 스타일:
- 부드럽고 감성적인 표현
- 비유와 상징
- 감정의 흐름 중시

스토리 요소:
- 운명적 만남
- 오해와 화해
- 성장하는 사랑
`;
```

## Frontend Tasks:

### Writer Store (Zustand):
- Writer list state management
- Selected writer state
- Writer creation/editing forms state

### Writer Components:
- WriterCard (display writer info with genre tags)
- WriterForm (create/edit writer with systemPrompt editor)
- WriterGallery (grid of writer cards)
- WriterDetails (full writer view with sample stories)
- ImageUpload (writer avatar upload)
- SystemPromptEditor (textarea with syntax highlighting)

### Writer Pages:
- /writers (writer gallery)
- /writers/create (writer creation)
- /writers/:id (writer details)
- /writers/:id/edit (writer editing)
- /my-writers (user's created writers)

### Features:
- Writer ranking system (by usage/popularity)
- Genre-based filtering
- Writer search by name/genre
- Preview writer style (sample generation)
- Responsive writer grid

### Sample Writers (Seed Data):
```typescript
const sampleWriters = [
  {
    name: "하드보일드 탐정",
    description: "도시의 어둠을 파헤치는 냉소적 작가",
    genre: ["느와르", "스릴러", "범죄"],
    imageUrl: "/writers/noir.jpg",
    systemPrompt: "...", // 위 하드보일드 프롬프트
  },
  {
    name: "감성 로맨스",
    description: "가슴 뛰는 사랑 이야기를 쓰는 작가",
    genre: ["로맨스", "드라마"],
    imageUrl: "/writers/romance.jpg",
    systemPrompt: "...", // 위 로맨스 프롬프트
  },
  {
    name: "SF 마스터",
    description: "미래 세계를 상상하는 SF 전문가",
    genre: ["SF", "디스토피아"],
    imageUrl: "/writers/sf.jpg",
    systemPrompt: "...",
  },
];
```

## UI/UX Requirements:
- Use shadcn/ui components (Card, Form, Input, Button, Textarea)
- Implement proper form validation
- Show loading states during API calls
- Handle image upload with progress indicator
- Mobile-responsive writer cards
- Genre tag chips with colors

## Success Criteria:
- ✅ User can create writers with name, description, systemPrompt, genres
- ✅ Writers display in public gallery
- ✅ User can edit their own writers only
- ✅ Writer images upload and display correctly
- ✅ Search and filtering work properly
- ✅ Writer visibility controls work (PUBLIC/PRIVATE)
- ✅ SystemPrompt affects AI story generation style

## File Structure:
```
/apps/server/src
  /writer
    writer.module.ts
    writer.service.ts
    writer.controller.ts
    writer.dto.ts
  /upload
    upload.module.ts
    upload.service.ts

/apps/web/src
  /components/writer
    WriterCard.tsx
    WriterForm.tsx
    WriterGallery.tsx
    WriterDetails.tsx
    ImageUpload.tsx
    SystemPromptEditor.tsx
  /stores
    writer.store.ts
  /services
    writer.api.ts
  /pages
    Writers.tsx
    CreateWriter.tsx
    EditWriter.tsx
    MyWriters.tsx
```

## Key Implementation Notes:

### SystemPrompt is Critical:
The systemPrompt field defines the AI writer's personality and style. This will be used in Phase 4 to generate stories with specific characteristics.

### Validation:
- Name: 2-50 characters
- Description: 10-500 characters
- SystemPrompt: 100-2000 characters (detailed enough for AI)
- Genres: 1-5 tags
- Image: Max 5MB, JPG/PNG only

### Authorization:
- Anyone can view PUBLIC writers
- Only owner can edit/delete their writers
- PRIVATE writers visible only to owner

## Next Phase:
After completion, use `/phase4-story-gen` to implement AI story generation using these writer personas.

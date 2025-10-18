Command: Phase 4 - AI Story Generation (핵심 기능)

You are implementing Phase 4: AI-powered short story generation system.

## 🤖 MCP Usage Strategy

**Critical**: This is the most important phase for demonstrating AI expertise (40% of portfolio evaluation).

### Step 1: Learn OpenAI Patterns with Context7
```bash
/context7 openai gpt-4 chat completions
/context7 openai streaming responses server-sent-events
/context7 openai prompt engineering best practices
/context7 nestjs sse server-sent-events
```

**Learning Goals:**
- GPT-4 Chat Completions API structure (messages, roles)
- Parameter tuning (temperature, max_tokens, presence_penalty, frequency_penalty)
- Streaming responses with SSE protocol
- Few-shot learning and prompt engineering techniques

### Step 2: Design Prompt Strategy with Sequential Thinking
Use Sequential Thinking to analyze:
- **Prompt Structure**: System message + Few-shot examples + User request
- **Few-shot vs Fine-tuning**: Which approach for writer style consistency?
- **Token Optimization**: How to fit systemPrompt + tags + examples within limits?
- **Quality vs Speed**: Sync generation vs async with progress updates?
- **Error Handling**: Retry strategy for API failures and rate limits?

### Step 3: Implementation Workflow
1. **Backend First**: AIService → StoryService → StoryController
2. **Test with curl**: Verify API before building UI
3. **Frontend Integration**: Generation UI → Progress indicators → Result display
4. **Validation**: Word count, quality, style consistency

### Step 4: Portfolio Evidence Collection
Document for evaluation:
- Context7 search queries used
- Sequential Thinking decisions made
- Prompt engineering iterations (v1 → v2 → v3)
- A/B test results if implemented

## 🎯 Phase 4 Goals:
- Implement AI story generation with OpenAI/Claude API
- Create style tag system for story customization
- Build story generation UI with loading states
- Implement story storage and metadata
- **Portfolio Focus**: Demonstrate AI integration expertise

## 📊 Database Models:

### Story Model (Prisma):
```prisma
model Story {
  id          String   @id @default(cuid())
  title       String   // AI-generated or user-provided
  content     String   @db.Text // Complete story text
  tags        String[] // ["느와르", "로맨스", "반전"]
  wordCount   Int
  readTime    Int      // Estimated reading time in minutes

  writerId    String
  userId      String
  isPublic    Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  writer      Writer   @relation(fields: [writerId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  bookmarks   Bookmark[]

  @@index([userId, createdAt])
  @@index([isPublic, createdAt])
  @@index([writerId])
}
```

### StyleTag Model:
```prisma
model StyleTag {
  id          String      @id @default(cuid())
  name        String      @unique // "느와르", "로맨스"
  category    TagCategory // GENRE, MOOD, ENDING
  description String
  emoji       String      // "🕵️", "💖"
  prompt      String      @db.Text // AI prompt hint

  createdAt   DateTime @default(now())

  @@index([category])
}

enum TagCategory {
  GENRE      // 장르: 느와르, 로맨스, SF, 판타지, 미스터리
  MOOD       // 분위기: 우울한, 경쾌한, 긴장감, 유머러스
  ENDING     // 결말: 해피엔딩, 반전, 열린결말, 비극
}
```

### StyleTag Prompt Hint Examples:
```typescript
// Seed data showing how prompt hints work

const styleTags = [
  // GENRE tags
  {
    name: "느와르",
    category: "GENRE",
    description: "어두운 도시 배경의 범죄 스토리",
    emoji: "🕵️",
    prompt: `
장르적 요소:
- 비 오는 밤, 어두운 골목, 네온사인 등 도시의 어두운 면 강조
- 범죄, 배신, 복수 등의 테마
- 도덕적으로 모호한 캐릭터들
- 냉소적이고 비관적인 톤
    `
  },
  {
    name: "로맨스",
    category: "GENRE",
    emoji: "💖",
    prompt: `
장르적 요소:
- 두 캐릭터 간의 감정 발전 과정을 세밀하게 묘사
- 내면의 갈등과 감정의 변화
- 운명적 만남, 오해와 화해, 성장하는 사랑
- 따뜻하고 감성적인 톤
    `
  },

  // MOOD tags
  {
    name: "긴장감",
    category: "MOOD",
    emoji: "😰",
    prompt: `
분위기 조성:
- 빠른 전개와 짧은 문장으로 템포 유지
- 예측 불가능한 상황과 갈등의 고조
- 독자가 숨 막히는 느낌을 받도록
- 위기감과 불안감 조성
    `
  },

  // ENDING tags
  {
    name: "반전",
    category: "ENDING",
    emoji: "😱",
    prompt: `
결말 구성:
- 독자의 예상을 완전히 뒤엎는 반전
- 앞부분의 복선을 회수하며 "아하!" 순간 제공
- 반전이 억지스럽지 않고 자연스럽게 연결되도록
- 반전 후 여운이 남도록 마무리
    `
  },
];
```

## 🔧 Backend Implementation:

### AIService (Core):
```typescript
// apps/server/src/ai/ai.service.ts

import OpenAI from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
    // Claude for comparison/fallback
    this.anthropic = new Anthropic({
      apiKey: config.get('ANTHROPIC_API_KEY'),
    });
  }

  async generateStory(
    writerPrompt: string,
    tags: string[],
    options?: GenerateOptions
  ): Promise<string> {
    const prompt = this.buildStoryPrompt(writerPrompt, tags);

    try {
      // Primary: OpenAI GPT-4
      return await this.generateWithOpenAI(prompt, options);
    } catch (error) {
      // Fallback: Claude
      this.logger.warn('OpenAI failed, using Claude', error);
      return await this.generateWithClaude(prompt, options);
    }
  }

  private async generateWithOpenAI(
    prompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '당신은 뛰어난 한국어 단편 소설 작가입니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options?.temperature || 0.9, // High creativity
      max_tokens: options?.maxTokens || 3000,
      presence_penalty: 0.6, // Encourage variety
      frequency_penalty: 0.3, // Reduce repetition
    });

    return response.choices[0].message.content;
  }

  /**
   * 🎯 Dual Prompt System Integration
   *
   * Combines Writer.systemPrompt (base persona) + StyleTag.prompt (modifiers)
   *
   * Architecture:
   * 1. Writer.systemPrompt: Defines writing STYLE and VOICE
   *    - Example: "당신은 하드보일드 작가입니다. 간결하고 힘있는 문체..."
   *
   * 2. StyleTag.prompt: Provides THEMATIC and TONAL modifiers
   *    - Genre tag: "느와르" → "도시의 어두운 면을 강조하세요"
   *    - Mood tag: "긴장감" → "빠른 전개와 예측 불가능한 반전"
   *    - Ending tag: "반전" → "예상을 뒤엎는 결말로 마무리"
   *
   * Integration Strategy: LAYERED PROMPTING
   *    Base (Writer) → Modifiers (Tags) → Requirements
   *
   * This ensures:
   * - Writer's voice remains consistent (systemPrompt is foundation)
   * - Tags add thematic variety without breaking style
   * - Each generation is unique within stylistic bounds
   */
  private buildStoryPrompt(
    writerPrompt: string,
    tags: string[]
  ): string {
    // Get tag-specific prompt hints from database
    const tagDescriptions = tags.map(tag =>
      this.getTagPromptHint(tag)
    ).join('\n');

    return `
${writerPrompt}  // Layer 1: BASE PERSONA (Writer's systemPrompt)

다음 스타일 요소를 반영하여 소설을 작성하세요:
${tagDescriptions}  // Layer 2: THEMATIC MODIFIERS (StyleTag prompts)

## 요구사항:  // Layer 3: TECHNICAL REQUIREMENTS
- 길이: 1,500-2,000단어
- 완전한 시작-중간-끝 구조
- 인상적인 첫 문장으로 독자를 사로잡기
- 생동감 있는 캐릭터와 구체적인 묘사
- 예상치 못한 전개 또는 반전
- 여운이 남는 강렬한 결말

## 주의사항:
- 메타 설명이나 해설 없이 바로 소설 시작
- 제목은 포함하지 마세요 (별도 생성)
- 완결된 이야기로 작성 (열린 결말도 가능하지만 완성도 유지)

지금 바로 소설을 시작하세요:
`;
  }

  async generateTitle(content: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '당신은 소설 제목을 짓는 전문가입니다.',
        },
        {
          role: 'user',
          content: `다음 소설에 어울리는 한국어 제목을 하나만 제안해주세요. 제목만 출력하세요:\n\n${content.slice(0, 500)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 30,
    });

    return response.choices[0].message.content.trim();
  }

  private getTagPromptHint(tag: string): string {
    // Get tag's prompt hint from database
    // This helps guide AI to match the tag style
  }
}
```

### StoryService:
```typescript
// apps/server/src/story/story.service.ts

@Injectable()
export class StoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  async generateStory(
    dto: GenerateStoryDto,
    userId: string
  ): Promise<Story> {
    // 1. Get writer persona
    const writer = await this.prisma.writer.findUnique({
      where: { id: dto.writerId },
    });

    if (!writer) {
      throw new NotFoundException('Writer not found');
    }

    // 2. Generate story content
    const content = await this.aiService.generateStory(
      writer.systemPrompt,
      dto.tags,
      {
        temperature: dto.temperature || 0.9,
        maxTokens: dto.maxTokens || 3000,
      }
    );

    // 3. Generate title
    const title = await this.aiService.generateTitle(content);

    // 4. Calculate metadata
    const wordCount = this.countWords(content);
    const readTime = this.calculateReadTime(wordCount);

    // 5. Save story
    const story = await this.prisma.story.create({
      data: {
        title,
        content,
        tags: dto.tags,
        wordCount,
        readTime,
        writerId: dto.writerId,
        userId,
        isPublic: dto.isPublic || false,
      },
      include: {
        writer: true,
      },
    });

    return story;
  }

  private countWords(text: string): number {
    // Korean word counting (space-separated)
    return text.trim().split(/\s+/).length;
  }

  private calculateReadTime(wordCount: number): number {
    // Assume 200 words per minute
    return Math.ceil(wordCount / 200);
  }

  async getStories(userId: string, filters?: StoryFilters) {
    return this.prisma.story.findMany({
      where: {
        userId,
        ...filters,
      },
      include: {
        writer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStory(id: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        writer: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Check access permission
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (!story.isPublic && story.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return story;
  }
}
```

### API Endpoints:
```typescript
// POST /api/stories/generate
{
  "writerId": "writer_123",
  "tags": ["느와르", "로맨스", "반전"],
  "temperature": 0.9,
  "isPublic": false
}

// Response:
{
  "id": "story_456",
  "title": "비 오는 밤의 탐정",
  "content": "비 오는 밤, 탐정 사무소 문을...",
  "tags": ["느와르", "로맨스", "반전"],
  "wordCount": 1845,
  "readTime": 9,
  "writer": {
    "id": "writer_123",
    "name": "하드보일드 작가"
  },
  "createdAt": "2025-01-11T..."
}

// GET /api/stories (list user's stories)
// GET /api/stories/:id (get single story)
// DELETE /api/stories/:id (delete story)
// PUT /api/stories/:id/public (toggle public/private)
```

## 🎨 Frontend Implementation:

### Generation Page:
```tsx
// apps/web/src/pages/Generate.tsx

export function GeneratePage() {
  const [selectedWriter, setSelectedWriter] = useState<Writer | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const tagsByCategory = {
    genre: [
      { name: '느와르', emoji: '🕵️' },
      { name: '로맨스', emoji: '💖' },
      { name: 'SF', emoji: '🚀' },
      { name: '판타지', emoji: '🧙' },
      { name: '미스터리', emoji: '🔍' },
    ],
    mood: [
      { name: '우울한', emoji: '😢' },
      { name: '경쾌한', emoji: '😊' },
      { name: '긴장감', emoji: '😰' },
      { name: '유머러스', emoji: '😂' },
    ],
    ending: [
      { name: '해피엔딩', emoji: '🎉' },
      { name: '반전', emoji: '😱' },
      { name: '열린결말', emoji: '🌅' },
      { name: '비극', emoji: '😭' },
    ],
  };

  const handleGenerate = async () => {
    if (!selectedWriter || selectedTags.length === 0) {
      toast.error('작가와 스타일을 선택해주세요');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // Progress animation
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 3000);

    try {
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writerId: selectedWriter.id,
          tags: selectedTags,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const story = await response.json();

      clearInterval(interval);
      setProgress(100);

      toast.success('소설이 생성되었습니다!');
      setTimeout(() => {
        navigate(`/stories/${story.id}`);
      }, 500);
    } catch (error) {
      clearInterval(interval);
      toast.error('소설 생성 중 오류가 발생했습니다');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
        <h2 className="text-2xl font-bold mb-2">
          {selectedWriter.name}가 소설을 쓰고 있어요...
        </h2>
        <p className="text-muted-foreground mb-4">
          선택하신 스타일: {selectedTags.join(', ')}
        </p>
        <Progress value={progress} className="w-80 mb-2" />
        <p className="text-sm text-muted-foreground">
          {progress}% 완료 - 잠시만 기다려주세요
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">✨ 새로운 소설 생성</h1>

      {/* Writer Selection */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1️⃣ 작가 선택</h2>
        <WriterSelector
          value={selectedWriter}
          onChange={setSelectedWriter}
        />
      </section>

      {/* Style Tags */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          2️⃣ 스타일 조합 (최대 3개)
        </h2>

        {Object.entries(tagsByCategory).map(([category, tags]) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-medium mb-3 capitalize">
              {category === 'genre' && '장르'}
              {category === 'mood' && '분위기'}
              {category === 'ending' && '결말'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge
                  key={tag.name}
                  variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
                  className="cursor-pointer text-base px-4 py-2"
                  onClick={() => {
                    if (selectedTags.includes(tag.name)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag.name));
                    } else if (selectedTags.length < 3) {
                      setSelectedTags([...selectedTags, tag.name]);
                    } else {
                      toast.error('최대 3개까지 선택할 수 있습니다');
                    }
                  }}
                >
                  {tag.emoji} {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!selectedWriter || selectedTags.length === 0}
        size="lg"
        className="w-full h-14 text-lg"
      >
        ✨ 소설 생성하기
      </Button>
    </div>
  );
}
```

## 🎯 Success Criteria:
- ✅ User selects writer and style tags (max 3)
- ✅ "Generate" button triggers API call to OpenAI
- ✅ Loading screen shows progress animation
- ✅ AI generates 1500-2000 word story
- ✅ Title is auto-generated
- ✅ Story is saved to database with metadata
- ✅ User is redirected to story reading page
- ✅ Error handling for API failures

## 🎓 Portfolio Highlights:
This phase demonstrates:
- ✅ **AI Integration**: OpenAI API with proper prompt engineering
- ✅ **Fallback Strategy**: Claude as backup provider
- ✅ **Parameter Tuning**: Temperature, tokens, penalties
- ✅ **UX Design**: Loading states, progress indicators
- ✅ **Error Handling**: Graceful failures with user feedback

## File Structure:
```
/apps/server/src
  /ai
    ai.module.ts
    ai.service.ts
    ai.types.ts
  /story
    story.module.ts
    story.service.ts
    story.controller.ts
    story.dto.ts

/apps/web/src
  /components/story
    WriterSelector.tsx
    StyleTagSelector.tsx
    GenerationProgress.tsx
  /pages
    Generate.tsx
  /hooks
    useStoryGeneration.ts
```

## Next Phase:
After completion, use `/phase5-library` to implement story library and reading interface.

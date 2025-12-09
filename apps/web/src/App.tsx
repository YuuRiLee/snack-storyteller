import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/layout';
import {
  LoginPage,
  RegisterPage,
  WritersPage,
  CreateWriterPage,
  EditWriterPage,
  WriterDetailPage,
  MyWritersPage,
  LibraryPage,
  StoryDetailPage,
  GenerateStoryPage,
} from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">Snack Storyteller</h1>
        <p className="text-xl text-muted-foreground">AI 기반 단편 소설 생성 플랫폼</p>
        <p className="text-muted-foreground">
          나만의 AI 작가를 만들고, 원하는 스타일과 장르로 매력적인 단편 소설을 생성해보세요.
        </p>

        <div className="flex gap-4 justify-center mt-8 flex-wrap">
          <div className="px-6 py-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">작가</p>
            <p className="text-2xl font-bold text-primary">AI 페르소나</p>
          </div>
          <div className="px-6 py-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">소설</p>
            <p className="text-2xl font-bold text-primary">1,500자 이상</p>
          </div>
          <div className="px-6 py-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">생성 시간</p>
            <p className="text-2xl font-bold text-primary">30초</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-8">지금 바로 시작해보세요!</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background dark">
          <Navbar />
          <main>
            <Routes>
              {/* Home */}
              <Route path="/" element={<HomePage />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Writers */}
              <Route path="/writers" element={<WritersPage />} />
              <Route path="/writers/create" element={<CreateWriterPage />} />
              <Route path="/writers/:id" element={<WriterDetailPage />} />
              <Route path="/writers/:id/edit" element={<EditWriterPage />} />
              <Route path="/my-writers" element={<MyWritersPage />} />

              {/* Stories / Library */}
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/stories/:id" element={<StoryDetailPage />} />
              <Route path="/stories/generate" element={<GenerateStoryPage />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

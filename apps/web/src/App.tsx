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
        <p className="text-xl text-muted-foreground">AI-Powered Short Story Generation Platform</p>
        <p className="text-muted-foreground">
          Create unique AI writer personas and generate engaging short stories in your preferred
          style and genre.
        </p>

        <div className="flex gap-4 justify-center mt-8 flex-wrap">
          <div className="px-6 py-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Writers</p>
            <p className="text-2xl font-bold text-primary">AI Personas</p>
          </div>
          <div className="px-6 py-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Stories</p>
            <p className="text-2xl font-bold text-primary">1,500+ Words</p>
          </div>
          <div className="px-6 py-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Generation</p>
            <p className="text-2xl font-bold text-primary">30 Seconds</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Phase 3: Writer Management System Complete
        </p>
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

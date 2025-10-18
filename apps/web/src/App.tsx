function App() {
  return (
    <div className="min-h-screen flex items-center justify-center dark">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-primary">Snack Storyteller</h1>
        <p className="text-muted-foreground text-lg">AI-Powered Short Story Generation Platform</p>
        <div className="flex gap-4 justify-center mt-8">
          <div className="px-4 py-2 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Frontend</p>
            <p className="font-semibold">React + Vite ✅</p>
          </div>
          <div className="px-4 py-2 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Backend</p>
            <p className="font-semibold">NestJS ✅</p>
          </div>
          <div className="px-4 py-2 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Database</p>
            <p className="font-semibold">PostgreSQL ✅</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-8">
          Phase 1: Project Initialization Complete 🎉
        </p>
      </div>
    </div>
  );
}

export default App;

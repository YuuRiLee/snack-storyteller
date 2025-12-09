import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { useAuthStore } from '../stores';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(formData);
      navigate('/writers');
    } catch {
      // Error is already set in the store by the login function
      // No additional handling needed here
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">다시 오신 것을 환영합니다</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">로그인하여 작가와 소설을 관리하세요</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="shrink-0 p-1 rounded-full hover:bg-destructive/20 transition-colors"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호 입력"
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              로그인
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link to="/register" className="text-primary hover:underline">
                회원가입
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

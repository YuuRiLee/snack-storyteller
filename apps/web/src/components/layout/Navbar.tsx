import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../stores';
import { Button } from '../ui';

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">스낵 스토리텔러</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/writers"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              작가
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-writers"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  내 작가
                </Link>
                <Link
                  to="/library"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  라이브러리
                </Link>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{user?.name}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    로그아웃
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">회원가입</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border/50">
            <Link
              to="/writers"
              className="block px-2 py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              작가
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-writers"
                  className="block px-2 py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  내 작가
                </Link>
                <Link
                  to="/library"
                  className="block px-2 py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  라이브러리
                </Link>

                <div className="px-2 pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{user?.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    로그아웃
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-2 px-2 pt-2">
                <Link to="/login" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    로그인
                  </Button>
                </Link>
                <Link to="/register" className="flex-1">
                  <Button className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    회원가입
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

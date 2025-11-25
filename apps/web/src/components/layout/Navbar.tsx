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
            <span className="text-lg font-bold">Snack Storyteller</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/writers"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Writers
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-writers"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Writers
                </Link>
                <Link
                  to="/library"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Library
                </Link>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{user?.name}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
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
              Writers
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-writers"
                  className="block px-2 py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Writers
                </Link>
                <Link
                  to="/library"
                  className="block px-2 py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Library
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
                    Logout
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
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" className="flex-1">
                  <Button className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign Up
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

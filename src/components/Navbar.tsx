import { useState, useEffect, useRef } from 'react';
import { Menu, Search, X, Sun, Moon, User, LogOut, Bookmark, Settings, Newspaper, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SearchBar } from './SearchBar';
import toast from 'react-hot-toast';
import type { Category } from '../types';

interface NavbarProps {
  categories: Category[];
  currentCategory?: string;
}

export function Navbar({ categories, currentCategory }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    toast.success('Signed out successfully.');
    navigate('/');
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
              <Newspaper className="h-7 w-7 text-primary transition-transform duration-200 group-hover:scale-110" />
              <span className="font-display text-xl font-bold text-foreground">NewsHub</span>
            </button>

            {/* Desktop Category Links */}
            <div className="hidden md:flex items-center gap-1">
              {categories.slice(0, 5).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentCategory === cat.slug
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {searchOpen ? (
                <div className="hidden md:block animate-fade-in">
                  <SearchBar autoFocus onClose={() => setSearchOpen(false)} placeholder="Search articles..." />
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* User / Login */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-all duration-200"
                  >
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg animate-scale-in">
                      <div className="p-3 border-b border-border">
                        <p className="text-sm font-medium text-foreground">{userName}</p>
                        <p className="text-xs text-muted-foreground">{userEmail}</p>
                      </div>
                      <button
                        onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                        className="w-full px-3 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors duration-200"
                      >
                        <User className="h-4 w-4" /> My Profile
                      </button>
                      <button
                        onClick={() => { navigate('/profile?tab=saved'); setUserMenuOpen(false); }}
                        className="w-full px-3 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors duration-200"
                      >
                        <Bookmark className="h-4 w-4" /> Saved Articles
                      </button>
                      <button
                        onClick={() => { navigate('/profile?tab=settings'); setUserMenuOpen(false); }}
                        className="w-full px-3 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors duration-200"
                      >
                        <Settings className="h-4 w-4" /> Settings
                      </button>
                      {user?.user_metadata?.role === 'admin' && (
                        <button
                          onClick={() => { navigate('/admin'); setUserMenuOpen(false); }}
                          className="w-full px-3 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors duration-200"
                        >
                          <Shield className="h-4 w-4" /> Admin Panel
                        </button>
                      )}
                        <Settings className="h-4 w-4" /> Settings
                      </button>
                      <div className="border-t border-border" />
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 text-sm text-destructive hover:bg-accent flex items-center gap-2 transition-colors duration-200 rounded-b-lg"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  className="hidden md:block px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200"
                >
                  Sign In
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-background z-[70] shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-primary" />
                <span className="font-display text-lg font-bold text-foreground">NewsHub</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <SearchBar placeholder="Search articles..." onClose={() => setMobileMenuOpen(false)} />
            </div>

            <div className="px-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    currentCategory === cat.slug
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              {user ? (
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full px-4 py-2.5 text-sm font-medium text-foreground bg-accent rounded-lg hover:bg-accent/80 transition-all duration-200"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

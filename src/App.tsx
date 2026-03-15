import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import { CategoryPage } from './pages/CategoryPage';
import { AuthPage } from './pages/AuthPage';
import { AuthCallback } from './pages/AuthCallback';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AboutPage, EditorialPolicyPage, PrivacyPage, TermsPage } from './pages/StaticPage';

function AppContent() {
  const [route, setRoute] = useState(window.location.pathname);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleNavigation = () => {
      setRoute(window.location.pathname);
      setSearchQuery(new URLSearchParams(window.location.search).get('q') || '');
    };

    window.addEventListener('popstate', handleNavigation);

    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      history.pushState = originalPushState;
    };
  }, []);

  if (route === '/' || route === '') return <HomePage />;
  if (route.startsWith('/article/')) return <ArticlePage slug={route.replace('/article/', '')} />;
  if (route.startsWith('/category/')) return <CategoryPage slug={route.replace('/category/', '')} />;
  if (route === '/auth') return <AuthPage />;
  if (route === '/auth/callback') return <AuthCallback />;
  if (route === '/search') return <SearchPage query={searchQuery} />;
  if (route === '/profile') return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
  if (route === '/about') return <AboutPage />;
  if (route === '/editorial-policy') return <EditorialPolicyPage />;
  if (route === '/privacy') return <PrivacyPage />;
  if (route === '/terms') return <TermsPage />;
  return <NotFoundPage />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
          <ToastContainer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '8px',
                fontSize: '14px',
              },
            }}
          />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

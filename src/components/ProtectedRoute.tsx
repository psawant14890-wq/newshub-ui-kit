import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      history.pushState(null, '', '/auth');
      window.dispatchEvent(new Event('popstate'));
    }
  }, [isLoading, user]);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!user) return null;
  return <>{children}</>;
}

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoles, type AppRole } from '../hooks/useRoles';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole | AppRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useRoles();

  const requiredRoles = requiredRole ? (Array.isArray(requiredRole) ? requiredRole : [requiredRole]) : [];
  const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.some(role => roles.includes(role));
  const isLoading = authLoading || (requiredRoles.length > 0 && rolesLoading);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      history.pushState(null, '', '/auth');
      window.dispatchEvent(new Event('popstate'));
    } else if (requiredRoles.length > 0 && !hasRequiredRole) {
      history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
  }, [isLoading, user, hasRequiredRole, requiredRoles.length]);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!user) return null;
  if (requiredRoles.length > 0 && !hasRequiredRole) return null;
  return <>{children}</>;
}

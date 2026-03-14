import { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { LoadingSpinner } from '../components';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, signup } = useAuth();
  const { showToast } = useToastContext();

  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!signInForm.email) errs.email = 'Email is required';
    if (!signInForm.password) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await login(signInForm.email, signInForm.password);
      showToast({ message: 'Welcome back!', type: 'success' });
      navigate('/');
    } catch {
      setErrors({ submit: 'Sign in failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!signUpForm.name) errs.name = 'Name is required';
    if (!signUpForm.email) errs.email = 'Email is required';
    if (!signUpForm.password) errs.password = 'Password is required';
    if (signUpForm.password !== signUpForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await signup(signUpForm.name, signUpForm.email, signUpForm.password);
      showToast({ message: 'Account created!', type: 'success' });
      navigate('/');
    } catch {
      setErrors({ submit: 'Sign up failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-primary" />
            <span className="font-display text-2xl font-bold text-foreground">NewsHub</span>
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-border">
            <button
              onClick={() => { setIsSignUp(false); setErrors({}); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                !isSignUp ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setErrors({}); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                isSignUp ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {!isSignUp ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={signInForm.email}
                  onChange={e => setSignInForm({ ...signInForm, email: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 ${
                    errors.email ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <input
                  type="password"
                  value={signInForm.password}
                  onChange={e => setSignInForm({ ...signInForm, password: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 ${
                    errors.password ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>
              {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                <input
                  type="text"
                  value={signUpForm.name}
                  onChange={e => setSignUpForm({ ...signUpForm, name: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 ${
                    errors.name ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={signUpForm.email}
                  onChange={e => setSignUpForm({ ...signUpForm, email: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 ${
                    errors.email ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <input
                  type="password"
                  value={signUpForm.password}
                  onChange={e => setSignUpForm({ ...signUpForm, password: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 ${
                    errors.password ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={signUpForm.confirmPassword}
                  onChange={e => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 ${
                    errors.confirmPassword ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>
              {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our{' '}
          <button onClick={() => navigate('/terms')} className="text-primary hover:underline">Terms</button> and{' '}
          <button onClick={() => navigate('/privacy')} className="text-primary hover:underline">Privacy Policy</button>.
        </p>
      </div>
    </div>
  );
}

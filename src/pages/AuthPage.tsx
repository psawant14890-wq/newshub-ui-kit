import { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components';
import toast from 'react-hot-toast';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');
  const { signIn, signUp, signInWithGoogle, signInWithGitHub, resetPassword } = useAuth();

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
      const result = await signIn(signInForm.email, signInForm.password);
      if (result.error) {
        setErrors({ submit: result.error });
        toast.error(result.error);
      } else {
        toast.success('Welcome back!');
        navigate('/profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!signUpForm.name) errs.name = 'Name is required';
    if (!signUpForm.email) errs.email = 'Email is required';
    if (!signUpForm.password || signUpForm.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (signUpForm.password !== signUpForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.confirmPassword) toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(signUpForm.email, signUpForm.password, signUpForm.name);
      if (result.error) {
        setErrors({ submit: result.error });
        toast.error(result.error);
      } else {
        setSuccessMsg('Account created! Check your email to verify.');
        toast.success('Account created! Check your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!signInForm.email) {
      setErrors({ email: 'Enter your email first' });
      return;
    }
    const result = await resetPassword(signInForm.email);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Reset email sent! Check your inbox.');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Welcome!');
      navigate('/profile');
    }
    setGoogleLoading(false);
  };

  const handleGitHubSignIn = async () => {
    setGithubLoading(true);
    const result = await signInWithGitHub();
    if (result.error) {
      toast.error(result.error);
      setGithubLoading(false);
    }
    // GitHub redirects, so loading stays until redirect
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
              onClick={() => { setIsSignUp(false); setErrors({}); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                !isSignUp ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setErrors({}); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                isSignUp ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 text-primary text-sm font-medium">
              {successMsg}
            </div>
          )}

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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-foreground">Password</label>
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
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
                  placeholder="Minimum 8 characters"
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-all duration-200"
            >
              {googleLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              )}
              Google
            </button>
            <button
              onClick={handleGitHubSignIn}
              disabled={githubLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-all duration-200"
            >
              {githubLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              )}
              GitHub
            </button>
          </div>
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

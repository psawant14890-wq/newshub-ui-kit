import { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Status = 'idle' | 'checking' | 'no-user' | 'already-admin' | 'admin-exists' | 'ready' | 'working' | 'done' | 'error';

export function SetupAdminPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('checking');
  const [message, setMessage] = useState('');

  const check = async () => {
    setStatus('checking');
    if (!user) { setStatus('no-user'); return; }
    const { data: mine } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (mine) { setStatus('already-admin'); return; }
    const { count } = await supabase
      .from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'admin');
    if ((count ?? 0) > 0) { setStatus('admin-exists'); return; }
    setStatus('ready');
  };

  useEffect(() => { check(); /* eslint-disable-next-line */ }, [user?.id]);

  const bootstrap = async () => {
    if (!user) return;
    setStatus('working');
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'admin' });
    if (error) { setStatus('error'); setMessage(error.message); return; }
    setStatus('done');
    setTimeout(() => { window.location.href = '/admin'; }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-primary/10"><ShieldCheck className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Admin Setup</h1>
            <p className="text-sm text-muted-foreground">One-click bootstrap for the first admin.</p>
          </div>
        </div>

        {status === 'checking' && (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking current state…</div>
        )}

        {status === 'no-user' && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">You must be signed in first.</p>
            <a href="/auth" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">Sign in</a>
          </div>
        )}

        {status === 'already-admin' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-5 w-5" /> You are already an admin.</div>
            <a href="/admin" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">Go to Admin</a>
          </div>
        )}

        {status === 'admin-exists' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-amber-600"><AlertCircle className="h-5 w-5 mt-0.5" />
              <p className="text-sm">An admin already exists for this project. For security, only an existing admin can grant new admin roles. Ask them to add you from the Admin panel.</p>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">No admin found yet. Click below to make <strong className="text-foreground">{user?.email}</strong> the first admin.</p>
            <button onClick={bootstrap} className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition">
              Make me admin
            </button>
          </div>
        )}

        {status === 'working' && (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Granting admin role…</div>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-5 w-5" /> Done! Redirecting to /admin…</div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-destructive"><AlertCircle className="h-5 w-5 mt-0.5" />
              <p className="text-sm">{message || 'Something went wrong.'}</p>
            </div>
            <button onClick={check} className="px-4 py-2 border border-border rounded-lg text-sm">Retry check</button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
          Route: <code>/setup-admin</code> — safe to leave in place; it self-disables once an admin exists.
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Search, Shield, Trash2, UserPlus, Users, Ban, CheckCircle2, Crown, Zap } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { assignRole, removeRole, type AppRole } from '../hooks/useRoles';
import toast from 'react-hot-toast';

interface ManagedUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  suspended: boolean;
  is_premium: boolean;
  total_points: number;
  created_at: string;
  roles: AppRole[];
}

const ROLE_COLORS: Record<string, string> = {
  admin:  'bg-destructive/10 text-destructive',
  editor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  writer: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  reader: 'bg-muted text-muted-foreground',
};

export function UserManagementEnhanced() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('writer');

  useEffect(() => { void loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [{ data: profiles }, { data: roleRows }] = await Promise.all([
        supabase.from('profiles').select('id, name, avatar_url, suspended, is_premium, total_points, created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      const roleMap = new Map<string, AppRole[]>();
      (roleRows || []).forEach(r => {
        const arr = roleMap.get(r.user_id) || [];
        arr.push(r.role as AppRole);
        roleMap.set(r.user_id, arr);
      });
      setUsers((profiles || []).map(p => ({
        id: p.id,
        name: p.name,
        avatar_url: p.avatar_url,
        suspended: p.suspended || false,
        is_premium: p.is_premium || false,
        total_points: p.total_points || 0,
        created_at: p.created_at,
        roles: roleMap.get(p.id) || [],
      })));
    } catch (e) {
      console.error(e);
      toast.error('Could not load users');
    } finally { setLoading(false); }
  };

  const logAction = async (action: string, target: string, details?: any) => {
    if (!me) return;
    await supabase.from('admin_actions').insert({ admin_id: me.id, action, target_user: target, details });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(u => {
      if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false;
      if (!q) return true;
      return (u.name || '').toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    });
  }, [users, search, roleFilter]);

  const toggleSuspend = async (u: ManagedUser) => {
    const next = !u.suspended;
    const { error } = await supabase.from('profiles').update({ suspended: next }).eq('id', u.id);
    if (error) return toast.error('Failed');
    toast.success(next ? 'User suspended' : 'User reinstated');
    await logAction(next ? 'suspend_user' : 'unsuspend_user', u.id);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, suspended: next } : x));
  };

  const togglePremium = async (u: ManagedUser) => {
    const next = !u.is_premium;
    const { error } = await supabase.from('profiles').update({ is_premium: next }).eq('id', u.id);
    if (error) return toast.error('Failed');
    toast.success(next ? 'Granted premium' : 'Removed premium');
    await logAction(next ? 'grant_premium' : 'revoke_premium', u.id);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_premium: next } : x));
  };

  const handleAddRole = async () => {
    if (!newUserId.trim()) return toast.error('User ID required');
    const ok = await assignRole(newUserId.trim(), newRole);
    if (!ok) return toast.error('Failed to assign');
    toast.success(`Assigned ${newRole}`);
    await logAction('assign_role', newUserId.trim(), { role: newRole });
    setNewUserId('');
    await loadUsers();
  };

  const handleRemoveRole = async (uid: string, role: AppRole) => {
    const ok = await removeRole(uid, role);
    if (!ok) return toast.error('Failed');
    toast.success('Role removed');
    await logAction('remove_role', uid, { role });
    await loadUsers();
  };

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-card border border-border rounded-lg">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Assign Role by User ID
        </h3>
        <div className="flex gap-2 flex-wrap">
          <input value={newUserId} onChange={e => setNewUserId(e.target.value)} placeholder="User UUID"
            className="flex-1 min-w-[200px] px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <select value={newRole} onChange={e => setNewRole(e.target.value as AppRole)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm">
            <option value="writer">Writer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleAddRole} className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90">Assign</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}
          className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm">
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="editor">Editors</option>
          <option value="writer">Writers</option>
          <option value="reader">Readers</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border text-xs text-muted-foreground flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> {filtered.length} users
        </div>
        {filtered.map(u => (
          <div key={u.id} className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-accent/30">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                {(u.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground truncate">{u.name || 'Unnamed'}</p>
                {u.is_premium && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
                {u.suspended && <span className="text-[10px] font-semibold uppercase text-destructive">Suspended</span>}
              </div>
              <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}…</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-500" />{u.total_points} pts</span>
                <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {u.roles.length === 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">reader</span>}
                {u.roles.map(r => (
                  <div key={r} className="flex items-center gap-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[r]}`}>{r}</span>
                    <button onClick={() => handleRemoveRole(u.id, r)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 items-end">
              <button onClick={() => togglePremium(u)} className={`text-xs px-2.5 py-1 rounded border ${u.is_premium ? 'border-yellow-500/40 text-yellow-600 dark:text-yellow-400' : 'border-border text-muted-foreground'} hover:bg-accent`}>
                {u.is_premium ? 'Revoke Premium' : 'Grant Premium'}
              </button>
              <button onClick={() => toggleSuspend(u)} className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1 ${u.suspended ? 'border-green-500/40 text-green-600 dark:text-green-400' : 'border-destructive/40 text-destructive'} hover:bg-accent`}>
                {u.suspended ? <><CheckCircle2 className="h-3 w-3" /> Reinstate</> : <><Ban className="h-3 w-3" /> Suspend</>}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">No users match your filter.</p>
        )}
      </div>
    </div>
  );
}

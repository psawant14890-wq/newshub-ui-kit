import { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, Users, Search } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { getAllUsersWithRoles, assignRole, removeRole, type AppRole } from '../hooks/useRoles';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  editor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  writer: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  reader: 'bg-muted text-muted-foreground',
};

export function RoleManager() {
  const [users, setUsers] = useState<Array<{ user_id: string; email: string; name: string; roles: AppRole[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('writer');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsersWithRoles();
    setUsers(data);
    setLoading(false);
  };

  const handleAssignByEmail = async () => {
    if (!newEmail.trim()) return;
    setAssigning(true);
    try {
      // Look up user by email in profiles or auth
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('name', `%${newEmail}%`)
        .limit(1)
        .maybeSingle();

      if (!profile) {
        toast.error('User not found. They must sign up first.');
        return;
      }

      const success = await assignRole(profile.id, newRole);
      if (success) {
        toast.success(`Assigned ${newRole} role!`);
        setNewEmail('');
        await loadUsers();
      } else toast.error('Failed to assign role.');
    } catch { toast.error('Error assigning role.'); }
    finally { setAssigning(false); }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    const success = await removeRole(userId, role);
    if (success) {
      toast.success('Role removed.');
      await loadUsers();
    }
  };

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      {/* Add role */}
      <div className="p-4 bg-card border border-border rounded-lg">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Assign Role
        </h3>
        <div className="flex gap-2">
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="Username or email"
            className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
          <select value={newRole} onChange={e => setNewRole(e.target.value as AppRole)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm">
            <option value="writer">Writer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleAssignByEmail} disabled={assigning}
            className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
            {assigning ? '...' : 'Assign'}
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Users with Roles ({users.length})
        </h3>
        {users.map(u => (
          <div key={u.user_id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}...</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {u.roles.map(role => (
                <div key={role} className="flex items-center gap-1">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLORS[role] || ROLE_COLORS.reader}`}>
                    {role}
                  </span>
                  <button onClick={() => handleRemoveRole(u.user_id, role)}
                    className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No users with roles assigned yet.</p>
        )}
      </div>
    </div>
  );
}

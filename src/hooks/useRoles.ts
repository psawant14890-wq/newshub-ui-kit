import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type AppRole = 'admin' | 'editor' | 'writer' | 'reader';

interface RoleState {
  roles: AppRole[];
  isAdmin: boolean;
  isEditor: boolean;
  isWriter: boolean;
  loading: boolean;
}

export function useRoles(): RoleState {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRoles([]); setLoading(false); return; }
    fetchRoles(user.id);
  }, [user?.id]);

  const fetchRoles = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      if (error) throw error;
      setRoles((data || []).map(r => r.role as AppRole));
    } catch {
      // Check legacy metadata fallback
      const metaRole = user?.user_metadata?.role || user?.app_metadata?.role;
      if (metaRole === 'admin') setRoles(['admin']);
      else setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    roles,
    isAdmin: roles.includes('admin'),
    isEditor: roles.includes('editor') || roles.includes('admin'),
    isWriter: roles.includes('writer') || roles.includes('editor') || roles.includes('admin'),
    loading,
  };
}

// Admin helper functions
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  return (data || []).map(r => r.role as AppRole);
}

export async function assignRole(userId: string, role: AppRole): Promise<boolean> {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
  return !error;
}

export async function removeRole(userId: string, role: AppRole): Promise<boolean> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);
  return !error;
}

export async function getAllUsersWithRoles(): Promise<Array<{
  user_id: string;
  email: string;
  name: string;
  roles: AppRole[];
}>> {
  try {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id, role');
    
    if (!roleData || roleData.length === 0) return [];

    // Group roles by user
    const userMap = new Map<string, AppRole[]>();
    roleData.forEach(r => {
      const existing = userMap.get(r.user_id) || [];
      existing.push(r.role as AppRole);
      userMap.set(r.user_id, existing);
    });

    // Get profiles
    const userIds = Array.from(userMap.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    return userIds.map(uid => {
      const profile = profiles?.find(p => p.id === uid);
      return {
        user_id: uid,
        email: '',
        name: profile?.name || 'Unknown',
        roles: userMap.get(uid) || [],
      };
    });
  } catch {
    return [];
  }
}

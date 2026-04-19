import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function useFollow(writerId?: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!writerId) return;
    void load();
  }, [writerId, user?.id]);

  const load = async () => {
    if (!writerId) return;
    const { count } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('writer_id', writerId);
    setFollowersCount(count || 0);
    if (user) {
      const { data } = await supabase.from('followers').select('id').eq('writer_id', writerId).eq('follower_id', user.id).maybeSingle();
      setIsFollowing(!!data);
    }
  };

  const toggleFollow = async () => {
    if (!user) { window.location.href = '/auth'; return; }
    if (!writerId || writerId === user.id) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase.from('followers').delete().eq('writer_id', writerId).eq('follower_id', user.id);
        setIsFollowing(false);
        setFollowersCount(c => Math.max(0, c - 1));
      } else {
        await supabase.from('followers').insert({ writer_id: writerId, follower_id: user.id });
        setIsFollowing(true);
        setFollowersCount(c => c + 1);
        await supabase.from('notifications').insert({
          user_id: writerId,
          type: 'new_follower',
          title: 'New follower',
          message: `${user.email?.split('@')[0]} started following you`,
          link: `/author/${user.id}`,
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally { setLoading(false); }
  };

  return { isFollowing, toggleFollow, followersCount, loading };
}

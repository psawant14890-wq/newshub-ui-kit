import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points_required: number;
}

export interface EarnedBadge extends Badge {
  earned_at: string;
}

export function useBadges(userId?: string) {
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: catalog } = await supabase
          .from('badges')
          .select('*')
          .order('points_required', { ascending: true });
        if (cancelled) return;
        setAllBadges((catalog || []) as Badge[]);

        if (userId) {
          const [{ data: earned }, { data: profile }] = await Promise.all([
            supabase
              .from('user_badges')
              .select('earned_at, badge:badges(*)')
              .eq('user_id', userId),
            supabase.from('profiles').select('total_points').eq('id', userId).maybeSingle(),
          ]);
          if (cancelled) return;
          const mapped: EarnedBadge[] = (earned || []).map((row: any) => ({
            ...(row.badge as Badge),
            earned_at: row.earned_at,
          }));
          setBadges(mapped);
          setPoints(profile?.total_points || 0);
        }
      } catch (e) {
        console.error('useBadges', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { badges, allBadges, points, loading };
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string | null;
  total_points: number;
  badge_count: number;
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(limit);
  if (error) {
    console.error('leaderboard', error);
    return [];
  }
  return (data || []) as LeaderboardEntry[];
}

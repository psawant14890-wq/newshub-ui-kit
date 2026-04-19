import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export type ReactionType = 'informative' | 'shocking' | 'happy' | 'sad' | 'angry';

export function useReactions(articleSlug: string) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<ReactionType, number>>({
    informative: 0, shocking: 0, happy: 0, sad: 0, angry: 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!articleSlug) return;
    void load();
  }, [articleSlug, user?.id]);

  const load = async () => {
    const { data } = await supabase.from('article_reactions').select('reaction_type, user_id').eq('article_slug', articleSlug);
    if (data) {
      const counts: Record<ReactionType, number> = { informative: 0, shocking: 0, happy: 0, sad: 0, angry: 0 };
      data.forEach((r: any) => { if (counts[r.reaction_type as ReactionType] !== undefined) counts[r.reaction_type as ReactionType]++; });
      setReactions(counts);
      if (user) {
        const mine = data.find((r: any) => r.user_id === user.id);
        setUserReaction(mine ? (mine.reaction_type as ReactionType) : null);
      }
    }
  };

  const toggleReaction = async (type: ReactionType) => {
    if (!user) { toast.error('Please log in to react'); return; }
    setLoading(true);
    try {
      if (userReaction === type) {
        await supabase.from('article_reactions').delete().eq('article_slug', articleSlug).eq('user_id', user.id);
        setUserReaction(null);
        setReactions(p => ({ ...p, [type]: Math.max(0, p[type] - 1) }));
      } else {
        if (userReaction) {
          await supabase.from('article_reactions').update({ reaction_type: type }).eq('article_slug', articleSlug).eq('user_id', user.id);
          setReactions(p => ({ ...p, [userReaction]: Math.max(0, p[userReaction] - 1), [type]: p[type] + 1 }));
        } else {
          await supabase.from('article_reactions').insert({ article_slug: articleSlug, user_id: user.id, reaction_type: type });
          setReactions(p => ({ ...p, [type]: p[type] + 1 }));
        }
        setUserReaction(type);
      }
    } catch (err: any) {
      toast.error(err.message || 'Reaction failed');
    } finally { setLoading(false); }
  };

  return { reactions, userReaction, toggleReaction, loading };
}

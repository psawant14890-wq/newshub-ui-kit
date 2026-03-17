import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface UseArticleLikeReturn {
  isLiked: boolean;
  likesCount: number;
  toggleLike: () => Promise<void>;
  loading: boolean;
}

export function useArticleLike(articleSlug: string): UseArticleLikeReturn {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLikes = async () => {
      // Get total likes count
      const { count } = await supabase
        .from('article_likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_slug', articleSlug);
      setLikesCount(count || 0);

      // Check if current user liked
      if (user) {
        const { data } = await supabase
          .from('article_likes')
          .select('id')
          .eq('article_slug', articleSlug)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsLiked(!!data);
      }
    };
    fetchLikes();
  }, [articleSlug, user]);

  const toggleLike = async () => {
    if (!user) {
      toast.error('Login to like articles');
      return;
    }
    setLoading(true);
    try {
      if (isLiked) {
        await supabase
          .from('article_likes')
          .delete()
          .eq('article_slug', articleSlug)
          .eq('user_id', user.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('article_likes')
          .insert({ article_slug: articleSlug, user_id: user.id });
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, likesCount, toggleLike, loading };
}

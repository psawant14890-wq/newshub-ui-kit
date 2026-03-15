import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface UseBookmarkReturn {
  isSaved: boolean;
  toggleSave: () => Promise<void>;
  loading: boolean;
}

export function useBookmark(
  articleSlug: string,
  articleTitle: string,
  articleThumbnail?: string | null,
  articleCategory?: string
): UseBookmarkReturn {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      return;
    }
    const check = async () => {
      const { data } = await supabase
        .from('saved_articles')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_slug', articleSlug)
        .maybeSingle();
      setIsSaved(!!data);
    };
    check();
  }, [user, articleSlug]);

  const toggleSave = async () => {
    if (!user) {
      history.pushState(null, '', '/auth');
      window.dispatchEvent(new Event('popstate'));
      return;
    }
    setLoading(true);
    try {
      if (isSaved) {
        await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', user.id)
          .eq('article_slug', articleSlug);
        setIsSaved(false);
        toast.success('Removed from saved.');
      } else {
        await supabase.from('saved_articles').insert({
          user_id: user.id,
          article_slug: articleSlug,
          article_title: articleTitle,
          article_thumbnail: articleThumbnail || null,
          article_category: articleCategory || null,
        });
        setIsSaved(true);
        toast.success('Article saved!');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return { isSaved, toggleSave, loading };
}

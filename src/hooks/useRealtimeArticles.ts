import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface LiveArticle {
  id: string;
  title: string;
  slug: string;
  category?: string;
}

export function useRealtimeArticles() {
  const [latest, setLatest] = useState<LiveArticle | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel('articles-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'articles' },
        (payload) => {
          const row = payload.new as { id: string; title: string; slug: string; category?: string; status?: string };
          if (row.status && row.status !== 'published') return;
          setLatest({ id: row.id, title: row.title, slug: row.slug, category: row.category });
          setCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const dismiss = () => { setLatest(null); setCount(0); };
  return { latest, count, dismiss };
}

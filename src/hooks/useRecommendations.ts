import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getTrendingArticles } from '../lib/api';
import type { Article } from '../types';

function mapArticle(row: any): Article {
  return {
    id: row.id, title: row.title, slug: row.slug,
    excerpt: row.excerpt || '', content: row.body || row.content || '',
    featured_image_url: row.thumbnail || row.featured_image_url || null,
    author_id: row.author_id || null, category_id: null,
    is_featured: false, is_breaking: false, is_opinion: false, is_fact_checked: false,
    view_count: row.views || 0,
    published_at: row.published_at || row.created_at,
    updated_at: row.updated_at || row.created_at,
    created_at: row.created_at,
    meta_title: null, meta_description: null,
    author: { id: '0', name: row.author_name || 'Staff', slug: 'staff', bio: '', avatar_url: row.author_avatar || null, twitter_handle: null, email: null, created_at: row.created_at },
    category: row.category ? { id: row.category, name: row.category, slug: row.category.toLowerCase().replace(/\s+/g, '-'), description: '', display_order: 0, created_at: row.created_at } : undefined,
  };
}

export function useRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data: history } = await supabase
          .from('reading_history')
          .select('article_slug')
          .eq('user_id', user.id)
          .order('read_at', { ascending: false })
          .limit(10);

        if (history && history.length > 0) {
          const readSlugs = history.map(h => h.article_slug);
          const { data } = await supabase
            .from('articles')
            .select('*')
            .eq('status', 'published')
            .not('slug', 'in', `(${readSlugs.join(',')})`)
            .order('views', { ascending: false })
            .limit(3);
          if (data && data.length > 0) {
            setRecommendations(data.map(mapArticle));
            setLoading(false);
            return;
          }
        }
      }
      const trending = await getTrendingArticles(3);
      setRecommendations(trending);
    } catch {
      const trending = await getTrendingArticles(3);
      setRecommendations(trending);
    } finally {
      setLoading(false);
    }
  };

  return { recommendations, loading };
}

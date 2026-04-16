import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PendingTopic {
  id: string;
  title: string;
  source: string;
  source_url: string;
  score: number;
  status: 'pending' | 'generating' | 'generated' | 'rejected';
  article_id?: string;
  created_at: string;
}

export function usePendingTopics() {
  const [topics, setTopics] = useState<PendingTopic[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pending_topics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setTopics(data as PendingTopic[]);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const addTopic = useCallback(async (title: string, source: string, sourceUrl: string, score: number) => {
    // Dedup: check if similar title exists in last 24h
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: existing } = await supabase
      .from('pending_topics')
      .select('id')
      .gte('created_at', dayAgo)
      .ilike('title', `%${title.slice(0, 40)}%`)
      .limit(1);

    if (existing && existing.length > 0) return null; // duplicate

    const { data, error } = await supabase
      .from('pending_topics')
      .insert({ title, source, source_url: sourceUrl, score, status: 'pending' })
      .select()
      .single();
    
    if (!error && data) {
      setTopics(prev => [data as PendingTopic, ...prev]);
      return data;
    }
    return null;
  }, []);

  const updateStatus = useCallback(async (id: string, status: PendingTopic['status'], articleId?: string) => {
    const updates: Record<string, unknown> = { status };
    if (articleId) updates.article_id = articleId;
    await supabase.from('pending_topics').update(updates).eq('id', id);
    setTopics(prev => prev.map(t => t.id === id ? { ...t, status, article_id: articleId } : t));
  }, []);

  const rejectTopic = useCallback(async (id: string) => {
    await updateStatus(id, 'rejected');
  }, [updateStatus]);

  return { topics, loading, fetchTopics, addTopic, updateStatus, rejectTopic };
}

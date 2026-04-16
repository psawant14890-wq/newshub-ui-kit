import { useState, useRef, useCallback, useEffect } from 'react';
import { useArticleGenerator } from './useArticleGenerator';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useAutoScheduler() {
  const [active, setActive] = useState(false);
  const [nextScanIn, setNextScanIn] = useState(0);
  const [draftsGenerated, setDraftsGenerated] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { generateArticle } = useArticleGenerator();

  const scanAndGenerate = useCallback(async () => {
    try {
      const res = await fetch('https://www.reddit.com/r/worldnews/hot.json?limit=5');
      if (!res.ok) return;
      const data = await res.json();
      const posts = data?.data?.children || [];
      if (posts.length === 0) return;

      for (const child of posts) {
        const post = child?.data;
        if (!post || post.stickied) continue;

        // Dedup: check pending_topics in last 24h
        const dayAgo = new Date(Date.now() - 86400000).toISOString();
        const { data: existing } = await supabase
          .from('pending_topics')
          .select('id')
          .gte('created_at', dayAgo)
          .ilike('title', `%${post.title.slice(0, 40)}%`)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Add to pending_topics
        const { data: topic } = await supabase
          .from('pending_topics')
          .insert({
            title: post.title,
            source: 'Reddit r/worldnews',
            source_url: `https://reddit.com${post.permalink}`,
            score: post.score || 0,
            status: 'generating',
          })
          .select()
          .single();

        if (!topic) continue;

        // Generate article
        const article = await generateArticle(post.title, undefined, post.selftext?.slice(0, 300));
        if (article) {
          await supabase
            .from('pending_topics')
            .update({ status: 'generated', article_id: article.id })
            .eq('id', topic.id);
          setDraftsGenerated(p => p + 1);
          toast.success(`New AI draft: ${post.title.slice(0, 50)}...`);
        } else {
          await supabase
            .from('pending_topics')
            .update({ status: 'pending' })
            .eq('id', topic.id);
        }
        break; // Only one per scan cycle
      }
    } catch {
      // silent
    }
  }, [generateArticle]);

  const start = useCallback(() => {
    setActive(true);
    setNextScanIn(30);
    scanAndGenerate();

    countdownRef.current = setInterval(() => {
      setNextScanIn(prev => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 60000);

    intervalRef.current = setInterval(() => {
      scanAndGenerate();
    }, 30 * 60 * 1000);
  }, [scanAndGenerate]);

  const stop = useCallback(() => {
    setActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { active, start, stop, nextScanIn, draftsGenerated };
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { useArticleGenerator } from './useArticleGenerator';
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
      const res = await fetch('https://www.reddit.com/r/worldnews/hot.json?limit=3');
      if (!res.ok) return;
      const data = await res.json();
      const posts = data?.data?.children || [];
      if (posts.length === 0) return;

      const randomPost = posts[Math.floor(Math.random() * posts.length)]?.data;
      if (!randomPost) return;

      const article = await generateArticle(randomPost.title, undefined, randomPost.selftext?.slice(0, 300));
      if (article) {
        setDraftsGenerated(p => p + 1);
        toast.success(`New AI draft: ${randomPost.title.slice(0, 50)}...`);
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

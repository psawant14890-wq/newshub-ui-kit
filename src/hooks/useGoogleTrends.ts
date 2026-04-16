import { useState, useCallback } from 'react';

export interface TrendItem {
  title: string;
  traffic: string;
  relatedQueries: string[];
  source: 'google_trends';
}

/**
 * Fetches trending search terms. Since Google Trends has no public API,
 * we use the Daily Trends RSS feed via allorigins proxy.
 */
export function useGoogleTrends() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrends = useCallback(async (geo = 'US') => {
    setLoading(true);
    try {
      const feedUrl = `https://trends.google.com/trending/rss?geo=${geo}`;
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`);
      if (!res.ok) throw new Error('Failed to fetch trends');
      
      const json = await res.json();
      const parser = new DOMParser();
      const doc = parser.parseFromString(json.contents, 'text/xml');
      const items = doc.querySelectorAll('item');
      
      const results: TrendItem[] = [];
      Array.from(items).slice(0, 20).forEach(item => {
        const title = item.querySelector('title')?.textContent || '';
        const traffic = item.querySelector('ht\\:approx_traffic, approx_traffic')?.textContent || '';
        // Related queries from news items
        const newsItems = item.querySelectorAll('ht\\:news_item_title, news_item_title');
        const relatedQueries = Array.from(newsItems).map(n => n.textContent || '').filter(Boolean).slice(0, 3);
        
        if (title) {
          results.push({ title, traffic, relatedQueries, source: 'google_trends' });
        }
      });

      setTrends(results);
    } catch {
      // Fallback: generate trending topics from multiple RSS sources
      try {
        const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'));
        if (res.ok) {
          const json = await res.json();
          const parser = new DOMParser();
          const doc = parser.parseFromString(json.contents, 'text/xml');
          const items = doc.querySelectorAll('item');
          const results: TrendItem[] = Array.from(items).slice(0, 15).map(item => ({
            title: item.querySelector('title')?.textContent || '',
            traffic: '',
            relatedQueries: [],
            source: 'google_trends' as const,
          })).filter(t => t.title);
          setTrends(results);
        }
      } catch { /* silent */ }
    } finally {
      setLoading(false);
    }
  }, []);

  return { trends, loading, fetchTrends };
}

import { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface TrendingTopic {
  title: string;
  source: string;
  url: string;
  score: number;
}

interface TrendingTopicsWidgetProps {
  onGenerate?: (topic: string, source: string, url: string) => void;
}

export function TrendingTopicsWidget({ onGenerate }: TrendingTopicsWidgetProps) {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTopics(); }, []);

  const fetchTopics = async () => {
    setLoading(true);
    const results: TrendingTopic[] = [];

    // Reddit
    const subs = ['worldnews', 'technology', 'sports'];
    await Promise.all(subs.map(async (sub) => {
      try {
        const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=4`);
        if (res.ok) {
          const json = await res.json();
          (json.data?.children || []).forEach((child: any) => {
            const d = child.data;
            if (d && !d.stickied) {
              results.push({
                title: d.title,
                source: `Reddit r/${sub}`,
                url: `https://reddit.com${d.permalink}`,
                score: d.score || 0,
              });
            }
          });
        }
      } catch { /* skip */ }
    }));

    // RSS via allorigins
    const feeds = [
      { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', name: 'NY Times' },
    ];
    await Promise.all(feeds.map(async (feed) => {
      try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`);
        if (res.ok) {
          const json = await res.json();
          const parser = new DOMParser();
          const doc = parser.parseFromString(json.contents, 'text/xml');
          const items = doc.querySelectorAll('item');
          Array.from(items).slice(0, 3).forEach(item => {
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            if (title) {
              results.push({ title, source: feed.name, url: link, score: 0 });
            }
          });
        }
      } catch { /* skip */ }
    }));

    // Sort by score descending and dedupe
    const seen = new Set<string>();
    const deduped = results.filter(t => {
      const key = t.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => b.score - a.score).slice(0, 10);

    setTopics(deduped);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Trending Topics
        </h3>
        <button onClick={fetchTopics} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No trending topics found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topics.map((topic, i) => (
            <div key={i} className="p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
              <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">{topic.title}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{topic.source}</span>
                  {topic.score > 0 && (
                    <span className="text-xs text-muted-foreground">{topic.score.toLocaleString()} pts</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <a href={topic.url} target="_blank" rel="noopener noreferrer"
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {onGenerate && (
                    <button onClick={() => onGenerate(topic.title, topic.source, topic.url)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-all">
                      <Zap className="h-3 w-3" /> Generate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

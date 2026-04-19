import { useState } from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { generateWithGemini } from '../lib/gemini';
import { LoadingSpinner } from './LoadingSpinner';

interface Props { slug: string; body: string; }

interface Summary { summary: string[]; reading_time_saved: string; }

export function ArticleSummarizer({ slug, body }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (open && data) { setOpen(false); return; }
    setOpen(true);
    const cacheKey = `tldr:${slug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setData(JSON.parse(cached)); return; }
    setLoading(true);
    try {
      const text = body.replace(/<[^>]+>/g, '').slice(0, 4000);
      const prompt = `Summarize this news article in exactly 3 bullet points. Each point max 20 words. Return ONLY JSON: {"summary":["point1","point2","point3"],"reading_time_saved":"3 min"}\n\nArticle:\n${text}`;
      const raw = await generateWithGemini(prompt);
      const json = raw.match(/\{[\s\S]*\}/)?.[0];
      if (json) {
        const parsed = JSON.parse(json) as Summary;
        setData(parsed);
        localStorage.setItem(cacheKey, json);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="my-6">
      <button onClick={generate}
        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-all">
        <Sparkles className="h-4 w-4" /> {open ? 'Hide' : 'Show'} TL;DR Summary
      </button>
      {open && (
        <div className="mt-4 p-5 bg-card border border-primary/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> AI Summary
            </h3>
            {data && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Saved you {data.reading_time_saved}</span>}
          </div>
          {loading ? <LoadingSpinner /> : data && (
            <ul className="space-y-2">
              {data.summary.map((p, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <span className="text-primary font-bold">•</span> {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

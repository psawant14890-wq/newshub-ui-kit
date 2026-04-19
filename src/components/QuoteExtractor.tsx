import { useState, useEffect } from 'react';
import { Quote, Twitter, Copy, Check } from 'lucide-react';
import { generateWithGemini } from '../lib/gemini';

interface Props { slug: string; title: string; body: string; }

export function QuoteExtractor({ slug, title, body }: Props) {
  const [data, setData] = useState<{ quote: string; context: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cacheKey = `quote:${slug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { try { setData(JSON.parse(cached)); return; } catch {} }
    const text = body.replace(/<[^>]+>/g, '').slice(0, 3000);
    const prompt = `Find the single most powerful, shareable, or thought-provoking quote from this article. Return ONLY JSON: {"quote":"the exact quote text","context":"one sentence explaining why important"}\n\nArticle: ${text}`;
    generateWithGemini(prompt).then(raw => {
      const json = raw.match(/\{[\s\S]*\}/)?.[0];
      if (json) { try { const p = JSON.parse(json); setData(p); localStorage.setItem(cacheKey, json); } catch {} }
    }).catch(() => {});
  }, [slug, body]);

  if (!data) return null;

  const tweet = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${data.quote}" — from "${title}"`)}`;
    window.open(url, '_blank');
  };
  const copy = () => { navigator.clipboard.writeText(data.quote); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="my-8 p-6 bg-primary/5 border-l-4 border-primary rounded-r-lg">
      <Quote className="h-8 w-8 text-primary mb-3" />
      <p className="text-lg md:text-xl italic text-foreground mb-3 leading-relaxed">"{data.quote}"</p>
      <p className="text-sm text-muted-foreground mb-4">{data.context}</p>
      <div className="flex gap-2">
        <button onClick={tweet} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-card border border-border rounded-lg hover:border-primary transition-all">
          <Twitter className="h-4 w-4" /> Share
        </button>
        <button onClick={copy} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-card border border-border rounded-lg hover:border-primary transition-all">
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

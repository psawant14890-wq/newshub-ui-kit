import { useState } from 'react';
import { Sparkles, Send, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { ragAsk, type RagSource } from '../lib/api';

const FALLBACK = "I don't have enough information in the current articles to answer this.";

interface AskNewsHubProps {
  compact?: boolean;
}

export function AskNewsHub({ compact = false }: AskNewsHubProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<RagSource[]>([]);
  const [status, setStatus] = useState<'idle' | 'retrieving' | 'streaming' | 'done' | 'error' | 'no-info'>('idle');
  const [error, setError] = useState('');

  const ask = async () => {
    if (!question.trim() || status === 'retrieving' || status === 'streaming') return;
    setAnswer(''); setSources([]); setError(''); setStatus('retrieving');

    try {
      await ragAsk(question, {
        onCitations: (s) => { setSources(s); setStatus('streaming'); },
        onToken: (t) => setAnswer((prev) => prev + t),
        onDone: () => setStatus((cur) => {
          // After streaming complete, check fallback
          return cur;
        }),
        onError: (msg) => { setError(msg); setStatus('error'); },
      });
      setStatus((prev) => {
        if (prev === 'error') return prev;
        // Detect grounded fallback
        return answer.trim().includes(FALLBACK) ? 'no-info' : 'done';
      });
    } catch (e) {
      setError(String(e));
      setStatus('error');
    }
  };

  // Re-evaluate fallback after answer settles
  const isFallback = status === 'done' && answer.trim().includes(FALLBACK);

  return (
    <section className={`${compact ? '' : 'max-w-3xl mx-auto'} bg-card border border-border rounded-xl p-5 md:p-6`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Ask NewsHub</h2>
          <p className="text-xs text-muted-foreground">Grounded answers from today's articles — with citations</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="e.g. What's happening in tech this week?"
          className="flex-1 px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
          disabled={status === 'retrieving' || status === 'streaming'}
        />
        <button
          onClick={ask}
          disabled={!question.trim() || status === 'retrieving' || status === 'streaming'}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 text-sm font-medium"
        >
          {(status === 'retrieving' || status === 'streaming') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Ask
        </button>
      </div>

      {status === 'retrieving' && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-5/6" />
          <div className="h-3 bg-muted rounded w-4/6" />
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error || 'Something went wrong. Try again.'}</span>
        </div>
      )}

      {isFallback ? (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-foreground">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-medium">No relevant articles found</p>
            <p className="text-muted-foreground text-xs mt-1">
              Try a different question or browse articles directly.
            </p>
          </div>
        </div>
      ) : answer && (
        <div className="space-y-4">
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
            {answer}
            {status === 'streaming' && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />}
          </div>

          {sources.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sources</p>
              <ul className="space-y-1.5">
                {sources.map((s) => (
                  <li key={s.article_id}>
                    <a
                      href={`/article/${s.slug}`}
                      onClick={(e) => { e.preventDefault(); history.pushState(null, '', `/article/${s.slug}`); window.dispatchEvent(new Event('popstate')); }}
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
                    >
                      {s.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

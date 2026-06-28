import { Radio, X } from 'lucide-react';
import { useRealtimeArticles } from '../hooks/useRealtimeArticles';

export function LiveFeedBanner() {
  const { latest, count, dismiss } = useRealtimeArticles();
  if (!latest) return null;

  const go = () => {
    history.pushState(null, '', `/article/${latest.slug}`);
    window.dispatchEvent(new Event('popstate'));
    dismiss();
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-[90%] animate-slide-up">
      <div className="bg-card border border-primary/40 rounded-lg shadow-2xl p-3 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Radio className="h-5 w-5 text-red-500" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-red-500 font-bold">
            Live · {count} new {count === 1 ? 'story' : 'stories'}
          </div>
          <button
            onClick={go}
            className="text-sm text-foreground font-medium truncate text-left hover:text-primary transition-colors w-full"
          >
            {latest.title}
          </button>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

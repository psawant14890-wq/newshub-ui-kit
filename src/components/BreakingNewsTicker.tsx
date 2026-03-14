import { AlertCircle } from 'lucide-react';
import type { Article } from '../types';

interface BreakingNewsTickerProps {
  articles: Article[];
}

export function BreakingNewsTicker({ articles }: BreakingNewsTickerProps) {
  if (articles.length === 0) return null;

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="bg-destructive/10 border-b border-destructive/20">
      <div className="container mx-auto px-4 py-2 flex items-center gap-3 overflow-hidden">
        <span className="flex items-center gap-1.5 text-xs font-bold text-destructive uppercase whitespace-nowrap">
          <AlertCircle className="h-3.5 w-3.5" />
          Breaking
        </span>
        <div className="overflow-hidden flex-1">
          <div className="flex gap-8 animate-scroll whitespace-nowrap">
            {[...articles, ...articles].map((article, i) => (
              <button
                key={`${article.id}-${i}`}
                onClick={() => navigate(`/article/${article.slug}`)}
                className="text-sm text-foreground hover:text-primary transition-colors duration-200"
              >
                {article.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

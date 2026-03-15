import { Bookmark, Newspaper } from 'lucide-react';
import { useState } from 'react';
import { CategoryBadge } from './CategoryBadge';
import { AuthorMeta } from './AuthorMeta';
import { useBookmark } from '../hooks/useBookmark';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'horizontal' | 'featured';
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export function ArticleCard({ article, variant = 'default', onSave, isSaved = false }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false);

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleClick = () => navigate(`/article/${article.slug}`);

  const readTime = Math.max(1, Math.ceil((article.content?.length || 0) / 1500));

  const ImagePlaceholder = () => (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <Newspaper className="h-8 w-8 text-muted-foreground" />
    </div>
  );

  if (variant === 'featured') {
    return (
      <div
        onClick={handleClick}
        className="relative rounded-lg overflow-hidden cursor-pointer group aspect-[16/9] md:aspect-[21/9]"
      >
        {article.featured_image_url && !imgError ? (
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImagePlaceholder />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            {article.category && (
              <CategoryBadge category={article.category.name} size="sm" />
            )}
            <span className="text-sm text-primary-foreground/80">{readTime} min read</span>
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-primary-foreground mb-2 line-clamp-2">
            {article.title}
          </h2>
          <p className="text-primary-foreground/80 text-sm md:text-base line-clamp-2 max-w-2xl">
            {article.excerpt}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleClick}
        className="flex gap-4 p-3 rounded-lg cursor-pointer group hover:bg-accent/50 transition-all duration-200"
      >
        <div className="w-[120px] h-[80px] flex-shrink-0 rounded-md overflow-hidden">
          {article.featured_image_url && !imgError ? (
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {article.category && (
            <CategoryBadge category={article.category.name} size="sm" />
          )}
          <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2 mt-1">
            {article.title}
          </h3>
          <div className="mt-1">
            <AuthorMeta
              author={article.author ? { name: article.author.name, avatar: article.author.avatar_url || undefined } : undefined}
              date={article.published_at}
              readTime={readTime}
              size="sm"
            />
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-lg overflow-hidden bg-card border border-border hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
    >
      <div className="relative aspect-video overflow-hidden">
        {article.featured_image_url && !imgError ? (
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImagePlaceholder />
        )}
        {onSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onSave(article.id); }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isSaved
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/60 text-foreground opacity-0 group-hover:opacity-100'
            }`}
            aria-label={isSaved ? 'Remove bookmark' : 'Bookmark article'}
          >
            <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {article.category && (
            <CategoryBadge category={article.category.name} size="sm" />
          )}
          {article.is_opinion && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Opinion
            </span>
          )}
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {article.excerpt}
        </p>
        <AuthorMeta
          author={article.author ? { name: article.author.name, avatar: article.author.avatar_url || undefined } : undefined}
          date={article.published_at}
          readTime={readTime}
          size="sm"
        />
      </div>
    </div>
  );
}

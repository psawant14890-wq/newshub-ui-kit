import { ChevronRight } from 'lucide-react';
import type { Article, Category } from '../types';
import { ArticleCard } from './ArticleCard';

interface CategorySectionProps {
  category: Category;
  articles: Article[];
}

export function CategorySection({ category, articles }: CategorySectionProps) {
  if (articles.length === 0) return null;

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">{category.name}</h2>
        <button
          onClick={() => navigate(`/category/${category.slug}`)}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-all duration-200"
        >
          View All <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 3).map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

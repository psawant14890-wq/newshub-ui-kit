import { useEffect, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Navbar, ArticleCard, Footer, Pagination, CategoryBadge, SkeletonCard, EmptyState } from '../components';
import { getCategories, getArticlesByCategory } from '../lib/api';
import { AlertTriangle } from 'lucide-react';
import type { Article, Category } from '../types';

interface CategoryPageProps {
  slug: string;
}

type SortOption = 'latest' | 'most-read' | 'most-commented';

export function CategoryPage({ slug }: CategoryPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const perPage = 9;

  useEffect(() => {
    loadData();
    setCurrentPage(1);
  }, [slug]);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const cats = await getCategories();
      setCategories(cats);
      const category = cats.find(c => c.slug === slug);
      setCurrentCategory(category || null);
      if (category) {
        const arts = await getArticlesByCategory(slug, 50);
        setArticles(arts);
      }
    } catch (err) {
      console.error('Error loading category:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const sortedArticles = [...articles].sort((a, b) => {
    if (sortBy === 'most-read') return b.view_count - a.view_count;
    if (sortBy === 'most-commented') return 0; // would need comment counts
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  const totalPages = Math.ceil(sortedArticles.length / perPage);
  const paginatedArticles = sortedArticles.slice((currentPage - 1) * perPage, currentPage * perPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar categories={[]} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><SkeletonCard count={6} /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar categories={categories} />
        <EmptyState icon={AlertTriangle} title="Something went wrong" description="Please try again."
          buttonText="Retry" onButtonClick={loadData} />
        <Footer />
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar categories={categories} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Category Not Found</h1>
          <button onClick={() => { history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate')); }}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200">Go Home</button>
        </div>
        <Footer />
      </div>
    );
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'latest', label: 'Latest' },
    { value: 'most-read', label: 'Most Read' },
    { value: 'most-commented', label: 'Most Commented' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} currentCategory={slug} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <CategoryBadge category={currentCategory.name} size="lg" />
          <h1 className="font-display text-3xl font-bold text-foreground mt-3">{currentCategory.name}</h1>
          <p className="text-muted-foreground mt-1">{currentCategory.description}</p>
        </div>

        {/* Sort Bar */}
        <div className="flex items-center gap-2 mb-6">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSortBy(opt.value); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                sortBy === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {paginatedArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        ) : (
          <p className="text-center text-muted-foreground py-12">No articles found in this category.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Navbar, ArticleCard, Footer, Pagination, CategoryBadge, SkeletonCard } from '../components';
import { getCategories, getArticlesByCategory } from '../lib/api';
import type { Article, Category } from '../types';

interface CategoryPageProps {
  slug: string;
}

export function CategoryPage({ slug }: CategoryPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 9;

  useEffect(() => {
    loadData();
    setCurrentPage(1);
  }, [slug]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
      const category = cats.find(c => c.slug === slug);
      setCurrentCategory(category || null);
      if (category) {
        const articles = await getArticlesByCategory(slug, 50);
        setArticles(articles);
      }
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(articles.length / perPage);
  const paginatedArticles = articles.slice((currentPage - 1) * perPage, currentPage * perPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar categories={[]} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard count={6} />
          </div>
        </div>
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
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200">
            Go Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} currentCategory={slug} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <CategoryBadge category={currentCategory.name} size="lg" />
          <h1 className="font-display text-3xl font-bold text-foreground mt-3">{currentCategory.name}</h1>
          <p className="text-muted-foreground mt-1">{currentCategory.description}</p>
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

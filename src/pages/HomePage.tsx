import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Navbar, ArticleCard, Footer, Sidebar, BreakingNewsTicker, CategorySection, Newsletter, SkeletonCard, EmptyState } from '../components';
import { useRecommendations } from '../hooks/useRecommendations';
import {
  getCategories, getFeaturedArticle, getBreakingNews,
  getTrendingArticles, getArticlesByCategory
} from '../lib/api';
import type { Article, Category } from '../types';

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { recommendations, loading: recsLoading } = useRecommendations();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [cats, featured, breaking, trending] = await Promise.all([
        getCategories(), getFeaturedArticle(), getBreakingNews(), getTrendingArticles(4),
      ]);
      setCategories(cats);
      setFeaturedArticle(featured);
      setBreakingNews(breaking);
      setTrendingArticles(trending);

      const categoryData: Record<string, Article[]> = {};
      for (const cat of cats.slice(0, 4)) {
        const articles = await getArticlesByCategory(cat.slug, 3);
        categoryData[cat.slug] = articles;
      }
      setCategoryArticles(categoryData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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
        <Navbar categories={[]} />
        <EmptyState icon={AlertTriangle} title="Something went wrong" description="Failed to load content. Please try again."
          buttonText="Retry" onButtonClick={loadData} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <BreakingNewsTicker articles={breakingNews} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {featuredArticle && (
              <section className="mb-10">
                <ArticleCard article={featuredArticle} variant="featured" />
              </section>
            )}

            {trendingArticles.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">Trending Now</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trendingArticles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Recommended for You */}
            {recommendations.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">Recommended for You</h2>
                <p className="text-sm text-muted-foreground mb-6">Based on your reading history</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {categories.slice(0, 4).map(cat =>
              categoryArticles[cat.slug]?.length > 0 ? (
                <CategorySection key={cat.id} category={cat} articles={categoryArticles[cat.slug]} />
              ) : null
            )}

            <Newsletter />
          </div>

          <Sidebar showTrending showNewsletter={false} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

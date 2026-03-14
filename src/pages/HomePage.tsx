import { useEffect, useState } from 'react';
import { Navbar, ArticleCard, Footer, Sidebar, BreakingNewsTicker, CategorySection, Newsletter, SkeletonCard } from '../components';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, featured, breaking, trending] = await Promise.all([
        getCategories(),
        getFeaturedArticle(),
        getBreakingNews(),
        getTrendingArticles(4),
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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <BreakingNewsTicker articles={breakingNews} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {/* Featured Article */}
            {featuredArticle && (
              <section className="mb-10">
                <ArticleCard article={featuredArticle} variant="featured" />
              </section>
            )}

            {/* Trending */}
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

            {/* Category Sections */}
            {categories.slice(0, 4).map(cat =>
              categoryArticles[cat.slug]?.length > 0 ? (
                <CategorySection key={cat.id} category={cat} articles={categoryArticles[cat.slug]} />
              ) : null
            )}

            {/* Newsletter */}
            <Newsletter />
          </div>

          <Sidebar showTrending showNewsletter={false} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

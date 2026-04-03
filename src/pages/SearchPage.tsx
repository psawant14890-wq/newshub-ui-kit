import { useState, useEffect } from 'react';
import { Search, X, SearchX, AlertTriangle } from 'lucide-react';
import { Navbar, ArticleCard, Footer, EmptyState, Pagination } from '../components';
import { getCategories, searchArticles, getRecentArticles } from '../lib/api';
import type { Article, Category } from '../types';

interface SearchPageProps {
  query?: string;
}

export function SearchPage({ query = '' }: SearchPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'relevance'>('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    getCategories().then(setCategories);
    performSearch();
  }, []);

  useEffect(() => {
    performSearch();
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const performSearch = async () => {
    setLoading(true);
    setError(false);
    try {
      let articles: Article[];
      if (searchQuery.trim()) {
        articles = await searchArticles(searchQuery);
      } else {
        articles = await getRecentArticles(50);
      }
      if (selectedCategory) {
        articles = articles.filter(a => a.category?.slug === selectedCategory);
      }
      if (sortBy === 'latest') {
        articles.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      } else {
        articles.sort((a, b) => b.view_count - a.view_count);
      }
      setResults(articles);
    } catch (err) {
      console.error('Search error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(results.length / perPage);
  const paginatedResults = results.slice((currentPage - 1) * perPage, currentPage * perPage);

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-6">Search</h1>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-12 pr-10 py-3 text-base bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all duration-200"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'latest' | 'relevance')}
              className="px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
            >
              <option value="latest">Latest</option>
              <option value="relevance">Most Popular</option>
            </select>
            <span className="text-sm text-muted-foreground ml-auto">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {error ? (
          <EmptyState icon={AlertTriangle} title="Something went wrong" description="Search failed. Please try again."
            buttonText="Retry" onButtonClick={performSearch} />
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : paginatedResults.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-2 mb-8">
            {paginatedResults.map(article => (
              <ArticleCard key={article.id} article={article} variant="horizontal" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchX}
            title="No results found"
            description={searchQuery ? `No articles match "${searchQuery}". Try different keywords.` : 'Start typing to search articles.'}
            buttonText="Browse All Articles"
            onButtonClick={() => navigate('/')}
          />
        )}

        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </main>

      <Footer />
    </div>
  );
}

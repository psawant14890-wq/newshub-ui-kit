import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, FileText, Eye, Users } from 'lucide-react';
import { Navbar, Footer, ArticleCard, LoadingSpinner, EmptyState } from '../components';
import { useFollow } from '../hooks/useFollow';
import { supabase } from '../lib/supabase';
import { getCategories } from '../lib/api';
import type { Article, Category } from '../types';

export function AuthorPage({ id }: { id: string }) {
  const [author, setAuthor] = useState<any>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFollowing, toggleFollow, followersCount, loading: followLoading } = useFollow(id);

  useEffect(() => {
    void load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
      const { data: arts } = await supabase.from('articles').select('*').eq('author_id', id).eq('status', 'published').order('created_at', { ascending: false });
      setArticles((arts as any[] || []).map(a => ({ ...a, publishedAt: a.created_at })) as Article[]);
      // Try to load author info from articles or profiles
      const first = arts?.[0];
      setAuthor({
        id,
        name: first?.author_name || 'Writer',
        bio: first?.author_bio || '',
        avatar: first?.author_avatar,
      });
    } finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const totalViews = articles.reduce((s, a: any) => s + (a.views || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-lg p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {author?.avatar ? (
              <img src={author.avatar} alt={author.name} className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-foreground">{author?.name?.charAt(0).toUpperCase() || 'W'}</span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">{author?.name}</h1>
              {author?.bio && <p className="text-muted-foreground mb-4">{author.bio}</p>}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> {articles.length} articles</span>
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {totalViews.toLocaleString()} views</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {followersCount} followers</span>
              </div>
              <button onClick={toggleFollow} disabled={followLoading}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  isFollowing ? 'bg-card border border-border text-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}>
                {isFollowing ? <><UserCheck className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
              </button>
            </div>
          </div>
        </div>

        <h2 className="font-display text-xl font-bold text-foreground mb-4">Articles</h2>
        {articles.length === 0 ? (
          <EmptyState icon={FileText} title="No articles yet" description="This writer hasn't published anything yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

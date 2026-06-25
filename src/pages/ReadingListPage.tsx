import { useEffect, useState } from 'react';
import { Bookmark, BookmarkX, Trash2 } from 'lucide-react';
import { Navbar, Footer, LoadingSpinner, EmptyState } from '../components';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getCategories } from '../lib/api';
import toast from 'react-hot-toast';
import type { Category } from '../types';

interface SavedItem {
  id: string;
  article_slug: string;
  article_title: string;
  article_thumbnail: string | null;
  article_category: string | null;
  saved_at: string;
}

export function ReadingListPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      history.pushState(null, '', '/auth');
      window.dispatchEvent(new Event('popstate'));
      return;
    }
    (async () => {
      const [{ data }, cats] = await Promise.all([
        supabase
          .from('saved_articles')
          .select('*')
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false }),
        getCategories(),
      ]);
      setItems((data as SavedItem[]) || []);
      setCategories(cats);
      setLoading(false);
    })();
  }, [user]);

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('saved_articles').delete().eq('id', id);
    if (error) return toast.error('Failed to remove');
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Removed from reading list');
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Reading List</h1>
            <p className="text-sm text-muted-foreground">{items.length} saved {items.length === 1 ? 'article' : 'articles'}</p>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState icon={BookmarkX} title="Your reading list is empty" description="Tap the bookmark icon on any article to save it for later." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <button onClick={() => navigate(`/article/${item.article_slug}`)} className="block w-full text-left">
                  {item.article_thumbnail && (
                    <img src={item.article_thumbnail} alt={item.article_title} loading="lazy" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    {item.article_category && (
                      <span className="text-xs font-medium text-primary mb-1 block">{item.article_category}</span>
                    )}
                    <h3 className="font-display font-semibold text-foreground line-clamp-2 mb-1">{item.article_title}</h3>
                    <p className="text-xs text-muted-foreground">Saved {new Date(item.saved_at).toLocaleDateString()}</p>
                  </div>
                </button>
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

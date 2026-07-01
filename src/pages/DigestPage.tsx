import { useEffect, useState } from 'react';
import { Sparkles, Mail } from 'lucide-react';
import { Navbar, Footer, LoadingSpinner, ArticleCard } from '../components';
import { PushNotificationToggle } from '../components/PushNotificationToggle';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generateWithGemini } from '../lib/gemini';
import type { Article, Category } from '../types';

export function DigestPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [intro, setIntro] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      setCategories(cats || []);

      // Gather user signals
      let prefCats: string[] = [];
      if (user) {
        const { data: hist } = await supabase
          .from('reading_history')
          .select('article_slug')
          .eq('user_id', user.id)
          .order('read_at', { ascending: false })
          .limit(20);
        const slugs = (hist || []).map(h => h.article_slug);
        if (slugs.length) {
          const { data: recent } = await supabase
            .from('articles')
            .select('category')
            .in('slug', slugs);
          const counts: Record<string, number> = {};
          (recent || []).forEach(a => { if (a.category) counts[a.category] = (counts[a.category] || 0) + 1; });
          prefCats = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
        }
      }

      // Fetch a personalized set
      let q = supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(9);
      if (prefCats.length) q = q.in('category', prefCats);
      const { data: feed } = await q;
      let list = (feed as Article[]) || [];
      if (list.length < 6) {
        const { data: filler } = await supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(9);
        const ids = new Set(list.map(a => a.id));
        list = [...list, ...((filler as Article[]) || []).filter(a => !ids.has(a.id))].slice(0, 9);
      }
      setArticles(list);

      // AI intro
      try {
        const topics = prefCats.length ? prefCats.join(', ') : 'top stories';
        const titles = list.slice(0, 5).map(a => a.title).join('; ');
        const msg = await generateWithGemini(
          `Write a 2-sentence personalized morning digest intro for a reader interested in ${topics}. Reference these stories briefly: ${titles}. Warm, conversational, no emoji, no quotes.`
        );
        setIntro(msg.trim());
      } catch {
        setIntro('Here are the stories worth your time today, hand-picked from what you read most.');
      }
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <Sparkles className="h-3.5 w-3.5" /> AI-curated for you
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" /> Your Daily Digest
          </h1>
          {loading ? (
            <div className="h-6 w-2/3 bg-muted rounded animate-pulse" />
          ) : (
            <p className="text-lg text-muted-foreground">{intro}</p>
          )}
        </div>

        <div className="mb-8">
          <PushNotificationToggle />
        </div>

        {loading ? (
          <LoadingSpinner />
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

import { useState, useEffect } from 'react';
import { FileText, Edit3, Eye, EyeOff, Trash2, Plus, BarChart3, Clock } from 'lucide-react';
import { Navbar, Footer, LoadingSpinner } from './index';
import { useAuth } from '../context/AuthContext';
import { useRoles } from '../hooks/useRoles';
import { supabase } from '../lib/supabase';
import { getCategories } from '../lib/api';
import toast from 'react-hot-toast';
import type { Category } from '../types';

interface WriterArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  views: number;
  created_at: string;
}

export function WriterDashboard() {
  const { user } = useAuth();
  const { isWriter } = useRoles();
  const [articles, setArticles] = useState<WriterArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, totalViews: 0 });

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  useEffect(() => {
    if (!isWriter || !user) { navigate('/'); return; }
    loadData();
  }, [isWriter, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, { data }] = await Promise.all([
        getCategories(),
        supabase
          .from('articles')
          .select('id, title, slug, category, status, views, created_at')
          .eq('author_id', user!.id)
          .order('created_at', { ascending: false }),
      ]);
      setCategories(cats);
      const arts = data || [];
      setArticles(arts);
      setStats({
        total: arts.length,
        published: arts.filter(a => a.status === 'published').length,
        drafts: arts.filter(a => a.status === 'draft').length,
        totalViews: arts.reduce((s, a) => s + (a.views || 0), 0),
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (!isWriter) return null;
  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Writer Dashboard</h1>
          <button onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all">
            <Plus className="h-4 w-4" /> New Article
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Articles', value: stats.total, icon: FileText, color: 'text-primary' },
            { label: 'Published', value: stats.published, icon: Eye, color: 'text-green-500' },
            { label: 'Drafts', value: stats.drafts, icon: Clock, color: 'text-yellow-500' },
            { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: BarChart3, color: 'text-blue-500' },
          ].map(s => (
            <div key={s.label} className="p-5 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Articles table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Views</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(a => (
                <tr key={a.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">{a.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.category}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      a.status === 'draft' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                    }`}>{a.status === 'draft' ? 'Draft' : 'Published'}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{(a.views || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-12">No articles yet. Start writing!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}

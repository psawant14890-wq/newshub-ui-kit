import { useEffect, useState } from 'react';
import { FileText, Eye, Edit3, Trash2, Plus, BarChart3, Clock, Sparkles, Zap, Award, Wand2 } from 'lucide-react';
import { Navbar, Footer, LoadingSpinner, EmptyState } from '../components';
import { BadgeDisplay } from '../components/BadgeDisplay';
import { AIRewriteSuggestions } from '../components/AIRewriteSuggestions';
import { SchedulePublish } from '../components/SchedulePublish';
import { useAuth } from '../context/AuthContext';
import { useRoles } from '../hooks/useRoles';
import { useBadges } from '../hooks/useBadges';
import { supabase } from '../lib/supabase';
import { getCategories, deleteArticle, updateArticle } from '../lib/api';
import toast from 'react-hot-toast';
import type { Category } from '../types';

interface MyArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  views: number;
  created_at: string;
  content?: string;
  scheduled_at?: string | null;
}

type Tab = 'articles' | 'drafts' | 'analytics' | 'badges' | 'tools';

export function EditorDashboard() {
  const { user } = useAuth();
  const { isWriter, loading: rolesLoading } = useRoles();
  const { badges, allBadges, points, loading: badgesLoading } = useBadges(user?.id);
  const [tab, setTab] = useState<Tab>('articles');
  const [articles, setArticles] = useState<MyArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [followers, setFollowers] = useState(0);
  const [reactions, setReactions] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  useEffect(() => {
    if (rolesLoading) return;
    if (!isWriter || !user) { navigate('/'); return; }
    (async () => {
      const [cats, { data }, { count: fc }, { count: rc }] = await Promise.all([
        getCategories(),
        supabase.from('articles')
          .select('id, title, slug, category, status, views, created_at, content')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('reactions').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
      ]);
      setCategories(cats);
      setArticles((data as MyArticle[]) || []);
      setFollowers(fc || 0);
      setReactions(rc || 0);
      setLoading(false);
    })();
  }, [isWriter, user, rolesLoading]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const ok = await deleteArticle(id);
    if (ok) {
      setArticles(prev => prev.filter(a => a.id !== id));
      toast.success('Article deleted');
    } else toast.error('Failed');
  };

  const handleToggleStatus = async (a: MyArticle) => {
    const newStatus = a.status === 'published' ? 'draft' : 'published';
    const ok = await updateArticle(a.id, { status: newStatus });
    if (ok) {
      setArticles(prev => prev.map(x => x.id === a.id ? { ...x, status: newStatus } : x));
      toast.success(`Now ${newStatus}`);
    }
  };

  if (rolesLoading || loading || badgesLoading) return <LoadingSpinner fullPage />;

  const published = articles.filter(a => a.status === 'published');
  const drafts = articles.filter(a => a.status === 'draft');
  const totalViews = articles.reduce((s, a) => s + (a.views || 0), 0);
  const visible = tab === 'drafts' ? drafts : published;

  const stats = [
    { label: 'Published', value: published.length, icon: Eye, color: 'text-green-500' },
    { label: 'Drafts', value: drafts.length, icon: Clock, color: 'text-yellow-500' },
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: BarChart3, color: 'text-blue-500' },
    { label: 'Followers', value: followers, icon: FileText, color: 'text-purple-500' },
    { label: 'Reactions', value: reactions, icon: Sparkles, color: 'text-pink-500' },
    { label: 'Points', value: points, icon: Zap, color: 'text-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Editor Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your articles and track your growth</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/admin')}
              className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-accent transition-all text-sm font-medium">
              <Sparkles className="h-4 w-4" /> AI Generator
            </button>
            <button onClick={() => navigate('/admin')}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all text-sm">
              <Plus className="h-4 w-4" /> New Article
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {stats.map(s => (
            <div key={s.label} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {([
            { id: 'articles', label: `Published (${published.length})` },
            { id: 'drafts',   label: `Drafts (${drafts.length})` },
            { id: 'tools',    label: 'AI Tools & Schedule' },
            { id: 'analytics',label: 'Analytics' },
            { id: 'badges',   label: `Badges (${badges.length})` },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {(tab === 'articles' || tab === 'drafts') && (
          visible.length === 0 ? (
            <EmptyState icon={FileText} title={tab === 'drafts' ? 'No drafts yet' : 'No published articles'} description="Click 'New Article' to start writing." />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Views</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(a => (
                    <tr key={a.id} className="border-b border-border hover:bg-accent/40">
                      <td className="py-3 px-4 font-medium text-foreground max-w-xs truncate">
                        <button onClick={() => navigate(`/article/${a.slug}`)} className="hover:text-primary text-left">{a.title}</button>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{a.category}</td>
                      <td className="py-3 px-4 text-muted-foreground">{(a.views || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleToggleStatus(a)} className="p-1.5 text-muted-foreground hover:text-primary transition" title={a.status === 'published' ? 'Unpublish' : 'Publish'}>
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => navigate('/admin')} className="p-1.5 text-muted-foreground hover:text-foreground transition" title="Edit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(a.id, a.title)} className="p-1.5 text-muted-foreground hover:text-destructive transition" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground mb-4">Top Performing Articles</h3>
              <div className="space-y-3">
                {[...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <button onClick={() => navigate(`/article/${a.slug}`)} className="text-foreground hover:text-primary truncate max-w-[60%] text-left">{a.title}</button>
                    <span className="text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />{(a.views || 0).toLocaleString()}</span>
                  </div>
                ))}
                {articles.length === 0 && <p className="text-sm text-muted-foreground">No articles yet.</p>}
              </div>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground mb-4">Engagement Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Avg views per article</span><span className="text-foreground font-medium">{articles.length ? Math.round(totalViews / articles.length).toLocaleString() : 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reactions received</span><span className="text-foreground font-medium">{reactions}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Followers</span><span className="text-foreground font-medium">{followers}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total points</span><span className="text-foreground font-medium">{points}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Badges earned</span><span className="text-foreground font-medium">{badges.length} / {allBadges.length}</span></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'tools' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI rewrite & scheduled publishing</h3>
            </div>
            {articles.length === 0 ? (
              <EmptyState icon={FileText} title="No articles yet" description="Create an article first, then use AI tools on it." />
            ) : (
              articles.slice(0, 5).map(a => (
                <details key={a.id} className="bg-card border border-border rounded-lg">
                  <summary className="cursor-pointer p-4 flex items-center justify-between">
                    <span className="font-medium text-foreground truncate">{a.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-600'}`}>{a.status}</span>
                  </summary>
                  <div className="p-4 pt-0 space-y-4">
                    <AIRewriteSuggestions
                      content={a.content || ''}
                      onApply={async (rewritten) => {
                        const ok = await updateArticle(a.id, { content: rewritten });
                        if (ok) setArticles(prev => prev.map(x => x.id === a.id ? { ...x, content: rewritten } : x));
                      }}
                    />
                    <SchedulePublish articleId={a.id} currentScheduledAt={a.scheduled_at} />
                  </div>
                </details>
              ))
            )}
          </div>
        )}

        {tab === 'badges' && (
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Your Achievements</h3>
            </div>
            <BadgeDisplay earned={badges} catalog={allBadges} currentPoints={points} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

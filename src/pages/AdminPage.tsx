import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Eye, EyeOff, BarChart3, FileText, MessageSquare, ArrowLeft } from 'lucide-react';
import { Navbar, Footer, LoadingSpinner, Modal } from '../components';
import { useAuth } from '../context/AuthContext';
import { getAllArticles, getCategories, createArticle, updateArticle, deleteArticle } from '../lib/api';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Article, Category } from '../types';

type AdminTab = 'articles' | 'comments' | 'stats';

interface ArticleForm {
  title: string;
  slug: string;
  category: string;
  tags: string;
  excerpt: string;
  thumbnail: string;
  body: string;
  status: string;
}

const emptyForm: ArticleForm = {
  title: '', slug: '', category: 'Technology', tags: '',
  excerpt: '', thumbnail: '', body: '', status: 'draft',
};

export function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [stats, setStats] = useState({ articles: 0, comments: 0, views: 0 });

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const isAdmin = user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [arts, cats] = await Promise.all([getAllArticles(), getCategories()]);
      setArticles(arts);
      setCategories(cats);

      // Load comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setComments(commentsData || []);

      // Stats
      const totalViews = arts.reduce((sum, a) => sum + a.view_count, 0);
      setStats({ articles: arts.length, comments: (commentsData || []).length, views: totalViews });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openNewArticle = () => {
    setEditingArticle(null);
    setForm(emptyForm);
    setShowEditor(true);
  };

  const openEditArticle = (article: Article) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      slug: article.slug,
      category: article.category?.name || 'Technology',
      tags: article.tags?.map(t => t.name).join(', ') || '',
      excerpt: article.excerpt,
      thumbnail: article.featured_image_url || '',
      body: article.content,
      status: article.is_featured ? 'published' : 'draft',
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.body) {
      toast.error('Title, slug, and body are required.');
      return;
    }
    setSaving(true);
    try {
      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
      const userAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

      if (editingArticle) {
        const success = await updateArticle(editingArticle.id, {
          title: form.title,
          slug: form.slug,
          category: form.category,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          excerpt: form.excerpt,
          thumbnail: form.thumbnail,
          body: form.body,
          status: form.status,
        });
        if (success) {
          toast.success('Article updated!');
        } else {
          toast.error('Failed to update article.');
        }
      } else {
        const result = await createArticle({
          slug: form.slug,
          title: form.title,
          excerpt: form.excerpt,
          body: form.body,
          thumbnail: form.thumbnail,
          category: form.category,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          author_name: userName,
          author_avatar: userAvatar,
          status: form.status,
        });
        if (result) {
          toast.success('Article created!');
        } else {
          toast.error('Failed to create article.');
        }
      }
      setShowEditor(false);
      await loadData();
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const success = await deleteArticle(deleteTarget.id);
    if (success) {
      toast.success('Article deleted.');
      setDeleteTarget(null);
      await loadData();
    } else {
      toast.error('Failed to delete article.');
    }
  };

  const handleToggleStatus = async (article: Article) => {
    const newStatus = article.view_count >= 0 ? 'published' : 'draft'; // simplified
    const success = await updateArticle(article.id, {
      status: newStatus === 'published' ? 'draft' : 'published',
    });
    if (success) {
      toast.success(`Article ${newStatus === 'published' ? 'unpublished' : 'published'}!`);
      await loadData();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      toast.success('Comment deleted.');
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  if (!isAdmin) return null;
  if (loading) return <LoadingSpinner fullPage />;

  if (showEditor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar categories={categories} />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <button onClick={() => setShowEditor(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors duration-200">
            <ArrowLeft className="h-4 w-4" /> Back to articles
          </button>

          <h1 className="font-display text-2xl font-bold text-foreground mb-6">
            {editingArticle ? 'Edit Article' : 'New Article'}
          </h1>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                <input
                  value={form.title}
                  onChange={e => {
                    setForm(prev => ({
                      ...prev,
                      title: e.target.value,
                      slug: editingArticle ? prev.slug : generateSlug(e.target.value),
                    }));
                  }}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                  placeholder="Article title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Slug</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                  placeholder="article-slug"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                  placeholder="AI, Technology, Future"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 resize-none"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail URL</label>
              <input
                value={form.thumbnail}
                onChange={e => setForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                placeholder="https://images.unsplash.com/..."
              />
              {form.thumbnail && (
                <img src={form.thumbnail} alt="Preview" className="mt-2 h-32 object-cover rounded-lg" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Body (HTML)</label>
              <textarea
                value={form.body}
                onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
                rows={12}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 resize-y"
                placeholder="<h2>Article heading</h2><p>Content here...</p>"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
              >
                {saving && <LoadingSpinner size="sm" />}
                {editingArticle ? 'Update Article' : 'Create Article'}
              </button>
              <button
                onClick={() => setShowEditor(false)}
                className="px-6 py-2.5 border border-border text-foreground rounded-lg hover:bg-accent transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: 'articles' as const, label: 'Articles', icon: FileText },
    { id: 'comments' as const, label: 'Comments', icon: MessageSquare },
    { id: 'stats' as const, label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
          {tab === 'articles' && (
            <button onClick={openNewArticle} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-200">
              <Plus className="h-4 w-4" /> New Article
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Articles Tab */}
        {tab === 'articles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Views</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(article => (
                  <tr key={article.id} className="border-b border-border hover:bg-accent/50 transition-colors duration-200">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground line-clamp-1">{article.title}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{article.category?.name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        article.is_featured || article.view_count >= 0
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        Published
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{article.view_count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(article.published_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditArticle(article)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(article)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                          title="Toggle status"
                        >
                          <EyeOff className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(article)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {articles.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No articles yet.</p>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {tab === 'comments' && (
          <div className="space-y-3">
            {comments.length > 0 ? comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      on {comment.article_slug}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{comment.body}</p>
                </div>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-12">No comments yet.</p>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Articles</p>
                <p className="text-3xl font-bold text-foreground">{stats.articles}</p>
              </div>
              <div className="p-6 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Comments</p>
                <p className="text-3xl font-bold text-foreground">{stats.comments}</p>
              </div>
              <div className="p-6 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Views</p>
                <p className="text-3xl font-bold text-foreground">{stats.views.toLocaleString()}</p>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold text-foreground mb-4">Most Viewed Articles</h3>
            <div className="space-y-2">
              {[...articles].sort((a, b) => b.view_count - a.view_count).slice(0, 10).map((article, i) => (
                <div key={article.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg">
                  <span className="text-lg font-bold text-primary/50 w-8">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{article.title}</p>
                    <p className="text-xs text-muted-foreground">{article.category?.name}</p>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {article.view_count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Article" size="sm">
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-all duration-200">
            Cancel
          </button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-all duration-200">
            Delete
          </button>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}

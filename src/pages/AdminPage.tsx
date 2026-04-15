import { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Trash2, Eye, EyeOff, BarChart3, FileText, MessageSquare, ArrowLeft, Sparkles, Wand2, Bot, TrendingUp, Image as ImageIcon, Link2, Clock, AlertTriangle, Calendar, Shield } from 'lucide-react';
import { Navbar, Footer, LoadingSpinner, Modal } from '../components';
import { AIWritingAssistant } from '../components/AIWritingAssistant';
import { EditorialChecklist } from '../components/EditorialChecklist';
import { AutoGeneratorPanel } from '../components/AutoGeneratorPanel';
import { UnsplashModal } from '../components/UnsplashModal';
import { ShareModal } from '../components/ShareModal';
import { useAuth } from '../context/AuthContext';
import { useTagGenerator } from '../hooks/useTagGenerator';
import { useBreakingNewsDetector } from '../hooks/useBreakingNewsDetector';
import { useInternalLinkSuggester } from '../hooks/useInternalLinkSuggester';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { generateWithGemini } from '../lib/gemini';
import { getAllArticles, getCategories, createArticle, updateArticle, deleteArticle } from '../lib/api';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Article, Category } from '../types';
import MDEditor from '@uiw/react-md-editor';

type AdminTab = 'articles' | 'comments' | 'stats' | 'ai-generator';

interface ArticleForm {
  title: string;
  slug: string;
  category: string;
  tags: string;
  excerpt: string;
  thumbnail: string;
  thumbnailAlt: string;
  body: string;
  status: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  focusKeyword: string;
  isFeatured: boolean;
  isBreaking: boolean;
  scheduledAt: string;
}

const emptyForm: ArticleForm = {
  title: '', slug: '', category: 'Technology', tags: '',
  excerpt: '', thumbnail: '', thumbnailAlt: '', body: '', status: 'draft',
  metaTitle: '', metaDescription: '', canonicalUrl: '', focusKeyword: '',
  isFeatured: false, isBreaking: false, scheduledAt: '',
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
  const { generateTags, loading: tagsLoading } = useTagGenerator();
  const { checkBreaking, checking: breakingChecking } = useBreakingNewsDetector();
  const { suggestLinks, suggestions: linkSuggestions, loading: linksLoading } = useInternalLinkSuggester();
  const { sendNotification } = usePushNotifications();
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [commentFilter, setCommentFilter] = useState<'all' | 'safe' | 'flagged'>('all');
  const [generatingAlt, setGeneratingAlt] = useState(false);

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [arts, cats] = await Promise.all([getAllArticles(), getCategories()]);
      setArticles(arts);
      setCategories(cats);
      const { data: commentsData } = await supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(50);
      setComments(commentsData || []);
      const totalViews = arts.reduce((sum, a) => sum + a.view_count, 0);
      setStats({ articles: arts.length, comments: (commentsData || []).length, views: totalViews });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const readTime = Math.max(1, Math.ceil(form.body.split(/\s+/).filter(Boolean).length / 250));

  const openNewArticle = () => { setEditingArticle(null); setForm(emptyForm); setLastSaved(null); setShowEditor(true); };

  const openEditArticle = (article: Article) => {
    setEditingArticle(article);
    setForm({
      title: article.title, slug: article.slug, category: article.category?.name || 'Technology',
      tags: article.tags?.map(t => t.name).join(', ') || '', excerpt: article.excerpt,
      thumbnail: article.featured_image_url || '', thumbnailAlt: '', body: article.content,
      status: (article as any)._status || 'published',
      metaTitle: article.meta_title || '', metaDescription: article.meta_description || '',
      canonicalUrl: '', focusKeyword: '', isFeatured: article.is_featured, isBreaking: article.is_breaking,
      scheduledAt: '',
    });
    setLastSaved(null);
    setShowEditor(true);
  };

  const handleSave = async (overrideStatus?: string) => {
    if (!form.title || !form.slug || !form.body) { toast.error('Title, slug, and body are required.'); return; }
    setSaving(true);
    try {
      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
      const userAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;
      const finalStatus = overrideStatus || form.status;

      const articleData: Record<string, any> = {
        title: form.title, slug: form.slug, category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        excerpt: form.excerpt, thumbnail: form.thumbnail, body: form.body, status: finalStatus,
        meta_title: form.metaTitle || null, meta_description: form.metaDescription || null,
        canonical_url: form.canonicalUrl || null, focus_keyword: form.focusKeyword || null,
        featured: form.isFeatured, is_breaking: form.isBreaking,
        thumbnail_alt: form.thumbnailAlt || null,
        read_time: readTime,
        scheduled_at: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      };

      if (editingArticle) {
        const success = await updateArticle(editingArticle.id, articleData);
        if (success) { toast.success('Article updated!'); setLastSaved(new Date()); }
        else toast.error('Failed to update article.');
      } else {
        const result = await createArticle({
          slug: form.slug, title: form.title, excerpt: form.excerpt, body: form.body,
          thumbnail: form.thumbnail, category: form.category,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          author_name: userName, author_avatar: userAvatar, status: finalStatus,
        });
        if (result) {
          toast.success('Article created!');
          setLastSaved(new Date());

          if (finalStatus === 'published') {
            setPublishedSlug(form.slug);
            setShowShareModal(true);
            sendNotification('New Article Published', form.title, `/article/${form.slug}`);
          }
        } else toast.error('Failed to create article.');
      }

      if (!showShareModal) { setShowEditor(false); await loadData(); }
    } catch { toast.error('Something went wrong.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const success = await deleteArticle(deleteTarget.id);
    if (success) { toast.success('Article deleted.'); setDeleteTarget(null); await loadData(); }
    else toast.error('Failed to delete article.');
  };

  const handleToggleStatus = async (article: Article) => {
    const currentStatus = (article as any)._status;
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const success = await updateArticle(article.id, { status: newStatus });
    if (success) { toast.success(`Article ${newStatus === 'published' ? 'published' : 'unpublished'}!`); await loadData(); }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) { toast.success('Comment deleted.'); setComments(prev => prev.filter(c => c.id !== commentId)); }
  };

  const handleGenerateTags = async () => {
    const tags = await generateTags(form.title, form.body);
    if (tags.length > 0) {
      setForm(prev => ({ ...prev, tags: tags.join(', ') }));
      toast.success('Tags generated!');
    }
  };

  const handleCheckBreaking = async () => {
    const isBreaking = await checkBreaking(form.title, form.excerpt);
    if (isBreaking) {
      const confirmed = window.confirm('This looks like breaking news! Mark as breaking?');
      if (confirmed) setForm(prev => ({ ...prev, isBreaking: true }));
    } else {
      toast('This doesn\'t appear to be breaking news.');
    }
  };

  const handleGenerateAlt = async () => {
    if (!form.thumbnail || !form.title) { toast.error('Need thumbnail URL and title first.'); return; }
    setGeneratingAlt(true);
    try {
      const alt = await generateWithGemini(
        `Generate a descriptive alt text for an image used in a news article titled: "${form.title}". The image URL is: ${form.thumbnail}. Return only the alt text, max 125 characters.`
      );
      setForm(prev => ({ ...prev, thumbnailAlt: alt.trim().replace(/^"|"$/g, '') }));
      toast.success('Alt text generated!');
    } catch { toast.error('Failed to generate alt text.'); }
    finally { setGeneratingAlt(false); }
  };

  const handleSuggestLinks = async () => {
    const results = await suggestLinks(form.body);
    if (results.length === 0) toast('No internal link suggestions found.');
    else toast.success(`Found ${results.length} link suggestions!`);
  };

  if (!isAdmin) return null;
  if (loading) return <LoadingSpinner fullPage />;

  // Editor view
  if (showEditor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar categories={categories} />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setShowEditor(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to articles
            </button>
            {lastSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Last saved: {Math.floor((Date.now() - lastSaved.getTime()) / 60000)} min ago
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground mb-6">
            {editingArticle ? 'Edit Article' : 'New Article'}
          </h1>

          {/* AI Writing Assistant */}
          <div className="mb-6 p-4 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" /> AI Writing Assistant
            </h3>
            <AIWritingAssistant
              title={form.title} body={form.body}
              onTitleChange={title => setForm(prev => ({ ...prev, title, slug: editingArticle ? prev.slug : generateSlug(title) }))}
              onExcerptChange={excerpt => setForm(prev => ({ ...prev, excerpt }))}
              onBodyChange={body => setForm(prev => ({ ...prev, body }))}
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value, slug: editingArticle ? prev.slug : generateSlug(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="Article title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Slug</label>
                <input value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="article-slug" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all">
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tags (comma separated)</label>
                <div className="flex gap-2">
                  <input value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="AI, Technology" />
                  <button onClick={handleGenerateTags} disabled={tagsLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 transition-all whitespace-nowrap">
                    <Sparkles className="h-3.5 w-3.5" />
                    {tagsLoading ? '...' : 'AI Tags'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Excerpt</label>
              <textarea value={form.excerpt} onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))} rows={2}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none" placeholder="Brief description..." />
            </div>

            {/* Thumbnail with Unsplash */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail URL</label>
              <div className="flex gap-2">
                <input value={form.thumbnail} onChange={e => setForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="https://images.unsplash.com/..." />
                <button onClick={() => setShowUnsplash(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-all whitespace-nowrap">
                  <ImageIcon className="h-3.5 w-3.5" /> Unsplash
                </button>
              </div>
              {form.thumbnail && <img src={form.thumbnail} alt="Preview" className="mt-2 h-32 object-cover rounded-lg" />}
            </div>

            {/* Alt text with AI generation */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Alt Text</label>
              <div className="flex gap-2">
                <input value={form.thumbnailAlt} onChange={e => setForm(prev => ({ ...prev, thumbnailAlt: e.target.value }))}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="Descriptive alt text..." />
                <button onClick={handleGenerateAlt} disabled={generatingAlt}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 transition-all whitespace-nowrap">
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingAlt ? '...' : 'AI Alt'}
                </button>
              </div>
            </div>

            {/* Markdown Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">Body (Markdown/HTML)</label>
                <div className="flex items-center gap-3">
                  <button onClick={handleSuggestLinks} disabled={linksLoading}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all disabled:opacity-50">
                    <Link2 className="h-3.5 w-3.5" /> {linksLoading ? 'Checking...' : 'Suggest Links'}
                  </button>
                  <span className="text-xs text-muted-foreground">Est. read time: {readTime} min</span>
                </div>
              </div>
              <div data-color-mode="auto">
                <MDEditor
                  value={form.body}
                  onChange={val => setForm(prev => ({ ...prev, body: val || '' }))}
                  height={350}
                  preview="live"
                />
              </div>

              {/* Internal link suggestions */}
              {linkSuggestions.length > 0 && (
                <div className="mt-3 p-3 bg-card border border-border rounded-lg">
                  <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1"><Link2 className="h-3 w-3" /> Internal Link Suggestions</h4>
                  <div className="space-y-1.5">
                    {linkSuggestions.map((s, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        Link "<span className="text-foreground font-medium">{s.keyword}</span>" → <span className="text-primary">{s.articleTitle}</span> ({s.articleSlug})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SEO Section */}
            <div className="p-4 bg-card border border-border rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-foreground">SEO Settings</h3>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Meta Title</label>
                  <span className={`text-xs ${form.metaTitle.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>{form.metaTitle.length}/60</span>
                </div>
                <input value={form.metaTitle} onChange={e => setForm(prev => ({ ...prev, metaTitle: e.target.value }))} maxLength={70}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="SEO title (max 60 chars)" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Meta Description</label>
                  <span className={`text-xs ${form.metaDescription.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>{form.metaDescription.length}/160</span>
                </div>
                <textarea value={form.metaDescription} onChange={e => setForm(prev => ({ ...prev, metaDescription: e.target.value }))} maxLength={170} rows={2}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none" placeholder="SEO description (max 160 chars)" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Canonical URL</label>
                  <input value={form.canonicalUrl} onChange={e => setForm(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Focus Keyword</label>
                  <input value={form.focusKeyword} onChange={e => setForm(prev => ({ ...prev, focusKeyword: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="Main keyword" />
                </div>
              </div>
            </div>

            {/* Publishing Options */}
            <div className="flex flex-wrap items-center gap-4">
              <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="rounded border-border" />
                Featured
              </label>

              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.isBreaking} onChange={e => setForm(prev => ({ ...prev, isBreaking: e.target.checked }))}
                  className="rounded border-border" />
                Breaking News
              </label>

              <button onClick={handleCheckBreaking} disabled={breakingChecking}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-all disabled:opacity-50">
                <AlertTriangle className="h-3 w-3" /> {breakingChecking ? 'Checking...' : 'Detect Breaking'}
              </button>
            </div>

            {/* Scheduled Publishing */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Schedule Publish
              </label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              {form.scheduledAt && <p className="text-xs text-muted-foreground mt-1">Will be published at {new Date(form.scheduledAt).toLocaleString()}</p>}
            </div>

            {/* Editorial Checklist */}
            <EditorialChecklist
              title={form.title} body={form.body} excerpt={form.excerpt}
              metaTitle={form.metaTitle} metaDescription={form.metaDescription}
              tags={form.tags} thumbnail={form.thumbnail}
              onPublish={() => handleSave('published')}
              publishing={saving}
            />

            <div className="flex gap-3 pt-4 border-t border-border">
              <button onClick={() => handleSave()} disabled={saving}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
                {saving && <LoadingSpinner size="sm" />}
                {editingArticle ? 'Update Article' : 'Create Article'}
              </button>
              <button onClick={() => handleSave('draft')} disabled={saving}
                className="px-6 py-2.5 border border-border text-foreground rounded-lg hover:bg-accent transition-all">
                Save Draft
              </button>
              <button onClick={() => setShowEditor(false)}
                className="px-6 py-2.5 border border-border text-foreground rounded-lg hover:bg-accent transition-all">
                Cancel
              </button>
            </div>
          </div>
        </main>
        <Footer />

        <UnsplashModal isOpen={showUnsplash} onClose={() => setShowUnsplash(false)}
          onSelect={(url, alt) => setForm(prev => ({ ...prev, thumbnail: url, thumbnailAlt: alt }))} />

        <ShareModal isOpen={showShareModal} onClose={() => { setShowShareModal(false); setShowEditor(false); loadData(); }}
          title={form.title} slug={publishedSlug} />
      </div>
    );
  }

  const tabs = [
    { id: 'articles' as const, label: 'Articles', icon: FileText },
    { id: 'comments' as const, label: 'Comments', icon: MessageSquare },
    { id: 'ai-generator' as const, label: 'AI Generator', icon: Bot },
    { id: 'stats' as const, label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
          {tab === 'articles' && (
            <button onClick={openNewArticle} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all">
              <Plus className="h-4 w-4" /> New Article
            </button>
          )}
          {tab === 'stats' && (
            <button onClick={() => navigate('/admin/analytics')} className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-accent transition-all text-sm">
              <TrendingUp className="h-4 w-4" /> Full Analytics
            </button>
          )}
        </div>

        <div className="flex gap-1 mb-8 border-b border-border">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

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
                  <tr key={article.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground line-clamp-1">{article.title}</p>
                        {(article as any).is_ai_generated && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">AI</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{article.category?.name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        (article as any)._status === 'draft' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        {(article as any)._status === 'draft' ? 'Draft' : 'Published'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{article.view_count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(article.published_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditArticle(article)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all" title="Edit">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(article)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all" title="Toggle status">
                          {(article as any)._status === 'draft' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setDeleteTarget(article)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {articles.length === 0 && <p className="text-center text-muted-foreground py-12">No articles yet.</p>}
          </div>
        )}

        {tab === 'comments' && (
          <div>
            <div className="flex gap-2 mb-4">
              {(['all', 'safe', 'flagged'] as const).map(f => (
                <button key={f} onClick={() => setCommentFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    commentFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  {f === 'all' ? 'All' : f === 'safe' ? 'Safe' : 'Flagged'}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {comments.length > 0 ? comments.map((comment: any) => (
                <div key={comment.id} className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{comment.user_name}</span>
                      <span className="text-xs text-muted-foreground">on {comment.article_slug}</span>
                      <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-0.5">
                        <Shield className="h-2.5 w-2.5" /> Safe
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{comment.body}</p>
                  </div>
                  <button onClick={() => handleDeleteComment(comment.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )) : <p className="text-center text-muted-foreground py-12">No comments yet.</p>}
            </div>
          </div>
        )}

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

        {tab === 'ai-generator' && (
          <AutoGeneratorPanel />
        )}
      </main>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Article" size="sm">
        <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-all">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-all">Delete</button>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}

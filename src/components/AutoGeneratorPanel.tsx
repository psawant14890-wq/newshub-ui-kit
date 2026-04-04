import { useState, useEffect } from 'react';
import { Zap, Sparkles, CheckCircle2, Trash2, Eye, Edit3, Loader2 } from 'lucide-react';
import { useArticleGenerator } from '../hooks/useArticleGenerator';
import { TrendingTopicsWidget } from './TrendingTopicsWidget';
import { ContentPlanner } from './ContentPlanner';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';

export function AutoGeneratorPanel() {
  const { generateArticle, generating, progress, error } = useArticleGenerator();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Technology');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [bulkProgress, setBulkProgress] = useState({ running: false, current: 0, total: 0 });
  const [subTab, setSubTab] = useState<'manual' | 'trending' | 'planner' | 'drafts'>('manual');

  useEffect(() => { loadDrafts(); }, []);

  const loadDrafts = async () => {
    setLoadingDrafts(true);
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('is_ai_generated', true)
      .order('created_at', { ascending: false })
      .limit(50);
    setDrafts(data || []);
    setLoadingDrafts(false);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    const result = await generateArticle(topic, category);
    if (result) {
      toast.success('AI article generated!');
      setTopic('');
      await loadDrafts();
    }
  };

  const handleTrendingGenerate = async (topicTitle: string, source: string, url: string) => {
    const result = await generateArticle(topicTitle, undefined, `Source: ${source} - ${url}`);
    if (result) {
      toast.success('Article generated from trending topic!');
      await loadDrafts();
    }
  };

  const handlePlannerGenerate = async (topicTitle: string, cat: string) => {
    const result = await generateArticle(topicTitle, cat);
    if (result) {
      toast.success('Article generated from suggestion!');
      await loadDrafts();
    }
  };

  const handleBulkGenerate = async () => {
    setBulkProgress({ running: true, current: 0, total: 5 });
    try {
      const res = await fetch('https://www.reddit.com/r/worldnews/hot.json?limit=5');
      const json = await res.json();
      const topics = (json.data?.children || [])
        .filter((c: any) => !c.data.stickied)
        .slice(0, 5)
        .map((c: any) => c.data.title);

      for (let i = 0; i < topics.length; i++) {
        setBulkProgress(prev => ({ ...prev, current: i + 1 }));
        await generateArticle(topics[i], undefined, 'Source: Reddit r/worldnews');
      }
      toast.success(`Generated ${topics.length} articles!`);
      await loadDrafts();
    } catch {
      toast.error('Bulk generation failed');
    } finally {
      setBulkProgress({ running: false, current: 0, total: 0 });
    }
  };

  const handlePublish = async (id: string) => {
    await supabase.from('articles').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id);
    toast.success('Article published!');
    await loadDrafts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('articles').delete().eq('id', id);
    toast.success('Draft deleted.');
    await loadDrafts();
  };

  const handleApproveAll = async () => {
    const draftIds = drafts.filter(d => d.status === 'draft').map(d => d.id);
    if (draftIds.length === 0) return;
    await supabase.from('articles').update({ status: 'published', published_at: new Date().toISOString() }).in('id', draftIds);
    toast.success(`Published ${draftIds.length} articles!`);
    await loadDrafts();
  };

  const subTabs = [
    { id: 'manual' as const, label: 'Manual' },
    { id: 'trending' as const, label: 'Trending' },
    { id: 'planner' as const, label: 'Planner' },
    { id: 'drafts' as const, label: `Drafts (${drafts.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border">
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-all ${
              subTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>{t.label}</button>
        ))}
      </div>

      {subTab === 'manual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                placeholder="Enter a news topic..." disabled={generating} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all">
                {['Technology', 'Politics', 'Sports', 'World', 'Entertainment', 'Business'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
              {generating ? <LoadingSpinner size="sm" /> : <Sparkles className="h-4 w-4" />}
              Generate Article
            </button>
            <button onClick={handleBulkGenerate} disabled={generating || bulkProgress.running}
              className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-accent disabled:opacity-50 transition-all">
              {bulkProgress.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {bulkProgress.running ? `Generating ${bulkProgress.current}/${bulkProgress.total}...` : 'Bulk Generate (5)'}
            </button>
          </div>

          {generating && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> {progress}
              </p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      )}

      {subTab === 'trending' && (
        <TrendingTopicsWidget onGenerate={handleTrendingGenerate} />
      )}

      {subTab === 'planner' && (
        <ContentPlanner onGenerate={handlePlannerGenerate} />
      )}

      {subTab === 'drafts' && (
        <div className="space-y-4">
          {drafts.filter(d => d.status === 'draft').length > 0 && (
            <div className="flex justify-end">
              <button onClick={handleApproveAll}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all">
                <CheckCircle2 className="h-4 w-4" /> Approve All Drafts
              </button>
            </div>
          )}

          {loadingDrafts ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Generated</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map(d => (
                    <tr key={d.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">AI</span>
                          <p className="font-medium text-foreground line-clamp-1">{d.title}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{d.category}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          d.status === 'draft' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                        }`}>{d.status === 'draft' ? 'Draft' : 'Published'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {d.status === 'draft' && (
                            <button onClick={() => handlePublish(d.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Publish">
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(d.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {drafts.length === 0 && <p className="text-center text-muted-foreground py-8">No AI-generated articles yet.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Bot, Clock, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { supabase } from '../lib/supabase';
import { usePendingTopics, type PendingTopic } from '../hooks/usePendingTopics';
import { useArticleGenerator } from '../hooks/useArticleGenerator';
import toast from 'react-hot-toast';

export function AIDraftsReview() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { topics, fetchTopics, updateStatus, rejectTopic } = usePendingTopics();
  const { generateArticle, generating, progress } = useArticleGenerator();
  const [activeTab, setActiveTab] = useState<'drafts' | 'topics'>('drafts');

  useEffect(() => {
    loadDrafts();
    fetchTopics();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('is_ai_generated', true)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
      setDrafts(data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const approveDraft = async (draft: any) => {
    const { error } = await supabase
      .from('articles')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', draft.id);
    if (!error) {
      toast.success('Article published!');
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
    } else toast.error('Failed to publish.');
  };

  const rejectDraft = async (draft: any) => {
    const { error } = await supabase.from('articles').delete().eq('id', draft.id);
    if (!error) {
      toast.success('Draft rejected and deleted.');
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
    }
  };

  const generateFromTopic = async (topic: PendingTopic) => {
    await updateStatus(topic.id, 'generating');
    const article = await generateArticle(topic.title, undefined, '');
    if (article) {
      await updateStatus(topic.id, 'generated', article.id);
      toast.success('Draft generated from topic!');
      loadDrafts();
    } else {
      await updateStatus(topic.id, 'pending');
      toast.error('Generation failed.');
    }
  };

  const estimateReviewTime = (body: string) => {
    const words = (body || '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 250)); // ~250 wpm reading speed
  };

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border">
        {(['drafts', 'topics'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'drafts' ? `AI Drafts (${drafts.length})` : `Pending Topics (${topics.filter(t => t.status === 'pending').length})`}
          </button>
        ))}
      </div>

      {activeTab === 'drafts' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{drafts.length} AI-generated drafts awaiting review</p>
            <button onClick={loadDrafts} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? <LoadingSpinner /> : (
            <div className="space-y-3">
              {drafts.map(draft => (
                <div key={draft.id} className="p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-4 w-4 text-purple-500" />
                        <h4 className="text-sm font-semibold text-foreground line-clamp-1">{draft.title}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">AI Generated</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{draft.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ~{estimateReviewTime(draft.body)} min review</span>
                        <span>{draft.category}</span>
                        <span>{new Date(draft.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => window.open(`/article/${draft.slug}`, '_blank')}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all" title="Preview">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => approveDraft(draft)}
                        className="p-2 rounded-lg text-green-600 hover:bg-green-500/10 transition-all" title="Approve & Publish">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button onClick={() => rejectDraft(draft)}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all" title="Reject & Delete">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {drafts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No AI drafts to review. Use the Auto Generator or scan topics to create some.</p>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'topics' && (
        <div className="space-y-3">
          {generating && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <LoadingSpinner size="sm" /> {progress || 'Generating article...'}
              </p>
            </div>
          )}

          {topics.filter(t => t.status === 'pending').map(topic => (
            <div key={topic.id} className="p-4 bg-card border border-border rounded-lg flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{topic.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{topic.source}</span>
                  {topic.score > 0 && <span className="text-xs text-muted-foreground">{topic.score.toLocaleString()} pts</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => generateFromTopic(topic)} disabled={generating}
                  className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-all">
                  Generate
                </button>
                <button onClick={() => rejectTopic(topic.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {topics.filter(t => t.status === 'pending').length === 0 && (
            <p className="text-center text-muted-foreground py-8">No pending topics. Run the auto-scheduler to scan for new topics.</p>
          )}
        </div>
      )}
    </div>
  );
}

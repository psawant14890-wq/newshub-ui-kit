import { useEffect, useState } from 'react';
import { Tag as TagIcon, Bookmark, Send, Heart } from 'lucide-react';
import { Navbar, ArticleCard, Footer, Sidebar, ShareButtons, CommentCard, CategoryBadge, AuthorMeta, LoadingSpinner } from '../components';
import { getCategories, getArticleBySlug, getArticleTags, getRelatedArticles, getArticleComments, incrementArticleViews, addComment } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useBookmark } from '../hooks/useBookmark';
import { useArticleLike } from '../hooks/useArticleLike';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Article, Category, Tag, Comment } from '../types';

interface ArticlePageProps {
  slug: string;
}

export function ArticlePage({ slug }: ArticlePageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [article, setArticle] = useState<Article | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
    window.scrollTo(0, 0);
  }, [slug]);

  // Track reading history
  useEffect(() => {
    if (user && article) {
      supabase.from('reading_history').upsert({
        user_id: user.id,
        article_slug: article.slug,
        article_title: article.title,
        article_thumbnail: article.featured_image_url,
        read_at: new Date().toISOString(),
      }, { onConflict: 'user_id,article_slug' }).then(() => {});
    }
  }, [user, article?.slug]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, articleData] = await Promise.all([
        getCategories(),
        getArticleBySlug(slug)
      ]);
      setCategories(cats);
      setArticle(articleData);

      if (articleData) {
        incrementArticleViews(slug);
        const [articleTags, related, articleComments] = await Promise.all([
          getArticleTags(articleData.id),
          articleData.category_id ? getRelatedArticles(articleData.id, articleData.category_id) : Promise.resolve([]),
          getArticleComments(articleData.slug)
        ]);
        setTags(articleTags);
        setRelatedArticles(related);
        setComments(articleComments);
      }
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      history.pushState(null, '', '/auth');
      window.dispatchEvent(new Event('popstate'));
      return;
    }
    setSubmittingComment(true);
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const userAvatar = user.user_metadata?.avatar_url;
    const comment = await addComment(slug, commentText, user.id, userName, userAvatar);
    if (comment) {
      setComments(prev => [...prev, comment]);
      setCommentText('');
      toast.success('Comment posted!');
    } else {
      toast.error('Failed to post comment.');
    }
    setSubmittingComment(false);
  };

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  if (loading) return <LoadingSpinner fullPage />;

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar categories={categories} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200">
            Go Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const readTime = Math.max(1, Math.ceil((article.content?.length || 0) / 1500));

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <article className="flex-1 min-w-0 max-w-3xl">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                {article.category && <CategoryBadge category={article.category.name} size="md" />}
                {article.is_opinion && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground">Opinion</span>
                )}
                {article.is_fact_checked && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">Fact-Checked ✓</span>
                )}
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                {article.title}
              </h1>

              <p className="text-lg text-muted-foreground mb-4">{article.excerpt}</p>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <AuthorMeta
                  author={article.author ? { name: article.author.name, avatar: article.author.avatar_url } : undefined}
                  date={article.published_at}
                  readTime={readTime}
                  size="md"
                />
                <div className="flex items-center gap-2">
                  <ArticleLikeButton slug={article.slug} />
                  <ArticleBookmarkButton article={article} />
                  <ShareButtons title={article.title} url={`/article/${article.slug}`} />
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {article.featured_image_url && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img src={article.featured_image_url} alt={article.title} className="w-full h-auto object-cover" />
              </div>
            )}

            {/* Content */}
            <div className="article-content prose max-w-none text-foreground mb-8" dangerouslySetInnerHTML={{ __html: article.content }} />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-8 py-4 border-t border-border">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                {tags.map(tag => (
                  <span key={tag.id} className="px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-foreground transition-all duration-200 cursor-pointer">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <section className="border-t border-border pt-8 mb-8">
              <h3 className="font-display text-xl font-bold text-foreground mb-6">
                Comments ({comments.length})
              </h3>

              {/* Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder={user ? "Share your thoughts..." : "Sign in to comment"}
                      rows={3}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 resize-none placeholder:text-muted-foreground"
                      disabled={!user}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200"
                  >
                    {submittingComment ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
                    Post Comment
                  </button>
                </div>
              </form>

              {comments.length > 0 ? (
                <div className="divide-y divide-border">
                  {comments.map(comment => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
              )}
            </section>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section className="border-t border-border pt-8">
                <h3 className="font-display text-xl font-bold text-foreground mb-6">Related Articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map(a => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            )}
          </article>

          <Sidebar showTrending showNewsletter />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ArticleBookmarkButton({ article }: { article: Article }) {
  const { isSaved, toggleSave, loading } = useBookmark(
    article.slug,
    article.title,
    article.featured_image_url,
    article.category?.name
  );

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isSaved ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
      title={isSaved ? 'Remove bookmark' : 'Save article'}
    >
      <Bookmark className="h-5 w-5" fill={isSaved ? 'currentColor' : 'none'} />
    </button>
  );
}

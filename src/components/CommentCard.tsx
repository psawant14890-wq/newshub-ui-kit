import { useState } from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleCommentLike, addComment } from '../lib/api';
import toast from 'react-hot-toast';
import type { Comment } from '../types';

interface CommentCardProps {
  comment: Comment;
  depth?: number;
  articleSlug?: string;
  onReplyAdded?: (reply: Comment) => void;
}

export function CommentCard({ comment, depth = 0, articleSlug, onReplyAdded }: CommentCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes || 0);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Login to like comments');
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    await toggleCommentLike(comment.id, user.id);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user || !articleSlug) return;
    setSubmitting(true);
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const result = await addComment(articleSlug, replyText, user.id, userName, user.user_metadata?.avatar_url, comment.id);
    if (result) {
      setReplies(prev => [...prev, result]);
      setReplyText('');
      setShowReply(false);
      onReplyAdded?.(result);
      toast.success('Reply posted!');
    } else {
      toast.error('Failed to post reply.');
    }
    setSubmitting(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-border' : ''}`}>
      <div className="py-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-primary">{getInitials(comment.author_name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">{comment.author_name}</span>
              <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs transition-colors duration-200 ${
                  liked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Heart className="h-3.5 w-3.5" fill={liked ? 'currentColor' : 'none'} />
                {likeCount > 0 && likeCount}
              </button>
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
            </div>

            {showReply && (
              <div className="mt-3 flex gap-2">
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={user ? "Write a reply..." : "Login to reply"}
                  disabled={!user || submitting}
                  className="flex-1 px-3 py-2 text-sm bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground transition-all duration-200"
                  onKeyDown={e => e.key === 'Enter' && handleReply()}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || submitting || !user}
                  className="px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-200"
                >
                  {submitting ? '...' : 'Reply'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {replies.map(reply => (
        <CommentCard key={reply.id} comment={reply} depth={depth + 1} articleSlug={articleSlug} />
      ))}
    </div>
  );
}

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Comment {
  _id: string;
  user: {
    _id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  content: string;
  parent_id: string | null;
  created_at: string;
}

interface CommentsSectionProps {
  postId: string;
  postUserId: string;
  onCommentCountChange?: (count: number) => void;
}

const CommentsSection = ({ postId, postUserId, onCommentCountChange }: CommentsSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/social/comments/${postId}`);
      setComments(response.data);
      onCommentCountChange?.(response.data.length);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setLoading(true);

    try {
      await api.post(`/social/comment/${postId}`, {
        content: newComment.trim(),
        parent_id: replyTo,
      });
      setNewComment("");
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
    <div className={`${depth > 0 ? "ml-8 border-l border-border pl-3" : ""}`}>
      <div className="flex items-start gap-2 py-2">
        <div className="h-7 w-7 shrink-0 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground overflow-hidden">
          {comment.user?.avatar_url ? (
            <img src={comment.user.avatar_url.startsWith('http') ? comment.user.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${comment.user.avatar_url}`} className="h-full w-full object-cover" alt="" />
          ) : (
            comment.user?.display_name?.[0]?.toUpperCase() || "U"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to={`/profile/${comment.user?.username || comment.user._id}`} className="text-xs font-semibold hover:underline">
              {comment.user?.display_name || "User"}
            </Link>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs mt-0.5">{comment.content}</p>
          <button
            onClick={() => setReplyTo(comment._id)}
            className="text-[10px] text-muted-foreground hover:text-primary mt-0.5"
          >
            Reply
          </button>
        </div>
      </div>
      {replies(comment._id).map((r) => (
        <CommentItem key={r._id} comment={r} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div>
      {topLevel.map((c) => (
        <CommentItem key={c._id} comment={c} />
      ))}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <div className="flex-1">
          {replyTo && (
            <div className="text-[10px] text-muted-foreground mb-1">
              Replying to comment ·{" "}
              <button type="button" onClick={() => setReplyTo(null)} className="text-primary">
                Cancel
              </button>
            </div>
          )}
          <Input
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <Button type="submit" size="icon" disabled={!newComment.trim() || loading} className="h-8 w-8 gradient-primary text-primary-foreground shrink-0">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
};

export default CommentsSection;


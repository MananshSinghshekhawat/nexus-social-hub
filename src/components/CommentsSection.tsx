import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  profile?: { username: string | null; display_name: string | null } | null;
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
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch profiles for commenters
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
      const enriched = data.map((c) => ({ ...c, profile: profileMap.get(c.user_id) || null }));
      setComments(enriched);
      onCommentCountChange?.(enriched.length);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setLoading(true);

    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      post_id: postId,
      content: newComment.trim(),
      parent_id: replyTo,
    });

    if (!error) {
      setNewComment("");
      setReplyTo(null);
      fetchComments();
      // Notification
      if (postUserId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: postUserId,
          actor_id: user.id,
          type: "comment",
          post_id: postId,
        });
      }
    }
    setLoading(false);
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
    <div className={`${depth > 0 ? "ml-8 border-l border-border pl-3" : ""}`}>
      <div className="flex items-start gap-2 py-2">
        <div className="h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
          {comment.profile?.display_name?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to={`/profile/${comment.profile?.username || comment.user_id}`} className="text-xs font-semibold hover:underline">
              {comment.profile?.display_name || "User"}
            </Link>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs mt-0.5">{comment.content}</p>
          <button
            onClick={() => setReplyTo(comment.id)}
            className="text-[10px] text-muted-foreground hover:text-primary mt-0.5"
          >
            Reply
          </button>
        </div>
      </div>
      {replies(comment.id).map((r) => (
        <CommentItem key={r.id} comment={r} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div>
      {topLevel.map((c) => (
        <CommentItem key={c.id} comment={c} />
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

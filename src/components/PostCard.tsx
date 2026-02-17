import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import CommentsSection from "./CommentsSection";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    post_type: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
  };
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string;
  } | null;
  onDelete?: () => void;
}

const PostCard = ({ post, profile: authorProfile, onDelete }: PostCardProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", post.id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, post.id]);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      setLiked(false);
      setLikesCount((c) => c - 1);
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", post.id);
    } else {
      setLiked(true);
      setLikesCount((c) => c + 1);
      await supabase.from("likes").insert({ user_id: user.id, post_id: post.id });
      // Notification
      if (post.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: "like",
          post_id: post.id,
        });
      }
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      onDelete?.();
    }
  };

  const isOwner = user?.id === post.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 transition-all"
    >
      <div className="flex items-start gap-3">
        <Link to={`/profile/${authorProfile?.username || post.user_id}`}>
          <div className="h-10 w-10 shrink-0 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm hover:opacity-80 transition-opacity">
            {authorProfile?.display_name?.[0]?.toUpperCase() || "U"}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${authorProfile?.username || post.user_id}`} className="hover:underline">
              <span className="font-semibold text-sm">{authorProfile?.display_name || "User"}</span>
            </Link>
            <span className="text-xs text-muted-foreground">
              @{authorProfile?.username || "user"} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="mt-1.5 text-sm whitespace-pre-wrap">{post.content}</p>
          {post.image_url && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />
            </div>
          )}
          <div className="mt-3 flex items-center gap-6">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentsCount}</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="mt-4 border-t border-border pt-4">
          <CommentsSection postId={post.id} postUserId={post.user_id} onCommentCountChange={setCommentsCount} />
        </div>
      )}
    </motion.div>
  );
};

export default PostCard;

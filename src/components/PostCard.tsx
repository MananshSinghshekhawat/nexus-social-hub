import { useState } from "react";
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
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    video_url: string | null;
    post_type: string;
    filter?: string;
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
  const [liked, setLiked] = useState(false); // We need an initial liked state from backend eventually
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const { toast } = useToast();

  const handleLike = async () => {
    if (!user) return;
    try {
      const response = await api.post(`/social/like/${post.id}`);
      setLiked(response.data.liked);
      setLikesCount((prev) => response.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      toast({ title: "Error", description: "Could not like post", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/posts/${post.id}`);
      toast({ title: "Deleted", description: "Post deleted successfully" });
      onDelete?.();
    } catch (error) {
      toast({ title: "Error", description: "Could not delete post", variant: "destructive" });
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
            {authorProfile?.avatar_url ? (
              <img
                src={authorProfile.avatar_url.startsWith('http') ? authorProfile.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${authorProfile.avatar_url}`}
                className="h-full w-full rounded-full object-cover"
                alt=""
              />
            ) : (
              authorProfile?.display_name?.[0]?.toUpperCase() || "U"
            )}
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
            <div className="mt-3 rounded-xl overflow-hidden bg-black/5">
              <img
                src={post.image_url.startsWith('http') ? post.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${post.image_url}`}
                alt=""
                className="w-full object-cover max-h-[500px] transition-all duration-300"
                style={{ filter: post.filter && post.filter !== 'none' ? post.filter : '' }}
              />
            </div>
          )}
          {post.video_url && (
            <div className="mt-3 rounded-xl overflow-hidden bg-black">
              <video
                src={post.video_url.startsWith('http') ? post.video_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${post.video_url}`}
                controls
                className="w-full object-cover max-h-[500px]"
                style={{ filter: post.filter && post.filter !== 'none' ? post.filter : '' }}
              />
            </div>
          )}
          <div className="mt-3 flex items-center gap-6">
            <button
              onClick={handleLike}
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

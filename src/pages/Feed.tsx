import { useState, useEffect } from "react";
import StoriesBar from "@/components/StoriesBar";
import PostCard from "@/components/PostCard";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Music2 } from "lucide-react";

interface Post {
  _id: string;
  user: {
    _id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  content: string;
  image_url: string | null;
  video_url: string | null;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/posts");
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <StoriesBar />

      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={{
                ...post,
                id: post._id,
                user_id: post.user._id
              }}
              profile={{
                username: post.user.username,
                display_name: post.user.display_name,
                avatar_url: post.user.avatar_url
              }}
              onDelete={fetchPosts}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
            <p className="text-gray-500">No posts yet. Be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import { motion } from "framer-motion";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface ProfileMap {
  [userId: string]: {
    username: string | null;
    display_name: string | null;
    avatar_url: string;
  };
}

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .in("post_type", ["text", "image"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setPosts(data);
      const userIds = [...new Set(data.map((p) => p.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);
        
        const map: ProfileMap = {};
        profileData?.forEach((p) => { map[p.user_id] = p; });
        setProfiles(map);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Feed</h1>
      </div>

      <CreatePost onPostCreated={fetchPosts} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              profile={profiles[post.user_id]}
              onDelete={fetchPosts}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;

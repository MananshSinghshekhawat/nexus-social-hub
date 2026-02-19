import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";

const Explore = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggested = async () => {
    if (!user) return;
    // Get users the current user is NOT following
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followingIds = following?.map((f) => f.following_id) || [];
    followingIds.push(user.id); // exclude self

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .not("user_id", "in", `(${followingIds.join(",")})`)
      .limit(5);
    setSuggestedUsers(data || []);
  };

  const search = async () => {
    if (!query.trim()) {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .order("likes_count", { ascending: false })
        .limit(20);
      if (data) {
        setPosts(data);
        const userIds = [...new Set(data.map((p) => p.user_id))];
        if (userIds.length > 0) {
          const { data: p } = await supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds);
          const map: Record<string, any> = {};
          p?.forEach((pr) => { map[pr.user_id] = pr; });
          setProfiles(map);
        }
      }
      setUsers([]);
      return;
    }

    setLoading(true);
    const [userRes, postRes] = await Promise.all([
      supabase.from("profiles").select("*").or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).limit(10),
      supabase.from("posts").select("*").ilike("content", `%${query}%`).order("created_at", { ascending: false }).limit(20),
    ]);

    setUsers(userRes.data || []);
    if (postRes.data) {
      setPosts(postRes.data);
      const userIds = [...new Set(postRes.data.map((p) => p.user_id))];
      if (userIds.length > 0) {
        const { data: p } = await supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds);
        const map: Record<string, any> = {};
        p?.forEach((pr) => { map[pr.user_id] = pr; });
        setProfiles(map);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuggested();
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold font-display">Explore</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users or posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Suggested users to follow */}
      {!query && suggestedUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Who to Follow</h2>
          </div>
          <div className="space-y-2">
            {suggestedUsers.map((u) => (
              <motion.div
                key={u.user_id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-3 flex items-center gap-3"
              >
                <Link to={`/profile/${u.username || u.user_id}`} className="shrink-0">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm hover:opacity-80 transition-opacity">
                    {u.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.username || u.user_id}`} className="hover:underline">
                    <p className="font-semibold text-sm truncate">{u.display_name || "User"}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">@{u.username || "user"}</p>
                  {u.bio && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{u.bio}</p>}
                </div>
                <FollowButton targetUserId={u.user_id} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : (
        <>
          {users.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">People</h2>
              {users.map((u) => (
                <div
                  key={u.user_id}
                  className="glass rounded-xl p-3 flex items-center gap-3"
                >
                  <Link to={`/profile/${u.username || u.user_id}`} className="shrink-0">
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm hover:opacity-80 transition-opacity">
                      {u.display_name?.[0]?.toUpperCase() || "U"}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${u.username || u.user_id}`} className="hover:underline">
                      <p className="font-semibold text-sm">{u.display_name || "User"}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">@{u.username || "user"}</p>
                  </div>
                  <FollowButton targetUserId={u.user_id} />
                </div>
              ))}
            </div>
          )}

          {posts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {query ? "Posts" : "Trending"}
                </h2>
              </div>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} profile={profiles[post.user_id]} />
              ))}
            </div>
          )}

          {!loading && users.length === 0 && posts.length === 0 && query && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No results found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;

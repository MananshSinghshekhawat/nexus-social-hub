import { useState, useEffect } from "react";
import api from "@/lib/api";
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
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggested = async () => {
    if (!user) return;
    try {
      // For now, search for users that are NOT the current user
      // A more complex suggestion logic would be handled in the backend later
      const response = await api.get(`/users/search?query=a&limit=5`); // Mocking suggested
      setSuggestedUsers(response.data.filter((u: any) => u._id !== user._id));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const search = async () => {
    setLoading(true);
    try {
      if (!query.trim()) {
        const postRes = await api.get('/posts?limit=20');
        setPosts(postRes.data);
        setUsers([]);
      } else {
        const [userRes, postRes] = await Promise.all([
          api.get(`/users/search?query=${query}`),
          api.get(`/posts?query=${query}`)
        ]);
        setUsers(userRes.data);
        setPosts(postRes.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
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

      {!query && suggestedUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Who to Follow</h2>
          </div>
          <div className="space-y-2">
            {suggestedUsers.map((u) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-3 flex items-center gap-3"
              >
                <Link to={`/profile/${u.username || u._id}`} className="shrink-0">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm hover:opacity-80 transition-opacity">
                    {u.avatar_url ? (
                      <img src={u.avatar_url.startsWith('http') ? u.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${u.avatar_url}`} className="h-full w-full rounded-full object-cover" alt="" />
                    ) : (
                      u.display_name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.username || u._id}`} className="hover:underline">
                    <p className="font-semibold text-sm truncate">{u.display_name || "User"}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">@{u.username || "user"}</p>
                  {u.bio && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{u.bio}</p>}
                </div>
                <FollowButton targetUserId={u._id} />
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
                  key={u._id}
                  className="glass rounded-xl p-3 flex items-center gap-3"
                >
                  <Link to={`/profile/${u.username || u._id}`} className="shrink-0">
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm hover:opacity-80 transition-opacity">
                      {u.avatar_url ? (
                        <img src={u.avatar_url.startsWith('http') ? u.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${u.avatar_url}`} className="h-full w-full rounded-full object-cover" alt="" />
                      ) : (
                        u.display_name?.[0]?.toUpperCase() || "U"
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${u.username || u._id}`} className="hover:underline">
                      <p className="font-semibold text-sm">{u.display_name || "User"}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">@{u.username || "user"}</p>
                  </div>
                  <FollowButton targetUserId={u._id} />
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
                <PostCard
                  key={post._id}
                  post={{ ...post, id: post._id }}
                  profile={post.user}
                />
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


import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Shield, Users, FileText, Search, Trash2, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UserRow {
  _id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url?: string;
  created_at: string;
}

interface PostRow {
  _id: string;
  user: { _id: string; display_name: string; username: string };
  content: string | null;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

type Tab = "users" | "content";

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0 });

  const isAdmin = user?.role === "admin";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, postsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/posts')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
      toast({ title: "Error", description: "Failed to load admin data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleDeletePost = async () => {
    if (!deletePostId) return;
    try {
      await api.delete(`/admin/posts/${deletePostId}`);
      toast({ title: "Post removed" });
      setPosts((prev) => prev.filter((p) => p._id !== deletePostId));
      setStats((prev) => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    } finally {
      setDeletePostId(null);
    }
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(
    (p) =>
      !searchQuery ||
      p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Platform management & oversight</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Users", value: stats.totalUsers, icon: Users },
          { label: "Posts", value: stats.totalPosts, icon: FileText },
          { label: "Comments", value: stats.totalComments, icon: Eye },
        ].map(({ label, value, icon: Icon }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 text-center"
          >
            <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold font-display">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "users" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Users className="h-4 w-4 inline mr-1.5" /> Users
          </button>
          <button
            onClick={() => setTab("content")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "content" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <FileText className="h-4 w-4 inline mr-1.5" /> Content
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : tab === "users" ? (
        <div className="space-y-2">
          {filteredUsers.map((u) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4 flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 overflow-hidden">
                {u.avatar_url ? (
                  <img src={u.avatar_url} className="h-full w-full object-cover" alt="" />
                ) : (
                  u.display_name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{u.display_name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">@{u.username || "user"} · Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</p>
              </div>
            </motion.div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPosts.map((p) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    {p.user?.display_name || "Unknown"} · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </p>
                  <p className="text-sm line-clamp-2">{p.content || "(No text content)"}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>❤️ {p.likes_count}</span>
                    <span>💬 {p.comments_count}</span>
                    <span className="capitalize">{p.post_type}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={() => setDeletePostId(p._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
          {filteredPosts.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No posts found</p>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Post</DialogTitle>
            <DialogDescription>This will permanently delete this post and its engagement data. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePostId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePost}>Delete Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;

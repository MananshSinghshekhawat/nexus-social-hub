import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Shield, Users, FileText, Search, Trash2, Eye, Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { getAllUsersWellbeingData, AdminUserWellbeingData } from "@/lib/wellbeingApi";
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
  email: string | null;
  password: string | null;
  role: string | null;
  website: string | null;
  bio: string | null;
  avatar_url?: string;
  created_at: string;
}

interface PostRow {
  _id: string;
  user: { _id: string; display_name: string; username: string; avatar_url?: string };
  content: string | null;
  image_url?: string;
  video_url?: string;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

type Tab = "users" | "content" | "wellbeing";

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [wellbeingUsers, setWellbeingUsers] = useState<AdminUserWellbeingData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0 });

  // Only consider 'admin' explicitly. If not, bounce out immediately.
  const isAdmin = user?.role === "admin";

  const getMediaUrl = (path: string | undefined) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === "wellbeing") {
          const wellbeingData = await getAllUsersWellbeingData();
          setWellbeingUsers(wellbeingData);
        } else {
          const [statsRes, usersRes, postsRes] = await Promise.all([
            api.get('/admin/stats'),
            api.get('/admin/users'),
            api.get('/admin/posts')
          ]);
          setStats(statsRes.data);
          setUsers(usersRes.data);
          setPosts(postsRes.data);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch admin data", error);
        const status = typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
        if (status === 403 || status === 401) {
          toast({ title: "Access Denied", description: "You are not an admin", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "Failed to load admin data", variant: "destructive" });
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) fetchData();
  }, [isAdmin, toast, tab]);

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

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      await api.delete(`/admin/users/${deleteUserId}`);
      toast({ title: "User banned and removed" });
      setUsers((prev) => prev.filter((u) => u._id !== deleteUserId));
      setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    } finally {
      setDeleteUserId(null);
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-1 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setTab("users")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === "users" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Users className="h-4 w-4 inline mr-1.5" /> Users
          </button>
          <button
            onClick={() => setTab("content")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === "content" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <FileText className="h-4 w-4 inline mr-1.5" /> Content
          </button>
          <button
            onClick={() => setTab("wellbeing")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === "wellbeing" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Activity className="h-4 w-4 inline mr-1.5" /> Wellbeing
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
              className="glass rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedUser(u)}
            >
              <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 overflow-hidden">
                {u.avatar_url ? (
                  <img src={getMediaUrl(u.avatar_url)} className="h-full w-full object-cover" alt="" />
                ) : (
                  u.display_name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{u.display_name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">@{u.username || "user"} · Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={(e) => { e.stopPropagation(); setDeleteUserId(u._id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
          )}
        </div>
      ) : tab === "content" ? (
        <div className="space-y-2">
          {filteredPosts.map((p) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">

                {/* User Avatar & Media Thumbnail left side */}
                <div className="flex gap-3 items-center shrink-0">
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden shrink-0">
                    {p.user?.avatar_url ? (
                      <img src={getMediaUrl(p.user.avatar_url)} className="h-full w-full object-cover" alt="Avatar" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                        {p.user?.display_name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  {(p.image_url || p.video_url) && (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-lg overflow-hidden bg-black shrink-0 relative">
                      {p.video_url ? (
                        <video src={getMediaUrl(p.video_url)} className="h-full w-full object-cover opacity-80" />
                      ) : (
                        <img src={getMediaUrl(p.image_url)} className="h-full w-full object-cover" alt="Post media" />
                      )}
                      <div className="absolute top-1 right-1 bg-black/50 text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md font-medium uppercase">
                        {p.post_type}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    <strong className="text-foreground">{p.user?.display_name || "Unknown"}</strong> · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </p>
                  <p className="text-sm line-clamp-2">{p.content || <span className="text-muted-foreground italic">No text content</span>}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>❤️ {p.likes_count}</span>
                    <span>💬 {p.comments_count}</span>
                    {!p.image_url && !p.video_url && <span className="capitalize">{p.post_type}</span>}
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
      ) : tab === "wellbeing" ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Today</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">This Week</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Time Spent (min)</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {wellbeingUsers
                  .filter((u) => 
                    !searchQuery || 
                    u.user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((u) => (
                    <motion.tr
                      key={u.user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden shrink-0">
                            {u.user.avatar_url ? (
                              <img src={getMediaUrl(u.user.avatar_url)} className="h-full w-full object-cover" alt="" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                                {u.user.display_name?.[0]?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.user.display_name}</p>
                            <p className="text-xs text-muted-foreground">@{u.user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                          {u.today}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md text-xs font-medium">
                          {u.week}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{u.total_activities}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{u.total_time_spent}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {u.last_login ? formatDistanceToNow(new Date(u.last_login), { addSuffix: true }) : "Never"}
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>
          {wellbeingUsers.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No wellbeing data available</p>
          )}
        </div>
      ) : null}

      {/* Delete Post confirmation */}
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

      {/* Delete User confirmation */}
      <Dialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban / Delete User</DialogTitle>
            <DialogDescription>This will permanently delete this user, their posts, and all their data. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 rounded-full bg-muted overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <img src={getMediaUrl(selectedUser.avatar_url)} className="h-full w-full object-cover" alt="Avatar" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                      {selectedUser.display_name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-[70px_1fr] sm:grid-cols-[100px_1fr] gap-x-2 gap-y-3 text-sm">
                <span className="font-semibold text-muted-foreground">ID:</span>
                <span className="break-all font-mono">{selectedUser._id}</span>
                
                <span className="font-semibold text-muted-foreground">Name:</span>
                <span>{selectedUser.display_name || "N/A"}</span>
                
                <span className="font-semibold text-muted-foreground">Username:</span>
                <span>@{selectedUser.username}</span>

                <span className="font-semibold text-muted-foreground">Email:</span>
                <span className="break-all">{selectedUser.email || "N/A"}</span>

                <span className="font-semibold text-muted-foreground">Role:</span>
                <span className="capitalize">{selectedUser.role || "user"}</span>

                <span className="font-semibold text-muted-foreground mt-1">Password:</span>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1">(Hashed)</span>
                  <span className="font-mono text-[10px] break-all bg-muted p-1.5 rounded">{selectedUser.password || "N/A"}</span>
                </div>

                <span className="font-semibold text-muted-foreground">Bio:</span>
                <span>{selectedUser.bio || "N/A"}</span>

                <span className="font-semibold text-muted-foreground">Website:</span>
                <span className="break-all">
                  {selectedUser.website ? (
                    <a href={selectedUser.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedUser.website}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </span>

                <span className="font-semibold text-muted-foreground">Joined:</span>
                <span>{new Date(selectedUser.created_at).toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;

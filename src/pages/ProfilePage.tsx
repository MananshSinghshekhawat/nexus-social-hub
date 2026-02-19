import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, Profile } from "@/contexts/AuthContext";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Edit3, Calendar, Globe, MessageCircle, Grid3X3, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ProfilePage = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "", bio: "", website: "" });
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const { toast } = useToast();

  const isOwnProfile = user?.id === profile?.user_id;

  useEffect(() => {
    if (!identifier) return;
    const fetchProfile = async () => {
      setLoading(true);
      let { data } = await supabase.from("profiles").select("*").eq("username", identifier).maybeSingle();
      if (!data) {
        const res = await supabase.from("profiles").select("*").eq("user_id", identifier).maybeSingle();
        data = res.data;
      }
      if (data) {
        setProfile(data as Profile);
        setEditForm({ display_name: data.display_name || "", bio: data.bio || "", website: data.website || "" });

        const [postRes, followersRes, followingRes] = await Promise.all([
          supabase.from("posts").select("*").eq("user_id", data.user_id).order("created_at", { ascending: false }),
          supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", data.user_id),
          supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", data.user_id),
        ]);

        setPosts(postRes.data || []);
        setFollowersCount(followersRes.count || 0);
        setFollowingCount(followingRes.count || 0);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [identifier, user]);

  const fetchFollowersList = async () => {
    if (!profile) return;
    const { data: follows } = await supabase.from("follows").select("follower_id").eq("following_id", profile.user_id);
    if (follows && follows.length > 0) {
      const ids = follows.map((f) => f.follower_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, username, display_name, bio").in("user_id", ids);
      setFollowersList(profiles || []);
    } else {
      setFollowersList([]);
    }
    setShowFollowers(true);
  };

  const fetchFollowingList = async () => {
    if (!profile) return;
    const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", profile.user_id);
    if (follows && follows.length > 0) {
      const ids = follows.map((f) => f.following_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, username, display_name, bio").in("user_id", ids);
      setFollowingList(profiles || []);
    } else {
      setFollowingList([]);
    }
    setShowFollowing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(editForm)
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile((prev) => prev ? { ...prev, ...editForm } : null);
      setEditing(false);
      refreshProfile();
      toast({ title: "Profile updated" });
    }
  };

  const handleMessage = () => {
    navigate("/messages");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const UserListDialog = ({ open, onClose, title, list }: { open: boolean; onClose: () => void; title: string; list: any[] }) => (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {list.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No {title.toLowerCase()} yet</p>
          ) : (
            list.map((u) => (
              <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Link to={`/profile/${u.username || u.user_id}`} onClick={onClose} className="shrink-0">
                  <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                    {u.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.username || u.user_id}`} onClick={onClose} className="hover:underline">
                    <p className="font-semibold text-sm truncate">{u.display_name || "User"}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">@{u.username || "user"}</p>
                </div>
                <FollowButton targetUserId={u.user_id} size="sm" />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="py-6 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden"
      >
        {/* Cover */}
        <div className="h-36 gradient-primary opacity-80 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/40" />
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 relative z-10">
            <div className="h-24 w-24 rounded-full border-4 border-card gradient-accent flex items-center justify-center text-accent-foreground font-bold text-3xl font-display shadow-lg">
              {profile.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0 pt-14">
              <h1 className="text-xl font-bold font-display">{profile.display_name || "User"}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username || "user"}</p>
            </div>
            <div className="flex gap-2 shrink-0 pt-14">
              {isOwnProfile ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
                </Button>
              ) : (
                <>
                  <FollowButton
                    targetUserId={profile.user_id}
                    onFollowChange={(following) => setFollowersCount((c) => following ? c + 1 : c - 1)}
                  />
                  <Button variant="outline" size="sm" onClick={handleMessage}>
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {profile.bio && <p className="mt-4 text-sm leading-relaxed">{profile.bio}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            {profile.website && (
              <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-xs">
                <Globe className="h-3.5 w-3.5" /> {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-6 text-sm">
            <button onClick={fetchFollowersList} className="hover:underline transition-colors">
              <span className="font-bold">{followersCount}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </button>
            <button onClick={fetchFollowingList} className="hover:underline transition-colors">
              <span className="font-bold">{followingCount}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </button>
            <div>
              <span className="font-bold">{posts.length}</span>
              <span className="text-muted-foreground ml-1">Posts</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Posts Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-1 pb-3">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Posts</h2>
        </div>
        <Separator className="mb-4" />
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                profile={{ username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url }}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                maxLength={160}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{editForm.bio.length}/160</p>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://yoursite.com"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} className="gradient-primary text-primary-foreground">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Followers/Following dialogs */}
      <UserListDialog open={showFollowers} onClose={() => setShowFollowers(false)} title="Followers" list={followersList} />
      <UserListDialog open={showFollowing} onClose={() => setShowFollowing(false)} title="Following" list={followingList} />
    </div>
  );
};

export default ProfilePage;

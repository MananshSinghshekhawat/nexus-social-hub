import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, Profile } from "@/contexts/AuthContext";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { UserPlus, UserMinus, Edit3, X, Check, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ProfilePage = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "", bio: "", website: "" });
  const { toast } = useToast();

  const isOwnProfile = user?.id === profile?.user_id;

  useEffect(() => {
    if (!identifier) return;
    const fetchProfile = async () => {
      setLoading(true);
      // Try by username first, then by user_id
      let { data } = await supabase.from("profiles").select("*").eq("username", identifier).maybeSingle();
      if (!data) {
        const res = await supabase.from("profiles").select("*").eq("user_id", identifier).maybeSingle();
        data = res.data;
      }
      if (data) {
        setProfile(data as Profile);
        setEditForm({ display_name: data.display_name || "", bio: data.bio || "", website: data.website || "" });

        // Fetch posts
        const { data: postData } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", data.user_id)
          .order("created_at", { ascending: false });
        setPosts(postData || []);

        // Fetch follower counts
        const { count: followers } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", data.user_id);
        setFollowersCount(followers || 0);

        const { count: following } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", data.user_id);
        setFollowingCount(following || 0);

        // Check if following
        if (user) {
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", data.user_id)
            .maybeSingle();
          setIsFollowing(!!followData);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [identifier, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.user_id);
      setIsFollowing(false);
      setFollowersCount((c) => c - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.user_id });
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        actor_id: user.id,
        type: "follow",
      });
    }
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

  return (
    <div className="py-6 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden"
      >
        {/* Cover */}
        <div className="h-32 gradient-primary opacity-80" />

        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="h-20 w-20 rounded-full border-4 border-card gradient-accent flex items-center justify-center text-accent-foreground font-bold text-2xl font-display">
              {profile.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0 pt-12">
              <h1 className="text-xl font-bold font-display">{profile.display_name || "User"}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username || "user"}</p>
            </div>
            {isOwnProfile ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
                <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={toggleFollow}
                variant={isFollowing ? "outline" : "default"}
                className={!isFollowing ? "gradient-primary text-primary-foreground" : ""}
              >
                {isFollowing ? (
                  <><UserMinus className="h-3.5 w-3.5 mr-1.5" /> Unfollow</>
                ) : (
                  <><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Follow</>
                )}
              </Button>
            )}
          </div>

          {profile.bio && <p className="mt-4 text-sm">{profile.bio}</p>}

          <div className="mt-4 flex items-center gap-6 text-sm">
            <div>
              <span className="font-semibold">{followersCount}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
            <div>
              <span className="font-semibold">{followingCount}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
            <div>
              <span className="font-semibold">{posts.length}</span>
              <span className="text-muted-foreground ml-1">Posts</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
          </div>
        </div>
      </motion.div>

      {/* Posts */}
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
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} className="gradient-primary text-primary-foreground">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;

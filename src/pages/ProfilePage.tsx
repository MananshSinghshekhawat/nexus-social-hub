import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth, User } from "@/contexts/AuthContext";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Edit3, Calendar, Globe, MessageCircle, Grid3X3, Camera } from "lucide-react";
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
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const isOwnProfile = user?._id === profile?._id;

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!identifier) return;
      setLoading(true);
      try {
        const response = await api.get(`/users/${identifier}`);
        const userData = response.data;
        setProfile(userData);

        setEditForm({
          display_name: userData.display_name || "",
          bio: userData.bio || "",
          website: userData.website || ""
        });

        // Use userData._id for sub-resources
        const [postsRes, followersRes, followingRes] = await Promise.all([
          api.get(`/posts?userId=${userData._id}`),
          api.get(`/users/${userData._id}/followers`),
          api.get(`/users/${userData._id}/following`)
        ]);

        setPosts(postsRes.data);
        setFollowersList(followersRes.data);
        setFollowingList(followingRes.data);
        setFollowersCount(followersRes.data.length);
        setFollowingCount(followingRes.data.length);

      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({ title: "Error", description: "Profile not found", variant: "destructive" });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [identifier, navigate, toast]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const formData = new FormData();
      formData.append("display_name", editForm.display_name);
      formData.append("bio", editForm.bio);
      formData.append("website", editForm.website);
      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverFile) formData.append("cover", coverFile);

      const response = await api.patch(`/users/me`, formData);

      setProfile(response.data);
      setEditing(false);
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarPreview(null);
      setCoverPreview(null);
      refreshProfile();
      toast({ title: "Profile updated" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update profile",
        variant: "destructive"
      });
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
              <div key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Link to={`/profile/${u.username || u._id}`} onClick={onClose} className="shrink-0">
                  <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                    {u.avatar_url ? (
                      <img src={getImageUrl(u.avatar_url)} className="h-full w-full rounded-full object-cover" alt="" />
                    ) : (
                      u.display_name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.username || u._id}`} onClick={onClose} className="hover:underline">
                    <p className="font-semibold text-sm truncate">{u.display_name || "User"}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">@{u.username || "user"}</p>
                </div>
                <FollowButton targetUserId={u._id} size="sm" />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden"
      >
        <div className="h-48 md:h-64 gradient-primary opacity-80 relative group">
          {profile.cover_url && (
            <img src={getImageUrl(profile.cover_url)} className="absolute inset-0 w-full h-full object-cover" alt="" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/60" />

          {isOwnProfile && (
            <button
              onClick={() => setEditing(true)}
              className="absolute right-4 bottom-4 glass p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95 z-20"
              title="Change cover photo"
            >
              <Camera className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16 md:-mt-12 relative z-10 text-center sm:text-left">
            <div className="relative group/avatar shrink-0 z-20">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-card gradient-accent flex items-center justify-center text-accent-foreground font-bold text-3xl md:text-4xl font-display shadow-lg overflow-hidden">
                {profile.avatar_url ? (
                  <img src={getImageUrl(profile.avatar_url)} className="h-full w-full object-cover" alt="" />
                ) : (
                  profile.display_name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setEditing(true)}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity z-20"
                  title="Change avatar"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-2 sm:pt-16 md:pt-20 w-full">
              <h1 className="text-xl md:text-2xl font-bold font-display truncate">{profile.display_name || "User"}</h1>
              <p className="text-sm md:text-base text-muted-foreground truncate">@{profile.username || "user"}</p>
            </div>
            <div className="flex justify-center sm:justify-end gap-2 shrink-0 pt-1 sm:pt-16 md:pt-20 w-full sm:w-auto mt-2 sm:mt-0">
              {isOwnProfile ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="w-full sm:w-auto">
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
                </Button>
              ) : (
                <>
                  <div className="flex-1 sm:flex-none">
                    <FollowButton
                      targetUserId={profile._id}
                      onFollowChange={(following) => setFollowersCount((c) => following ? c + 1 : c - 1)}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleMessage}>
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {profile.bio && <p className="mt-4 text-sm leading-relaxed text-center sm:text-left px-2 sm:px-0">{profile.bio}</p>}

          <div className="mt-4 flex flex-wrap justify-center sm:justify-start items-center gap-4 text-sm px-2 sm:px-0">
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

          <div className="mt-5 flex items-center justify-center sm:justify-start gap-6 text-sm px-2 sm:px-0 bg-muted/30 sm:bg-transparent py-3 sm:py-0 rounded-xl sm:rounded-none">
            <button onClick={() => setShowFollowers(true)} className="hover:underline transition-colors">
              <span className="font-bold">{followersCount}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </button>
            <button onClick={() => setShowFollowing(true)} className="hover:underline transition-colors">
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
                key={post._id}
                post={{ ...post, id: post._id }}
                profile={{ username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url }}
              />
            ))
          )}
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col sm:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-5 pr-2 py-2 flex-1 scrollbar-thin">
            <div className="grid gap-2">
              <Label>Avatar Image</Label>
              <div className="flex items-center gap-4">
                <label className="relative cursor-pointer group rounded-full">
                  <div className="h-16 w-16 rounded-full border overflow-hidden bg-muted flex items-center justify-center shrink-0 transition-opacity group-hover:opacity-80">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="h-full w-full object-cover" alt="Avatar preview" />
                    ) : profile.avatar_url ? (
                      <img src={getImageUrl(profile.avatar_url)} className="h-full w-full object-cover" alt="Current avatar" />
                    ) : (
                      <span className="text-xl font-bold">{profile.display_name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <Input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAvatarFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setAvatarPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      } else {
                        setAvatarPreview(null);
                      }
                    }}
                  />
                </label>
                <div className="text-sm text-muted-foreground flex-1">
                  Click the avatar to upload a new photo. Recommended size: 256x256px.
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Banner/Cover Image</Label>
              <label className="relative cursor-pointer group w-full block">
                <div className="h-24 w-full rounded-lg border overflow-hidden bg-muted flex items-center justify-center transition-opacity group-hover:opacity-80">
                  {coverPreview ? (
                    <img src={coverPreview} className="h-full w-full object-cover" alt="Cover preview" />
                  ) : profile.cover_url ? (
                    <img src={getImageUrl(profile.cover_url)} className="h-full w-full object-cover" alt="Current cover" />
                  ) : (
                    <div className="w-full h-full gradient-primary opacity-50" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <Input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setCoverFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setCoverPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      setCoverPreview(null);
                    }
                  }}
                />
              </label>
            </div>
            <div className="grid gap-2">
              <Label>Display Name</Label>
              <Input
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Bio</Label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                maxLength={160}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{editForm.bio.length}/160</p>
            </div>
            <div className="grid gap-2 pb-2">
              <Label>Website</Label>
              <Input
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://yoursite.com"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t mt-auto">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} className="gradient-primary text-primary-foreground">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <UserListDialog
        open={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="Followers"
        list={followersList}
      />
      <UserListDialog
        open={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="Following"
        list={followingList}
      />
    </div >
  );
};

export default ProfilePage;

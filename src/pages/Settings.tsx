import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { User, Lock, Bell, Palette, Shield, Save, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Tab = "profile" | "account" | "notifications" | "appearance";

const Settings = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Profile form
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [username, setUsername] = useState(profile?.username || "");

  // Account form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification prefs (local only for now)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushLikes, setPushLikes] = useState(true);
  const [pushFollows, setPushFollows] = useState(true);
  const [pushMessages, setPushMessages] = useState(true);

  // Theme
  const [theme, setTheme] = useState<"dark" | "light">(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio, website, username })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  const toggleTheme = (mode: "dark" | "light") => {
    setTheme(mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const tabs = [
    { id: "profile" as Tab, label: "Profile", icon: User },
    { id: "account" as Tab, label: "Account", icon: Lock },
    { id: "notifications" as Tab, label: "Notifications", icon: Bell },
    { id: "appearance" as Tab, label: "Appearance", icon: Palette },
  ];

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold font-display">Settings</h1>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* Tabs */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:w-48 shrink-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all
                ${activeTab === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass rounded-2xl p-6"
        >
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold font-display">Edit Profile</h2>
                <p className="text-sm text-muted-foreground">Update your public information</p>
              </div>
              <Separator />
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" maxLength={160} rows={3} />
                  <p className="text-xs text-muted-foreground">{bio.length}/160</p>
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary text-primary-foreground">
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold font-display">Account Security</h2>
                <p className="text-sm text-muted-foreground">Manage your account credentials</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="glass rounded-xl p-4">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
                  <p className="font-medium mt-1">{user?.email}</p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Change Password</h3>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button onClick={handleChangePassword} disabled={saving || !newPassword} variant="outline">
                    <Lock className="h-4 w-4 mr-2" /> Update Password
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-destructive">Danger Zone</h3>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={signOut} className="text-muted-foreground">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold font-display">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">Control what alerts you receive</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Likes</p>
                    <p className="text-xs text-muted-foreground">When someone likes your post</p>
                  </div>
                  <Switch checked={pushLikes} onCheckedChange={setPushLikes} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">New Followers</p>
                    <p className="text-xs text-muted-foreground">When someone follows you</p>
                  </div>
                  <Switch checked={pushFollows} onCheckedChange={setPushFollows} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Messages</p>
                    <p className="text-xs text-muted-foreground">When you receive a new message</p>
                  </div>
                  <Switch checked={pushMessages} onCheckedChange={setPushMessages} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold font-display">Appearance</h2>
                <p className="text-sm text-muted-foreground">Customize how Nexus Logic looks</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => toggleTheme("light")}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                  >
                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-background border border-border" />
                    <p className="text-sm font-medium">Light</p>
                  </button>
                  <button
                    onClick={() => toggleTheme("dark")}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                  >
                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-card border border-border" style={{ background: "hsl(222 30% 7%)" }} />
                    <p className="text-sm font-medium">Dark</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;

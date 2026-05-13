import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { User, Lock, Bell, Palette, Save, LogOut, Trash2, Shield, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { WellbeingChart } from "@/components/WellbeingChart";
import { getUserWellbeingData, updateWellbeingSettings as updateWellbeingSettingsAPI, UserWellbeingData } from "@/lib/wellbeingApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Tab = "profile" | "account" | "notifications" | "appearance" | "wellbeing";

type ApiError = {
  message?: string;
  config?: {
    url?: string;
  };
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
};

type WellbeingErrorState = {
  title: string;
  description: string;
};

const Settings = () => {
  const { user, refreshProfile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [wellbeingData, setWellbeingData] = useState<UserWellbeingData | null>(null);
  const [wellbeingLoading, setWellbeingLoading] = useState(false);
  const [wellbeingError, setWellbeingError] = useState<WellbeingErrorState | null>(null);
  const [wellbeingEnabled, setWellbeingEnabled] = useState(true);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);

  // Profile form
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [username, setUsername] = useState(user?.username || "");

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

  const getErrorMessage = (error: unknown, fallback: string) => {
    const apiError = error as ApiError;
    return apiError.response?.data?.error || fallback;
  };

  const getWellbeingErrorState = (error: unknown): WellbeingErrorState => {
    const apiError = error as ApiError;
    const requestUrl = apiError.config?.url || "";

    if (apiError.response?.status === 404 && requestUrl.includes("/wellbeing")) {
      return {
        title: "Wellbeing API not available",
        description: "Restart the backend server so it picks up the new /api/wellbeing routes."
      };
    }

    return {
      title: "Unable to load wellbeing data",
      description: getErrorMessage(error, "Failed to load wellbeing data")
    };
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.patch('/users/me', { display_name: displayName, bio, website, username });
      await refreshProfile();
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update profile"),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/update-password', { password: newPassword });
      toast({ title: "Password updated" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update password"),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await api.delete('/users/me');
      toast({ title: "Account deleted" });
      logout();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete account"),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
    }
  };

  const toggleTheme = (mode: "dark" | "light") => {
    setTheme(mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const fetchWellbeingData = async () => {
    setWellbeingLoading(true);
    setWellbeingError(null);
    try {
      const data = await getUserWellbeingData();
      setWellbeingData(data);
      setWellbeingEnabled(data.user.wellbeing_enabled);
      setDailyLimit(data.user.daily_limit || null);
    } catch (error: unknown) {
      const errorState = getWellbeingErrorState(error);
      setWellbeingData(null);
      setWellbeingError(errorState);
      toast({
        title: errorState.title,
        description: errorState.description,
        variant: "destructive"
      });
    } finally {
      setWellbeingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "wellbeing") {
      fetchWellbeingData();
    }
  }, [activeTab]);

  const handleSaveWellbeingSettings = async () => {
    setSaving(true);
    try {
      await updateWellbeingSettingsAPI(wellbeingEnabled, dailyLimit || undefined);
      toast({ title: "Wellbeing settings updated" });
      await fetchWellbeingData();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update wellbeing settings"),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "account" as Tab, label: "Account", icon: Lock },
    { id: "notifications" as Tab, label: "Notifications", icon: Bell },
    { id: "appearance" as Tab, label: "Appearance", icon: Palette },
    { id: "wellbeing" as Tab, label: "Digital Wellbeing", icon: Activity },
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

          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-4"
            >
              <Shield className="h-4 w-4" />
              Admin Dashboard
            </button>
          )}
        </nav>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass rounded-2xl p-6"
        >

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
                  <Button variant="outline" onClick={logout} className="text-muted-foreground">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold font-display">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">Control what alerts you receive (Local Demo)</p>
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
                    <div className="mx-auto mb-2 h-10 w-10 rounded-full border border-border bg-[hsl(222_30%_7%)]" />
                    <p className="text-sm font-medium">Dark</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wellbeing" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold font-display">Digital Wellbeing</h2>
                <p className="text-sm text-muted-foreground">Track and manage your platform activity</p>
              </div>
              <Separator />
              
              {wellbeingLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading wellbeing data...</p>
                </div>
              ) : wellbeingData ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium">Enable Digital Wellbeing Tracking</p>
                          <p className="text-xs text-muted-foreground">Track your platform activity and usage</p>
                        </div>
                        <Switch checked={wellbeingEnabled} onCheckedChange={setWellbeingEnabled} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Daily Usage Limit (minutes)</Label>
                        <Input
                          type="number"
                          value={dailyLimit || ''}
                          onChange={(e) => setDailyLimit(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="No limit"
                          min="0"
                          disabled={!wellbeingEnabled}
                        />
                        <p className="text-xs text-muted-foreground">Leave empty for no limit</p>
                      </div>

                      <Button onClick={handleSaveWellbeingSettings} disabled={saving} variant="outline" className="w-full">
                        <Save className="h-4 w-4 mr-2" /> Save Settings
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium text-sm mb-4">Your Activity Analytics</h3>
                    <WellbeingChart data={wellbeingData} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {wellbeingError?.description || "Unable to load wellbeing data"}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={saving}>
              {saving ? "Deleting..." : "Permanently Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;

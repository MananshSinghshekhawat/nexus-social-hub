import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, UserPlus, MessageCircle, AtSign, Check } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  actor_id: string;
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor?: { username: string | null; display_name: string | null } | null;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const actorIds = [...new Set(data.map((n) => n.actor_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .in("user_id", actorIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
      setNotifications(data.map((n) => ({ ...n, actor: profileMap.get(n.actor_id) || null })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;
    const channel = supabase
      .channel("notifications-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const iconMap: Record<string, React.ReactNode> = {
    like: <Heart className="h-4 w-4 text-destructive" />,
    follow: <UserPlus className="h-4 w-4 text-primary" />,
    comment: <MessageCircle className="h-4 w-4 text-accent" />,
    mention: <AtSign className="h-4 w-4 text-primary" />,
  };

  const messageMap: Record<string, string> = {
    like: "liked your post",
    follow: "started following you",
    comment: "commented on your post",
    mention: "mentioned you",
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-xl p-3 flex items-center gap-3 transition-all ${!n.read ? "border-l-2 border-l-primary" : ""}`}
            >
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                {iconMap[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <Link to={`/profile/${n.actor?.username || n.actor_id}`} className="font-semibold hover:underline">
                    {n.actor?.display_name || "Someone"}
                  </Link>{" "}
                  {messageMap[n.type] || "interacted with you"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

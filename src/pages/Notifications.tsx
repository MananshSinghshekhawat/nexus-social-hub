import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, UserPlus, MessageCircle, AtSign, Check, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  _id: string;
  type: string;
  actor: { _id: string; username: string | null; display_name: string | null; avatar_url?: string } | null;
  post?: string | null;
  read: boolean;
  created_at: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await api.patch('/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      // Dispatch event to update AppLayout badge immediately
      window.dispatchEvent(new Event('notificationsRead'));
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Auto mark as read when visiting page? Or only via button? 
      // Original logic had a markAsRead call here.
      markAllRead();
    }
  }, [user?._id]);

  // Socket listener
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotif = () => {
      fetchNotifications();
    };

    socket.on('notification_received', handleNewNotif);

    return () => {
      socket.off('notification_received', handleNewNotif);
    };
  }, [socket, user]);

  const iconMap: Record<string, React.ReactNode> = {
    like: <Heart className="h-4 w-4 text-destructive" />,
    follow: <UserPlus className="h-4 w-4 text-primary" />,
    comment: <MessageCircle className="h-4 w-4 text-accent" />,
    mention: <AtSign className="h-4 w-4 text-primary" />,
    story: <Bell className="h-4 w-4 text-amber-500" />,
    message: <MessageCircle className="h-4 w-4 text-green-500" />,
  };

  const messageMap: Record<string, string> = {
    like: "liked your post",
    follow: "started following you",
    comment: "commented on your post",
    mention: "mentioned you",
    story: "posted a new story",
    message: "sent you a message",
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-muted-foreground group">
            <Check className="h-3.5 w-3.5 mr-1 group-hover:text-primary transition-colors" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl border-dashed">
          <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-primary/40" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Clear for now!</p>
          <p className="text-[10px] text-muted-foreground">New notifications will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`glass rounded-2xl p-4 flex items-center gap-4 transition-all relative overflow-hidden group hover:bg-muted/30 ${!n.read ? "ring-1 ring-primary/20" : ""}`}
              >
                {!n.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <div className="h-10 w-10 shrink-0">
                  <Avatar className="h-full w-full border border-primary/10">
                    <AvatarImage src={n.actor?.avatar_url?.startsWith('http') ? n.actor.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${n.actor?.avatar_url}`} />
                    <AvatarFallback className="bg-muted">
                      {iconMap[n.type] || <Bell className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link to={`/profile/${n.actor?.username || n.actor?._id}`} className="font-bold hover:text-primary transition-colors">
                      {n.actor?.display_name || "Someone"}
                    </Link>{" "}
                    <span className="text-muted-foreground">{messageMap[n.type] || "interacted with you"}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notifications;

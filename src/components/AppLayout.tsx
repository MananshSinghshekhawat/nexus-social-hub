import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Search, Bell, MessageCircle, User, LogOut, Zap, PlusCircle, Shield, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { VideoEditorDialog } from "@/components/VideoEditorDialog";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkAdmin = () => {
      setIsAdmin(user.role === 'admin');
    };

    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadNotifications(data.count);
      } catch (error) {
        setUnreadNotifications(0);
      }
    };

    checkAdmin();
    fetchUnread();

    const handleNotificationsRead = () => setUnreadNotifications(0);
    window.addEventListener('notificationsRead', handleNotificationsRead);

    // Refresh interval for badges (could also use sockets)
    const interval = setInterval(fetchUnread, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsRead', handleNotificationsRead);
    };
  }, [user]);

  const navItems = [
    { to: "/", icon: Home, label: "Feed" },
    { to: "/explore", icon: Search, label: "Explore" },
    { to: "/reels", icon: Zap, label: "Reels" },
    { to: "/shorts", icon: PlusCircle, label: "Shorts" },
    { to: "/notifications", icon: Bell, label: "Alerts", badge: unreadNotifications },
    { to: "/messages", icon: MessageCircle, label: "Chat" },
    { to: `/profile/${user?.username || user?._id}`, icon: User, label: "Profile" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const mobileBottomItems = [
    { to: "/", icon: Home },
    { to: "/explore", icon: Search },
    { to: "/create", icon: PlusCircle },
    { to: "/messages", icon: MessageCircle, badge: unreadNotifications },
    { to: `/profile/${user?.username || user?._id}`, icon: User },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-2 p-6">
          <Zap className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-display gradient-text">Nexus Logic</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => {
            const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all relative
                  ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
                {badge ? (
                  <span className="absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground px-1">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full gradient-primary"
                  />
                )}
              </NavLink>
            );
          })}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all
                ${location.pathname === "/admin" ? "bg-destructive/10 text-destructive" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Shield className="h-5 w-5" />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="p-3">
          <NavLink
            to="/create"
            className="flex items-center justify-center gap-2 rounded-xl gradient-primary text-primary-foreground font-semibold py-3 px-4 transition-all hover:opacity-90 glow"
          >
            <PlusCircle className="h-5 w-5" />
            <span>New Post</span>
          </NavLink>
        </div>

        <div className="border-t border-border p-4">
          <Link
            to={`/profile/${user?.username || user?._id}`}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-all group"
          >
            <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm overflow-hidden shrink-0">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar_url}`}
                  className="h-full w-full object-cover"
                  alt=""
                />
              ) : (
                user?.display_name?.[0]?.toUpperCase() || "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{user?.display_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">@{user?.username || "user"}</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 border-b border-border bg-card/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold font-display gradient-text">Nexus Logic</span>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `transition-colors ${isActive ? "text-destructive" : "hover:text-foreground"}`}>
              <Shield className="h-5 w-5" />
            </NavLink>
          )}
          <NavLink to="/notifications" className={({ isActive }) => `relative transition-colors ${isActive ? "text-primary" : "hover:text-foreground"}`}>
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full gradient-primary text-[9px] font-bold text-primary-foreground px-0.5">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `transition-colors ${isActive ? "text-primary" : "hover:text-foreground"}`}>
            <Settings className="h-5 w-5" />
          </NavLink>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="mx-auto max-w-2xl px-4 pb-20 md:pb-4">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border bg-card/90 backdrop-blur-xl h-14">
        {mobileBottomItems.map(({ to, icon: Icon, badge }) => {
          const isActive = location.pathname === to || (to !== "/" && to !== "/create" && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center justify-center relative transition-colors
                ${isActive ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="h-[22px] w-[22px]" />
              {badge ? (
                <span className="absolute top-2 right-1/4 flex h-4 min-w-4 items-center justify-center rounded-full gradient-primary text-[9px] font-bold text-primary-foreground px-0.5">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
              {isActive && (
                <motion.div
                  layoutId="mobile-indicator"
                  className="absolute top-0 left-1/3 right-1/3 h-0.5 rounded-full gradient-primary"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <VideoEditorDialog />
    </div>
  );
};

export default AppLayout;


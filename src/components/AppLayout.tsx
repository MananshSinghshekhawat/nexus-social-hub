import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Search, Bell, MessageCircle, User, LogOut, Zap, PlusCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, signOut, user } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      setIsAdmin((data?.length ?? 0) > 0);
    };

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadNotifications(count ?? 0);
    };

    checkAdmin();
    fetchUnread();

    const channel = supabase
      .channel("notifications-count")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        setUnreadNotifications((prev) => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const navItems = [
    { to: "/", icon: Home, label: "Feed" },
    { to: "/explore", icon: Search, label: "Explore" },
    { to: "/notifications", icon: Bell, label: "Alerts", badge: unreadNotifications },
    { to: "/messages", icon: MessageCircle, label: "Chat" },
    { to: `/profile/${profile?.username || user?.id}`, icon: User, label: "Profile" },
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
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {profile?.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.display_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">@{profile?.username || "user"}</p>
            </div>
            <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        <div className="mx-auto max-w-2xl px-4 pb-20 md:pb-4">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border bg-card/90 backdrop-blur-xl">
        {navItems.map(({ to, icon: Icon, badge }) => {
          const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center justify-center py-3 relative transition-colors
                ${isActive ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5" />
              {badge ? (
                <span className="absolute top-1 right-1/4 flex h-4 min-w-4 items-center justify-center rounded-full gradient-primary text-[9px] font-bold text-primary-foreground px-0.5">
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
    </div>
  );
};

export default AppLayout;

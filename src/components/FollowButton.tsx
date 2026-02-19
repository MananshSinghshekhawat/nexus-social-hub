import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "sm" | "default";
}

const FollowButton = ({ targetUserId, onFollowChange, size = "sm" }: FollowButtonProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) { setLoading(false); return; }
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle()
      .then(({ data }) => {
        setIsFollowing(!!data);
        setLoading(false);
      });
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId || loading) return null;

  const toggle = async () => {
    setActing(true);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      setIsFollowing(false);
      onFollowChange?.(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
      setIsFollowing(true);
      onFollowChange?.(true);
      // Send notification
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: "follow",
      });
    }
    setActing(false);
  };

  return (
    <Button
      size={size}
      onClick={toggle}
      disabled={acting}
      variant={isFollowing ? "outline" : "default"}
      className={!isFollowing ? "gradient-primary text-primary-foreground" : ""}
    >
      {acting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isFollowing ? (
        <><UserMinus className="h-3.5 w-3.5 mr-1" /> Unfollow</>
      ) : (
        <><UserPlus className="h-3.5 w-3.5 mr-1" /> Follow</>
      )}
    </Button>
  );
};

export default FollowButton;

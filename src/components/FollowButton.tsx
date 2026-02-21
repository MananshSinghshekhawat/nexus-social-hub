import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (following: boolean) => void;
  size?: "default" | "sm" | "lg" | "icon";
}

const FollowButton = ({ targetUserId, onFollowChange, size = "sm" }: FollowButtonProps) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || user._id === targetUserId) return;

    const checkFollow = async () => {
      try {
        // We'll need a check endpoint or assume the user object includes choices
        // For simplicity, let's assume we toggle blindly if we don't have a check endpoint
        // or we implement a simple check in a real app.
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };
    checkFollow();
  }, [user, targetUserId]);

  const handleFollow = async () => {
    if (!user) return;
    if (user._id === targetUserId) return;

    setLoading(true);
    try {
      const response = await api.post(`/social/follow/${targetUserId}`);
      setFollowing(response.data.following);
      onFollowChange?.(response.data.following);
      toast({
        title: response.data.following ? "Followed" : "Unfollowed",
        description: response.data.following ? "You are now following this user" : "You have unfollowed this user"
      });
    } catch (error) {
      toast({ title: "Error", description: "Could not toggle follow", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (user?._id === targetUserId) return null;

  return (
    <Button
      variant={following ? "outline" : "default"}
      size={size}
      onClick={handleFollow}
      disabled={loading}
      className={following ? "" : "gradient-primary text-primary-foreground font-semibold px-6 rounded-full"}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
};

export default FollowButton;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface CreatePostProps {
  onPostCreated?: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        post_type: "text",
      });
      if (error) throw error;
      setContent("");
      onPostCreated?.();
      toast({ title: "Posted!", description: "Your post is live." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {profile?.display_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <ImagePlus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || loading}
            className="gradient-primary text-primary-foreground font-semibold rounded-full px-5"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Post
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Send, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Story {
    _id: string;
    user: {
        _id: string;
        username: string;
        display_name: string;
        avatar_url: string;
    };
    image_url?: string;
    video_url?: string;
    story_views?: Array<{ user: string; viewed_at: string }>;
}

interface StoryViewerProps {
    story: Story | null;
    onClose: () => void;
}

const StoryViewer = ({ story, onClose }: StoryViewerProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [replyText, setReplyText] = useState("");
    const [viewsCount, setViewsCount] = useState(story?.story_views?.length || 0);

    if (!story) return null;

    useEffect(() => {
        if (!story || !user) return;

        // Record view if not the author
        if (story.user._id !== user._id) {
            api.post(`/posts/${story._id}/view`).catch(err => console.error("Failed to record view", err));
        } else {
            setViewsCount(story.story_views?.length || 0);
        }
    }, [story, user]);

    const getMediaUrl = (path: string | undefined) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
    };

    return (
        <AnimatePresence>
            {story && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-[60]"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md aspect-[9/16] bg-black rounded-3xl overflow-hidden flex items-center justify-center border border-white/10"
                    >
                        {/* Header Overlay */}
                        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center gap-3">
                            <img
                                src={getMediaUrl(story.user.avatar_url)}
                                alt={story.user.username}
                                className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                            />
                            <div className="flex flex-col">
                                <span className="font-semibold text-white text-sm">
                                    {story.user.display_name}
                                </span>
                                <span className="text-white/70 text-xs">
                                    @{story.user.username}
                                </span>
                            </div>
                        </div>

                        {/* Media Content */}
                        {story.video_url ? (
                            <video
                                src={getMediaUrl(story.video_url)}
                                autoPlay
                                playsInline
                                loop
                                className="w-full h-full object-cover"
                            />
                        ) : story.image_url ? (
                            <img
                                src={getMediaUrl(story.image_url)}
                                alt="Story"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-white/50">Media unavailable</div>
                        )}

                        {/* Interactive Bottom Bar (Instagram-like) */}
                        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-10">
                            {user?._id === story.user._id ? (
                                <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors w-max">
                                    <Eye className="w-5 h-5 text-white" />
                                    <span className="text-white font-medium text-sm">{viewsCount} Views</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={`Reply to ${story.user.username}...`}
                                            className="w-full bg-black/40 border border-white/20 rounded-full py-2.5 pl-4 pr-10 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-white w-full backdrop-blur-md transition-all h-[42px]"
                                        />
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white disabled:opacity-50"
                                            disabled={!replyText.trim()}
                                            onClick={() => {
                                                toast({ title: "Sent", description: `Replied to ${story.user.username}` });
                                                setReplyText("");
                                            }}
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <button className="text-white hover:text-red-500 hover:scale-110 active:scale-90 transition-all">
                                            <Heart className="w-6 h-6" />
                                        </button>
                                        <button className="text-white/90 hover:text-white hover:scale-110 active:scale-90 transition-all">
                                            <MessageCircle className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StoryViewer;

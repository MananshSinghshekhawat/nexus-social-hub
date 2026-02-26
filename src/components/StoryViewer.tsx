import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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
}

interface StoryViewerProps {
    story: Story | null;
    onClose: () => void;
}

const StoryViewer = ({ story, onClose }: StoryViewerProps) => {
    if (!story) return null;

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
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StoryViewer;

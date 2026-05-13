import { useState, useEffect, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import StoryViewer from "./StoryViewer";

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

const StoriesBar = () => {
    const { user } = useAuth();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const fetchStories = async () => {
        try {
            const response = await api.get("/posts?type=story");
            setStories(response.data);
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('content', "");
        formData.append('post_type', "story");

        if (file.type.startsWith('video/')) {
            formData.append('video', file);
        } else {
            formData.append('image', file);
        }

        try {
            await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({ title: "Story Uploaded!", description: "Your story is now live." });
            fetchStories();
        } catch (error) {
            toast({ title: "Upload Failed", description: "Could not upload story", variant: "destructive" });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const getImageUrl = (path: string | undefined) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
    };

    return (
        <div className="relative w-full py-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                aria-label="Upload story media"
                title="Upload story media"
                className="hidden"
            />

            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4 pb-2">
                    {/* Add Story Button */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <button
                            onClick={handleFileClick}
                            disabled={uploading}
                            className="relative group active:scale-95 transition-transform"
                        >
                            <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-primary via-purple-500 to-pink-500">
                                <div className="h-full w-full rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center">
                                    {uploading ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    ) : user?.avatar_url ? (
                                        <img
                                            src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar_url}`}
                                            className="h-full w-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100"
                                            alt=""
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center font-bold text-muted-foreground bg-accent">
                                            {user?.display_name?.[0] || user?.username?.[0] || "+"}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary border-2 border-background flex items-center justify-center text-white scale-110 group-hover:scale-125 transition-transform">
                                <Plus className="h-3 w-3 stroke-[3px]" />
                            </div>
                        </button>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {uploading ? "Posting..." : "Story"}
                        </span>
                    </div>

                    {/* Existing Stories - No dummy/skeleton placeholders */}
                    {!loading && stories.map((story) => (
                        <motion.div
                            key={story._id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSelectedStory(story)}
                            className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                        >
                            <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 group-hover:rotate-12 transition-transform shadow-lg shadow-rose-500/10">
                                <div className="h-full w-full rounded-full border-2 border-background overflow-hidden">
                                    <img
                                        src={getImageUrl(story.user.avatar_url)}
                                        className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                                        alt={story.user.username}
                                    />
                                </div>
                            </div>
                            <span className="text-[10px] font-bold truncate max-w-[64px] text-muted-foreground">
                                {story.user.display_name.split(' ')[0]}
                            </span>
                        </motion.div>
                    ))}

                    {loading && !stories.length && (
                        <div className="flex items-center px-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground opacity-20" />
                        </div>
                    )}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>

            {/* Story Viewer Modal */}
            <StoryViewer
                story={selectedStory}
                onClose={() => setSelectedStory(null)}
            />
        </div>
    );
};

export default StoriesBar;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Share2, Play, UserPlus, Zap, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEditorStore } from "@/store/useEditorStore";
import { VirtualFeedContainer } from "@/components/hls-feed/VirtualFeedContainer";

interface Short {
    _id: string;
    user: {
        _id: string;
        username: string;
        display_name: string;
        avatar_url: string;
    };
    content: string;
    video_url: string;
    likes_count: number;
    comments_count: number;
}

const Shorts = () => {
    const [shorts, setShorts] = useState<Short[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setIsOpen } = useEditorStore();

    useEffect(() => {
        const fetchShorts = async () => {
            try {
                const response = await api.get('/posts?type=shorts');
                setShorts(response.data);
            } catch (error) {
                console.error("Error fetching shorts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchShorts();
    }, [user?._id]);

    const getImageUrl = (path: string | undefined) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
    };

    return (
        <div className="py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-display tracking-tight">Shorts</h1>
                        <p className="text-sm text-muted-foreground">Quick bites of entertainment</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsOpen(true, 'shorts')}
                        className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-2xl shadow-xl flex items-center gap-2 transform transition-all active:scale-95 group"
                    >
                        <PlusCircle className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                        <span>Create Short</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20 h-full items-center bg-black">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                </div>
            ) : shorts.length === 0 ? (
                <div className="glass rounded-3xl p-20 flex flex-col items-center justify-center text-muted-foreground text-center bg-black h-[50vh]">
                    <Play className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No shorts found</p>
                    <p className="text-sm">Be the first to create one!</p>
                </div>
            ) : (
                <div className="-mx-4 sm:mx-0">
                    <VirtualFeedContainer posts={shorts} />
                </div>
            )}
        </div>
    );
};

export default Shorts;

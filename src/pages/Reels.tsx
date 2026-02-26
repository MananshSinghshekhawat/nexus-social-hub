import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Share2, Music, UserPlus, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEditorStore } from "@/store/useEditorStore";
import { VirtualFeedContainer } from "@/components/hls-feed/VirtualFeedContainer";

interface Reel {
    _id: string;
    user: {
        _id: string;
        username: string;
        display_name: string;
        avatar_url: string;
    };
    content: string;
    video_url: string;
    audio_name?: string;
    likes_count: number;
    comments_count: number;
}

const Reels = () => {
    const [reels, setReels] = useState<Reel[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setIsOpen } = useEditorStore();

    useEffect(() => {
        const fetchReels = async () => {
            try {
                const response = await api.get('/posts?type=reel');
                setReels(response.data);
            } catch (error) {
                console.error("Error fetching reels:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReels();
    }, [user?._id]);

    const getImageUrl = (path: string | undefined) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col items-center relative">
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={() => setIsOpen(true, 'reels')}
                    className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-2 transform transition-all active:scale-95 group"
                >
                    <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    <span>Create Reel</span>
                </button>
            </div>
            {loading ? (
                <div className="flex h-full items-center justify-center bg-black w-full">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                </div>
            ) : reels.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-black w-full">
                    <Music className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium">No reels found</p>
                </div>
            ) : (
                <VirtualFeedContainer posts={reels} />
            )}
        </div>
    );
};

export default Reels;

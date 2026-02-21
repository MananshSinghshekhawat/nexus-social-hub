import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Share2, Music, UserPlus, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    const navigate = useNavigate();

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
    }, []);

    const getImageUrl = (path: string | undefined) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col items-center relative">
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={() => navigate("/create?type=reel")}
                    className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-2 transform transition-all active:scale-95 group"
                >
                    <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    <span>Create Reel</span>
                </button>
            </div>
            <ScrollArea className="w-full max-w-[400px] h-full snap-y snap-mandatory scrollbar-hide">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    </div>
                ) : reels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Music className="h-12 w-12 mb-4 opacity-20" />
                        <p className="font-medium">No reels found</p>
                    </div>
                ) : (
                    reels.map((reel) => (
                        <div key={reel._id} className="relative h-full w-full snap-start overflow-hidden bg-black rounded-3xl mb-4 group">
                            <video
                                src={getImageUrl(reel.video_url)}
                                className="h-full w-full object-cover"
                                loop
                                autoPlay
                                muted
                                playsInline
                            />

                            {/* Overlay Content */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
                                <div className="flex items-end justify-between">
                                    <div className="space-y-4 max-w-[80%]">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-primary/50">
                                                <AvatarImage src={getImageUrl(reel.user.avatar_url)} />
                                                <AvatarFallback>{reel.user.display_name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="text-white font-bold text-sm">@{reel.user.username}</h3>
                                                <p className="text-white/80 text-xs">{reel.user.display_name}</p>
                                            </div>
                                            <button className="bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/30 backdrop-blur-sm transition-all ml-1">
                                                Follow
                                            </button>
                                        </div>

                                        <p className="text-white text-sm line-clamp-2">{reel.content}</p>

                                        <div className="flex items-center gap-2 text-white/90">
                                            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 max-w-full">
                                                <Music className="h-3 w-3 animate-pulse" />
                                                <span className="text-[10px] font-medium truncate italic">
                                                    {reel.audio_name || "Original Audio"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-5 items-center">
                                        <button className="flex flex-col items-center gap-1 group/btn">
                                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white group-hover/btn:bg-destructive group-hover/btn:scale-110 transition-all">
                                                <Heart className="h-6 w-6" />
                                            </div>
                                            <span className="text-white text-[11px] font-bold">{reel.likes_count || 0}</span>
                                        </button>

                                        <button className="flex flex-col items-center gap-1 group/btn">
                                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white group-hover/btn:bg-primary group-hover/btn:scale-110 transition-all">
                                                <MessageCircle className="h-6 w-6" />
                                            </div>
                                            <span className="text-white text-[11px] font-bold">{reel.comments_count || 0}</span>
                                        </button>

                                        <button className="flex flex-col items-center gap-1 group/btn">
                                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                                                <Share2 className="h-6 w-6" />
                                            </div>
                                        </button>

                                        <div className="mt-2 h-10 w-10 rounded-lg overflow-hidden border-2 border-white/30 animate-spin-slow">
                                            <img src={getImageUrl(reel.user.avatar_url)} className="h-full w-full object-cover" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </ScrollArea>
        </div>
    );
};

export default Reels;

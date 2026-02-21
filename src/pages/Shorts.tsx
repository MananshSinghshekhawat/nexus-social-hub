import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Share2, Play, UserPlus, Zap, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    const navigate = useNavigate();

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
    }, []);

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
                        onClick={() => navigate("/create?type=shorts")}
                        className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-2xl shadow-xl flex items-center gap-2 transform transition-all active:scale-95 group"
                    >
                        <PlusCircle className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                        <span>Create Short</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                </div>
            ) : shorts.length === 0 ? (
                <div className="glass rounded-3xl p-20 flex flex-col items-center justify-center text-muted-foreground text-center">
                    <Play className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No shorts found</p>
                    <p className="text-sm">Be the first to create one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {shorts.map((short) => (
                        <motion.div
                            key={short._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-black cursor-pointer shadow-xl"
                        >
                            <video
                                src={getImageUrl(short.video_url)}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                muted
                                onMouseEnter={(e) => e.currentTarget.play()}
                                onMouseLeave={(e) => {
                                    e.currentTarget.pause();
                                    e.currentTarget.currentTime = 0;
                                }}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2 mb-3">
                                    <Avatar className="h-8 w-8 border border-white/20">
                                        <AvatarImage src={getImageUrl(short.user.avatar_url)} />
                                        <AvatarFallback>{short.user.display_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-white text-xs font-bold">@{short.user.username}</span>
                                </div>
                                <p className="text-white text-xs line-clamp-2 mb-4">{short.content}</p>
                                <div className="flex items-center gap-4 text-white">
                                    <div className="flex items-center gap-1.5">
                                        <Heart className="h-4 w-4 fill-white text-white" />
                                        <span className="text-[10px] font-bold">{short.likes_count || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MessageCircle className="h-4 w-4 fill-white text-white" />
                                        <span className="text-[10px] font-bold">{short.comments_count || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="h-3 w-3 fill-current" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Shorts;

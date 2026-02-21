import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImagePlus, Send, X, Video, Music, Play, Zap, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface CreatePostProps {
  onPostCreated?: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [postType, setPostType] = useState<"text" | "image" | "video" | "reel" | "shorts">("text");
  const [audioName, setAudioName] = useState("");
  const [filter, setFilter] = useState("none");
  const [loading, setLoading] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'reel' || type === 'shorts' || type === 'video' || type === 'image' || type === 'story') {
      setPostType(type as any);
      // We don't automatically show studio because we need a file first
    }
  }, [searchParams]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "Image size must be less than 10MB", variant: "destructive" });
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setVideoFile(null);
      setVideoPreview(null);
      setPostType("image");
      setShowStudio(true);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({ title: "Error", description: "Video size must be less than 100MB", variant: "destructive" });
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setImageFile(null);
      setImagePreview(null);
      setPostType("reel"); // Default to reel for videos now
      setShowStudio(true);
    }
  };

  const clearFiles = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setPostType("text");
    setAudioName("");
    setFilter("none");
    setShowStudio(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !imageFile && !videoFile) || !user) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('post_type', postType);
      if (audioName) formData.append('audio_name', audioName);
      if (filter !== "none") formData.append('filter', filter);

      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (videoFile) {
        formData.append('video', videoFile);
      }

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status !== 201) throw new Error('Failed to create post');

      setContent("");
      clearFiles();
      onPostCreated?.();
      toast({
        title: "Published!",
        description: `Your ${postType === 'reel' ? 'Reel' : postType === 'shorts' ? 'Short' : 'Post'} is now live.`,
        className: "bg-primary text-primary-foreground border-none"
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { name: "none", label: "Normal", style: {} },
    { name: "grayscale(1)", label: "Mono", style: { filter: "grayscale(1)" } },
    { name: "sepia(0.6)", label: "Vintage", style: { filter: "sepia(0.6)" } },
    { name: "contrast(1.2) brightness(1.1)", label: "Vivid", style: { filter: "contrast(1.2) brightness(1.1)" } },
    { name: "hue-rotate(90deg)", label: "Neon", style: { filter: "hue-rotate(90deg)" } },
    { name: "invert(0.1) hue-rotate(180deg)", label: "Cool", style: { filter: "invert(0.1) hue-rotate(180deg)" } },
  ];

  return (
    <div className="relative">
      <div className={`glass rounded-3xl p-5 shadow-2xl border border-white/20 transition-all duration-500 ${showStudio ? "scale-95 opacity-50 blur-sm pointer-events-none" : "scale-100"}`}>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="h-12 w-12 shrink-0 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-extrabold text-lg shadow-lg overflow-hidden border-2 border-white/30">
              {user?.avatar_url ? (
                <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar_url}`} className="h-full w-full object-cover" alt="" />
              ) : (
                user?.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "U"
              )}
            </div>

            <div className="flex-1">
              <Textarea
                placeholder="Share something amazing..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0 placeholder:text-muted-foreground/40 font-medium"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex gap-3">
              <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleImageSelect} />
              <label htmlFor="image-upload" className="flex items-center gap-2 cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border border-primary/20 group active:scale-95">
                <ImagePlus className="h-5 w-5 group-hover:scale-110 transition-transform" /> Photo
              </label>

              <input type="file" accept="video/*" className="hidden" id="video-upload" onChange={handleVideoSelect} />
              <label htmlFor="video-upload" className="flex items-center gap-2 cursor-pointer bg-accent/10 hover:bg-accent/20 text-accent px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border border-accent/20 group active:scale-95">
                <Video className="h-5 w-5 group-hover:scale-110 transition-transform" /> Video
              </label>
            </div>

            <Button
              type="submit"
              disabled={(!content.trim() && !imageFile && !videoFile) || loading}
              className="gradient-primary text-primary-foreground font-black rounded-2xl px-10 h-11 shadow-xl hover:shadow-primary/20 transition-all active:scale-95 uppercase tracking-wider"
            >
              {loading ? "Posting..." : "Post"} <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {showStudio && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 md:absolute md:inset-[-12px] z-[100] glass rounded-none md:rounded-[32px] p-4 md:p-8 shadow-3xl border md:border-white/40 flex flex-col gap-6 overflow-hidden md:h-[600px]"
          >
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                  {videoFile ? <Video className="h-6 w-6" /> : <ImagePlus className="h-6 w-6" />}
                </div>
                <div>
                  <h2 className="font-black text-xl tracking-tight leading-none mb-1">Creative Hub</h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-70">
                    {postType === "image" ? "Photo Editor" : postType === "shorts" ? "Shorts Studio" : "Reels Creator"}
                  </p>
                </div>
              </div>
              <button
                onClick={clearFiles}
                className="p-3 bg-muted/30 hover:bg-destructive/10 hover:text-destructive rounded-2xl transition-all border border-white/10 group active:scale-90"
              >
                <X className="h-6 w-6 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden">
              <div className="flex-1 relative rounded-[28px] overflow-hidden bg-black/60 border border-white/10 group shadow-2xl">
                {videoPreview ? (
                  <video
                    src={videoPreview}
                    className="h-full w-full object-contain transition-all duration-700"
                    style={{ filter: filter === 'none' ? '' : filter }}
                    autoPlay loop muted
                  />
                ) : (
                  <img
                    src={imagePreview!}
                    className="h-full w-full object-contain transition-all duration-700"
                    style={{ filter: filter === 'none' ? '' : filter }}
                    alt=""
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                <div className="absolute top-4 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Preview Mode</span>
                  </div>
                  <button
                    onClick={() => {
                      if (videoFile) document.getElementById('video-upload')?.click();
                      else document.getElementById('image-upload')?.click();
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/20 text-white text-[10px] font-black transition-all active:scale-95"
                  >
                    REPLACE
                  </button>
                </div>
              </div>

              <div className="w-full md:w-80 flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Composition Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: videoFile ? "reel" : "image", label: videoFile ? "Reel" : "Post", icon: videoFile ? Play : ImagePlus },
                      { id: "shorts", label: "Short", icon: Zap },
                      { id: "story", label: "Story", icon: Bell }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPostType(mode.id as any)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-2xl text-[10px] font-black transition-all border-2 ${postType === mode.id ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/10"}`}
                      >
                        <mode.icon className="h-4 w-4" />
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Style Filters</label>
                  <ScrollArea className="w-full pb-4">
                    <div className="flex gap-3">
                      {filters.map((f) => (
                        <button
                          key={f.name}
                          type="button"
                          onClick={() => setFilter(f.name)}
                          className={`shrink-0 flex flex-col items-center gap-2 p-1.5 rounded-2xl transition-all border-2 ${filter === f.name ? "border-primary bg-primary/10" : "border-transparent bg-white/5 hover:bg-white/10"}`}
                        >
                          <div
                            className="h-16 w-16 rounded-[14px] overflow-hidden shadow-lg"
                            style={f.style}
                          >
                            <div className="h-full w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-80" />
                          </div>
                          <span className="text-[9px] font-bold text-white/70">{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {videoFile && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Audio Signature</label>
                    <div className="relative group">
                      <Music className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                      <input
                        type="text"
                        placeholder="Song or Artist name..."
                        value={audioName}
                        onChange={(e) => setAudioName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold placeholder:text-white/20"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Caption</label>
                  <Textarea
                    placeholder="Describe your creation..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl py-4 text-white min-h-[80px] text-sm font-bold placeholder:text-white/20 focus-visible:ring-primary/50"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-16 gradient-primary text-primary-foreground font-black rounded-[20px] shadow-2xl hover:shadow-primary/40 transition-all uppercase tracking-[0.2em] text-xs mt-auto active:scale-[0.98] border border-white/20"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>UPLOADING</span>
                    </div>
                  ) : "PUBLISH NOW"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatePost;

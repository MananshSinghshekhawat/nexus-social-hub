import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Type, Sticker, SlidersHorizontal, Check, Play, Pause, Download, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { AudioSelector } from "./video-editor/AudioSelector";
import { TimelineController } from "./video-editor/TimelineController";
import { DraggableOverlay } from "./video-editor/DraggableOverlay";
import { useWhisper } from "@/hooks/useWhisper";
import api from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

export const VideoEditorDialog = () => {
    const {
        isOpen, setIsOpen, videoUrl, isPlaying, setIsPlaying,
        currentTime, setCurrentTime, videoDuration, setVideoDuration,
        reset, viewType, setVideoBlob, overlays, addOverlay
    } = useEditorStore();

    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { loaded, isProcessing, progress, exportVideo } = useFFmpeg();
    const { transcribeAudio, isTranscribing, downloadProgress } = useWhisper();
    const [isAudioSelectorOpen, setIsAudioSelectorOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Close the dialog and clear the state
    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => reset(), 300); // Wait for exit animation
    };

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.play();
            else videoRef.current.pause();
        }
    }, [isPlaying]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setVideoBlob(file);
        } else {
            alert("Please select a valid video file.");
        }
    };

    const handleAddText = () => {
        addOverlay({
            id: uuidv4(),
            type: 'text',
            content: 'NEW TEXT',
            position: { x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 },
            scale: 1,
            rotation: 0,
            startTime: 0,
            endTime: videoDuration || 15,
            color: '#ffffff',
            fontFamily: 'sans-serif'
        });
    };

    const handleExport = async () => {
        const finalBlob = await exportVideo();
        if (finalBlob) {
            try {
                // Convert blob to file for Multer
                const file = new File([finalBlob], `nexus_${viewType}_${Date.now()}.mp4`, { type: 'video/mp4' });
                const formData = new FormData();
                formData.append('video', file);
                formData.append('content', `My new ${viewType === 'reels' ? 'Reel' : 'Short'}!`); // A real app would have a caption input step
                formData.append('post_type', viewType);

                await api.post('/posts', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                // Wait a moment and then close/reset
                setTimeout(() => {
                    handleClose();
                }, 1000);
            } catch (error) {
                console.error("Upload failed:", error);
                alert("Failed to upload the video to the server.");
            }
        } else {
            alert("Failed to export video. Please try again.");
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            {/* 
        Using a completely custom overlay style to make it full screen 
        and mobile-first for the Reel/Shorts vibe 
      */}
            <DialogContent className="max-w-none w-screen h-screen p-0 m-0 rounded-none bg-black border-none flex flex-col sm:max-w-md sm:h-[90vh] sm:rounded-3xl sm:mx-auto sm:my-auto sm:overflow-hidden relative z-[100]">

                {/* Header Options */}
                <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                    <button onClick={handleClose} className="p-2 rounded-full glass hover:bg-white/20 transition-colors">
                        <X className="w-6 h-6 text-white" />
                    </button>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setIsAudioSelectorOpen(true)}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div className="p-2.5 rounded-full glass group-hover:bg-white/20 transition-colors">
                                <Music className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] font-semibold text-white drop-shadow-md">Audio</span>
                        </button>
                        <button
                            onClick={handleAddText}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div className="p-2.5 rounded-full glass group-hover:bg-white/20 transition-colors">
                                <Type className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] font-semibold text-white drop-shadow-md">Text</span>
                        </button>
                        <button
                            onClick={async () => {
                                // Try fetching the object URL as a blob
                                if (videoUrl && !isTranscribing) {
                                    try {
                                        const res = await fetch(videoUrl);
                                        const blob = await res.blob();
                                        transcribeAudio(blob);
                                    } catch (e) {
                                        console.error("Failed to fetch blob from videoUrl", e);
                                    }
                                }
                            }}
                            className="flex flex-col items-center gap-1 group relative"
                        >
                            <div className={`p-2.5 rounded-full glass transition-colors ${isTranscribing ? 'bg-primary/50 animate-pulse' : 'group-hover:bg-white/20'}`}>
                                <Type className="w-5 h-5 text-white" />
                                <span className="absolute -bottom-1 -right-1 text-[8px] bg-primary rounded-sm px-1 font-bold">AI</span>
                            </div>
                            <span className="text-[10px] font-semibold text-white drop-shadow-md">
                                {isTranscribing ? (downloadProgress > 0 ? `${downloadProgress}%` : 'Reading...') : 'Captions'}
                            </span>
                        </button>
                        <button className="flex flex-col items-center gap-1 group">
                            <div className="p-2.5 rounded-full glass group-hover:bg-white/20 transition-colors">
                                <Sticker className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] font-semibold text-white drop-shadow-md">Sticker</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 group">
                            <div className="p-2.5 rounded-full glass group-hover:bg-white/20 transition-colors">
                                <SlidersHorizontal className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] font-semibold text-white drop-shadow-md">Filters</span>
                        </button>
                    </div>
                </div>

                {/* Video Preview Area */}
                <div
                    className="flex-1 w-full bg-zinc-900 relative overflow-hidden"
                    onClick={togglePlay}
                >
                    {videoUrl ? (
                        <>
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                className="w-full h-full object-cover"
                                loop
                                playsInline
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                            />
                            {/* Render draggable overlays over the video */}
                            {overlays.map(overlay => (
                                <DraggableOverlay key={overlay.id} overlay={overlay} />
                            ))}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                            <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <div
                                className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors mb-6"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <PlusCircle className="w-10 h-10 text-white/50" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                Upload your {viewType === 'reels' ? 'Reel' : 'Short'}
                            </h3>
                            <p className="text-white/50 text-sm max-w-xs">
                                Select a vertically shot video from your device to start editing.
                            </p>
                        </div>
                    )}

                    {/* Play/Pause indicator overlay */}
                    <AnimatePresence>
                        {!isPlaying && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <div className="p-4 rounded-full bg-black/40 backdrop-blur-sm">
                                    <Play className="w-12 h-12 text-white opacity-80" fill="currentColor" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Draggable timeline component with audio track visualization */}
                    <TimelineController />
                </div>

                {/* Footer Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex justify-between items-end bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20">
                    <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full px-4 glass">
                        <Download className="w-4 h-4 mr-2" /> Save Draft
                    </Button>

                    <Button
                        onClick={handleExport}
                        disabled={!videoUrl || isProcessing || !loaded}
                        className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <>Processing {Math.round(progress)}% <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
                        ) : !loaded ? (
                            <>Loading Engine... <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
                        ) : (
                            <>Next <Check className="w-4 h-4 ml-2" /></>
                        )}
                    </Button>
                </div>
            </DialogContent>

            {/* Sub-modals */}
            <AudioSelector
                isOpen={isAudioSelectorOpen}
                onClose={() => setIsAudioSelectorOpen(false)}
            />
        </Dialog>
    );
};

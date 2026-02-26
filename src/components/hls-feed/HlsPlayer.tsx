import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useInView } from 'react-intersection-observer';
import { Play } from 'lucide-react';

interface HlsPlayerProps {
    src: string;
    isActive: boolean; // Is the video currently the main visible item?
    isPreWarming: boolean; // Is the video next or next+1 in the queue?
    poster?: string;
}

export const HlsPlayer: React.FC<HlsPlayerProps> = ({ src, isActive, isPreWarming, poster }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Fallback URL parser for absolute paths
    const videoSrc = src.startsWith('http') ? src : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${src}`;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Cleanup previous instance if constraints changed
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        // If the video is neither active nor in the pre-warm queue, don't load anything (saves memory)
        if (!isActive && !isPreWarming) {
            return;
        }

        // Initialize HLS.js
        if (Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 30, // Limit buffer to save RAM
                maxMaxBufferLength: 60,
                // Only load lowest level initially to save bandwidth if just pre-warming
                startLevel: isPreWarming ? 0 : -1,
            });

            hls.loadSource(videoSrc);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isActive) {
                    video.play().catch(e => console.log('Auto-play prevented:', e));
                    setIsPlaying(true);
                }
            });

            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari fallback (native HLS support)
            video.src = videoSrc;
            if (isActive) {
                video.play().catch(e => console.log('Auto-play prevented:', e));
                setIsPlaying(true);
            }
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoSrc, isActive, isPreWarming]);

    // Handle Active state changes (user swiped to this video)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive) {
            // Restore auto-resolution and play
            if (hlsRef.current) {
                hlsRef.current.nextLevel = -1; // Auto level
            }
            video.play().catch(e => console.log('Auto-play prevented:', e));
            setIsPlaying(true);
        } else {
            video.pause();
            video.currentTime = 0; // Reset for next time they swipe back
            setIsPlaying(false);
        }
    }, [isActive]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer" onClick={togglePlay}>
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                loop
                playsInline
                poster={poster}
            />

            {!isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                        <Play className="w-8 h-8 ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
};

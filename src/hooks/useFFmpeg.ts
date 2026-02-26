import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useEditorStore } from '@/store/useEditorStore';
import { useSmartCrop } from './useSmartCrop';

export const useFFmpeg = () => {
    const [loaded, setLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const ffmpegRef = useRef(new FFmpeg());
    const { analyzeVideo } = useSmartCrop();

    // Setup FFmpeg
    const load = async () => {
        if (loaded) return;

        setIsProcessing(true);
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        const ffmpeg = ffmpegRef.current;

        ffmpeg.on('progress', ({ progress, time }) => {
            setProgress(progress * 100);
        });

        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
        } catch (e) {
            console.error("Error loading FFmpeg:", e);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const exportVideo = async (): Promise<Blob | null> => {
        const { videoBlob, audioTrack, originalVolume, overlays } = useEditorStore.getState();
        if (!videoBlob || !loaded) return null;

        setIsProcessing(true);
        setProgress(0);
        const ffmpeg = ffmpegRef.current;

        try {
            // 1. Write the main video file to memory
            await ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));

            let ffmpegArgs = ['-i', 'input.mp4'];
            let videoFilters = [];
            let audioFilters = [];

            // Apply volume if changed
            if (originalVolume !== 1) {
                audioFilters.push(`volume=${originalVolume}`);
            }

            // Client-Side AI Smart Crop implementation
            // 1. Create a hidden video element to read the natural dimensions
            const videoElement = document.createElement('video');
            videoElement.src = URL.createObjectURL(videoBlob);
            await new Promise((resolve) => {
                videoElement.onloadeddata = resolve;
            });

            const isLandscape = videoElement.videoWidth > videoElement.videoHeight;

            if (isLandscape) {
                console.log("[SmartCrop] Landscape video detected. Initializing AI Crop...");
                try {
                    const cropCoords = await analyzeVideo(videoElement, 9 / 16);
                    console.log("[SmartCrop] Face detected. Apply dynamic crop:", cropCoords);
                    videoFilters.push(`crop=${cropCoords.width}:${cropCoords.height}:${cropCoords.x}:${cropCoords.y}`);
                } catch (cropErr) {
                    console.error("[SmartCrop] Failed to analyze face, falling back to center crop.", cropErr);
                    // Fallback to strict center crop
                    const targetW = videoElement.videoHeight * (9 / 16);
                    const cropX = (videoElement.videoWidth - targetW) / 2;
                    videoFilters.push(`crop=${targetW}:${videoElement.videoHeight}:${cropX}:0`);
                }
            }

            // Only add complex commands if we actually have filters to avoid re-encoding when not needed
            if (videoFilters.length > 0) {
                ffmpegArgs.push('-vf', videoFilters.join(','));
                ffmpegArgs.push('-c:v', 'libx264'); // Re-encode is required when filtering
            } else {
                ffmpegArgs.push('-c:v', 'copy');
            }

            if (audioFilters.length > 0) {
                ffmpegArgs.push('-af', audioFilters.join(','));
            }

            ffmpegArgs.push('output.mp4');

            // Execute the command
            await ffmpeg.exec(ffmpegArgs);

            // Read generated file
            const data = await ffmpeg.readFile('output.mp4');
            return new Blob([data as unknown as BlobPart], { type: 'video/mp4' });

        } catch (error) {
            console.error('Error exporting video:', error);
            return null;
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    return { loaded, isProcessing, progress, exportVideo };
};

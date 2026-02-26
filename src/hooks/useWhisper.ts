import { useState, useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { v4 as uuidv4 } from 'uuid';

export const useWhisper = () => {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const workerRef = useRef<Worker | null>(null);
    const { addOverlay } = useEditorStore();

    const transcribeAudio = useCallback(async (videoBlob: Blob | File) => {
        setIsTranscribing(true);
        setDownloadProgress(0);

        // 1. Extract audio array from video blob
        const audioContext = new window.AudioContext({ sampleRate: 16000 });
        const arrayBuffer = await videoBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const float32Array = audioBuffer.getChannelData(0); // Take the left channel

        // 2. Initialize the Web Worker lazily
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../workers/whisper.worker.js', import.meta.url), {
                type: 'module'
            });
        }

        const worker = workerRef.current;

        // 3. Send data and wait for result
        return new Promise<void>((resolve, reject) => {
            worker.onmessage = (event) => {
                const { status, result, data } = event.data;

                if (status === 'progress') {
                    // Update download progress of the WASM models
                    if (data.status === 'downloading') {
                        setDownloadProgress(Math.round(data.progress || 0));
                    }
                } else if (status === 'complete') {
                    const chunks = result.chunks;
                    if (chunks && Array.isArray(chunks)) {
                        // Extract timestamps and map to Zustand overlays
                        chunks.forEach((chunk: any) => {
                            addOverlay({
                                id: uuidv4(),
                                type: 'text',
                                content: chunk.text.trim(),
                                position: { x: window.innerWidth / 2 - 100, y: window.innerHeight - 150 }, // Bottom center
                                scale: 1,
                                rotation: 0,
                                startTime: chunk.timestamp[0], // Start time in seconds
                                endTime: chunk.timestamp[1] || chunk.timestamp[0] + 2, // End time
                                color: '#ffffff',
                                fontFamily: 'sans-serif'
                            });
                        });
                    }
                    setIsTranscribing(false);
                    resolve();
                } else if (status === 'error') {
                    console.error("Transcription failed", data);
                    setIsTranscribing(false);
                    reject(new Error(data));
                }
            };

            worker.postMessage({ audio: float32Array });
        });
    }, [addOverlay]);

    return { transcribeAudio, isTranscribing, downloadProgress };
};

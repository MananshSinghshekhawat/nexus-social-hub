import { useEditorStore } from '@/store/useEditorStore';
import { SlidersHorizontal, Trash2, Activity } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export const TimelineController = () => {
    const {
        videoDuration,
        currentTime,
        audioTrack,
        setAudioTrack,
        setCurrentTime,
        beatMarkers,
        setBeatMarkers
    } = useEditorStore();

    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const waveformContainerRef = useRef<HTMLDivElement | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (!audioTrack || !waveformContainerRef.current) return;

        setIsAnalyzing(true);
        const ws = WaveSurfer.create({
            container: waveformContainerRef.current,
            waveColor: 'rgba(255, 255, 255, 0.2)',
            progressColor: 'rgba(255, 255, 255, 0.5)',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 30, // Hidden visually but height needed for generation
            normalize: true,
            interact: false // We use the main range input for scrubbing
        });

        ws.load(audioTrack.url);

        ws.on('ready', () => {
            // 1. Get raw float32 audio data to find peaks
            const decodedData = ws.getDecodedData();
            if (decodedData) {
                const sampleRate = decodedData.sampleRate;
                const channelData = decodedData.getChannelData(0); // Left channel

                // Simple peak detection (find high energy spots)
                const peaks: number[] = [];
                const windowSize = sampleRate / 2; // 0.5s chunks
                for (let i = 0; i < channelData.length; i += windowSize) {
                    let maxVal = 0;
                    let maxIndex = i;
                    for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
                        const val = Math.abs(channelData[i + j]);
                        if (val > maxVal) {
                            maxVal = val;
                            maxIndex = i + j;
                        }
                    }
                    // If it's a significant peak, register it
                    if (maxVal > 0.6) {
                        const timeInSeconds = maxIndex / sampleRate;
                        peaks.push(timeInSeconds);
                    }
                }
                setBeatMarkers(peaks);
            }
            setIsAnalyzing(false);
        });

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
        };
    }, [audioTrack, setBeatMarkers]);

    if (!videoDuration) return null;

    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentTime(parseFloat(e.target.value));
    };

    const handleAudioVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioTrack) {
            setAudioTrack({ ...audioTrack, volume: parseFloat(e.target.value) });
        }
    };

    const removeAudio = () => {
        setBeatMarkers([]);
        setAudioTrack(null);
    };

    return (
        <div className="absolute bottom-[90px] left-0 right-0 px-4 pb-4 z-20 flex flex-col gap-3">

            {/* Scrubber */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-white/70 w-8">{Math.floor(currentTime)}s</span>
                <input
                    type="range"
                    min={0}
                    max={videoDuration}
                    step={0.1}
                    value={currentTime || 0}
                    onChange={handleScrub}
                    className="flex-1 accent-primary h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer relative z-10"
                />

                {/* Visual Beat Markers strictly rendered beneath the scrubber absolute to parent */}
                <div className="absolute left-[3.5rem] right-[3.5rem] top-1/2 -translate-y-1/2 h-1.5 pointer-events-none">
                    {beatMarkers.map((time, idx) => {
                        const percentage = (time / videoDuration) * 100;
                        if (percentage > 100) return null;
                        return (
                            <div
                                key={`${time}-${idx}`}
                                className="absolute w-[2px] h-3 bg-primary/80 rounded-full top-1/2 -translate-y-1/2"
                                style={{ left: `${percentage}%` }}
                            />
                        );
                    })}
                </div>

                <span className="text-[10px] font-medium text-white/70 w-8 text-right">{Math.floor(videoDuration)}s</span>
            </div>

            {/* Added Audio Track Visualization */}
            {audioTrack && (
                <div className="glass rounded-xl p-2.5 flex flex-col gap-2 border border-white/10 animate-in fade-in slide-in-from-bottom-2">

                    {/* Hidden Container for WaveSurfer Initialization */}
                    <div ref={waveformContainerRef} className="hidden" />

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white truncate">{audioTrack.name}</span>
                                {isAnalyzing && <Activity className="w-3 h-3 text-primary animate-pulse" />}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <SlidersHorizontal className="w-3 h-3 text-white/60" />
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={audioTrack.volume}
                                    onChange={handleAudioVolume}
                                    className="w-16 accent-white h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <button
                            onClick={removeAudio}
                            className="p-1.5 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors ml-2"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

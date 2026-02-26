import { create } from 'zustand';

export interface OverlayElement {
    id: string;
    type: 'text' | 'sticker' | 'emoji';
    content: string; // Text string or image URL
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    startTime: number; // in seconds
    endTime: number; // in seconds
    color?: string;
    fontFamily?: string;
}

export interface AudioTrack {
    id: string;
    url: string;
    name: string;
    startTime: number; // Start relative to the video timeline
    duration: number; // How much of the audio to play
    volume: number; // 0 to 1
}

interface EditorState {
    isOpen: boolean; // Whether the editor is open
    viewType: 'reels' | 'shorts';
    videoBlob: Blob | null;
    videoUrl: string | null;
    videoDuration: number;
    currentTime: number;
    isPlaying: boolean;

    overlays: OverlayElement[];
    audioTrack: AudioTrack | null;
    originalVolume: number; // Volume of the original video (0 to 1)

    beatMarkers: number[]; // Array of timestamps in seconds where high energy beats occur

    // Basic filters
    filter: string;

    // Actions
    setIsOpen: (isOpen: boolean, viewType?: 'reels' | 'shorts') => void;
    setVideoBlob: (blob: Blob | null) => void;
    setVideoDuration: (duration: number) => void;
    setCurrentTime: (time: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setBeatMarkers: (markers: number[]) => void;

    addOverlay: (overlay: OverlayElement) => void;
    updateOverlay: (id: string, updates: Partial<OverlayElement>) => void;
    removeOverlay: (id: string) => void;

    setAudioTrack: (track: AudioTrack | null) => void;
    setOriginalVolume: (volume: number) => void;

    setFilter: (filter: string) => void;

    reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    isOpen: false,
    viewType: 'reels',
    videoBlob: null,
    videoUrl: null,
    videoDuration: 0,
    currentTime: 0,
    isPlaying: false,

    overlays: [],
    audioTrack: null,
    originalVolume: 1,
    beatMarkers: [],
    filter: 'none',

    setIsOpen: (isOpen, viewType = 'reels') => set({ isOpen, viewType }),

    setVideoBlob: (blob) => set((state) => {
        // Revoke old URL if it exists to prevent memory leaks
        if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
        return {
            videoBlob: blob,
            videoUrl: blob ? URL.createObjectURL(blob) : null
        };
    }),

    setVideoDuration: (videoDuration) => set({ videoDuration }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setBeatMarkers: (beatMarkers) => set({ beatMarkers }),

    addOverlay: (overlay) => set((state) => ({ overlays: [...state.overlays, overlay] })),

    updateOverlay: (id, updates) => set((state) => ({
        overlays: state.overlays.map((o) => (o.id === id ? { ...o, ...updates } : o))
    })),

    removeOverlay: (id) => set((state) => ({
        overlays: state.overlays.filter((o) => o.id !== id)
    })),

    setAudioTrack: (audioTrack) => set({ audioTrack }),
    setOriginalVolume: (originalVolume) => set({ originalVolume }),
    setFilter: (filter) => set({ filter }),

    reset: () => set((state) => {
        if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
        return {
            // Don't reset isOpen here so the modal can animate closing, or handle it explicitly.
            videoBlob: null,
            videoUrl: null,
            videoDuration: 0,
            currentTime: 0,
            isPlaying: false,
            overlays: [],
            audioTrack: null,
            originalVolume: 1,
            beatMarkers: [],
            filter: 'none',
        };
    }),
}));

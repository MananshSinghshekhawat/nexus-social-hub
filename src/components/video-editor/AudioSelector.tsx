import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEditorStore, AudioTrack } from '@/store/useEditorStore';
import { Search, Music, Play, Pause, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock list of trending tracks
const TRENDING_TRACKS = [
    { id: '1', name: 'Chill Lofi Beats', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { id: '2', name: 'Upbeat Urban Vibe', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1084da6364.mp3' },
    { id: '3', name: 'Epic Cinematic Trailer', url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_7acb85b4f6.mp3' },
    { id: '4', name: 'Corporate Motivational', url: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b3cbce25.mp3' },
];

export const AudioSelector = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [search, setSearch] = useState('');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const { setAudioTrack, audioTrack } = useEditorStore();

    const handleTogglePlay = (trackId: string, url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // Simplified logic: in a real app, you'd manage an AudioContext or HTMLAudioElement here to preview
        setPlayingId(playingId === trackId ? null : trackId);
    };

    const handleSelectTrack = (track: typeof TRENDING_TRACKS[0]) => {
        // When a user selects a track, set it in the Zustand store to be mixed later
        setAudioTrack({
            id: track.id,
            name: track.name,
            url: track.url,
            startTime: 0,
            duration: 15, // Default to using the first 15 seconds
            volume: 0.8
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md h-[70vh] flex flex-col p-0 overflow-hidden bg-background border-border/50 rounded-t-3xl sm:rounded-3xl mt-auto sm:mt-0">
                <DialogHeader className="p-4 border-b border-border/50">
                    <DialogTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-primary" /> Audio Library
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 border-b border-border/50">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search trending songs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-muted/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                        {TRENDING_TRACKS.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map((track) => (
                            <div
                                key={track.id}
                                onClick={() => handleSelectTrack(track)}
                                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors
                  ${audioTrack?.id === track.id ? 'bg-primary/10' : 'hover:bg-muted/50'}
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => handleTogglePlay(track.id, track.url, e)}
                                        className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 transition-transform active:scale-95"
                                    >
                                        {playingId === track.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                    </button>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{track.name}</span>
                                        <span className="text-xs text-muted-foreground">0:30 • Pixabay</span>
                                    </div>
                                </div>

                                {audioTrack?.id === track.id && (
                                    <Check className="w-5 h-5 text-primary mr-2" />
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

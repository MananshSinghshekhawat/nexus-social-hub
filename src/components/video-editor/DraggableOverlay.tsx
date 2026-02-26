import { useDrag } from '@use-gesture/react';
import { useEditorStore, OverlayElement } from '@/store/useEditorStore';

export const DraggableOverlay = ({ overlay }: { overlay: OverlayElement }) => {
    const { updateOverlay, removeOverlay, currentTime, beatMarkers } = useEditorStore();

    // Only show if the current time is within the overlay's bounds (if bounds are set)
    // For a real app, you'd allow editing these bounds in the timeline
    if (overlay.startTime !== undefined && overlay.endTime !== undefined) {
        if (currentTime < overlay.startTime || currentTime > overlay.endTime) {
            return null;
        }
    }

    const bind = useDrag(({ offset: [x, y], last }) => {
        updateOverlay(overlay.id, { position: { x, y } });

        // Beat Snapping Logic on Drag End
        if (last && beatMarkers.length > 0) {
            // Find the closest beat marker to the current video time
            const closestBeat = beatMarkers.reduce((prev, curr) => {
                return (Math.abs(curr - currentTime) < Math.abs(prev - currentTime) ? curr : prev);
            });

            // If we are within 0.1s of a beat, snap the start time of this overlay to it
            // This allows users to drag words/stickers and have them pop in precisely on the beat
            if (Math.abs(closestBeat - currentTime) <= 0.1) {
                console.log(`[BeatSnap] Snapped overlay ${overlay.id} to beat at ${closestBeat}s`);

                // Keep the current duration but shift the start/end
                const duration = (overlay.endTime || currentTime + 2) - (overlay.startTime || currentTime);
                updateOverlay(overlay.id, {
                    startTime: closestBeat,
                    endTime: closestBeat + duration
                });
            }
        }

    }, {
        from: () => [overlay.position.x, overlay.position.y],
    });

    return (
        <div
            {...bind()}
            className="absolute z-30 cursor-move"
            style={{
                top: 0,
                left: 0,
                transform: `translate3d(${overlay.position.x}px, ${overlay.position.y}px, 0) scale(${overlay.scale}) rotate(${overlay.rotation}deg)`,
                touchAction: 'none' // required for use-gesture
            }}
        >
            {overlay.type === 'text' && (
                <div className="relative group">
                    <div
                        className="px-4 py-2 text-2xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                        style={{ color: overlay.color, fontFamily: overlay.fontFamily }}
                    >
                        {overlay.content}
                    </div>

                    {/* Delete button appears on hover/tap */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeOverlay(overlay.id);
                        }}
                        className="absolute -top-3 -right-3 w-6 h-6 bg-destructive rounded-full text-white text-xs items-center justify-center hidden group-hover:flex"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Add sticker/emoji rendering here if extending */}
        </div>
    );
};

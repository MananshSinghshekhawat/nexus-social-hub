import React, { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { HlsPlayer } from './HlsPlayer';
import { Heart, MessageCircle, Share2, Music } from 'lucide-react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

// Mock Post Type (Assume this maps to the API response for /posts?type=reel/shorts)
export interface FeedPost {
    _id: string;
    user: {
        username: string;
        display_name: string;
        avatar_url: string;
    };
    content: string;
    hls_url?: string;
    video_url?: string; // Fallback
    audio_name?: string;
    likes_count: number;
    comments_count: number;
}

interface VirtualFeedContainerProps {
    posts: FeedPost[];
    fetchMore?: () => void;
    hasMore?: boolean;
}

export const VirtualFeedContainer: React.FC<VirtualFeedContainerProps> = ({ posts, fetchMore, hasMore }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const controls = useAnimation();

    const rowVirtualizer = useVirtualizer({
        count: hasMore ? posts.length + 1 : posts.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => window.innerHeight, // Each item takes full viewport height
        overscan: 2, // Pre-render 2 items ahead for pre-warming logic
    });

    // Detect when user scrolls to bottom to fetch more
    const virtualItems = rowVirtualizer.getVirtualItems();
    useEffect(() => {
        const lastItem = virtualItems[virtualItems.length - 1];
        if (
            lastItem &&
            lastItem.index >= posts.length - 1 &&
            hasMore &&
            fetchMore
        ) {
            fetchMore();
        }
    }, [virtualItems, posts.length, hasMore, fetchMore]);

    // Handle Snap Scrolling
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollOffset = e.currentTarget.scrollTop;
        const viewportHeight = window.innerHeight;
        const newIndex = Math.round(scrollOffset / viewportHeight);

        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < posts.length) {
            setActiveIndex(newIndex);
        }
    };

    return (
        <div
            ref={parentRef}
            className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory hide-scrollbar bg-black"
            onScroll={handleScroll}
            style={{
                scrollBehavior: 'smooth',
                overscrollBehaviorY: 'contain' // Prevent pull-to-refresh on mobile
            }}
        >
            <div
                className="relative w-full"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
                {virtualItems.map((virtualRow) => {
                    const isLoaderRow = virtualRow.index > posts.length - 1;
                    const post = posts[virtualRow.index];

                    if (isLoaderRow) {
                        return (
                            <div
                                key={virtualRow.key}
                                className="absolute top-0 left-0 w-full flex items-center justify-center text-white"
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                Loading more...
                            </div>
                        );
                    }

                    const isActive = activeIndex === virtualRow.index;
                    // Pre-warm the next two items in the queue
                    const isPreWarming = virtualRow.index === activeIndex + 1 || virtualRow.index === activeIndex + 2;

                    const videoSrc = post.hls_url || post.video_url;

                    return (
                        <div
                            key={virtualRow.key}
                            className="absolute top-0 left-0 w-full snap-start snap-always"
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <div className="relative w-full h-full max-w-md mx-auto sm:h-[calc(100vh-2rem)] sm:my-4 sm:rounded-2xl overflow-hidden bg-black shadow-2xl shrink-0 border border-white/10">
                                {videoSrc ? (
                                    <HlsPlayer
                                        src={videoSrc}
                                        isActive={isActive}
                                        isPreWarming={isPreWarming}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/50">
                                        No media available
                                    </div>
                                )}

                                {/* Right Side Actions */}
                                <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center z-10">
                                    <button className="flex flex-col items-center gap-1">
                                        <div className="p-3 rounded-full bg-black/40 backdrop-blur-md">
                                            <Heart className="w-7 h-7 text-white" />
                                        </div>
                                        <span className="text-white text-sm font-semibold text-shadow">{post.likes_count}</span>
                                    </button>

                                    <button className="flex flex-col items-center gap-1">
                                        <div className="p-3 rounded-full bg-black/40 backdrop-blur-md">
                                            <MessageCircle className="w-7 h-7 text-white" />
                                        </div>
                                        <span className="text-white text-sm font-semibold text-shadow">{post.comments_count}</span>
                                    </button>

                                    <button className="flex flex-col items-center gap-1">
                                        <div className="p-3 rounded-full bg-black/40 backdrop-blur-md">
                                            <Share2 className="w-7 h-7 text-white" />
                                        </div>
                                        <span className="text-white text-sm font-semibold text-shadow">Share</span>
                                    </button>

                                    {isActive && post.audio_name && (
                                        <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center animate-spin-slow mt-2">
                                            <Music className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Info */}
                                <div className="absolute bottom-0 left-0 right-16 p-6 pt-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-0">
                                    <h3 className="text-white font-bold text-lg pointer-events-auto">@{post.user.username}</h3>
                                    <p className="text-white/90 text-sm mt-2 line-clamp-2 pointer-events-auto shadow-sm">
                                        {post.content}
                                    </p>
                                    {post.audio_name && (
                                        <div className="flex items-center gap-2 mt-3 text-white/80 text-sm pointer-events-auto">
                                            <Music className="w-4 h-4" />
                                            <span className="animate-marquee whitespace-nowrap overflow-hidden w-48">
                                                {post.audio_name} - Original Audio
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

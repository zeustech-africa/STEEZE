'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Heart, MessageCircle, Eye } from 'lucide-react';

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  views?: number;
  likes?: number;
  comments?: number;
  thumbnailUrl?: string;
  videoUrl: string;
  duration?: string;
}

interface VideoGridProps {
  videos: VideoItem[];
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  showMetadata?: boolean;
  onVideoClick?: (video: VideoItem) => void;
  onLike?: (videoId: string) => void;
  onComment?: (videoId: string) => void;
}

export function VideoGrid({
  videos,
  title,
  subtitle,
  columns = 3,
  showMetadata = true,
  onVideoClick,
  onLike,
  onComment
}: VideoGridProps) {
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  // Grid columns class
  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }[columns];

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return null;
    // Handle MM:SS or HH:MM:SS format
    if (duration.includes(':')) return duration;
    // If seconds, convert to MM:SS
    const seconds = parseInt(duration);
    if (!isNaN(seconds)) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return duration;
  };

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {subtitle && (
              <p className="text-gold uppercase tracking-wider text-sm mb-2">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* Video Grid */}
        <div className={`grid ${gridColsClass} gap-6`}>
          {videos.map((video) => {
            const isHovered = hoveredVideo === video.id;
            
            return (
              <div
                key={video.id}
                className="group cursor-pointer"
                onClick={() => onVideoClick?.(video)}
                onMouseEnter={() => setHoveredVideo(video.id)}
                onMouseLeave={() => setHoveredVideo(null)}
              >
                {/* Thumbnail with Play Overlay */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                      <Play className="w-12 h-12 text-white/30" />
                    </div>
                  )}
                  
                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-7 h-7 text-black ml-1" />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="mt-3">
                  <h3 className="text-white font-semibold text-base line-clamp-1 group-hover:text-gold transition-colors">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-gray-400 text-sm line-clamp-1 mt-1">
                      {video.description}
                    </p>
                  )}
                  
                  {/* Metadata */}
                  {showMetadata && (
                    <div className="flex items-center gap-4 mt-2 text-gray-500 text-xs">
                      {video.views !== undefined && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(video.views)}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLike?.(video.id);
                        }}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-3 h-3" />
                        {formatNumber(video.likes)}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onComment?.(video.id);
                        }}
                        className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        {formatNumber(video.comments)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
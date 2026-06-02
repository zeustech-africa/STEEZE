'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Pause, Heart, MessageCircle } from 'lucide-react';

export interface MusicTrack {
  id: string;
  title: string;
  duration?: string;
  plays?: number;
  likes?: number;
  comments?: number;
  coverArtUrl?: string;
  audioUrl: string;
  artistName?: string;
}

interface MusicGridProps {
  tracks: MusicTrack[];
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  showMetadata?: boolean;
  onTrackPlay?: (track: MusicTrack) => void;
  onTrackPause?: (track: MusicTrack) => void;
  onLike?: (trackId: string) => void;
  onComment?: (trackId: string) => void;
  playButtonClassName?: string;
}

export function MusicGrid({
  tracks,
  title,
  subtitle,
  columns = 3,
  showMetadata = true,
  onTrackPlay,
  onTrackPause,
  onLike,
  onComment,
  playButtonClassName
}: MusicGridProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

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

  const handlePlayPause = (track: MusicTrack) => {
    let audio = audioElements.get(track.id);

    if (!audio) {
      audio = new Audio(track.audioUrl);
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        onTrackPause?.(track);
      });
      audioElements.set(track.id, audio);
    }

    if (currentlyPlaying === track.id) {
      audio.pause();
      setCurrentlyPlaying(null);
      onTrackPause?.(track);
    } else {
      // Pause any currently playing track
      if (currentlyPlaying) {
        const currentAudio = audioElements.get(currentlyPlaying);
        if (currentAudio) {
          currentAudio.pause();
        }
      }
      audio.play();
      setCurrentlyPlaying(track.id);
      onTrackPlay?.(track);
    }
  };

  if (tracks.length === 0) {
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

        {/* Music Grid */}
        <div className={`grid ${gridColsClass} gap-6`}>
          {tracks.map((track) => {
            const isPlaying = currentlyPlaying === track.id;
            
            return (
              <div
                key={track.id}
                className="group bg-gray-900 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {/* Cover Art with Play Button Overlay */}
                <div className="relative aspect-square bg-gradient-to-br from-purple-900 to-black">
                  {track.coverArtUrl ? (
                    <Image
                      src={track.coverArtUrl}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white/20 text-6xl">🎵</span>
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <button
                    onClick={() => handlePlayPause(track)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2 focus:ring-offset-transparent"
                    aria-label={isPlaying ? 'Pause track' : 'Play track'}
                  >
                    <div className={playButtonClassName || "w-16 h-16 rounded-full bg-gold flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300"}>
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-black" />
                      ) : (
                        <Play className="w-8 h-8 text-black ml-1" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Track Info */}
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">
                    {track.title}
                  </h3>
                  {track.artistName && (
                    <p className="text-gray-400 text-sm mb-2">
                      {track.artistName}
                    </p>
                  )}
                  {track.duration && (
                    <p className="text-gray-500 text-xs mb-2">
                      Duration: {track.duration}
                    </p>
                  )}
                  
                  {/* Metadata (Plays, Likes, Comments) */}
                  {showMetadata && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                      {track.plays !== undefined && (
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          ▶ {formatNumber(track.plays)}
                        </span>
                      )}
                      <button
                        onClick={() => onLike?.(track.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors text-xs flex items-center gap-1 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
                      >
                        <Heart className="w-3 h-3" />
                        {formatNumber(track.likes)}
                      </button>
                      <button
                        onClick={() => onComment?.(track.id)}
                        className="text-gray-500 hover:text-blue-500 transition-colors text-xs flex items-center gap-1 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
                      >
                        <MessageCircle className="w-3 h-3" />
                        {formatNumber(track.comments)}
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
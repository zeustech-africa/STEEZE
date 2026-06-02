"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Download,
  Lock,
  Heart,
  Share2,
  Music,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import ReportButton from "../ReportButton";
import AddToPlaylistButton from "../playlist/AddToPlaylistButton";

interface Song {
  id: string;
  title: string;
  description?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  isFree: boolean;
  price: number;
  interactions?: { type: string; userId: string }[];
  userType?: string;
}

interface MusicLibraryProps {
  songs: Song[];
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isSubscribed: boolean;
  subscriptionTier: string | null;
}

export default function MusicLibrary({
  songs,
  currentSong,
  setCurrentSong,
  isPlaying,
  setIsPlaying,
  isSubscribed,
  subscriptionTier,
}: MusicLibraryProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize WaveSurfer when current song changes
  useEffect(() => {
    if (waveformRef.current && currentSong) {
      // Destroy previous instance
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }

      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#4a4a4a",
        progressColor: "#FFD700",
        cursorColor: "#FFD700",
        barWidth: 3,
        barRadius: 4,
        height: 80,
        normalize: true,
      });

      // Manual responsive handling for WaveSurfer v7
      const observer = new ResizeObserver(() => {
        ws.setOptions({ width: waveformRef.current?.clientWidth || 900 });
      });
      if (waveformRef.current) observer.observe(waveformRef.current);
      (ws as any).__resizeObserver = observer;

      ws.load(currentSong.mediaUrl);

      ws.on("ready", () => {
        setDuration(ws.getDuration());
        if (isPlaying && currentSong) {
          ws.play();
        }
      });

      ws.on("audioprocess", () => {
        setCurrentTime(ws.getCurrentTime());
      });

      ws.on("finish", () => {
        setIsPlaying(false);
      });

      wavesurfer.current = ws;
    }

    return () => {
      if (wavesurfer.current) {
        const ws = wavesurfer.current as any;
        if (ws.__resizeObserver) ws.__resizeObserver.disconnect();
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [currentSong]);

  // Sync play/pause
  useEffect(() => {
    if (wavesurfer.current) {
      if (isPlaying) {
        wavesurfer.current.play();
      } else {
        wavesurfer.current.pause();
      }
    }
  }, [isPlaying]);

  const handlePlayPause = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const canAccess = (song: Song) => {
    if (song.isFree) return true;
    return isSubscribed && subscriptionTier !== "free";
  };

  if (!songs || songs.length === 0) return null;

  return (
    <section className="py-12 md:py-16 px-4 bg-black/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gold mb-8 flex items-center gap-2">
          <Music size={24} className="text-gold" /> Music
        </h2>

        {/* Waveform Display */}
        {currentSong && (
          <div className="glass-card p-5 mb-8 rounded-xl border border-gold/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-gold flex items-center justify-center text-black hover:bg-gold/90 transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {currentSong.title}
                  </h3>
                  <p className="text-white/50 text-sm">
                    {currentSong.description || "Single"}
                  </p>
                </div>
              </div>
              <span className="text-white/50 text-sm font-mono tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div ref={waveformRef} className="w-full rounded-lg overflow-hidden" />
          </div>
        )}

        {/* Song List */}
        <div className="space-y-2">
          {songs.map((song) => {
            const isActive = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all group ${
                  isActive
                    ? "bg-gold/10 border border-gold/30"
                    : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-gold/20"
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button
                    onClick={() => handlePlayPause(song)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isActive
                        ? "bg-gold text-black"
                        : "bg-white/10 text-gold hover:bg-gold hover:text-black"
                    }`}
                    aria-label={isActive && isPlaying ? "Pause" : "Play"}
                  >
                    {isActive && isPlaying ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium truncate">
                        {song.title}
                      </h4>
                      {song.userType === 'zls_artist' && (
                        <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs rounded-full shrink-0">
                          ZLS
                        </span>
                      )}
                    </div>
                    <p className="text-white/35 text-xs truncate">
                      {song.description || "STEEZE Original"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {!canAccess(song) && (
                    <span className="text-gold/80" title="Subscribe to unlock">
                      <Lock size={15} />
                    </span>
                  )}

                  <button
                    className="text-white/30 hover:text-red-500 transition-colors"
                    aria-label="Like"
                  >
                    <Heart size={16} />
                  </button>
                  <button
                    className="text-white/30 hover:text-gold transition-colors"
                    aria-label="Share"
                  >
                    <Share2 size={16} />
                  </button>
                  <AddToPlaylistButton postId={song.id} />
                  <ReportButton
                    targetType="post"
                    targetId={song.id}
                    targetTitle={song.title}
                    variant="icon"
                  />
                  {canAccess(song) && (
                    <a
                      href={song.mediaUrl}
                      download
                      className="text-white/30 hover:text-gold transition-colors"
                      aria-label="Download"
                    >
                      <Download size={16} />
                    </a>
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
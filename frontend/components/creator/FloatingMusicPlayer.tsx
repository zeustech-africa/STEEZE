"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Music,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingMusicPlayerProps {
  song: {
    id: string;
    title: string;
    artist?: string;
    audioUrl: string;
    album?: string;
  };
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export default function FloatingMusicPlayer({
  song,
  isPlaying,
  setIsPlaying,
}: FloatingMusicPlayerProps) {
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element on mount / song change
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.src = song.audioUrl;
    audio.loop = true;
    audio.preload = "metadata";

    // Enable background audio on mobile
    // @ts-ignore – setSinkId not fully typed
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist || "STEEZE Artist",
        album: song.album || "STEEZE",
      });
      navigator.mediaSession.setActionHandler("play", () =>
        setIsPlaying(true),
      );
      navigator.mediaSession.setActionHandler("pause", () =>
        setIsPlaying(false),
      );
    }

    if (isPlaying) {
      audio.play().catch(() => {
        // Autoplay blocked - user gesture needed
        setIsPlaying(false);
      });
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [song.audioUrl]);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Sync mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const dismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {minimized ? (
        <motion.button
          key="minimized"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => setMinimized(false)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full glass-card flex items-center justify-center border border-gold/20 hover:border-gold/50 transition-colors shadow-lg shadow-black/40"
          aria-label="Expand player"
        >
          <Music size={18} className="text-gold" />
        </motion.button>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50 glass-card rounded-2xl p-3 w-80 shadow-xl shadow-black/40 border border-white/5"
        >
          <div className="flex items-center gap-3">
            {/* Album art placeholder */}
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
              <Music size={18} className="text-gold" />
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {song.title}
              </p>
              <p className="text-white/40 text-xs truncate">
                {song.artist || "STEEZE Artist"}
              </p>
            </div>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-black flex-shrink-0 hover:shadow-md hover:shadow-gold/20 transition-all"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={15} />
              ) : (
                <Play size={15} className="ml-0.5" />
              )}
            </button>

            {/* Mute */}
            <button
              onClick={() => setMuted(!muted)}
              className="text-white/40 hover:text-white transition-colors flex-shrink-0"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* Minimize */}
            <button
              onClick={() => setMinimized(true)}
              className="text-white/40 hover:text-white transition-colors flex-shrink-0"
              aria-label="Minimize"
            >
              <Minimize2 size={15} />
            </button>

            {/* Close */}
            <button
              onClick={dismiss}
              className="text-white/30 hover:text-white transition-colors flex-shrink-0"
              aria-label="Close player"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VideoPlayerProps {
  video: {
    id: string;
    title: string;
    description?: string;
    mediaUrl: string;
    thumbnailUrl?: string;
  };
  onClose: () => void;
}

export default function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (videoRef.current && !playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: true,
        preload: "auto",
        fluid: true,
        playbackRates: [0.5, 1, 1.5, 2],
        controlBar: {
          volumePanel: { inline: false },
        },
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [video]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10 transition-colors"
        aria-label="Close video"
      >
        <X size={32} />
      </button>

      <div className="w-full max-w-5xl">
        <div className="rounded-xl overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            className="video-js vjs-big-play-centered vjs-theme-city w-full"
            poster={video.thumbnailUrl || undefined}
          >
            <source src={video.mediaUrl} type="video/mp4" />
          </video>
        </div>
        <div className="mt-4 px-2">
          <h3 className="text-white text-xl font-bold">{video.title}</h3>
          {video.description && (
            <p className="text-white/60 mt-1">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
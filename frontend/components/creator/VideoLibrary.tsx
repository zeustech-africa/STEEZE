"use client";

import { useState, useEffect } from "react";
import { Play, Lock, Heart, Share2, Video, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import VideoPlayer from "./VideoPlayer";
import ReportButton from "../ReportButton";

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  isFree: boolean;
  price: number;
  isAgeRestricted?: boolean;
  ageRating?: string;
  interactions?: { type: string; userId: string }[];
  userType?: string;
}

interface VideoLibraryProps {
  videos: VideoItem[];
  isSubscribed: boolean;
  subscriptionTier: string | null;
}

export default function VideoLibrary({
  videos,
  isSubscribed,
  subscriptionTier,
}: VideoLibraryProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [ageChecked, setAgeChecked] = useState(false);

  useEffect(() => {
    // Check user's age from local storage or profile
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.dateOfBirth) {
        const birthDate = new Date(user.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setUserAge(age);
      }
    } catch {
      // ignore
    }
    setAgeChecked(true);
  }, []);

  const canAccess = (video: VideoItem) => {
    // Check age restriction first
    if (video.isAgeRestricted) {
      if (userAge === null) return false; // Must have age to view
      if (userAge < 18) return false; // Under-18 locked
    }
    if (video.isFree) return true;
    return isSubscribed && subscriptionTier !== "free";
  };

  const getLockReason = (video: VideoItem): string | null => {
    if (video.isAgeRestricted) {
      if (userAge === null) return "Age verification required";
      if (userAge < 18) return "18+ only";
    }
    if (!video.isFree && !(isSubscribed && subscriptionTier !== "free")) {
      return "Subscribe to unlock";
    }
    return null;
  };

  if (!videos || videos.length === 0) return null;

  return (
    <section className="py-12 md:py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gold mb-8 flex items-center gap-2">
          <Video size={24} className="text-gold" /> Videos
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video, idx) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="relative group rounded-xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-gold/30 transition-all cursor-pointer"
              onClick={() => canAccess(video) && setSelectedVideo(video)}
            >
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gold/20 to-black flex items-center justify-center">
                    <Video size={36} className="text-gold/40" />
                  </div>
                )}

                {/* ZLS badge overlay */}
                {video.userType === 'zls_artist' && (
                  <div className="absolute bottom-2 right-2 z-10">
                    <div className="px-2 py-1 bg-gold/80 text-black text-xs font-bold rounded">
                      ZLS ARTIST
                    </div>
                  </div>
                )}

                {/* Play button overlay */}
                {canAccess(video) && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center shadow-xl">
                      <Play size={24} className="text-black ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Locked overlay */}
                {!canAccess(video) && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                    {video.isAgeRestricted && (userAge === null || userAge < 18) ? (
                      <>
                        <AlertTriangle size={28} className="text-red-400" />
                        <p className="text-white/70 text-xs text-center px-2">
                          {getLockReason(video)}
                        </p>
                        {video.ageRating && (
                          <span className="text-red-400/60 text-[10px] uppercase tracking-wider border border-red-400/30 rounded px-1.5 py-0.5">
                            {video.ageRating}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <Lock size={28} className="text-gold" />
                        <p className="text-white/70 text-xs">{getLockReason(video)}</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-white font-semibold text-sm line-clamp-1">
                  {video.title}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    className="text-white/30 hover:text-red-500 transition-colors"
                    aria-label="Like"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart size={14} />
                  </button>
                  <button
                    className="text-white/30 hover:text-gold transition-colors"
                    aria-label="Share"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Share2 size={14} />
                  </button>
                  <ReportButton
                    targetType="post"
                    targetId={video.id}
                    targetTitle={video.title}
                    variant="icon"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </section>
  );
}
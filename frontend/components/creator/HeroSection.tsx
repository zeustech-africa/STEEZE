"use client";

import { useState } from "react";
import Image from "next/image";
import { Verified, MapPin, CalendarCheck, Link, Share2, VolumeX, Volume2, Crown, Shield } from "lucide-react";

interface HeroSectionProps {
  creator: {
    id?: string;
    username?: string;
    artistName: string;
    tagline?: string;
    coverVideoUrl?: string;
    coverPhotoUrl?: string;
    isVerified: boolean;
    category?: string;
    bio?: string;
    followerCount?: number;
    subscriberCount?: number;
    totalLikes?: number;
    createdAt?: string;
    userType?: string;
    zlsBadgeEnabled?: boolean;
  };
  isCreator: boolean;
}

export default function HeroSection({ creator, isCreator }: HeroSectionProps) {
  const hasVideo = !!creator.coverVideoUrl;
  const [isMuted, setIsMuted] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyLink = () => {
    const profileUrl = `https://steeze.com/@${creator.username || creator.artistName}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }).catch(() => {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  const handleMute = async () => {
    try {
      const res = await fetch(`/api/vibes/mute/${creator.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setIsMuted(data.muted);
    } catch (error) {
      console.error("Failed to toggle mute:", error);
    }
  };

  return (
    <div className="relative h-[55vh] md:h-[70vh] w-full overflow-hidden">
      {/* Cover Video or Image */}
      {hasVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover animate-slow-zoom"
          src={creator.coverVideoUrl}
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-full">
            <Image
              src={creator.coverPhotoUrl || "/images/auth-bg.jpg"}
              alt={`Cover image for ${creator.artistName}`}
              fill
              priority
              className="object-cover"
            />
        </div>
      )}

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

      {/* ZLS / Independent Badge */}
      {creator.userType === "zls_artist" && creator.zlsBadgeEnabled && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gold to-gold-dark rounded-full shadow-lg">
            <Crown size={14} className="text-black" />
            <span className="text-black text-xs font-bold">ZeusLiveStudio Artist</span>
          </div>
        </div>
      )}

      {creator.userType === "independent_creator" && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
            <Shield size={14} className="text-white/50" />
            <span className="text-white/50 text-xs">Independent Creator</span>
          </div>
        </div>
      )}

      {/* Top-right action buttons */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/70 hover:text-gold hover:bg-white/20 transition-all text-xs"
          aria-label="Copy profile link"
          title="Copy profile link"
        >
          {showCopied ? (
            <>Copied!</>
          ) : (
            <>
              <Link size={12} /> Copy Link
            </>
          )}
        </button>
        <button
          onClick={handleMute}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/70 hover:text-gold hover:bg-white/20 transition-all text-xs"
          aria-label={isMuted ? "Unmute creator" : "Mute creator"}
          title={isMuted ? "Unmute creator" : "Mute creator"}
        >
          {isMuted ? <Volume2 size={12} /> : <VolumeX size={12} />}
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${creator.artistName} on STEEZE`,
                text: `Check out ${creator.artistName} on STEEZE`,
                url: `https://steeze.com/@${creator.username || creator.artistName}`,
              });
            } else {
              handleCopyLink();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/70 hover:text-gold hover:bg-white/20 transition-all text-xs"
          aria-label="Share profile"
          title="Share profile"
        >
          <Share2 size={12} /> Share
        </button>
      </div>

      {/* Hero Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 pb-8 md:pb-16">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gold/80 text-sm font-medium uppercase tracking-widest">
              {creator.category || "Artist"}
            </span>
            {creator.isVerified && (
              <span className="px-2 py-0.5 bg-gold/20 rounded-full text-gold text-xs flex items-center gap-1">
                <Verified size={12} fill="#FFD700" /> Verified
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-tight">
            {creator.artistName}
          </h1>

          {creator.tagline && (
            <p className="text-gold text-base md:text-xl mt-2 max-w-2xl italic">
              {creator.tagline}
            </p>
          )}

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4 md:gap-8 mt-6 text-white/60 text-sm md:text-base">
            <span className="flex items-center gap-1.5">
              <span className="text-gold font-semibold">{creator.followerCount ?? 0}</span> Followers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gold font-semibold">{creator.subscriberCount ?? 0}</span> Subscribers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gold font-semibold">{creator.totalLikes ?? 0}</span> Likes
            </span>
            {creator.createdAt && (
              <span className="flex items-center gap-1.5">
                <CalendarCheck size={14} /> Joined {new Date(creator.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

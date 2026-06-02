"use client";

import { useState } from "react";
import OptimizedImage from "../OptimizedImage";
import { Verified, MapPin, CalendarCheck, Link, Share2, VolumeX, Volume2, Crown, Shield } from "lucide-react";

interface HeroSectionProps {
  creator: {
    id?: string;
    username?: string;
    artistName: string;
    tagline?: string;
    coverVideoUrl?: string;
    coverPhotoUrl?: string;
    profilePicUrl?: string;
    fullName?: string;
    isVerified: boolean;
    category?: string;
    bio?: string;
    followerCount?: number;
    followingCount?: number;
    subscriberCount?: number;
    totalLikes?: number;
    createdAt?: string;
    userType?: string;
    zlsBadgeEnabled?: boolean;
  };
  isCreator: boolean;
  onShowFollowers?: () => void;
  onShowFollowing?: () => void;
}

function formatNumber(num: number | undefined): string {
  if (num == null) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function HeroSection({ creator, isCreator, onShowFollowers, onShowFollowing }: HeroSectionProps) {
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
            <OptimizedImage
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

          <div className="flex items-center flex-wrap gap-2">
            {/* Profile Picture / Avatar */}
            {creator.profilePicUrl ? (
              <div className="flex-shrink-0 mr-2">
                <OptimizedImage
                  src={creator.profilePicUrl}
                  alt={creator.artistName}
                  width={80}
                  height={80}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-[3px] border-gold shadow-lg"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 mr-2 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gold/20 border-[3px] border-gold flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-bold text-gold">
                  {creator.artistName?.charAt(0) || creator.fullName?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-tight">
              {creator.artistName}
            </h1>
            {creator.userType === 'zls_artist' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-gold to-gold-dark rounded-full">
                  <Crown size={14} className="text-black" />
                  <span className="text-black font-bold text-sm">ZLS</span>
                </div>
                <span className="text-gold text-xs">Verified ZLS Artist</span>
              </div>
            )}
          </div>

          {creator.tagline && (
            <p className="text-gold text-base md:text-xl mt-2 max-w-2xl italic">
              {creator.tagline}
            </p>
          )}

          {/* Stats Bar - Clickable Followers/Following */}
          <div className="flex flex-wrap gap-8 md:gap-12 mt-6">
            <button
              onClick={() => onShowFollowers?.()}
              className="text-center hover:scale-105 transition-transform"
              aria-label="View followers"
            >
              <div className="text-2xl md:text-3xl font-bold text-white">{formatNumber(creator.followerCount)}</div>
              <div className="text-white/50 text-sm">Followers</div>
            </button>
            <button
              onClick={() => onShowFollowing?.()}
              className="text-center hover:scale-105 transition-transform"
              aria-label="View following"
            >
              <div className="text-2xl md:text-3xl font-bold text-white">{formatNumber(creator.followingCount)}</div>
              <div className="text-white/50 text-sm">Following</div>
            </button>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{formatNumber(creator.totalLikes)}</div>
              <div className="text-white/50 text-sm">Likes</div>
            </div>
            {creator.createdAt && (
              <div className="text-center">
                <div className="text-white/50 text-sm mt-2 flex items-center gap-1.5 justify-center">
                  <CalendarCheck size={14} /> Joined {new Date(creator.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short" })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
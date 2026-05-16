"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Share2, Headphones, Play, Pause, Volume2, VolumeX, Bookmark, Crown, Lock, Download } from "lucide-react";

interface FeedCardProps {
  post: any;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onShare: () => void;
  onFollow: () => void;
  currentUserId?: string;
  isRepost?: boolean;
  repostedBy?: any;
}

export default function FeedCard({
  post,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onComment,
  onShare,
  onFollow,
  currentUserId,
  isRepost = false,
  repostedBy,
}: FeedCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserAge(user.age || null);
        setSubscriptionTier(user.subscriptionTier || "free");
      }
    } catch {
      setUserAge(null);
      setSubscriptionTier("free");
    }
  }, []);

  const isContentBlocked = post.isAgeRestricted && userAge !== null && userAge < 18;
  const isPaidContentBlurred = post.isPaid && subscriptionTier === "free";
  const canDownload = post.type === "audio" && (post.isPaid ? subscriptionTier !== "free" : true);

  const handleDownload = async () => {
    if (!canDownload || !post.mediaUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(post.mediaUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = post.title ? `${post.title}.mp3` : "download.mp3";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isContentBlocked) {
    return (
      <div className="glass-card p-4 mb-4 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
          <Lock className="text-gold" size={32} aria-hidden="true" />
        </div>
        <p className="text-white font-semibold mb-1">Age Restricted Content</p>
        <p className="text-white/50 text-sm">This content is for users 18 and older.</p>
      </div>
    );
  }

  const displayUser = isRepost && repostedBy ? repostedBy : post.creator;
  const originalCreator = post.creator;

  const renderContent = () => {
    if (isPaidContentBlurred && post.type !== "audio") {
      return (
        <div className="relative rounded-xl overflow-hidden">
          <div className="relative">
            <Image
              src={post.mediaUrl || "/images/auth-bg.jpg"}
              alt={post.title || "Post image"}
              width={600}
              height={600}
              className="w-full object-cover max-h-[70vh] blur-xl opacity-30"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <Crown className="text-gold mb-3" size={40} aria-hidden="true" />
              <p className="text-white font-semibold text-lg mb-1">Subscribe to Unlock</p>
              <p className="text-white/60 text-sm mb-3">This is paid content</p>
              <Link
                href="/settings/subscriptions"
                className="px-4 py-2 bg-gold text-black rounded-full text-sm font-semibold hover:bg-gold/80 transition-all"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      );
    }

    switch (post.type) {
      case "image":
        return (
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src={post.mediaUrl}
              alt={post.title || "Post image"}
              width={600}
              height={600}
              className="w-full object-cover max-h-[70vh]"
            />
          </div>
        );
      case "video":
        return (
          <div className="relative rounded-xl overflow-hidden">
            <video src={post.mediaUrl} className="w-full max-h-[70vh] object-contain" controls />
          </div>
        );
      case "audio":
        return (
          <div className="p-4 bg-white/10 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
                className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center"
              >
                {isPlaying ? <Pause className="text-gold" size={20} aria-hidden="true" /> : <Play className="text-gold" size={20} aria-hidden="true" />}
              </button>
              <div className="flex-1">
                <h3 className="text-white font-semibold">{post.title}</h3>
                <p className="text-white/50 text-sm">{post.description}</p>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                className="text-white/50 hover:text-gold"
              >
                {isMuted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={!canDownload || isDownloading}
                aria-label={post.isPaid && subscriptionTier === "free" ? "Subscribe to download" : "Download audio"}
                className={`text-white/50 hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed ${isDownloading ? "animate-pulse" : ""}`}
                title={
                  post.isPaid && subscriptionTier === "free"
                    ? "Subscribe to download paid content"
                    : "Download"
                }
              >
                <Download size={18} aria-hidden="true" />
              </button>
            </div>
            {isPlaying && (
              <div className="mt-3">
                <audio src={post.mediaUrl} autoPlay controls className="w-full" />
              </div>
            )}
            {post.isPaid && subscriptionTier === "free" && (
              <p className="text-gold/60 text-xs mt-2">Subscribe to download this track</p>
            )}
          </div>
        );
      case "text":
        return (
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-white/80">{post.content}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-card p-4 mb-4">
      {/* Header with attribution for reposts */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link href={`/creator/${displayUser.username}`}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={displayUser.profilePicUrl || "/icons/steeze-icon-square.png"}
                alt={`Profile picture of ${displayUser.artistName || displayUser.username}`}
                fill
                className="object-cover"
              />
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/creator/${displayUser.username}`} className="text-white font-semibold hover:text-gold">
                {displayUser.artistName || displayUser.username}
              </Link>
              {displayUser.userType === "zls_artist" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs ml-1">
                  <Crown size={10} aria-hidden="true" /> ZLS Artist
                </span>
              )}
              {displayUser.userType === "independent_creator" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-xs ml-1">
                  Independent
                </span>
              )}
              {isRepost && repostedBy && (
                <span className="text-white/40 text-xs">
                  reposted from{" "}
                  <Link href={`/creator/${originalCreator?.username}`} className="text-gold hover:underline">
                    @{originalCreator?.username}
                  </Link>
                </span>
              )}
            </div>
            <p className="text-white/40 text-xs">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        {currentUserId !== post.creatorId && !isRepost && (
          <button
            onClick={onFollow}
            className="px-4 py-1 border border-gold text-gold rounded-full text-sm hover:bg-gold hover:text-black transition-all"
          >
            Follow
          </button>
        )}
      </div>

      {/* Content */}
      {renderContent()}

      {/* Caption */}
      {post.caption && <p className="text-white/80 mt-3">{post.caption}</p>}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-6">
          <button
            onClick={onLike}
            aria-label={isLiked ? "Unlike post" : "Like post"}
            aria-pressed={isLiked}
            className="flex items-center gap-1 text-white/50 hover:text-red-500 transition-all group"
          >
            <Heart
              size={22}
              className={isLiked ? "fill-red-500 text-red-500" : "group-hover:scale-110 transition-transform"}
              aria-hidden="true"
            />
            <span className="text-sm" aria-hidden="true">{post.likeCount || 0}</span>
          </button>
          <button
            onClick={onComment}
            aria-label="Comment on this post"
            className="flex items-center gap-1 text-white/50 hover:text-gold transition-all"
          >
            <MessageCircle size={22} aria-hidden="true" />
            <span className="text-sm" aria-hidden="true">{post.commentCount || 0}</span>
          </button>
          {/* SAVE button = REPOST action */}
          <button
            onClick={onSave}
            aria-label={isSaved ? "Remove from saved" : "Save this post"}
            aria-pressed={isSaved}
            className="flex items-center gap-1 text-white/50 hover:text-green-500 transition-all"
          >
            <Bookmark size={22} className={isSaved ? "fill-green-500 text-green-500" : ""} aria-hidden="true" />
            <span className="text-sm" aria-hidden="true">{post.saveCount || 0}</span>
          </button>
          <button
            onClick={onShare}
            aria-label="Share this post"
            className="flex items-center gap-1 text-white/50 hover:text-gold transition-all"
          >
            <Share2 size={22} aria-hidden="true" />
          </button>
        </div>
        <button
          aria-label="Listen to audio preview"
          className="text-white/50 hover:text-gold transition-all"
        >
          <Headphones size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
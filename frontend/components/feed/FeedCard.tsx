'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, 
  Lock, DollarSign, Crown, Sparkles, Eye, Play, AlertCircle, Download
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useJustVibes } from "@/hooks/useJustVibes";
import { UpgradeModal } from "@/components/UpgradeModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FeedCardProps {
  post: {
    id: string;
    mediaUrl: string;
    mediaType: "image" | "video" | "audio";
    caption: string;
    title?: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    contentType: "free" | "subscriber" | "direct_purchase" | "creator_page_only";
    price?: number;
    creator: {
      id: string;
      artistName: string;
      fullName: string;
      profilePicUrl: string;
    };
  };
  onLikeUpdate?: (postId: string, newLikeCount: number) => void;
  onComment?: (postId: string) => void;
  onCreatorPage?: boolean;
}

// Helper: Get user subscription tier
function getUserSubscriptionTier(user: any): string | null {
  if (!user) return null;
  return user.subscriptionTier || null;
}

export const FeedCard: React.FC<FeedCardProps> = ({ 
  post, 
  onLikeUpdate, 
  onComment,
  onCreatorPage = false 
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const { isAuthenticated: isJustVibesAuth } = useJustVibes();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const userTier = getUserSubscriptionTier(user);
  const isPremiumOrGold = userTier === 'premium' || userTier === 'gold';
  const isBasic = userTier === 'basic';
  const isViber = isAuthenticated && !userTier && !isJustVibesAuth;
  const isJustVibes = isJustVibesAuth;
  
  // Check if user can access full content
  const canAccessFull = useCallback(() => {
    if (post.contentType === 'free') {
      return !isJustVibes; // Just VIBES get preview only
    }
    if (post.contentType === 'subscriber') {
      return isPremiumOrGold;
    }
    if (post.contentType === 'direct_purchase') {
      return hasPurchased;
    }
    if (post.contentType === 'creator_page_only') {
      return onCreatorPage; // Only visible on creator page
    }
    return false;
  }, [post.contentType, isJustVibes, isPremiumOrGold, hasPurchased, onCreatorPage]);
  
  const requiresPurchase = post.contentType === 'direct_purchase' && !hasPurchased;
  const requiresSubscription = post.contentType === 'subscriber' && !isPremiumOrGold;
  const isPreviewOnly = post.contentType === 'free' && isJustVibes;
  
  // Check purchase status for direct purchase content
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (post.contentType !== 'direct_purchase' || !isAuthenticated) return;
      
      setCheckingPurchase(true);
      try {
        const response = await fetch(`${API_URL}/api/user/purchases`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const purchased = data.purchases.some((p: any) => p.post.id === post.id);
          setHasPurchased(purchased);
        }
      } catch (error) {
        console.error('Check purchase error:', error);
      } finally {
        setCheckingPurchase(false);
      }
    };
    
    checkPurchaseStatus();
  }, [post.id, post.contentType, token, isAuthenticated]);
  
  // Track interaction
  const trackInteraction = useCallback(async (type: string, additionalData?: any) => {
    try {
      if (!token) return;
      
      const body: any = { postId: post.id, type };
      if (additionalData?.watchTime) {
        body.watchTime = additionalData.watchTime;
      }
      
      await fetch(`${API_URL}/api/feed/interaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error("Track interaction error:", error);
    }
  }, [post.id, token]);
  
  // Like handler
  const handleLike = useCallback(async () => {
    if (!isAuthenticated || isJustVibes) {
      alert("Become a VIBER to like content");
      return;
    }
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    await trackInteraction("like");
    
    try {
      await fetch(`${API_URL}/api/posts/${post.id}/like`, {
        method: newLikedState ? "POST" : "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (onLikeUpdate) {
        onLikeUpdate(post.id, newLikedState ? likeCount + 1 : likeCount - 1);
      }
    } catch (error) {
      console.error("Like error:", error);
      setIsLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
    }
  }, [isLiked, likeCount, post.id, trackInteraction, onLikeUpdate, token, isAuthenticated, isJustVibes]);
  
  // Comment handler
  const handleComment = useCallback(async () => {
    if (!isAuthenticated || isJustVibes) {
      alert("Become a VIBER to comment");
      return;
    }
    await trackInteraction("comment");
    if (onComment) onComment(post.id);
  }, [trackInteraction, onComment, post.id, isAuthenticated, isJustVibes]);
  
  // Share handler
  const handleShare = useCallback(async () => {
    if (!isAuthenticated || isJustVibes) {
      alert("Become a VIBER to share content");
      return;
    }
    await trackInteraction("share");
    
    if (navigator.share) {
      navigator.share({
        title: post.title || "Check out this post",
        text: post.caption,
        url: `${window.location.origin}/post/${post.id}`
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    }
  }, [trackInteraction, post.id, post.title, post.caption, isAuthenticated, isJustVibes]);
  
  // Save handler
  const handleSave = useCallback(async () => {
    if (!isAuthenticated || isJustVibes) {
      alert("Become a VIBER to save content");
      return;
    }
    
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    await trackInteraction("save");
    
    try {
      await fetch(`${API_URL}/api/posts/${post.id}/save`, {
        method: newSavedState ? "POST" : "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Save error:", error);
      setIsSaved(!newSavedState);
    }
  }, [isSaved, post.id, trackInteraction, token, isAuthenticated, isJustVibes]);
  
  // Download handler
  const handleDownload = useCallback(async () => {
    if (!isAuthenticated || isJustVibes) {
      setUpgradeFeature('Download');
      setShowUpgradeModal(true);
      return;
    }
    
    const canDownload = userTier === 'basic' || userTier === 'premium' || userTier === 'gold';
    if (!canDownload) {
      setUpgradeFeature('Download');
      setShowUpgradeModal(true);
      return;
    }
    
    if (post.contentType === 'direct_purchase' && !hasPurchased) {
      alert('Please purchase this content first to download');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/posts/${post.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  }, [isAuthenticated, isJustVibes, userTier, post.id, post.contentType, hasPurchased, token]);

  // Purchase handler for direct purchase content
  const handlePurchase = () => {
    window.location.href = `/purchase/${post.id}`;
  };
  
  // Subscribe handler
  const handleSubscribe = () => {
    window.location.href = `/settings/subscriptions`;
  };
  
  // Render CTA overlay for locked content
  const renderLockedOverlay = () => {
    if (canAccessFull()) return null;
    
    if (requiresPurchase) {
      const priceRands = post.price ? (post.price / 100).toFixed(2) : "0.00";
      return (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
          <DollarSign className="w-12 h-12 text-yellow-500 mb-3" />
          <p className="text-white text-lg font-semibold mb-2">Pay to Unlock</p>
          <p className="text-gray-400 text-sm mb-4">One-time payment of R{priceRands}</p>
          <button
            onClick={handlePurchase}
            disabled={checkingPurchase}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
          >
            Buy Now
          </button>
        </div>
      );
    }
    
    if (requiresSubscription) {
      return (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
          <Crown className="w-12 h-12 text-purple-500 mb-3" />
          <p className="text-white text-lg font-semibold mb-2">Subscriber Only</p>
          <p className="text-gray-400 text-sm mb-4">This content is for Premium and Gold members</p>
          <button
            onClick={handleSubscribe}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
          >
            Upgrade to Subscribe
          </button>
        </div>
      );
    }
    
    if (isPreviewOnly) {
      return (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 pointer-events-none">
          <Eye className="w-12 h-12 text-purple-500 mb-3" />
          <p className="text-white text-sm font-semibold">30-Second Preview</p>
          <p className="text-gray-400 text-xs">Become a VIBER for full access</p>
        </div>
      );
    }
    
    return null;
  };
  
  // Media player with locked overlay
  const renderMedia = () => {
    const showPreviewOnly = isPreviewOnly && !canAccessFull();
    
    return (
      <div className="relative bg-black w-full">
        {post.mediaType === "video" ? (
          <div className="relative">
            <video
              ref={videoRef}
              src={post.mediaUrl}
              className="w-full max-h-[50vh] md:max-h-[70vh] object-contain"
              loop={!showPreviewOnly}
              muted={isMuted}
              playsInline
              controls={canAccessFull()}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!canAccessFull() && renderLockedOverlay()}
            {canAccessFull() && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            )}
          </div>
        ) : post.mediaType === "audio" ? (
          <div className="relative p-8 bg-gradient-to-r from-purple-900 to-black text-center">
            {!canAccessFull() ? (
              <>
                {renderLockedOverlay()}
                <div className="opacity-50">
                  <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                    {requiresPurchase ? <DollarSign className="w-10 h-10 text-yellow-500" /> : 
                     requiresSubscription ? <Crown className="w-10 h-10 text-purple-500" /> :
                     <Lock className="w-10 h-10 text-gray-500" />}
                  </div>
                  <p className="mt-4 text-white font-semibold">{post.title || post.caption}</p>
                </div>
              </>
            ) : (
              <audio src={post.mediaUrl} controls className="w-full" />
            )}
          </div>
        ) : (
          <div className="relative">
            <Image
              src={post.mediaUrl}
              alt={`${post.creator.artistName}'s post: ${post.caption?.substring(0, 50) || 'image'}`}
              width={800}
              height={800}
              className="w-full object-contain max-h-[50vh] md:max-h-[70vh]"
              loading="lazy"
              unoptimized
            />
            {!canAccessFull() && renderLockedOverlay()}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
    <div ref={cardRef} className="bg-gray-900 rounded-xl overflow-hidden mb-6 shadow-lg">
      {renderMedia()}
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            {/* Like Button */}
              <button 
              onClick={handleLike} 
              className="flex items-center gap-1 transition hover:scale-110 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
              aria-label={isLiked ? "Unlike post" : "Like post"}
              aria-pressed={isLiked}
              disabled={!isAuthenticated || isJustVibes}
            >
              <Heart className={isLiked ? "fill-red-500 text-red-500" : "text-gray-400"} size={24} />
              <span className="text-sm text-gray-300">{likeCount}</span>
            </button>
            
            {/* Comment Button */}
            <button 
              onClick={handleComment} 
              className="flex items-center gap-1 transition hover:scale-110 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
              aria-label="Comment on post"
              disabled={!isAuthenticated || isJustVibes}
            >
              <MessageCircle size={24} className="text-gray-400" />
              <span className="text-sm text-gray-300">{post.comments}</span>
            </button>
            
            {/* Share Button */}
            <button 
              onClick={handleShare} 
              className="transition hover:scale-110 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
              aria-label="Share post"
              disabled={!isAuthenticated || isJustVibes}
            >
              <Share2 size={24} className="text-gray-400" />
            </button>
            
            {/* Save Button */}
            <button 
              onClick={handleSave} 
              className="transition hover:scale-110 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
              aria-label={isSaved ? "Unsave post" : "Save post"}
              disabled={!isAuthenticated || isJustVibes}
            >
              <Bookmark className={isSaved ? "fill-blue-500 text-blue-500" : "text-gray-400"} size={24} />
            </button>

            {/* Download Button - visible only for subscribers (Basic+) */}
            {((userTier === 'basic' || userTier === 'premium' || userTier === 'gold') && (hasPurchased || post.contentType !== 'direct_purchase')) && (
              <button onClick={handleDownload} className="transition hover:scale-110 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2" aria-label="Download">
                <Download size={24} className="text-gray-400" />
              </button>
            )}
          </div>
          
          {/* Content Type Badge */}
          {post.contentType !== 'free' && (
            <div className="flex items-center gap-1">
              {post.contentType === 'subscriber' && (
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full flex items-center gap-1">
                  <Crown size={12} /> Subscriber
                </span>
              )}
              {post.contentType === 'direct_purchase' && (
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1">
                  <DollarSign size={12} /> Direct Purchase
                </span>
              )}
              {post.contentType === 'creator_page_only' && (
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1">
                  <Eye size={12} /> Page Only
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Title and Caption */}
        {post.title && (
          <h3 className="text-white font-semibold mt-2">{post.title}</h3>
        )}
        <div className="mt-1">
          <span className="font-semibold text-white mr-2">{post.creator.artistName || post.creator.fullName}</span>
          <span className="text-gray-300">{post.caption}</span>
        </div>
        
        {/* Upgrade Prompt for Just VIBES */}
        {isJustVibes && (
          <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500 rounded-lg flex items-center justify-between">
            <span className="text-xs text-purple-400">30-second preview only</span>
            <Link href="/signup" className="text-xs text-purple-400 hover:text-purple-300 underline">
              Become a VIBER →
            </Link>
          </div>
        )}
      </div>
    </div>

    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      feature={upgradeFeature}
      message="Download content to enjoy offline, anytime, anywhere."
    />
    </>
  );
};

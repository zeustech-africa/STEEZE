"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload,
  Edit3,
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  Palette,
} from "lucide-react";
import HeroSection from "@/components/creator/HeroSection";
import BioSection from "@/components/creator/BioSection";
import PhotoGallery from "@/components/creator/PhotoGallery";
import MusicLibrary from "@/components/creator/MusicLibrary";
import VideoLibrary from "@/components/creator/VideoLibrary";
import PostsSection from "@/components/creator/PostsSection";
import EventsSection from "@/components/creator/EventsSection";
import VIPSection from "@/components/creator/VIPSection";
import SocialLinks from "@/components/creator/SocialLinks";
import FloatingMusicPlayer from "@/components/creator/FloatingMusicPlayer";
import AnalyticsPanel from "@/components/creator/AnalyticsPanel";
import UploadModal from "@/components/creator/UploadModal";
import EditProfileModal from "@/components/creator/EditProfileModal";

// Template CSS class map
const templateClasses: Record<string, string> = {
  classic: "template-classic",
  premium: "template-premium",
  feminine: "template-feminine",
  muscular: "template-muscular",
  minimal: "template-minimal",
};

export default function CreatorProfilePage() {
  const params = useParams();
  const username = Array.isArray(params?.username)
    ? params.username[0]
    : params?.username ?? "";

  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [previewAsFan, setPreviewAsFan] = useState(false);
  const [template, setTemplate] = useState("classic");

  useEffect(() => {
    if (!username) return;

    const fetchCreator = async () => {
      try {
        const res = await fetch(`/api/creators/${username}`);
        const data = await res.json();
        if (!data?.success) {
          setCreator(null);
          return;
        }
        setCreator(data.creator);
        setTemplate(data.creator.template || "classic");

        // Check current user
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            setIsCreator(
              user.username === username || user.artistName === username
            );
            setSubscriptionTier(user.subscriptionTier || null);
            setIsSubscribed(
              !!user.subscriptionTier && user.subscriptionTier !== "free"
            );
          }
        } catch {
          // Not logged in
        }
      } catch {
        console.error("Failed to fetch creator");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentlyPlayed = async () => {
      try {
        const res = await fetch("/api/vibes/recently-played", {
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        setRecentlyPlayed(data.recentlyPlayed || []);
      } catch {
        // Not critical, silently fail
      }
    };

    fetchCreator();
    fetchRecentlyPlayed();
  }, [username]);

  // Custom cursor effect
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--y", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold text-xl animate-pulse">Loading STEEZE...</div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60 text-lg">Creator not found</div>
      </div>
    );
  }

  // Template-specific content container class
  const getTemplateClasses = () => {
    switch (template) {
      case "premium":
        return "border-x border-gold/10";
      case "feminine":
        return "border-x border-pink-500/10";
      case "muscular":
        return "border-x border-blue-500/10";
      case "minimal":
        return "";
      case "classic":
      default:
        return "border-x border-white/5";
    }
  };

  return (
    <main className={`min-h-screen bg-black ${templateClasses[template] || ""}`}>
      {/* Custom Cursor */}
      <div className="hidden md:block fixed w-8 h-8 rounded-full border-2 border-gold pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-100"
        style={{ left: "var(--x, 0)", top: "var(--y, 0)" }}
      />

      {/* Hero Section */}
      <HeroSection creator={creator} isCreator={isCreator && !previewAsFan} />

      {/* Action Buttons */}
      <div className={`container mx-auto max-w-6xl px-4 py-6 flex flex-wrap gap-4 justify-between items-center ${getTemplateClasses()}`}>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg hover:shadow-gold/20 transition-all text-sm">
            {isSubscribed ? "Subscribed ✓" : "Subscribe"}
          </button>
          <button className="px-6 py-2.5 border border-white/20 text-white rounded-full hover:border-gold hover:text-gold transition-all text-sm">
            Follow
          </button>
        </div>

        {isCreator && !previewAsFan && (
          <div className="flex gap-2">
            {/* Template indicator */}
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40" title={`Template: ${template}`}>
              <Palette size={14} />
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/30 transition-all"
              title="Upload content"
            >
              <Upload size={18} />
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/30 transition-all"
              title="Edit profile"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={() => setShowAnalytics((p) => !p)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/30 transition-all"
              title="Analytics"
            >
              <BarChart3 size={18} />
            </button>
            {/* Preview as Fan toggle */}
            <button
              onClick={() => setPreviewAsFan((p) => !p)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                previewAsFan
                  ? "bg-gold/20 border border-gold text-gold"
                  : "bg-white/5 border border-white/10 text-white/60 hover:text-gold hover:border-gold/30"
              }`}
              title={previewAsFan ? "Exit preview" : "Preview as Fan"}
            >
              {previewAsFan ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}

        {/* Preview mode banner */}
        {previewAsFan && (
          <div className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gold/10 border border-gold/20 rounded-lg text-gold text-sm">
            <Eye size={16} />
            <span>Preview Mode — This is what your fans see</span>
            <button
              onClick={() => setPreviewAsFan(false)}
              className="ml-2 px-3 py-1 bg-gold text-black rounded-full text-xs font-semibold hover:bg-gold-dark transition-colors"
            >
              Exit Preview
            </button>
          </div>
        )}
      </div>

      {/* Analytics Panel */}
      {showAnalytics && isCreator && !previewAsFan && <AnalyticsPanel creator={creator} username={username as string} />}

      {/* Bio Section */}
      <div className={getTemplateClasses()}>
        <BioSection creator={creator} />
      </div>

      {/* Photo Gallery */}
      <div className={getTemplateClasses()}>
        <PhotoGallery photos={creator.galleryPhotos || []} />
      </div>

      {/* Music Library */}
      <div className={getTemplateClasses()}>
        <MusicLibrary
          songs={creator.songs || []}
          currentSong={currentSong}
          setCurrentSong={setCurrentSong}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          isSubscribed={isSubscribed}
          subscriptionTier={subscriptionTier}
        />
      </div>

      {/* Video Library */}
      <div className={getTemplateClasses()}>
        <VideoLibrary
          videos={creator.videos || []}
          isSubscribed={isSubscribed}
          subscriptionTier={subscriptionTier}
        />
      </div>

      {/* Posts Section */}
      <div className={getTemplateClasses()}>
        <PostsSection
          posts={creator.posts || []}
          isSubscribed={isSubscribed}
          subscriptionTier={subscriptionTier}
        />
      </div>

      {/* Events Section */}
      <div className={getTemplateClasses()}>
        <EventsSection events={creator.events || []} />
      </div>

      {/* VIP Section */}
      <div className={getTemplateClasses()}>
        <VIPSection
          vipContent={creator.vipContent || []}
          isSubscribed={isSubscribed}
          subscriptionTier={subscriptionTier}
        />
      </div>

      {/* Social Links */}
      <div className={getTemplateClasses()}>
        <SocialLinks links={creator.socialLinks || {}} />
      </div>

      {/* Recently Played Section */}
      {recentlyPlayed.length > 0 && (
        <section className={`container mx-auto max-w-6xl px-4 py-8 ${getTemplateClasses()}`}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-gold" />
            <h3 className="text-white font-semibold text-lg">Recently Played</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {recentlyPlayed.map((item: any) => (
              <Link
                key={item.id}
                href={`/post/${item.post?.id}`}
                className="flex-shrink-0 w-32 group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-1.5">
                  <Image
                    src={item.post?.thumbnail || item.post?.mediaUrl || "/images/auth-bg.jpg"}
                    alt={item.post?.title || ""}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all" />
                </div>
                <p className="text-white/70 text-sm truncate">{item.post?.title}</p>
                <p className="text-white/40 text-xs">
                  {item.playedAt
                    ? new Date(item.playedAt).toLocaleDateString()
                    : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Floating Music Player */}
      {currentSong && (
        <FloatingMusicPlayer
          song={currentSong}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      )}

      {/* Modals (hidden in preview mode) */}
      {!previewAsFan && (
        <>
          <UploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            creatorId={creator.id}
          />
          <EditProfileModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            creator={creator}
          />
        </>
      )}
    </main>
  );
}
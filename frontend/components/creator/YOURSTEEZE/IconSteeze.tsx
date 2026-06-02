"use client";

import { useState, useEffect } from "react";
import FollowersModal from "../../profile/FollowersModal";
import FollowingModal from "../../profile/FollowingModal";
import UserActionsMenu from "../../profile/UserActionsMenu";
import {
  Home,
  Search,
  Upload,
  Bell,
  MessageCircle,
  Settings,
  User,
  Crown,
  Heart,
  MessageSquare,
  Share2,
  Download,
  Play,
  Pause,
  MapPin,
  Calendar,
  Edit3,
  Ticket,
  Music,
  Apple,
  Mic,
  Film,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Plus,
  Check,
  X,
  Globe,
  AtSign,
  BarChart3,
  ListMusic,
  Pin,
  Wallet as WalletIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import EditSongModal from "../EditSongModal";
import EditVideoModal from "../EditVideoModal";
import EditPhotoModal from "../EditPhotoModal";
import EditEventModal from "../EditEventModal";
import EditBTSModal from "../EditBTSModal";
import UploadModal from "../UploadModal";
import AddEventModal from "../AddEventModal";
import AddBTSModal from "../AddBTSModal";
import ReportButton from "../../ReportButton";
import PinButton from "../PinButton";

interface IconTemplateProps {
  creator: {
    id: string;
    artistName: string;
    tagline?: string;
    shortBio?: string;
    fullBio?: string;
    followerCount?: number;
    followingCount?: number;
    totalLikes?: number;
    profilePicUrl?: string;
    coverPhotoUrl?: string;
    coverVideoUrl?: string;
    socialLinks?: {
      instagram?: string;
      tiktok?: string;
      youtube?: string;
      spotify?: string;
      appleMusic?: string;
      twitter?: string;
    };
    songs?: Array<{
      id: string;
      title: string;
      duration?: string;
      plays?: number;
      likes?: number;
      comments?: number;
      mediaUrl: string;
      coverArtUrl?: string;
    }>;
    videos?: Array<{
      id: string;
      title: string;
      views?: number;
      likes?: number;
      comments?: number;
      thumbnailUrl?: string;
      mediaUrl: string;
    }>;
    galleryPhotos?: Array<{
      id: string;
      imageUrl: string;
      story?: string;
      likes?: number;
      comments?: number;
    }>;
    events?: Array<{
      id: string;
      city: string;
      date: string;
      venue: string;
      ticketLink?: string;
    }>;
    btsContent?: Array<{
      id: string;
      title: string;
      description: string;
      date: string;
      likes?: number;
      comments?: number;
      mediaUrl?: string;
    }>;
    userType?: string;
    isVerified?: boolean;
  };
  isCreator?: boolean;
  previewAsFan?: boolean;
  followStatus?: { isFollowing: boolean };
  onFollow?: () => void;
  isFollowLoading?: boolean;
}

export default function IconTemplate({ creator: initialCreator, isCreator, previewAsFan, followStatus, onFollow, isFollowLoading }: IconTemplateProps) {
  const [creator, setCreator] = useState(initialCreator);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUploadSuccess = (newContent: any) => {
    if (newContent.type === "audio" || newContent.type === "music") {
      setCreator((prev: any) => ({
        ...prev,
        songs: [newContent, ...(prev.songs || [])]
      }));
    } else if (newContent.type === "video") {
      setCreator((prev: any) => ({
        ...prev,
        videos: [newContent, ...(prev.videos || [])]
      }));
    } else if (newContent.type === "photo") {
      setCreator((prev: any) => ({
        ...prev,
        galleryPhotos: [newContent, ...(prev.galleryPhotos || [])]
      }));
    }
  };
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showEditSongModal, setShowEditSongModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showEditVideoModal, setShowEditVideoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showEditPhotoModal, setShowEditPhotoModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [selectedBTS, setSelectedBTS] = useState<any>(null);
  const [showEditBTSModal, setShowEditBTSModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddBTSModal, setShowAddBTSModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<any[]>([]);

  // Sync with prop changes
  useEffect(() => {
    setCreator(initialCreator);
    // Get current user ID from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id || payload.userId || "");
      } catch {}
    }
  }, [initialCreator]);

  // Fetch playlists for vibers
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (creator.userType === "vibes") {
        try {
          const token = localStorage.getItem("token");
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
          const response = await fetch(`${API_URL}/api/playlists`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok) {
            setPlaylists(data.playlists || []);
          }
        } catch (error) {
          console.error("Fetch playlists error:", error);
        }
      }
    };
    fetchPlaylists();
  }, [creator.id, creator.userType]);

  // Fetch pinned posts
  const fetchPinnedPosts = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/pinned/${creator.id}`);
      const data = await response.json();
      if (response.ok) {
        setPinnedPosts(data.pinnedPosts || []);
      }
    } catch (error) {
      console.error("Fetch pinned posts error:", error);
    }
  };

  useEffect(() => {
    if (creator.id) {
      fetchPinnedPosts();
    }
  }, [creator.id]);

  const handleShowFollowers = () => setShowFollowersModal(true);
  const handleShowFollowing = () => setShowFollowingModal(true);

  // Helper to format numbers (K, M)
  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Get social links with defaults
  const socialLinks = creator.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some(link => link);

  // Get songs (up to 3 for display)
  const displaySongs = creator.songs?.slice(0, 3) || [];
  const hasSongs = displaySongs.length > 0;

  // Get videos (up to 4 for display)
  const displayVideos = creator.videos?.slice(0, 4) || [];
  const hasVideos = displayVideos.length > 0;

  // Get gallery photos (up to 6 for display)
  const displayPhotos = creator.galleryPhotos?.slice(0, 6) || [];
  const hasPhotos = displayPhotos.length > 0;

  // Get events (up to 4 for display)
  const displayEvents = creator.events?.slice(0, 4) || [];
  const hasEvents = displayEvents.length > 0;

  // Get BTS content (up to 4 for display)
  const displayBTS = creator.btsContent?.slice(0, 4) || [];
  const hasBTS = displayBTS.length > 0;

  // Song edit/delete handlers
  const handleSongUpdate = (updatedSong: any) => {
    setCreator({
      ...creator,
      songs: creator.songs?.map((s: any) =>
        s.id === updatedSong.id ? updatedSong : s
      ) || [],
    });
  };

  const handleSongDelete = (songId: string) => {
    setCreator({
      ...creator,
      songs: creator.songs?.filter((s: any) => s.id !== songId) || [],
    });
  };

  // Video edit/delete handlers
  const handleVideoUpdate = (updatedVideo: any) => {
    setCreator({
      ...creator,
      videos: creator.videos?.map((v: any) =>
        v.id === updatedVideo.id ? updatedVideo : v
      ) || [],
    });
  };

  const handleVideoDelete = (videoId: string) => {
    setCreator({
      ...creator,
      videos: creator.videos?.filter((v: any) => v.id !== videoId) || [],
    });
  };

  // Photo edit/delete handlers
  const handlePhotoUpdate = (updatedPhoto: any) => {
    setCreator({
      ...creator,
      galleryPhotos: creator.galleryPhotos?.map((p: any) =>
        p.id === updatedPhoto.id ? updatedPhoto : p
      ) || [],
    });
  };

  const handlePhotoDelete = (photoId: string) => {
    setCreator({
      ...creator,
      galleryPhotos: creator.galleryPhotos?.filter((p: any) => p.id !== photoId) || [],
    });
  };

  const handleEventUpdate = (updatedEvent: any) => {
    setCreator({
      ...creator,
      events: creator.events?.map((e: any) =>
        e.id === updatedEvent.id ? updatedEvent : e
      ) || [],
    });
  };

  const handleEventDelete = (eventId: string) => {
    setCreator({
      ...creator,
      events: creator.events?.filter((e: any) => e.id !== eventId) || [],
    });
  };

  // BTS edit/delete handlers
  const handleBTSUpdate = (updatedBTS: any) => {
    setCreator({
      ...creator,
      btsContent: creator.btsContent?.map((b: any) =>
        b.id === updatedBTS.id ? updatedBTS : b
      ) || [],
    });
  };

  const handleBTSDelete = (btsId: string) => {
    setCreator({
      ...creator,
      btsContent: creator.btsContent?.filter((b: any) => b.id !== btsId) || [],
    });
  };

  // Add event/BTS handlers
  const handleAddEvent = (newEvent: any) => {
    setCreator({
      ...creator,
      events: [...(creator.events || []), newEvent]
    });
  };

  const handleAddBTS = (newBTS: any) => {
    setCreator({
      ...creator,
      btsContent: [...(creator.btsContent || []), newBTS]
    });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* ============================================
          TOP NAVIGATION BAR
          ============================================ */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-gold text-xl font-bold hover:opacity-80 transition-opacity">
              STEEZE
            </Link>
            
            {/* Navigation Icons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="p-2 text-white/70 hover:text-gold transition-colors focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2" aria-label="Home">
                <Home size={20} />
              </Link>
              <Link href="/search" className="p-2 text-white/70 hover:text-gold transition-colors focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2" aria-label="Search">
                <Search size={20} />
              </Link>
              {isCreator && !previewAsFan && (
                <button onClick={() => setShowUploadModal(true)} className="p-2 text-white/70 hover:text-gold transition-colors focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2" aria-label="Upload">
                  <Upload size={20} />
                </button>
              )}
              <Link href="/notifications" className="p-2 text-white/70 hover:text-gold transition-colors focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2" aria-label="Notifications">
                <Bell size={20} />
              </Link>
              <Link href="/inbox" className="p-2 text-white/70 hover:text-gold transition-colors focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2" aria-label="Messages">
                <MessageCircle size={20} />
              </Link>
              <Link href="/settings" className="p-2 text-white/70 hover:text-gold transition-colors focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2" aria-label="Settings">
                <Settings size={20} />
              </Link>
              {isCreator && !previewAsFan && (
                <Link
                  href={`/creator/${creator.artistName?.toLowerCase().replace(/\s/g, '')}/analytics`}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/30 transition-all focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
                  title="Analytics"
                >
                  <BarChart3 size={18} />
                </Link>
              )}
              {isCreator && !previewAsFan && (
                <Link
                  href={`/creator/${creator.artistName?.toLowerCase().replace(/\s/g, '')}/wallet`}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/30 transition-all focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
                  title="Wallet"
                >
                  <WalletIcon size={18} />
                </Link>
              )}
              <Link href="/profile" className="p-2 text-white/70 hover:text-gold transition-colors focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2" aria-label="Profile">
                <User size={20} />
              </Link>
              <Link href="/vip" className="px-3 py-1 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full text-sm hover:shadow-lg transition-all focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2">
                VIP
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-white/70 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2">
              <span className="sr-only">Menu</span>
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative py-16 md:py-24 lg:py-32">
        {/* Cover Image/Video Background */}
        {creator.coverVideoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            src={creator.coverVideoUrl}
          />
        ) : creator.coverPhotoUrl ? (
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={creator.coverPhotoUrl}
              alt="Cover"
              fill
              className="object-cover opacity-30"
            />
          </div>
        ) : null}
        
        <div className="relative container mx-auto max-w-7xl px-4 text-center">
          {/* Profile Picture (Optional - acts as logo) */}
          {creator.profilePicUrl && (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-6 overflow-hidden border-2 border-gold">
              <Image
                src={creator.profilePicUrl}
                alt={creator.artistName}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Large Bold Name */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white tracking-tight mb-4">
            {creator.artistName || "ARTIST NAME"}
          </h1>
          
          {/* Tagline */}
          {creator.tagline && (
            <p className="text-gold text-lg md:text-xl lg:text-2xl mb-3">
              {creator.tagline}
            </p>
          )}
          
          {/* Descriptor (Short Bio) */}
          {creator.shortBio && (
            <p className="text-white/60 text-base md:text-lg italic mb-8 max-w-2xl mx-auto">
              "{creator.shortBio}"
            </p>
          )}
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button className="px-6 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg hover:shadow-gold/20 transition-all focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2">
              Subscribe
            </button>
            <button className="px-6 py-2.5 border border-white/20 text-white rounded-full hover:border-gold hover:text-gold transition-all focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2">
              Follow
            </button>
            <button className="px-6 py-2.5 border border-white/20 text-white rounded-full hover:border-gold hover:text-gold transition-all focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2">
              Message
            </button>
            {!isCreator && !previewAsFan && currentUserId && (
              <UserActionsMenu
                userId={currentUserId}
                targetUserId={creator.id}
                targetUserName={creator.artistName || "User"}
              />
            )}
            <button 
              onClick={() => setShowShareModal(true)}
              className="px-6 py-2.5 border border-white/20 text-white rounded-full hover:border-gold hover:text-gold transition-all focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
            >
              Share
            </button>
          </div>
        </div>
      </section>

      {/* ============================================
          STATS BAR
          ============================================ */}
      <section className="border-y border-white/10 py-6">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <button
              onClick={handleShowFollowers}
              className="text-center hover:scale-105 transition-transform"
              aria-label="View followers"
            >
              <div className="text-2xl md:text-3xl font-bold text-white">{formatNumber(creator.followerCount)}</div>
              <div className="text-white/50 text-sm">Followers</div>
            </button>
            <button
              onClick={handleShowFollowing}
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
          </div>
        </div>
      </section>

      {/* ============================================
          PINNED POSTS SECTION
          ============================================ */}
      {pinnedPosts.length > 0 && (
        <section className="py-8 bg-gold/5 border-y border-gold/20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center gap-2 mb-6">
              <Pin size={20} className="text-gold" />
              <h2 className="text-white font-semibold text-lg">Pinned Posts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinnedPosts.map((post: any) => (
                <div key={post.id} className="bg-white/5 rounded-xl border border-gold/30 p-4 hover:border-gold/50 transition-all group relative">
                  <div className="absolute top-2 right-2">
                    <Pin size={14} className="text-gold" />
                  </div>
                  <div className="flex items-start justify-between mb-2 pr-6">
                    <h3 className="text-white font-medium text-sm">{post.title || "Untitled Post"}</h3>
                  </div>
                  {post.description && (
                    <p className="text-white/50 text-xs line-clamp-2 mb-3">{post.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-white/40 text-xs">
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {post.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} /> {post.comments || 0}
                    </span>
                  </div>
                  {isCreator && !previewAsFan && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <PinButton 
                        postId={post.id} 
                        isPinned={true} 
                        onPinChange={() => {
                          fetchPinnedPosts();
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          ABOUT SECTION
          ============================================ */}
      {creator.fullBio && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">About {creator.artistName}</h2>
            <div className="bg-white/5 rounded-2xl p-6 md:p-8 border border-white/10">
              <p className="text-white/70 leading-relaxed text-center whitespace-pre-line">
                {creator.fullBio}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          CONNECT / SOCIAL LINKS
          ============================================ */}
      {hasSocialLinks && (
        <section className="py-8">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex flex-wrap justify-center gap-6">
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-gold transition-colors">
                  <Camera size={24} />
                </a>
              )}
              {socialLinks.tiktok && (
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-gold transition-colors">
                  <Music size={24} />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-gold transition-colors">
                  <Film size={24} />
                </a>
              )}
              {socialLinks.spotify && (
                <a href={socialLinks.spotify} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-gold transition-colors">
                  <Music size={24} />
                </a>
              )}
              {socialLinks.appleMusic && (
                <a href={socialLinks.appleMusic} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-gold transition-colors">
                  <Apple size={24} />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-gold transition-colors">
                  <AtSign size={24} />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          LATEST MUSIC SECTION
          ============================================ */}
      <section className="py-12">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">Latest Music</h2>
          {hasSongs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displaySongs.map((song) => (
                <div key={song.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-gold/30 transition-all group relative">
                  {/* Edit button (creator only) */}
                  {isCreator && !previewAsFan && (
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button
                        onClick={() => {
                          setSelectedSong(song);
                          setShowEditSongModal(true);
                        }}
                        className="p-1.5 bg-black/50 rounded-lg text-white/70 hover:text-gold transition-all"
                        title="Edit song"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                  <div className="aspect-square bg-gradient-to-br from-gold/20 to-black rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    {song.coverArtUrl ? (
                      <Image src={song.coverArtUrl} alt={song.title} fill className="object-cover" />
                    ) : (
                      <Music size={48} className="text-gold/50" />
                    )}
                    <button 
                      onClick={() => {
                        setCurrentSong(song);
                        setIsPlaying(!isPlaying);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isPlaying && currentSong?.id === song.id ? (
                        <Pause size={32} className="text-gold" />
                      ) : (
                        <Play size={32} className="text-gold" />
                      )}
                    </button>
                  </div>
                  <h3 className="text-white font-semibold truncate">{song.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gold hover:bg-gold/20 rounded-full transition-all">
                        <Play size={16} />
                      </button>
                      <button className="p-1 text-white/50 hover:text-gold transition-all">
                        <Download size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 text-white/40 text-xs hover:text-red-400 transition-colors">
                        <Heart size={14} /> {formatNumber(song.likes)}
                      </button>
                      <button className="flex items-center gap-1 text-white/40 text-xs hover:text-gold transition-colors">
                        <MessageSquare size={14} /> {formatNumber(song.comments)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <Music size={48} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/40">No music uploaded yet</p>
              {isCreator && !previewAsFan && (
                <button onClick={() => setShowUploadModal(true)} className="mt-4 px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm hover:bg-gold/30 transition-all">
                  + Upload Your First Song
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ============================================
          MUSIC VIDEOS SECTION
          ============================================ */}
      <section className="py-12 bg-white/5">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">Music Videos</h2>
          {hasVideos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayVideos.map((video) => (
                <div key={video.id} className="bg-black/50 rounded-xl overflow-hidden border border-white/10 hover:border-gold/30 transition-all group">
                  {/* Edit button (creator only) */}
                  {isCreator && !previewAsFan && (
                    <button
                      onClick={() => {
                        setSelectedVideo(video);
                        setShowEditVideoModal(true);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white/70 hover:text-gold transition-all z-10"
                      title="Edit video"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                  <div className="aspect-video bg-gradient-to-br from-gold/20 to-black flex items-center justify-center relative">
                    {video.thumbnailUrl ? (
                      <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
                    ) : (
                      <Film size={32} className="text-gold/50" />
                    )}
                    <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={32} className="text-gold" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-semibold text-sm truncate">{video.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-white/40 text-xs">{formatNumber(video.views)} views</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-white/40 text-xs">
                          <Heart size={12} /> {formatNumber(video.likes)}
                        </span>
                        <span className="flex items-center gap-1 text-white/40 text-xs">
                          <MessageSquare size={12} /> {formatNumber(video.comments)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-black/50 rounded-xl border border-white/10">
              <Film size={48} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/40">No videos uploaded yet</p>
              {isCreator && !previewAsFan && (
                <button onClick={() => setShowUploadModal(true)} className="mt-4 px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm hover:bg-gold/30 transition-all">
                  + Upload Your First Video
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ============================================
          PHOTO GALLERY
          ============================================ */}
      <section className="py-12">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">Photo Gallery</h2>
          {hasPhotos ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {displayPhotos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-gold/50 transition-all cursor-pointer">
                  {/* Edit button (creator only) */}
                  {isCreator && !previewAsFan && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhoto(photo);
                        setShowEditPhotoModal(true);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white/70 hover:text-gold transition-all z-10 opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                  <Image src={photo.imageUrl} alt={photo.story || "Gallery photo"} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-white text-xs">
                        <Heart size={12} /> {formatNumber(photo.likes)}
                      </span>
                      <span className="flex items-center gap-1 text-white text-xs">
                        <MessageSquare size={12} /> {formatNumber(photo.comments)}
                      </span>
                    </div>
                    {photo.story && (
                      <p className="text-white/80 text-xs mt-1 text-center px-1 line-clamp-2">{photo.story}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <Camera size={48} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/40">No photos uploaded yet</p>
              {isCreator && !previewAsFan && (
                <button onClick={() => setShowUploadModal(true)} className="mt-4 px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm hover:bg-gold/30 transition-all">
                  + Upload Your First Photo
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ============================================
          ON TOUR / EVENTS SECTION
          ============================================ */}
      <section className="py-12 bg-white/5">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center">On Tour</h2>
            {isCreator && !previewAsFan && hasEvents && (
              <button
                onClick={() => setShowAddEventModal(true)}
                className="px-3 py-1 bg-gold/20 text-gold rounded-lg text-sm hover:bg-gold/30 transition-all"
              >
                + Add Event
              </button>
            )}
          </div>
          {hasEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {displayEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-gold" />
                      <div>
                        <p className="text-white font-medium">{event.city}</p>
                        <p className="text-white/40 text-sm">{event.date} • {event.venue}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.ticketLink ? (
                        <a href={event.ticketLink} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-gold/20 text-gold text-sm rounded-full hover:bg-gold/30 transition-all">
                          Tickets
                        </a>
                      ) : (
                        <button className="px-4 py-1.5 bg-gold/20 text-gold text-sm rounded-full hover:bg-gold/30 transition-all">
                          Tickets
                        </button>
                      )}
                      {isCreator && !previewAsFan && (
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEditEventModal(true);
                          }}
                          className="p-1.5 bg-black/50 rounded-lg text-white/70 hover:text-gold transition-all"
                          aria-label="Edit event"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                <h3 className="text-gold font-semibold mb-2">🎟️ Tour Information</h3>
                <p className="text-white/60 text-sm mb-4">Subscribe for presale codes and VIP package access.</p>
                <button className="w-full py-2 bg-gold/20 text-gold rounded-lg text-sm font-semibold hover:bg-gold/30 transition-all">
                  Get Tour Alerts
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

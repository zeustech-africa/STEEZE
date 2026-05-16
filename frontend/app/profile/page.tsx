"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Grid,
  LogOut,
  Crown,
  Repeat,
  Clock,
} from "lucide-react";
import BottomNav from "../../components/layout/BottomNav";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"reposts" | "liked" | "recentlyPlayed">("reposts");
  const [reposts, setReposts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    const token = localStorage.getItem("token");
    try {
      const [repostsRes, likedRes, recentlyPlayedRes] = await Promise.all([
        fetch("/api/posts/user/reposts", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }),
        fetch("/api/posts/user/liked", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }),
        fetch("/api/vibes/recently-played", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }),
      ]);

      const [repostsData, likedData, recentlyPlayedData] = await Promise.all([
        repostsRes.json(),
        likedRes.json(),
        recentlyPlayedRes.ok ? recentlyPlayedRes.json() : Promise.resolve({ success: false }),
      ]);

      if (repostsData.success) setReposts(repostsData.reposts || []);
      if (likedData.success) setLikedPosts(likedData.posts || []);
      if (recentlyPlayedData.success) setRecentlyPlayed(recentlyPlayedData.recentlyPlayed || []);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-gold">Loading...</div>
      </div>
    );
  }

  const isCreator = user.role === "creator";

  const displayContent = () => {
    if (activeTab === "reposts") return reposts;
    if (activeTab === "liked") return likedPosts;
    return recentlyPlayed;
  };

  const content = displayContent();

  return (
    <div className="min-h-screen bg-black pt-12 pb-20 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gold">Profile</h1>
          <button
            onClick={handleLogout}
            aria-label="Log out of account"
            className="p-2 bg-white/10 rounded-full text-white/50 hover:text-red-500 transition-all"
          >
            <LogOut size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Avatar & Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={user.profilePicUrl || "/icons/steeze-icon-square.png"}
                alt={`Profile picture of ${user.artistName || user.username}`}
                fill
                className="object-cover"
              />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">
              {user.artistName || user.username}
            </h2>
            <p className="text-white/50">@{user.username}</p>
            {user.subscriptionTier === "gold" && (
              <p className="text-gold text-xs flex items-center gap-1 mt-1">
                <Crown size={12} /> Gold Member
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="text-center">
            <p className="text-white font-bold">{user.followerCount || 0}</p>
            <p className="text-white/40 text-sm">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{user.followingCount || 0}</p>
            <p className="text-white/40 text-sm">Following</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{reposts.length}</p>
            <p className="text-white/40 text-sm">Reposts</p>
          </div>
        </div>

        {/* Settings/Edit Button */}
        {isCreator ? (
          <Link
            href="/settings"
            className="block w-full mb-6 py-2 bg-gold text-black rounded-full text-center font-semibold"
          >
            Edit Profile
          </Link>
        ) : (
          <button
            onClick={() => router.push("/become-creator")}
            className="block w-full mb-6 py-2 border border-gold text-gold rounded-full text-center font-semibold hover:bg-gold hover:text-black transition-all"
          >
            Switch to Creator
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-3 border-b border-white/10 mb-4">
          <button
            onClick={() => setActiveTab("reposts")}
            aria-label="Show reposts"
            aria-pressed={activeTab === "reposts"}
            className={`flex items-center gap-2 pb-2 px-4 transition-all ${
              activeTab === "reposts"
                ? "border-b-2 border-gold text-gold"
                : "text-white/50"
            }`}
          >
            <Repeat size={18} aria-hidden="true" /> Reposts
          </button>
          <button
            onClick={() => setActiveTab("liked")}
            aria-label="Show liked posts"
            aria-pressed={activeTab === "liked"}
            className={`flex items-center gap-2 pb-2 px-4 transition-all ${
              activeTab === "liked"
                ? "border-b-2 border-gold text-gold"
                : "text-white/50"
            }`}
          >
            <Heart size={18} aria-hidden="true" /> Liked
          </button>
          <button
            onClick={() => setActiveTab("recentlyPlayed")}
            aria-label="Show recently played"
            aria-pressed={activeTab === "recentlyPlayed"}
            className={`flex items-center gap-2 pb-2 px-4 transition-all ${
              activeTab === "recentlyPlayed"
                ? "border-b-2 border-gold text-gold"
                : "text-white/50"
            }`}
          >
            <Clock size={18} aria-hidden="true" /> Recently Played
          </button>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-gold">Loading...</div>
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-12">
            {activeTab === "reposts" ? (
              <Repeat className="mx-auto text-white/40 mb-4" size={48} />
            ) : activeTab === "liked" ? (
              <Heart className="mx-auto text-white/40 mb-4" size={48} />
            ) : (
              <Clock className="mx-auto text-white/40 mb-4" size={48} />
            )}
            <p className="text-white/50">
              {activeTab === "reposts"
                ? "No reposts yet. Save content you love to see it here!"
                : activeTab === "liked"
                ? "No liked posts yet"
                : "No recently played tracks"}
            </p>
          </div>
        ) : activeTab === "recentlyPlayed" ? (
          <div className="space-y-2">
            {content.map((item: any) => (
              <Link
                key={item.id}
                href={`/post/${item.id}`}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
              >
                <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={item.thumbnail || item.mediaUrl || "/images/auth-bg.jpg"}
                    alt={item.title || "Track"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  <p className="text-white/40 text-xs">
                    {item.creator?.artistName || item.creator?.username || "Unknown"}
                  </p>
                </div>
                <span className="text-white/30 text-xs flex-shrink-0">
                  {item.playedAt ? new Date(item.playedAt).toLocaleDateString() : ""}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {content.map((item: any) => (
              <Link
                key={item.repostId || item.id}
                href={`/post/${item.id}`}
                className="relative aspect-square group overflow-hidden rounded-sm"
              >
                <Image
                  src={
                    item.thumbnail ||
                    item.mediaUrl ||
                    "/images/auth-bg.jpg"
                  }
                  alt={item.title || "Post thumbnail"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                {activeTab === "reposts" && item.attribution && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-white/80 p-1 truncate">
                    {item.attribution}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav isCreator={isCreator} onUploadClick={() => {}} />
    </div>
  );
}
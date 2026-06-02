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
  Music,
  ListMusic,
} from "lucide-react";
import BottomNav from "../../components/layout/BottomNav";
import MessageButton from "../../components/MessageButton";
import { SubscriptionBadge } from "../../components/SubscriptionBadge";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"reposts" | "liked" | "recentlyPlayed">("reposts");
  const [reposts, setReposts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBioEditor, setShowBioEditor] = useState(false);
  const [bioText, setBioText] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);

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

  useEffect(() => {
    if (user?.bio) {
      setBioText(user.bio);
    }
  }, [user]);

  useEffect(() => {
    fetchPlaylists();
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

  const fetchPlaylists = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/playlists`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setPlaylists(data.playlists || []);
    } catch (error) {
      console.error("Fetch playlists error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const saveBio = async () => {
    setSavingBio(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/bio`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ bio: bioText })
      });
      if (response.ok) {
        const updatedUser = { ...user, bio: bioText };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setShowBioEditor(false);
      }
    } catch (error) {
      console.error("Save bio error:", error);
    } finally {
      setSavingBio(false);
    }
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
          <h1 className="text-2xl font-bold text-gold">YOUR STEEZE PAGE</h1>
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
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-white font-bold text-xl">
                {user.artistName || user.username}
              </h2>
              <SubscriptionBadge tier={user.subscriptionTier || 'free'} size="lg" />
            </div>
            <p className="text-white/50">@{user.username}</p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gold text-sm font-semibold uppercase tracking-wider">Bio</h3>
            <button
              onClick={() => setShowBioEditor(true)}
              className="text-white/50 hover:text-gold text-xs transition-all"
            >
              Edit
            </button>
          </div>
          {user?.bio ? (
            <p className="text-white/80 text-sm leading-relaxed">{user.bio}</p>
          ) : (
            <p className="text-white/40 text-sm italic">No bio yet. Click edit to add one.</p>
          )}
        </div>

        {/* Bio Editor Modal */}
        {showBioEditor && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
              <h3 className="text-white text-xl font-bold mb-4">Edit Bio</h3>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Tell your story... what music do you love? What creators inspire you?"
                rows={4}
                maxLength={150}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
              />
              <p className="text-white/40 text-xs text-right mt-1">{bioText.length}/150</p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowBioEditor(false)}
                  className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBio}
                  disabled={savingBio}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {savingBio ? "Saving..." : "Save Bio"}
                </button>
              </div>
            </div>
          </div>
        )}

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
            BUILD YOUR STEEZE
          </Link>
        ) : (
          <button
            onClick={() => router.push("/become-creator")}
            className="block w-full mb-6 py-2 border border-gold text-gold rounded-full text-center font-semibold hover:bg-gold hover:text-black transition-all"
          >
            Switch to Creator
          </button>
        )}

        {/* Message Button */}
        <div className="flex justify-center mb-6">
          <MessageButton userId={user.id} userName={user.fullName || user.artistName || user.username} />
        </div>

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

      {/* Playlists Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <ListMusic size={20} className="text-gold" /> My Playlists
          </h2>
          <Link href="/profile/playlists" className="text-gold text-sm hover:underline">
            View All →
          </Link>
        </div>
        {playlists.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 text-center">
            <Music size={32} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/50 mb-3">No playlists yet</p>
            <Link href="/profile/playlists" className="text-gold text-sm">
              Create your first playlist
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {playlists.slice(0, 4).map((playlist) => (
              <Link key={playlist.id} href={`/profile/playlists/${playlist.id}`} className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all">
                <div className="aspect-square bg-gradient-to-br from-gold/20 to-black rounded-lg flex items-center justify-center mb-2">
                  <Music size={24} className="text-gold/50" />
                </div>
                <p className="text-white font-medium text-sm truncate">{playlist.name}</p>
                <p className="text-white/40 text-xs">{playlist.songs?.length || 0} songs</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav isCreator={isCreator} onUploadClick={() => {}} />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Bookmark, Repeat, Play, Sparkles, RefreshCw } from "lucide-react";

export default function ForYouFeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchPosts = () => {
    fetch("/api/vibes/feed/for-you")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch((e) => console.error(e))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/feed/refresh`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Refresh error:", error);
    }
    fetchPosts();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold animate-pulse">Personalizing your feed...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-gold" size={24} />
            <h1 className="text-2xl font-bold text-gold">For You</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50"
            aria-label="Refresh feed"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50">Start liking and saving posts to personalize your feed</p>
            <Link href="/explore" className="inline-block mt-4 px-6 py-2 bg-gold text-black rounded-full">
              Explore Content
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={post.creator?.profilePicUrl || "/icons/steeze-icon-square.png"}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/creator/${post.creator?.artistName || post.creator?.username}`}
                      className="text-white font-semibold hover:text-gold"
                    >
                      {post.creator?.artistName}
                    </Link>
                    <p className="text-white/40 text-xs">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {post.type === "image" && (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <Image src={post.mediaUrl} alt={post.title} fill className="object-cover" />
                  </div>
                )}
                {post.type === "audio" && (
                  <div className="p-4 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-gold/20 flex items-center justify-center">
                        <Play className="text-gold" size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{post.title}</h3>
                        <p className="text-white/50 text-sm">{post.description}</p>
                      </div>
                    </div>
                  </div>
                )}
                {post.type === "text" && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-white/80">{post.content}</p>
                  </div>
                )}
                {post.type === "video" && (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10">
                  <button className="flex items-center gap-1 text-white/50 hover:text-red-500 transition-colors">
                    <Heart size={18} /> <span className="text-sm">{post.likes || 0}</span>
                  </button>
                  <button className="flex items-center gap-1 text-white/50 hover:text-gold transition-colors">
                    <MessageCircle size={18} /> <span className="text-sm">{post.comments || 0}</span>
                  </button>
                  <button className="flex items-center gap-1 text-white/50 hover:text-green-500 transition-colors">
                    <Repeat size={18} /> <span className="text-sm">{post.reposts || 0}</span>
                  </button>
                  <button className="flex items-center gap-1 text-white/50 hover:text-gold transition-colors">
                    <Bookmark size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Eye, Music, Laugh, Video, Sparkles, Drama, Flame, Users, TrendingUp } from "lucide-react";
import { AdBanner } from "@/components/ads/AdBanner";
import { useAuthStore } from "@/stores/authStore";

interface Creator {
  id: string;
  name: string;
  username: string;
  profilePicUrl: string;
  tagline: string;
  followerCount: number;
}

interface TrendingHashtag {
  tag: string;
  count: number;
}

const categories = [
  { id: "for-you", name: "For You", icon: Sparkles },
  { id: "music", name: "Music", icon: Music },
  { id: "comedy", name: "Comedy", icon: Laugh },
  { id: "dance", name: "Dance", icon: Video },
  { id: "drama", name: "Drama", icon: Drama },
  { id: "trending", name: "Trending", icon: Flame },
];

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const hashtagParam = searchParams.get("hashtag");
  const { user } = useAuthStore();
  
  const [activeCategory, setActiveCategory] = useState("for-you");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [recommendedCreators, setRecommendedCreators] = useState<Creator[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);

  // Get ad frequency based on subscription tier
  const userTier = user?.subscriptionTier;
  const getAdFrequency = (): number | null => {
    switch (userTier) {
      case 'gold': return null; // No ads
      case 'premium': return 20;
      case 'basic': return 12;
      default: return 8; // Free VIBES
    }
  };
  const adFrequency = getAdFrequency();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPosts();
    fetchRecommendedCreators();
    fetchTrendingHashtags();
  }, [activeCategory, page]);

  const fetchRecommendedCreators = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/discovery/recommended-creators`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (response.ok) setRecommendedCreators(data.creators || []);
    } catch (error) {
      console.error("Fetch recommended creators error:", error);
    }
  };

  const fetchTrendingHashtags = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hashtags/trending`);
      const data = await response.json();
      if (response.ok) setTrendingHashtags(data.trending || []);
    } catch (error) {
      console.error("Fetch trending hashtags error:", error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url =
        activeCategory === "trending"
          ? `/api/vibes/trending?page=${page}`
          : `/api/vibes/explore?category=${activeCategory}&page=${page}`;
      const res = await fetch(url);
      const data = await res.json();
      if (page === 1) setPosts(data.posts);
      else setPosts((prev) => [...prev, ...data.posts]);
    } catch (error) {
      console.error("Failed to fetch explore posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => setPage((prev) => prev + 1);

  return (
    <div className="min-h-screen bg-black pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gold mb-6">Explore</h1>

        {/* Trending Hashtags */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={20} className="text-gold" />
            <h2 className="text-white font-semibold text-lg">Trending Hashtags</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {trendingHashtags.map(({ tag, count }) => (
              <Link
                key={tag}
                href={`/explore?hashtag=${encodeURIComponent(tag)}`}
                className="px-4 py-2 bg-white/5 rounded-full text-gold text-sm hover:bg-white/10 transition-all"
              >
                #{tag} <span className="text-white/40 text-xs">{count}</span>
              </Link>
            ))}
            {trendingHashtags.length === 0 && (
              <p className="text-white/40 text-sm">No trending hashtags yet</p>
            )}
          </div>
        </div>

        {/* Recommended Creators */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Users size={20} className="text-gold" />
            <h2 className="text-white font-semibold text-lg">Recommended Creators</h2>
          </div>
          {recommendedCreators.length === 0 ? (
            <p className="text-white/40 text-sm">No recommendations yet. Start liking and following creators!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendedCreators.slice(0, 6).map((creator) => (
                <Link
                  key={creator.id}
                  href={`/creator/${creator.username || creator.name.toLowerCase().replace(/\s/g, '')}`}
                  className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-all"
                >
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-gold/20">
                    {creator.profilePicUrl ? (
                      <Image src={creator.profilePicUrl} alt={creator.name} width={80} height={80} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gold text-2xl">
                        {creator.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-white font-medium text-sm truncate">{creator.name}</p>
                  <p className="text-white/40 text-xs">{creator.followerCount?.toLocaleString() || 0} followers</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setPage(1);
                }}
                className={`px-5 py-2 rounded-full flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? "bg-gold text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <Icon size={16} /> {cat.name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post, idx) => {
            const showAdHere = adFrequency && (idx + 1) % adFrequency === 0 && idx !== posts.length - 1;
            return (
              <React.Fragment key={post.id}>
                <Link href={`/post/${post.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (idx + Math.floor(idx / (adFrequency || 8))) * 0.05 }}
                    className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                  >
                    <Image
                      src={post.thumbnail || post.mediaUrl || "/images/auth-bg.jpg"}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-all">
                      <p className="font-semibold text-sm truncate">{post.title}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Heart size={12} /> {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {post.views || 0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
                {showAdHere && (
                  <div className="col-span-2 md:col-span-3 lg:col-span-4">
                    <AdBanner position="explore" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-pulse text-gold">Loading...</div>
          </div>
        )}

        {/* Hashtag Search Results */}
        {hashtagParam && (
          <div className="mt-8 mb-8">
            <h2 className="text-white font-semibold text-lg mb-4">Posts with #{hashtagParam}</h2>
            <p className="text-white/40 text-sm">Showing posts tagged with #{hashtagParam}</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="px-6 py-2 border border-gold text-gold rounded-full hover:bg-gold hover:text-black transition-all"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
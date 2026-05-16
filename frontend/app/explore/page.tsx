"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Eye, Music, Laugh, Video, Sparkles, Drama, Flame } from "lucide-react";

const categories = [
  { id: "for-you", name: "For You", icon: Sparkles },
  { id: "music", name: "Music", icon: Music },
  { id: "comedy", name: "Comedy", icon: Laugh },
  { id: "dance", name: "Dance", icon: Video },
  { id: "drama", name: "Drama", icon: Drama },
  { id: "trending", name: "Trending", icon: Flame },
];

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState("for-you");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [activeCategory, page]);

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
          {posts.map((post, idx) => (
            <Link key={post.id} href={`/post/${post.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
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
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-pulse text-gold">Loading...</div>
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
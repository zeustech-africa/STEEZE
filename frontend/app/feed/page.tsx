"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import TopFeedSwitcher from "@/components/feed/TopFeedSwitcher";
import FeedCard from "@/components/feed/FeedCard";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeFeed, setActiveFeed] = useState("for-you");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchFeed();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [activeFeed]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feed/${activeFeed}?page=1&limit=10`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
  };

  const handleSave = async (postId: string) => {
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
    await fetch(`/api/posts/${postId}/save`, { method: "POST" });
  };

  const handleFollow = async (creatorId: string) => {
    await fetch(`/api/users/${creatorId}/follow`, { method: "POST" });
  };

  const handleSearchClick = () => {
    router.push("/search");
  };

  if (!user) return null;

  const isCreator = user.role === "creator";

  return (
    <div className="min-h-screen bg-black pb-20">
      <TopFeedSwitcher
        activeFeed={activeFeed}
        onFeedChange={setActiveFeed}
        onSearchClick={handleSearchClick}
      />
      
      <div className="container mx-auto max-w-2xl px-4">
        {loading ? (
          <div className="text-center py-8"><div className="animate-pulse text-gold">Loading...</div></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50">No posts yet. Follow some creators to see their content!</p>
          </div>
        ) : (
          posts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              isLiked={likedPosts.has(post.id)}
              isSaved={savedPosts.has(post.id)}
              onLike={() => handleLike(post.id)}
              onSave={() => handleSave(post.id)}
              onComment={() => router.push(`/post/${post.id}`)}
              onShare={() => navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)}
              onFollow={() => handleFollow(post.creatorId)}
              currentUserId={user?.id}
              isRepost={post.isRepost}
              repostedBy={post.repostedBy}
            />
          ))
        )}
      </div>

      <BottomNav isCreator={isCreator} onUploadClick={() => {}} />
    </div>
  );
}

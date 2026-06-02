"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import TopFeedSwitcher from "@/components/feed/TopFeedSwitcher";
import { FeedCard } from "@/components/feed/FeedCard";
import { AdBanner } from "@/components/ads/AdBanner";
import { useAdVisibility } from "@/hooks/useAdVisibility";
import { FeedCardSkeleton } from "@/components/ui/Skeleton";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeFeed, setActiveFeed] = useState("for-you");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAds } = useAdVisibility();

  // Get ad frequency based on subscription tier
  const userTier = user?.subscriptionTier;
  const getAdFrequency = (): number | null => {
    switch (userTier) {
      case 'gold': return null;
      case 'premium': return 20;
      case 'basic': return 12;
      default: return 8;
    }
  };
  const adFrequency = getAdFrequency();

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

  const isCreator = user?.role === "creator";

  // Render feed with tier-based ad frequency
  const renderFeedWithAds = () => {
    return posts.map((post, index) => {
      const showAd = adFrequency && showAds && index > 0 && index % adFrequency === 0;
      return (
        <React.Fragment key={post.id}>
          {showAd && <AdBanner />}
          <FeedCard post={post} onComment={() => router.push(`/post/${post.id}`)} />
        </React.Fragment>
      );
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <TopFeedSwitcher activeFeed={activeFeed} onFeedChange={setActiveFeed} onSearchClick={() => router.push("/search")} />

      <div className="container mx-auto max-w-2xl px-4">
        {loading && posts.length === 0 ? (
          <div className="max-w-2xl mx-auto py-4 px-4">
            <h1 className="text-2xl font-bold text-white mb-4">FOR YOU</h1>
            {[1, 2, 3].map((i) => (
              <FeedCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50">START YOUR VIBES - Follow creators to feel the energy</p>
          </div>
        ) : (
          renderFeedWithAds()
        )}
      </div>

      <BottomNav isCreator={isCreator} onUploadClick={() => {}} />
    </div>
  );
}
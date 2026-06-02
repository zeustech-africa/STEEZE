"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Following {
  id: string;
  fullName: string;
  username?: string;
  profilePicUrl?: string;
  userType: string;
  isFollowing: boolean;
}

export default function FollowingPage() {
  const router = useRouter();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowing, setUnfollowing] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/following`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error("Fetch following error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!confirm("Unfollow this user? You will no longer see their content in your feed.")) return;
    setUnfollowing(userId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/following/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setFollowing(following.filter(f => f.id !== userId));
      }
    } catch (error) {
      console.error("Unfollow error:", error);
    } finally {
      setUnfollowing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">Loading following...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-gold">
            ← Back
          </button>
          <h1 className="text-white text-2xl font-bold">Following</h1>
          <span className="text-gold text-sm">{following.length} following</span>
        </div>

        {following.length === 0 ? (
          <div className="text-center text-white/50 py-12">
            Not following anyone yet. Explore creators to follow!
          </div>
        ) : (
          <div className="space-y-3">
            {following.map((user) => (
              <div key={user.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                    {user.profilePicUrl ? (
                      <Image src={user.profilePicUrl} alt={user.fullName} width={48} height={48} className="object-cover" />
                    ) : (
                      <span className="text-gold text-xl">{user.fullName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{user.fullName}</p>
                    <p className="text-white/40 text-xs">{user.userType}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleUnfollow(user.id)}
                  disabled={unfollowing === user.id}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  {unfollowing === user.id ? "Unfollowing..." : "Unfollow"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
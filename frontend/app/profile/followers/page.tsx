"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Follower {
  id: string;
  fullName: string;
  username?: string;
  profilePicUrl?: string;
  userType: string;
  isFollowing: boolean;
}

export default function FollowersPage() {
  const router = useRouter();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchFollowers();
  }, []);

  const fetchFollowers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/followers`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setFollowers(data.followers || []);
      }
    } catch (error) {
      console.error("Fetch followers error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!confirm("Remove this follower? They will no longer see your content.")) return;
    setRemoving(followerId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/followers/${followerId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setFollowers(followers.filter(f => f.id !== followerId));
      }
    } catch (error) {
      console.error("Remove follower error:", error);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">Loading followers...</div>
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
          <h1 className="text-white text-2xl font-bold">Followers</h1>
          <span className="text-gold text-sm">{followers.length} followers</span>
        </div>

        {followers.length === 0 ? (
          <div className="text-center text-white/50 py-12">
            No followers yet. Share your profile to get noticed!
          </div>
        ) : (
          <div className="space-y-3">
            {followers.map((follower) => (
              <div key={follower.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                <Link href={`/profile/${follower.id}`} className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                    {follower.profilePicUrl ? (
                      <Image src={follower.profilePicUrl} alt={follower.fullName} width={48} height={48} className="object-cover" />
                    ) : (
                      <span className="text-gold text-xl">{follower.fullName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{follower.fullName}</p>
                    <p className="text-white/40 text-xs">{follower.userType}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemoveFollower(follower.id)}
                  disabled={removing === follower.id}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  {removing === follower.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
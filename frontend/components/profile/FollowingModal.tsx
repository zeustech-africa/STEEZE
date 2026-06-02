"use client";

import { useState, useEffect } from "react";
import { X, UserMinus, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface FollowingUser {
  id: string;
  fullName: string;
  username?: string;
  profilePicUrl?: string;
  userType: string;
  isFollowing: boolean;
  isCurrentUser: boolean;
}

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function FollowingModal({ isOpen, onClose, userId, userName }: FollowingModalProps) {
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowing();
    }
  }, [isOpen, userId]);

  const fetchFollowing = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/${userId}/following`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setFollowing(data.following || []);
      } else {
        setError(data.error || "Failed to load following");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!confirm("Unfollow this user? You will no longer see their content in your feed.")) return;

    setActionLoading(targetUserId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/${userId}/unfollow/${targetUserId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        setFollowing(following.filter(f => f.id !== targetUserId));
      }
    } catch (err) {
      console.error("Unfollow error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900 rounded-t-2xl">
          <h2 className="text-white text-xl font-bold">Following</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={32} className="text-gold animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">{error}</div>
          ) : following.length === 0 ? (
            <div className="text-center text-white/40 py-8">
              Not following anyone yet
            </div>
          ) : (
            <div className="space-y-3">
              {following.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                      {user.profilePicUrl ? (
                        <Image src={user.profilePicUrl} alt={user.fullName} width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-gold font-bold">{user.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.fullName}</p>
                      <p className="text-white/40 text-xs">{user.userType}</p>
                    </div>
                  </Link>
                  {!user.isCurrentUser && (
                    <button
                      onClick={() => handleUnfollow(user.id)}
                      disabled={actionLoading === user.id}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all disabled:opacity-50"
                    >
                      {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : "Unfollow"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
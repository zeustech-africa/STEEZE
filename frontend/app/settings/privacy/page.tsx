"use client";

import { useState, useEffect } from "react";
import { Shield, Users, CheckCircle, XCircle, UserMinus, Lock, Globe } from "lucide-react";

export default function PrivacySettingsPage() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/vibes/privacy")
      .then((r) => r.json())
      .then((d) => setIsPrivate(d.isPrivate || false))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchRequests();
    fetchFollowers();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/vibes/follower-requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {}
  };

  const fetchFollowers = async () => {
    try {
      const res = await fetch("/api/user/followers");
      const data = await res.json();
      setFollowers(data.followers || []);
    } catch {}
  };

  const handleToggle = async () => {
    const newValue = !isPrivate;
    setIsPrivate(newValue);
    await fetch("/api/vibes/privacy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPrivate: newValue }),
    });
  };

  const handleRequest = async (requestId: string, action: "approve" | "decline") => {
    await fetch(`/api/vibes/follower-requests/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchRequests();
    if (action === "approve") fetchFollowers();
  };

  const removeFollower = async (followerId: string) => {
    await fetch(`/api/vibes/followers/${followerId}`, {
      method: "DELETE",
    });
    fetchFollowers();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold animate-pulse">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gold mb-6 flex items-center gap-3">
          <Shield size={28} /> Privacy Settings
        </h1>

        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isPrivate ? (
                  <Lock size={18} className="text-gold" />
                ) : (
                  <Globe size={18} className="text-white/50" />
                )}
                <h2 className="text-white font-semibold text-lg">
                  {isPrivate ? "Private Account" : "Public Account"}
                </h2>
              </div>
              <p className="text-white/50 text-sm">
                {isPrivate
                  ? "Only approved followers can see your saved posts and activity"
                  : "Anyone can view your profile and saved posts"}
              </p>
            </div>
            <button
              onClick={handleToggle}
              className={`relative w-14 h-7 rounded-full transition-all ${
                isPrivate ? "bg-gold" : "bg-white/20"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  isPrivate ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {requests.length > 0 && (
          <div className="glass-card p-6 mb-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Users size={18} className="text-gold" /> Follower Requests ({requests.length})
            </h2>
            <div className="divide-y divide-white/10">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-white font-medium">
                      @{req.fromUser?.artistName || req.fromUser?.username || "unknown"}
                    </p>
                    <p className="text-white/40 text-xs">wants to follow you</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(req.id, "approve")}
                      className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleRequest(req.id, "decline")}
                      className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                      title="Decline"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {followers.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Users size={18} className="text-gold" /> Followers ({followers.length})
            </h2>
            <div className="divide-y divide-white/10">
              {followers.map((follower: any) => (
                <div key={follower.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-white font-medium">
                      @{follower.artistName || follower.username || "unknown"}
                    </p>
                    <p className="text-white/40 text-xs">
                      {follower.createdAt
                        ? `Since ${new Date(follower.createdAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFollower(follower.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                    title="Remove follower"
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && followers.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Users size={48} className="mx-auto mb-4 text-white/30" />
            <p className="text-white/50">No follower requests or followers yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
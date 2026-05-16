"use client";

import { useEffect, useState } from "react";
import { Send, Music, Film, Radio, Headphones, Cloud, Play } from "lucide-react";

interface DistributionItem {
  id: string;
  postId: string;
  creatorId: string;
  channels: string[];
  status: string;
  errorMessage: string;
  createdAt: string;
  pushedAt: string;
  post: {
    title: string;
    creator: {
      artistName: string;
    };
  };
}

const channelIcons: Record<string, any> = {
  distrokid: Music,
  youtube: Film,
  spotify: Radio,
  appleMusic: Headphones,
  tidal: Cloud,
};

const DistributionPage = () => {
  const [queue, setQueue] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/distribution/queue", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) setQueue(data.queue);
    } catch (error) {
      console.error("Failed to fetch distribution queue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const pushDistribution = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/distribution/${id}/push`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) fetchQueue();
    } catch (error) {
      console.error("Failed to push distribution:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Distribution Queue</h1>
          <p className="text-white/50 mt-1">
            {queue.length} item{queue.length !== 1 ? "s" : ""} pending distribution
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Send className="mx-auto text-white/20 mb-4" size={48} />
          <p className="text-white/50">Distribution queue is empty</p>
          <p className="text-white/30 text-sm mt-1">
            When creators distribute content, it will appear here for admin approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div key={item.id} className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">
                    {item.post?.title || "Unknown Track"}
                  </h3>
                  <p className="text-white/40 text-sm mt-1">
                    by {item.post?.creator?.artistName || "Unknown Artist"}
                  </p>

                  {/* Channels */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {item.channels?.map((ch: string) => {
                      const Icon = channelIcons[ch] || Send;
                      return (
                        <span
                          key={ch}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs"
                        >
                          <Icon size={12} />
                          {ch}
                        </span>
                      );
                    })}
                  </div>

                  <p className="text-white/20 text-xs mt-2">
                    Submitted: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : item.status === "processing"
                      ? "bg-blue-500/20 text-blue-400"
                      : item.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  } uppercase`}>
                    {item.status}
                  </span>
                  {item.status === "pending" && (
                    <button
                      onClick={() => pushDistribution(item.id)}
                      disabled={actionLoading === item.id}
                      className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg font-medium text-sm hover:brightness-110 transition disabled:opacity-50"
                    >
                      <Play size={14} />
                      Push to Channels
                    </button>
                  )}
                </div>
              </div>

              {item.errorMessage && (
                <div className="mt-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-red-400/60 text-xs">{item.errorMessage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DistributionPage;
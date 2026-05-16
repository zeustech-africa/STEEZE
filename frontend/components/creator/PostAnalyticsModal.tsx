"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Eye, Heart, MessageCircle, Download, Share2, TrendingUp } from "lucide-react";

interface PostAnalyticsModalProps {
  post: {
    id: string;
    title: string;
    price: number;
    isFree: boolean;
  };
  onClose: () => void;
}

interface AnalyticsData {
  views: number;
  likes: number;
  comments: number;
  downloads: number;
  shares: number;
  paidDownloads: number;
  earnings: number;
  postTitle: string;
}

export default function PostAnalyticsModal({ post, onClose }: PostAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/creators/posts/${post.id}/analytics`);
        const data = await res.json();
        if (data.success) setAnalytics(data.analytics);
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [post.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-md rounded-2xl p-6 border border-white/5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold text-lg">Post Analytics</h3>
            <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{post.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-white/30 text-sm">Loading analytics...</div>
        ) : analytics ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Eye size={16} />
                  <span className="text-xs">Views</span>
                </div>
                <p className="text-white text-xl font-bold">{analytics.views.toLocaleString()}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-400 mb-1">
                  <Heart size={16} />
                  <span className="text-xs">Likes</span>
                </div>
                <p className="text-white text-xl font-bold">{analytics.likes.toLocaleString()}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-300 mb-1">
                  <MessageCircle size={16} />
                  <span className="text-xs">Comments</span>
                </div>
                <p className="text-white text-xl font-bold">{analytics.comments.toLocaleString()}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <Download size={16} />
                  <span className="text-xs">Downloads</span>
                </div>
                <p className="text-white text-xl font-bold">{analytics.downloads.toLocaleString()}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-300 mb-1">
                  <Share2 size={16} />
                  <span className="text-xs">Shares</span>
                </div>
                <p className="text-white text-xl font-bold">{analytics.shares.toLocaleString()}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gold mb-1">
                  <TrendingUp size={16} />
                  <span className="text-xs">Engagement</span>
                </div>
                <p className="text-white text-xl font-bold">
                  {analytics.views > 0
                    ? (( (analytics.likes + analytics.comments) / analytics.views) * 100).toFixed(1)
                    : "0"}%
                </p>
              </div>
            </div>

            {/* Earnings section */}
            <div className="bg-gold/10 p-4 rounded-xl border border-gold/10 mb-4">
              <p className="text-gold font-bold text-lg">Earnings: R{analytics.earnings.toFixed(2)}</p>
              <p className="text-white/50 text-xs mt-1">
                {analytics.paidDownloads} paid downloads at R{post.price} each
              </p>
              {analytics.downloads > 0 && (
                <div className="mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gold h-full rounded-full transition-all"
                    style={{ width: `${(analytics.paidDownloads / analytics.downloads) * 100}%` }}
                  />
                </div>
              )}
              <p className="text-white/30 text-[10px] mt-1">
                {analytics.paidDownloads}/{analytics.downloads} downloads were paid
              </p>
            </div>

            {/* Post URL share */}
            <div className="border-t border-white/5 pt-4">
              <p className="text-white/40 text-xs mb-2">Post URL:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/creator/${post.id}`}
                  className="flex-1 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-white/60 text-xs truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/creator/${post.id}`);
                  }}
                  className="px-3 py-1.5 bg-white/10 text-white/70 text-xs rounded-lg hover:bg-white/20 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-white/30 text-sm">No analytics data available.</div>
        )}
      </motion.div>
    </motion.div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  CheckCircle, XCircle, Globe, User, Music, Film, Camera, 
  Loader2, Eye, Clock, AlertTriangle, Trash2 
} from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  type: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  creator: {
    id: string;
    fullName: string;
    artistName: string;
    email: string;
    profilePicUrl: string;
  };
  status: string;
}

export default function AdminContentApprovalPage() {
  const router = useRouter();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    checkAdminAuth();
    fetchPendingContent();
    fetchStats();
  }, [filter]);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || user.email !== "admin@steeze.com") {
      router.push("/admin/login");
    }
  };

  const fetchPendingContent = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = filter === "all" 
        ? `${API_URL}/api/admin/content/pending`
        : `${API_URL}/api/admin/content/pending?type=${filter}`;
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setContents(data.posts || []);
      }
    } catch (error) {
      console.error("Fetch content error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/content/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  const handleApproveGlobal = async (postId: string) => {
    setActionLoading(postId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/content/${postId}/approve-global`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPendingContent();
        fetchStats();
        setSelectedContent(null);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to approve");
      }
    } catch (error) {
      console.error("Approve error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveProfile = async (postId: string) => {
    setActionLoading(postId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/content/${postId}/approve-profile`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPendingContent();
        fetchStats();
        setSelectedContent(null);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to approve");
      }
    } catch (error) {
      console.error("Approve error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (postId: string) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setActionLoading(postId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/content/${postId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (response.ok) {
        fetchPendingContent();
        fetchStats();
        setSelectedContent(null);
        setShowRejectModal(false);
        setRejectionReason("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to reject");
      }
    } catch (error) {
      console.error("Reject error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "audio": return <Music size={16} className="text-gold" />;
      case "video": return <Film size={16} className="text-gold" />;
      default: return <Camera size={16} className="text-gold" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Content Approval</h1>
            <p className="text-white/50 text-sm">Review and manage pending content from creators</p>
          </div>
          <Link href="/admin" className="text-gray-400 hover:text-gold transition-colors">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-white/50 text-sm">Pending</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-green-400">{stats.approvedGlobal}</div>
              <div className="text-white/50 text-sm">Global Feed</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-blue-400">{stats.approvedProfile}</div>
              <div className="text-white/50 text-sm">Profile Only</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
              <div className="text-white/50 text-sm">Rejected</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {["all", "audio", "video", "image"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                filter === tab
                  ? "text-gold border-b-2 border-gold"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab === "all" ? "All" : tab === "audio" ? "Music" : tab === "video" ? "Videos" : "Photos"}
              {stats?.byType?.find((t: any) => t.type === tab) && (
                <span className="ml-1 text-xs">({stats.byType.find((t: any) => t.type === tab)?._count.id || 0})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {contents.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <CheckCircle size={48} className="mx-auto mb-4 text-white/20" />
              No pending content to review
            </div>
          ) : (
            contents.map((content) => (
              <div
                key={content.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-gold/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                    {content.thumbnailUrl ? (
                      <Image src={content.thumbnailUrl} alt={content.title} width={96} height={96} className="object-cover" />
                    ) : content.type === "audio" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={32} className="text-gold/50" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={32} className="text-gold/50" />
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(content.type)}
                      <h3 className="text-white font-semibold">{content.title}</h3>
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Pending</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/40 text-sm">
                      <span className="flex items-center gap-1">
                        <User size={14} /> {content.creator.artistName || content.creator.fullName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {formatDate(content.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveGlobal(content.id)}
                      disabled={actionLoading === content.id}
                      className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30 transition-all disabled:opacity-50"
                    >
                      {actionLoading === content.id ? <Loader2 size={14} className="animate-spin" /> : "Global Feed"}
                    </button>
                    <button
                      onClick={() => handleApproveProfile(content.id)}
                      disabled={actionLoading === content.id}
                      className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-sm hover:bg-blue-600/30 transition-all disabled:opacity-50"
                    >
                      Profile Only
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContent(content);
                        setShowRejectModal(true);
                      }}
                      disabled={actionLoading === content.id}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-all disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedContent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-white text-xl font-bold mb-4">Reject Content</h2>
            <p className="text-white/60 text-sm mb-4">
              Rejecting: <span className="text-white font-medium">{selectedContent.title}</span>
            </p>
            <div>
              <label className="block text-white/80 text-sm mb-1">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Why is this content being rejected?"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold resize-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setSelectedContent(null);
                }}
                className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedContent.id)}
                disabled={actionLoading === selectedContent.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === selectedContent.id ? <Loader2 size={18} className="animate-spin" /> : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
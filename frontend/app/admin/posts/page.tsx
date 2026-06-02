"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Globe,
  User,
  XCircle,
  CheckCircle,
  Trash2,
  Search,
  Play,
  Image as ImageIcon,
  Layers,
} from "lucide-react";

interface Post {
  id: string;
  type: string;
  contentType: string;
  title: string;
  description: string;
  mediaUrl: string;
  thumbnailUrl: string;
  price: number;
  isFree: boolean;
  autoScanStatus: string;
  autoScanReason: string;
  adminStatus: string;
  createdAt: string;
  creator: {
    artistName: string;
    profilePicUrl: string;
    distributionSettings?: any;
  };
}

const PostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectReason, setRejectionReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectPostId, setRejectPostId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedFreePosts, setSelectedFreePosts] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkPendingAction, setBulkPendingAction] = useState<{ type: string; approvalType?: "global" | "profile" } | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/posts/pending", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const approveGlobal = async (postId: string) => {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/approve-global`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) fetchPosts();
    } catch (error) {
      console.error("Failed to approve global:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const approveProfile = async (postId: string) => {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/approve-profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) fetchPosts();
    } catch (error) {
      console.error("Failed to approve profile:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (postId: string) => {
    setRejectPostId(postId);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectPostId || !rejectReason.trim()) return;

    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/posts/${rejectPostId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        fetchPosts();
        setRejectModalOpen(false);
        setRejectionReason("");
        setRejectPostId(null);
      }
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setRejecting(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("WARNING: This will delete the post from EVERYWHERE (feed, profile, saves, comments, likes). This cannot be undone. Continue?")) return;
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) fetchPosts();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFreePostSelection = (postId: string) => {
    const next = new Set(selectedFreePosts);
    if (next.has(postId)) {
      next.delete(postId);
    } else {
      next.add(postId);
    }
    setSelectedFreePosts(next);
  };

  const selectAllFreePosts = () => {
    const freeIds = filtered
      .filter((p) => p.contentType === "free")
      .map((p) => p.id);
    setSelectedFreePosts(new Set(freeIds));
  };

  const clearSelection = () => {
    setSelectedFreePosts(new Set());
  };

  const handleBulkApprove = (approvalType: "global" | "profile") => {
    if (selectedFreePosts.size === 0) return;
    if (selectedFreePosts.size > 50) {
      alert("Maximum 50 posts per bulk approval. Please reduce your selection.");
      return;
    }

    setBulkPendingAction({ type: 'approve', approvalType });
    setBulkConfirmOpen(true);
  };

  const executeBulkApprove = async (approvalType: "global" | "profile") => {
    setBulkApproving(true);
    try {
      const res = await fetch("/api/admin/posts/bulk-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          postIds: Array.from(selectedFreePosts),
          approvalType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
        setSelectedFreePosts(new Set());
        alert(
          `Bulk approval complete: ${data.results.success.length} succeeded, ${data.results.failed.length} failed`
        );
      }
    } catch (err) {
      console.error("Bulk approve error:", err);
    } finally {
      setBulkApproving(false);
    }
  };

  const filtered = posts.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.creator?.artistName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const freePostCount = filtered.filter((p) => p.contentType === "free").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Post Approval Queue</h1>
          <p className="text-white/50 mt-1">
            {posts.length} post{posts.length !== 1 ? "s" : ""} pending review (auto-scan passed)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input
          type="text"
          placeholder="Search by title or artist..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
        />
      </div>

      {/* Bulk Actions for Free Content */}
      {freePostCount > 0 && (
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers size={18} className="text-white/50" />
            <span className="text-white/70 text-sm">
              <span className="text-green-400 font-medium">{freePostCount}</span> free posts available for bulk approval
            </span>
            <span className="text-white/30 text-sm">
              ({selectedFreePosts.size} selected)
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={selectAllFreePosts}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
            >
              Select All Free
            </button>
            {selectedFreePosts.size > 0 && (
              <>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/50 hover:bg-white/10 transition"
                >
                  Clear
                </button>
                  <button
                    onClick={() => handleBulkApprove("global")}
                  disabled={bulkApproving}
                  className="px-3 py-1.5 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50"
                >
                  {bulkApproving ? "Approving..." : "Bulk Approve Global"}
                </button>
                  <button
                    onClick={() => handleBulkApprove("profile")}
                  disabled={bulkApproving}
                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                >
                  {bulkApproving ? "Approving..." : "Bulk Approve Profile"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="mx-auto text-white/20 mb-4" size={48} />
          <p className="text-white/50">No pending posts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <div key={post.id} className={`glass-card p-6 ${post.contentType === "free" && selectedFreePosts.has(post.id) ? "ring-2 ring-green-500/40" : ""}`}>
              <div className="flex items-start gap-4">
                {/* Bulk select checkbox for free content */}
                {post.contentType === "free" && (
                  <div className="flex-shrink-0 pt-1">
                    <input
                      type="checkbox"
                      checked={selectedFreePosts.has(post.id)}
                      onChange={() => toggleFreePostSelection(post.id)}
                      className="w-4 h-4 rounded border-white/30 bg-transparent accent-green-500"
                    />
                  </div>
                )}

                {/* Thumbnail Preview */}
                {post.thumbnailUrl && (
                  <div className="w-24 h-24 rounded-lg border border-white/10 overflow-hidden flex-shrink-0 bg-white/5">
                    <img
                      src={post.thumbnailUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 capitalize">
                      {post.type}
                    </span>
                    {/* Content Type Badge */}
                    {post.contentType === "free" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                        Free
                      </span>
                    )}
                    {post.contentType === "subscriber" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                        Subscriber
                      </span>
                    )}
                    {post.contentType === "direct_purchase" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                        Direct Purchase • R{((post.price || 0) / 100).toFixed(2)}
                      </span>
                    )}
                    {post.contentType === "creator_page_only" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        Page Only
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                      Auto-scan passed
                    </span>
                    {!post.isFree && post.contentType !== "direct_purchase" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">
                        ${post.price}
                      </span>
                    )}
                  </div>

                  <h3 className="text-white font-semibold text-lg truncate">
                    {post.title}
                  </h3>
                  <p className="text-white/40 text-sm mt-1 line-clamp-2">
                    {post.description || "No description"}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden">
                      {post.creator?.profilePicUrl && (
                        <img
                          src={post.creator.profilePicUrl}
                          alt={post.creator.artistName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <span className="text-white/50 text-xs">
                      {post.creator?.artistName || "Unknown Creator"}
                    </span>
                    <span className="text-white/20 text-xs">•</span>
                    <span className="text-white/20 text-xs">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Approval Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approveGlobal(post.id)}
                      disabled={actionLoading === post.id || post.contentType === "creator_page_only"}
                      className={`px-3 py-1 text-sm rounded-lg transition ${
                        post.contentType === "creator_page_only"
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                      }`}
                      title={
                        post.contentType === "creator_page_only"
                          ? "Page-only content cannot go to global feed"
                          : "Approve for Global Feed"
                      }
                    >
                      <Globe size={14} />
                      Approve Global
                    </button>
                    <button
                      onClick={() => approveProfile(post.id)}
                      disabled={actionLoading === post.id}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition disabled:opacity-50"
                      title="Approve for Profile Only"
                    >
                      <User size={14} />
                      Approve Profile
                    </button>
                    <button
                      onClick={() => openRejectModal(post.id)}
                      disabled={actionLoading === post.id}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      disabled={actionLoading === post.id}
                      className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-50"
                      title="Delete from everywhere"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Auto-scan reason if present */}
              {post.autoScanReason && (
                <div className="mt-3 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-yellow-400/60 text-xs">
                    Scan note: {post.autoScanReason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* === BULK APPROVE CONFIRMATION MODAL === */}
      {bulkConfirmOpen && bulkPendingAction?.type === 'approve' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Bulk Approval</h2>
            <div className="space-y-3 mb-4">
              <p className="text-gray-400">
                You are about to approve <span className="text-yellow-500 font-bold">{selectedFreePosts.size}</span> posts.
              </p>
              <p className="text-gray-400">
                Approval type: <span className="text-purple-400 font-bold">
                  {bulkPendingAction.approvalType === 'global' ? 'Global Feed' : 'Profile Only'}
                </span>
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3">
                <p className="text-yellow-500 text-sm">
                  ⚠️ This action is IRREVERSIBLE and can only be performed by Super Admin.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setBulkConfirmOpen(false);
                  setBulkPendingAction(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setBulkConfirmOpen(false);
                  await executeBulkApprove(bulkPendingAction.approvalType!);
                  setBulkPendingAction(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition"
              >
                Confirm Bulk Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === REJECTION MODAL === */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Reject Content</h2>
            <p className="text-gray-400 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 min-h-[100px]"
              rows={3}
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectionReason("");
                  setRejectPostId(null);
                }}
                className="px-4 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting}
                className="px-4 py-2 bg-red-600 rounded-lg text-white font-medium disabled:opacity-50 hover:bg-red-700 transition"
              >
                {rejecting ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsPage;
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
} from "lucide-react";

interface Post {
  id: string;
  type: string;
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
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const rejectPost = async (postId: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
        setRejectingId(null);
        setRejectReason("");
      }
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setActionLoading(null);
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

  const filtered = posts.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.creator?.artistName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div key={post.id} className="glass-card p-6">
              <div className="flex items-start gap-4">
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
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                      Auto-scan passed
                    </span>
                    {!post.isFree && (
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
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveGlobal(post.id)}
                    disabled={actionLoading === post.id}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm hover:bg-green-500/20 transition disabled:opacity-50"
                    title="Approve for Global Feed"
                  >
                    <Globe size={14} />
                    Global
                  </button>
                  <button
                    onClick={() => approveProfile(post.id)}
                    disabled={actionLoading === post.id}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/20 transition disabled:opacity-50"
                    title="Approve for Profile Only"
                  >
                    <User size={14} />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(post.id);
                      setRejectReason("");
                    }}
                    disabled={actionLoading === post.id}
                    className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                    title="Reject"
                  >
                    <XCircle size={18} />
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

      {/* === REJECT MODAL === */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-white font-semibold text-lg mb-2">Reject Post</h3>
            <p className="text-white/50 text-sm mb-4">
              Provide a reason for rejection. The creator will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Content violates community guidelines..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 min-h-[100px] mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-white/10 rounded-lg text-white/60 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectPost(rejectingId)}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Reject Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsPage;
"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, Download, Lock, Pin, Edit2, Trash2, BarChart3, Eye, Bookmark, Repeat2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CommentSection from "../comments/CommentSection";
import PostAnalyticsModal from "./PostAnalyticsModal";
import EditPostModal from "./EditPostModal";

interface Post {
  id: string;
  title: string;
  description?: string;
  type: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  coverArtUrl?: string;
  isFree: boolean;
  price: number;
  isPinned: boolean;
  status?: string;
  lyrics?: string;
  album?: string;
  scheduledFor?: string;
  createdAt: string;
  _count?: { likes: number; comments: number };
  interactions: any[];
  distributionSelections?: any;
}

interface PostsSectionProps {
  posts: Post[];
  creatorId?: string;
  isOwner?: boolean;
  currentUserId?: string;
  onRefresh?: () => void;
  isSubscribed?: boolean;
  subscriptionTier?: string | null;
}

export default function PostsSection({ posts, creatorId, isOwner, currentUserId, onRefresh, isSubscribed, subscriptionTier }: PostsSectionProps) {
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [showCommentsPostId, setShowCommentsPostId] = useState<string | null>(null);
  const [analyticsPost, setAnalyticsPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [shareCopied, setShareCopied] = useState<string | null>(null);

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(post.id);
      setTimeout(() => setShareCopied(null), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShareCopied(post.id);
      setTimeout(() => setShareCopied(null), 2000);
    }
  };

  const handleSave = (postId: string) => {
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleRepost = async (postId: string) => {
    if (!currentUserId) return;
    try {
      await fetch("/api/creators/repost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, postId }),
      });
      onRefresh?.();
    } catch (e) {
      console.error("Repost failed", e);
    }
  };

  const handlePinPost = async (postId: string) => {
    try {
      await fetch(`/api/creators/posts/${postId}/pin`, { method: "POST" });
      onRefresh?.();
    } catch (e) {
      console.error("Pin toggle failed", e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await fetch(`/api/creators/posts/${postId}`, { method: "DELETE" });
      setShowDeleteConfirm(null);
      onRefresh?.();
    } catch (e) {
      console.error("Delete post failed", e);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUserId) return;
    try {
      await fetch("/api/creators/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, postId, type: "like" }),
      });
      onRefresh?.();
    } catch (e) {
      console.error("Like failed", e);
    }
  };

  const handleView = async (postId: string) => {
    if (!currentUserId) return;
    try {
      await fetch("/api/creators/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, postId, type: "view" }),
      });
    } catch {}
  };

  const getLikeCount = (post: Post) => {
    return post.interactions?.filter((i: any) => i.type === "like").length || 0;
  };

  const getCommentCount = (post: Post) => {
    return post.interactions?.filter((i: any) => i.type === "comment").length || 0;
  };

  const getViewCount = (post: Post) => {
    return post.interactions?.filter((i: any) => i.type === "view").length || 0;
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <p>No posts yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-white/5 overflow-hidden group"
          >
            {/* Pinned badge */}
            {post.isPinned && (
              <div className="flex items-center gap-1 px-5 pt-3 pb-0 text-gold text-xs">
                <Pin size={12} />
                <span>Pinned</span>
              </div>
            )}

            {/* Draft/Scheduled badge */}
            {post.status === "draft" && (
              <div className="px-5 pt-3 pb-0 text-yellow-400 text-xs">Draft</div>
            )}
            {post.status === "scheduled" && post.scheduledFor && (
              <div className="px-5 pt-3 pb-0 text-blue-400 text-xs">
                Scheduled for {new Date(post.scheduledFor).toLocaleString()}
              </div>
            )}

            {/* Media */}
            {post.mediaUrl && (
              <div className="relative">
                {post.type === "video" && (
                  <video
                    src={post.mediaUrl}
                    controls
                    poster={post.thumbnailUrl}
                    className="w-full max-h-96 object-contain bg-black/50"
                    preload="metadata"
                  />
                )}
                {post.type === "audio" && (
                  <div className="flex items-center gap-4 p-5">
                    {post.coverArtUrl && (
                      <img
                        src={post.coverArtUrl}
                        alt="Cover art"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <audio src={post.mediaUrl} controls className="w-full" preload="metadata" />
                      {post.album && (
                        <p className="text-white/40 text-xs mt-1">Album: {post.album}</p>
                      )}
                    </div>
                  </div>
                )}
                {post.type === "image" && (
                  <img src={post.mediaUrl} alt={post.title} className="w-full max-h-96 object-contain bg-black/50" />
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base mb-1">{post.title}</h3>
                  {post.description && (
                    <p className="text-white/50 text-sm line-clamp-2 mb-3">{post.description}</p>
                  )}
                  {post.lyrics && (
                    <details className="mb-3">
                      <summary className="text-gold/70 text-xs cursor-pointer hover:text-gold">
                        Show Lyrics
                      </summary>
                      <p className="text-white/50 text-xs mt-1 whitespace-pre-wrap">{post.lyrics}</p>
                    </details>
                  )}
                  <div className="flex items-center gap-2 text-white/30 text-xs">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    {!post.isFree && (
                      <span className="flex items-center gap-1 text-gold/70">
                        <Lock size={10} />R{post.price}
                      </span>
                    )}
                    {post.isFree && (
                      <span className="text-green-400/70">Free</span>
                    )}
                  </div>
                </div>

                {/* Creator actions */}
                {isOwner && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handlePinPost(post.id)}
                      className={`p-1.5 rounded-lg transition-colors ${post.isPinned ? "text-gold bg-gold/10" : "text-white/40 hover:text-gold"}`}
                      title={post.isPinned ? "Unpin" : "Pin to top"}
                    >
                      <Pin size={16} />
                    </button>
                    <button
                      onClick={() => setEditingPost(post)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-gold transition-colors"
                      title="Edit post"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setAnalyticsPost(post)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-gold transition-colors"
                      title="View analytics"
                    >
                      <BarChart3 size={16} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(post.id)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-red-500 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/5">
                <button
                  onClick={() => { handleView(post.id); handleLike(post.id); }}
                  className="flex items-center gap-1.5 text-white/40 hover:text-red-500 transition-colors text-sm"
                >
                  <Heart size={18} />
                  <span>{getLikeCount(post)}</span>
                </button>
                <button
                  onClick={() => setShowCommentsPostId(showCommentsPostId === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-white/40 hover:text-blue-400 transition-colors text-sm"
                >
                  <MessageCircle size={18} />
                  <span>{getCommentCount(post)}</span>
                </button>
                <button
                  onClick={() => handleShare(post)}
                  className="flex items-center gap-1.5 text-white/40 hover:text-green-400 transition-colors text-sm"
                >
                  {shareCopied === post.id ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
                  <span>{shareCopied === post.id ? "Copied!" : ""}</span>
                </button>
                <button
                  onClick={() => handleSave(post.id)}
                  className={`flex items-center gap-1.5 transition-colors text-sm ${savedPosts.has(post.id) ? "text-gold" : "text-white/40 hover:text-gold"}`}
                  title={savedPosts.has(post.id) ? "Saved" : "Save post"}
                >
                  <Bookmark size={18} fill={savedPosts.has(post.id) ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => handleRepost(post.id)}
                  className="flex items-center gap-1.5 text-white/40 hover:text-purple-400 transition-colors text-sm"
                  title="Repost"
                >
                  <Repeat2 size={18} />
                </button>
                {post.type === "audio" && post.isFree && (
                  <a
                    href={post.mediaUrl}
                    download
                    className="flex items-center gap-1.5 text-white/40 hover:text-gold transition-colors text-sm"
                  >
                    <Download size={18} />
                  </a>
                )}
                <div className="flex items-center gap-1.5 text-white/20 text-sm ml-auto">
                  <Eye size={14} />
                  <span>{getViewCount(post)}</span>
                </div>
              </div>

              {/* Comments section */}
              {showCommentsPostId === post.id && currentUserId && (
                <CommentSection
                  postId={post.id}
                  currentUserId={currentUserId}
                  isCreator={!!isOwner}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm rounded-2xl p-6 border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold text-lg mb-2">Delete Post?</h3>
              <p className="text-white/50 text-sm mb-4">
                This action cannot be undone. All likes, comments, and interactions will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2.5 text-white/60 hover:text-white border border-white/10 rounded-full text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePost(showDeleteConfirm)}
                  className="flex-1 py-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full text-sm font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post analytics modal */}
      <AnimatePresence>
        {analyticsPost && (
          <PostAnalyticsModal post={analyticsPost} onClose={() => setAnalyticsPost(null)} />
        )}
      </AnimatePresence>

      {/* Edit post modal */}
      <AnimatePresence>
        {editingPost && (
          <EditPostModal
            post={editingPost}
            onClose={() => setEditingPost(null)}
            onSaved={() => { setEditingPost(null); onRefresh?.(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
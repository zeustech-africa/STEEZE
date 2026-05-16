"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, Reply, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommentUser {
  id: string;
  artistName: string;
  profilePhotoUrl: string | null;
}

interface CommentData {
  id: string;
  userId: string;
  text: string;
  likes: number;
  replyCount: number;
  createdAt: string;
  parentId: string | null;
  user: CommentUser;
  replies: CommentData[];
}

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
  isCreator: boolean;
  apiBase?: string;
}

export default function CommentSection({ postId, currentUserId, isCreator, apiBase = "/api/creators" }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) setComments(data.comments);
    } catch (e) {
      console.error("Failed to fetch comments", e);
    } finally {
      setLoading(false);
    }
  }, [postId, apiBase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${apiBase}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, text: newComment.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewComment("");
        fetchComments();
      }
    } catch (e) {
      console.error("Failed to add comment", e);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`${apiBase}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, text: replyText.trim(), parentId }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText("");
        setReplyTo(null);
        fetchComments();
      }
    } catch (e) {
      console.error("Failed to add reply", e);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const res = await fetch(`${apiBase}/comments/${commentId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
      }
    } catch (e) {
      console.error("Failed to like comment", e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`${apiBase}/comments/${commentId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchComments();
    } catch (e) {
      console.error("Failed to delete comment", e);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: CommentData; depth?: number }) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const showReplies = expandedReplies.has(comment.id);
    const isReplyOwner = currentUserId === comment.userId;

    return (
      <div className={`${depth > 0 ? "ml-8 border-l border-white/10 pl-4" : ""}`}>
        <div className="flex gap-3 py-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
            {comment.user.profilePhotoUrl ? (
              <img src={comment.user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold">
                {(comment.user.artistName || "U")[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white font-semibold text-sm">{comment.user.artistName || "User"}</span>
              <span className="text-white/30 text-xs">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed break-words">{comment.text}</p>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-1.5">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className="flex items-center gap-1 text-white/40 hover:text-red-500 transition-colors text-xs"
              >
                <Heart size={12} className={likedComments.has(comment.id) ? "fill-current text-red-500" : ""} />
                {comment.likes > 0 && <span>{comment.likes}</span>}
              </button>

              <button
                onClick={() => { setReplyTo(comment.id); setReplyText(""); }}
                className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors text-xs"
              >
                <Reply size={12} />
                <span>Reply</span>
              </button>

              {(isCreator || isReplyOwner) && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="flex items-center gap-1 text-white/40 hover:text-red-500 transition-colors text-xs"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Reply input */}
            {replyTo === comment.id && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddReply(comment.id)}
                  className="flex-1 px-3 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-gold/50"
                  autoFocus
                />
                <button
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="px-3 py-1.5 bg-gold/20 text-gold rounded-lg text-xs font-semibold hover:bg-gold/30 disabled:opacity-30 transition-colors"
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View replies toggle */}
        {hasReplies && (
          <button
            onClick={() => toggleReplies(comment.id)}
            className="ml-11 flex items-center gap-1 text-gold/60 hover:text-gold text-xs mb-1 transition-colors"
          >
            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showReplies ? "Hide" : `View ${comment.replyCount} ${comment.replyCount === 1 ? "reply" : "replies"}`}
          </button>
        )}

        {/* Nested replies */}
        <AnimatePresence>
          {showReplies && hasReplies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="border-t border-white/5 pt-4 px-5">
      <h4 className="text-white font-semibold text-sm mb-3">Comments ({comments.length})</h4>

      {/* New comment input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
          className="flex-1 px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/50"
        />
        <button
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          className="px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm font-semibold hover:bg-gold/30 disabled:opacity-30 transition-colors"
        >
          Post
        </button>
      </div>

      {/* Comments list */}
      {loading ? (
        <p className="text-white/30 text-sm text-center py-4">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-0 divide-y divide-white/5">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
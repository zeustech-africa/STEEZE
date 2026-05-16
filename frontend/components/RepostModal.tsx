"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";

interface RepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  postTitle: string;
  postCreator: string;
}

export default function RepostModal({
  isOpen,
  onClose,
  onConfirm,
  postTitle,
  postCreator,
}: RepostModalProps) {
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(comment);
    setComment("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gold">Repost</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="text-white/50" />
          </button>
        </div>
        <p className="text-white/60 mb-2">
          Repost "{postTitle}" by @{postCreator} to your profile?
        </p>
        <p className="text-white/40 text-sm mb-4">
          Your followers will see this in their feed.
        </p>
        <textarea
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-gold mb-4 resize-none"
          rows={3}
        />
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 bg-gold text-black rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-gold/90 transition-all"
          >
            <Send size={16} /> Repost
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-white/30 text-white rounded-full hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
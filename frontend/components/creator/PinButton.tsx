"use client";

import { useState } from "react";
import { Pin, PinOff, Loader2 } from "lucide-react";

interface PinButtonProps {
  postId: string;
  isPinned: boolean;
  pinnedCount?: number;
  onPinChange?: (isPinned: boolean) => void;
}

export default function PinButton({ postId, isPinned: initialIsPinned, pinnedCount = 0, onPinChange }: PinButtonProps) {
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handlePinToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const method = isPinned ? "DELETE" : "POST";
      const response = await fetch(`${API_URL}/api/pinned/${postId}`, {
        method,
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        const newPinnedState = !isPinned;
        setIsPinned(newPinnedState);
        if (onPinChange) onPinChange(newPinnedState);
      } else {
        setError(data.error || "Failed to pin post");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Network error");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!isPinned && pinnedCount >= 3) {
    return (
      <button
        disabled
        className="p-1.5 text-white/30 cursor-not-allowed rounded-lg transition-all"
        title="Maximum 3 pinned posts"
      >
        <Pin size={16} />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handlePinToggle}
        disabled={loading}
        className={`p-1.5 rounded-lg transition-all ${
          isPinned
            ? "text-gold hover:text-gold/70"
            : "text-white/40 hover:text-gold"
        } disabled:opacity-50`}
        title={isPinned ? "Unpin from profile" : "Pin to profile"}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : isPinned ? <PinOff size={16} /> : <Pin size={16} />}
      </button>
      {error && <span className="text-red-400 text-xs ml-1">{error}</span>}
    </>
  );
}
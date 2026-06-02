"use client";

import { useState } from "react";
import { EyeOff, Check } from "lucide-react";

interface NotInterestedButtonProps {
  postId: string;
  onHide?: () => void;
}

export default function NotInterestedButton({ postId, onHide }: NotInterestedButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleNotInterested = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/feed/not-interested/${postId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        if (onHide) onHide();
        setShowConfirm(false);
      }
    } catch (error) {
      console.error("Not interested error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-white text-sm mb-2">We'll show you less content like this.</p>
        <div className="flex gap-2">
          <button
            onClick={handleNotInterested}
            disabled={loading}
            className="flex-1 px-3 py-1 bg-gold text-black text-sm rounded-lg disabled:opacity-50"
          >
            {loading ? "..." : "Yes, Hide"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 px-3 py-1 bg-white/10 text-white text-sm rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 text-white/50 hover:text-white transition-all text-sm"
    >
      <EyeOff size={16} /> Not Interested
    </button>
  );
}
"use client";

import { useState } from "react";
import { Shield, ShieldOff } from "lucide-react";

interface BlockButtonProps {
  userId: string;
  isBlocked: boolean;
  onBlockChange?: (isBlocked: boolean) => void;
}

export default function BlockButton({ userId, isBlocked: initialIsBlocked, onBlockChange }: BlockButtonProps) {
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleBlock = async () => {
    if (!confirm(`Are you sure you want to ${isBlocked ? "unblock" : "block"} this user?`)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/block/${userId}`, {
        method: isBlocked ? "DELETE" : "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const newBlockedState = !isBlocked;
        setIsBlocked(newBlockedState);
        if (onBlockChange) onBlockChange(newBlockedState);
      }
    } catch (error) {
      console.error("Block error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        isBlocked
          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
      } disabled:opacity-50`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isBlocked ? (
        <ShieldOff size={16} />
      ) : (
        <Shield size={16} />
      )}
      {isBlocked ? "Unblock" : "Block"}
    </button>
  );
}
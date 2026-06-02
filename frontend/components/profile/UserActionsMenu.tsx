"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Shield, BellOff, Flag, Ban, UserX } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserActionsMenuProps {
  userId: string;
  targetUserId: string;
  targetUserName: string;
  isBlocked?: boolean;
  isMuted?: boolean;
  onAction?: () => void;
}

export default function UserActionsMenu({ userId, targetUserId, targetUserName, isBlocked: initialIsBlocked, isMuted: initialIsMuted, onAction }: UserActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked || false);
  const [isMuted, setIsMuted] = useState(initialIsMuted || false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleBlock = async () => {
    if (!confirm(`Are you sure you want to ${isBlocked ? "unblock" : "block"} ${targetUserName}?`)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/${userId}/${isBlocked ? "unblock" : "block"}/${targetUserId}`, {
        method: isBlocked ? "DELETE" : "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        setIsBlocked(!isBlocked);
        if (onAction) onAction();
        router.refresh();
      }
    } catch (error) {
      console.error("Block action error:", error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const handleMute = async () => {
    if (!confirm(`Mute ${targetUserName}? You will no longer see their content in your feed.`)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/${userId}/mute/${targetUserId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        setIsMuted(true);
        if (onAction) onAction();
      }
    } catch (error) {
      console.error("Mute action error:", error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const handleReport = () => {
    setIsOpen(false);
    // Will be implemented in Group D (Report Content)
    alert("Report functionality coming soon.");
  };

  // Don't show menu for own profile
  if (userId === targetUserId) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white/50 hover:text-gold rounded-full hover:bg-white/10 transition-all"
        aria-label="User actions"
      >
        <MoreHorizontal size={20} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-white/10 z-50 overflow-hidden">
            {!isBlocked && (
              <button
                onClick={handleMute}
                disabled={loading || isMuted}
                className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <BellOff size={16} />
                {isMuted ? "Unmute" : "Mute"} User
              </button>
            )}
            <button
              onClick={handleBlock}
              disabled={loading}
              className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Ban size={16} />
              {isBlocked ? "Unblock" : "Block"} User
            </button>
            <button
              onClick={handleReport}
              className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2 text-sm border-t border-white/10"
            >
              <Flag size={16} />
              Report User
            </button>
          </div>
        </>
      )}
    </div>
  );
}
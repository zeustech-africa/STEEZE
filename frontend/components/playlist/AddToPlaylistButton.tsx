"use client";

import { useState, useEffect } from "react";
import { Plus, Music, Loader2 } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
}

interface AddToPlaylistButtonProps {
  postId: string;
  onAdded?: () => void;
}

export default function AddToPlaylistButton({ postId, onAdded }: AddToPlaylistButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/playlists`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPlaylists(data.playlists || []);
      }
    } catch (error) {
      console.error("Fetch playlists error:", error);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingTo(playlistId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ postId })
      });

      if (response.ok) {
        if (onAdded) onAdded();
        setIsOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add to playlist");
      }
    } catch (error) {
      console.error("Add to playlist error:", error);
    } finally {
      setAddingTo(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-white/40 hover:text-gold transition-all"
        aria-label="Add to playlist"
      >
        <Plus size={16} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-48 bg-gray-900 rounded-lg shadow-lg border border-white/10 z-50 overflow-hidden">
            <div className="p-2 border-b border-white/10">
              <p className="text-white/60 text-xs px-2">Add to playlist</p>
            </div>
            {playlists.length === 0 ? (
              <div className="px-4 py-3 text-white/40 text-sm text-center">
                No playlists yet
              </div>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  disabled={addingTo === playlist.id}
                  className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {addingTo === playlist.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Music size={14} className="text-gold" />
                  )}
                  {playlist.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Music } from "lucide-react";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (name: string, description?: string) => void;
  onUpdate?: (name: string, description?: string) => void;
  playlist?: { id: string; name: string; description?: string } | null;
}

export default function PlaylistModal({ isOpen, onClose, onCreate, onUpdate, playlist }: PlaylistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setError(null);
  }, [playlist, isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Playlist name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (playlist && onUpdate) {
        onUpdate(name.trim(), description.trim() || undefined);
      } else if (onCreate) {
        onCreate(name.trim(), description.trim() || undefined);
      }
      onClose();
    } catch {
      setError("Failed to save playlist");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!playlist;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Music size={20} className="text-gold" />
            <h2 className="text-white text-xl font-bold">
              {isEditing ? "Edit Playlist" : "Create New Playlist"}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-1">Playlist Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chill Vibes, Workout Mix, Study Beats"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What's this playlist about?"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : (isEditing ? "Save Changes" : "Create Playlist")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
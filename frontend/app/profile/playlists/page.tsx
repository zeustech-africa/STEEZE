"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Music, Trash2, Edit2, Play } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  songs: any[];
  createdAt: string;
}

export default function PlaylistsPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPlaylists();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      alert("Please enter a playlist name");
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/playlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDesc
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewPlaylistName("");
        setNewPlaylistDesc("");
        fetchPlaylists();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create playlist");
      }
    } catch (error) {
      console.error("Create playlist error:", error);
      alert("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (!confirm(`Delete "${playlistName}"? This cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/playlists/${playlistId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPlaylists();
      } else {
        alert("Failed to delete playlist");
      }
    } catch (error) {
      console.error("Delete playlist error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">Loading playlists...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gold">
              ← Back
            </button>
            <h1 className="text-white text-2xl font-bold">My Playlists</h1>
            <span className="text-gold text-sm">{playlists.length} playlists</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-full hover:shadow-lg transition-all"
          >
            <Plus size={18} /> New Playlist
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <Music size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/50">No playlists yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 bg-gold text-black rounded-full"
            >
              Create your first playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-gold/50 transition-all group"
              >
                <Link href={`/profile/playlists/${playlist.id}`}>
                  <div className="aspect-square bg-gradient-to-br from-gold/20 to-black flex items-center justify-center">
                    {playlist.coverImage ? (
                      <Image src={playlist.coverImage} alt={playlist.name} width={200} height={200} className="w-full h-full object-cover" />
                    ) : (
                      <Music size={48} className="text-gold/50" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
                    <p className="text-white/40 text-sm">{playlist.songs.length} songs</p>
                  </div>
                </Link>
                <div className="p-4 pt-0 flex gap-2">
                  <Link
                    href={`/profile/playlists/${playlist.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gold/20 text-gold rounded-lg text-sm hover:bg-gold/30 transition-all"
                  >
                    <Play size={14} /> Play
                  </Link>
                  <button
                    onClick={() => router.push(`/profile/playlists/${playlist.id}/edit`)}
                    className="px-3 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-white text-xl font-bold mb-4">Create New Playlist</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-1">Playlist Name *</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g., Chill Vibes, Workout Mix, Study Beats"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Description (optional)</label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="What's this playlist about?"
                  rows={2}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={creating || !newPlaylistName.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Playlist"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
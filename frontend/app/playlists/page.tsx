"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Music, Play, Trash2 } from "lucide-react";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch("/api/vibes/playlists", {
        credentials: "include",
      });
      const data = await res.json();
      setPlaylists(data.playlists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await fetch("/api/vibes/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: newPlaylistName.trim(),
        description: newPlaylistDesc.trim(),
      }),
    });
    setShowCreateModal(false);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    fetchPlaylists();
  };

  const deletePlaylist = async (id: string) => {
    await fetch(`/api/vibes/playlists/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchPlaylists();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold animate-pulse">Loading playlists...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gold">YOUR VIBES</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gold text-black rounded-full flex items-center gap-2 hover:bg-gold/90 transition-all"
          >
            <Plus size={16} /> Create Playlist
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Music className="mx-auto text-white/40 mb-4" size={48} />
            <p className="text-white/50 mb-4">You haven't created any playlists yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-gold text-black rounded-full hover:bg-gold/90 transition-all"
            >
              START YOUR VIBES
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className="glass-card p-4 group relative block"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                  <Image
                    src={playlist.coverImage || "/images/auth-bg.jpg"}
                    alt={playlist.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all">
                    <Play className="text-gold" size={32} />
                  </div>
                </div>
                <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
                <p className="text-white/50 text-sm">
                  {playlist.songs?.length || 0} {playlist.songs?.length === 1 ? "song" : "songs"}
                </p>
                {playlist.description && (
                  <p className="text-white/40 text-xs mt-1 truncate">{playlist.description}</p>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deletePlaylist(playlist.id);
                  }}
                  className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all p-2 bg-black/50 rounded-full hover:bg-red-500/30"
                  title="Delete playlist"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold text-gold mb-4">Create Playlist</h2>
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 mb-3 focus:outline-none focus:border-gold"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 mb-4 focus:outline-none focus:border-gold resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={createPlaylist}
                className="flex-1 py-2 bg-gold text-black rounded-full font-semibold hover:bg-gold/90 transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 border border-white/30 text-white rounded-full hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
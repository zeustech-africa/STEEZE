"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditPlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPlaylist();
  }, [playlistId]);

  const fetchPlaylist = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/playlists/${playlistId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.playlist) {
        setName(data.playlist.name);
        setDescription(data.playlist.description || "");
      }
    } catch (error) {
      console.error("Fetch playlist error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Playlist name is required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/playlists/${playlistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null })
      });

      if (response.ok) {
        router.push(`/profile/playlists/${playlistId}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update playlist");
      }
    } catch (error) {
      console.error("Update playlist error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="container mx-auto max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-gold">
            ← Back
          </button>
          <h1 className="text-white text-2xl font-bold">Edit Playlist</h1>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">Playlist Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
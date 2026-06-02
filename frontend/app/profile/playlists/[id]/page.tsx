"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Play, Pause, X, Music, Plus, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Song {
  id: string;
  postId: string;
  order: number;
  post: {
    id: string;
    title: string;
    mediaUrl: string;
    creator: {
      id: string;
      fullName: string;
      artistName: string | null;
    };
  };
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  songs: Song[];
}

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPlaylist();
    fetchAvailableSongs();
  }, [playlistId]);

  useEffect(() => {
    if (audioRef.current && playlist?.songs[currentSongIndex]) {
      audioRef.current.src = playlist.songs[currentSongIndex].post.mediaUrl;
      if (playing) audioRef.current.play();
    }
  }, [currentSongIndex, playlist]);

  const fetchPlaylist = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/playlists/${playlistId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPlaylist(data.playlist);
      }
    } catch (error) {
      console.error("Fetch playlist error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSongs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/posts/saved`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAvailableSongs(data.savedPosts || data.posts || []);
      }
    } catch (error) {
      console.error("Fetch saved posts error:", error);
    }
  };

  const handlePlayPause = () => {
    if (playing) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setPlaying(!playing);
  };

  const handleNext = () => {
    if (playlist && currentSongIndex < playlist.songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
    }
  };

  const handleAddSong = async (postId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ postId })
      });

      if (response.ok) {
        fetchPlaylist();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add song");
      }
    } catch (error) {
      console.error("Add song error:", error);
    }
  };

  const handleRemoveSong = async (postId: string, songTitle: string) => {
    if (!confirm(`Remove "${songTitle}" from this playlist?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/playlists/${playlistId}/songs/${postId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPlaylist();
      }
    } catch (error) {
      console.error("Remove song error:", error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !playlist) return;

    const items = Array.from(playlist.songs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedSongs = items.map((item, idx) => ({ ...item, order: idx }));
    setPlaylist({ ...playlist, songs: updatedSongs });

    // Save order to backend
    const songOrders = updatedSongs.map((song, idx) => ({ postId: song.postId, order: idx }));
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/playlists/${playlistId}/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ songOrders })
      });
    } catch (error) {
      console.error("Reorder error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50">Playlist not found</p>
          <button onClick={() => router.push("/profile/playlists")} className="mt-4 text-gold">
            ← Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-gold">
            ← Back
          </button>
          <h1 className="text-white text-2xl font-bold">{playlist.name}</h1>
          <span className="text-gold text-sm">{playlist.songs.length} songs</span>
        </div>

        {/* Now Playing Bar */}
        {playlist.songs.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 rounded-full bg-gold flex items-center justify-center"
                >
                  {playing ? <Pause size={20} className="text-black" /> : <Play size={20} className="text-black" />}
                </button>
                <div>
                  <p className="text-white font-semibold">
                    {playlist.songs[currentSongIndex]?.post.title || "No song selected"}
                  </p>
                  <p className="text-white/40 text-sm">
                    {playlist.songs[currentSongIndex]?.post.creator.artistName || playlist.songs[currentSongIndex]?.post.creator.fullName}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrevious} disabled={currentSongIndex === 0} className="text-white/50 hover:text-white disabled:opacity-30">
                  Previous
                </button>
                <button onClick={handleNext} disabled={currentSongIndex === playlist.songs.length - 1} className="text-white/50 hover:text-white disabled:opacity-30">
                  Next
                </button>
              </div>
            </div>
            <audio ref={audioRef} onEnded={handleNext} />
          </div>
        )}

        {/* Song List */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-white font-semibold">Songs in this playlist</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 py-1 bg-gold/20 text-gold rounded-lg text-sm"
            >
              <Plus size={14} /> Add Song
            </button>
          </div>

          {playlist.songs.length === 0 ? (
            <div className="text-center py-12">
              <Music size={32} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/50">No songs in this playlist yet</p>
              <button onClick={() => setShowAddModal(true)} className="mt-3 text-gold text-sm">
                Add songs from your saved posts
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="songs">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {playlist.songs.map((song, index) => (
                      <Draggable key={song.id} draggableId={song.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical size={16} className="text-white/30" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{song.post.title}</p>
                                <p className="text-white/40 text-sm">{song.post.creator.artistName || song.post.creator.fullName}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveSong(song.postId, song.post.title)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Add Song Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-white text-xl font-bold mb-4">Add Songs</h2>
              {availableSongs.length === 0 ? (
                <p className="text-white/50 text-center py-8">
                  No saved songs found. Save songs from creators first.
                </p>
              ) : (
                <div className="space-y-2">
                  {availableSongs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => handleAddSong(song.id)}
                      className="w-full text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <p className="text-white font-medium">{song.title}</p>
                      <p className="text-white/40 text-sm">{song.creator?.artistName || song.creator?.fullName}</p>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full mt-4 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
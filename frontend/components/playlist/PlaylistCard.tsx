"use client";

import { useState } from "react";
import { Play, MoreHorizontal, Trash2, Edit2, Music } from "lucide-react";
import Image from "next/image";

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    description?: string;
    coverImage?: string;
    songs: any[];
  };
  onPlay: (playlist: any) => void;
  onEdit: (playlist: any) => void;
  onDelete: (playlistId: string) => void;
}

export default function PlaylistCard({ playlist, onPlay, onEdit, onDelete }: PlaylistCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const songCount = playlist.songs?.length || 0;

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-gold/30 transition-all group">
      <div
        className="aspect-square bg-gradient-to-br from-gold/20 to-black relative cursor-pointer"
        onClick={() => onPlay(playlist)}
      >
        {playlist.coverImage ? (
          <Image src={playlist.coverImage} alt={playlist.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={48} className="text-gold/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play size={32} className="text-gold" />
        </div>
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
            <p className="text-white/40 text-xs">{songCount} {songCount === 1 ? "song" : "songs"}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-white/40 hover:text-gold transition-all"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-32 bg-gray-900 rounded-lg shadow-lg border border-white/10 z-50 overflow-hidden">
                  <button
                    onClick={() => { onEdit(playlist); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2 text-sm"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => { onDelete(playlist.id); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-red-400 hover:bg-white/10 flex items-center gap-2 text-sm"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {playlist.description && (
          <p className="text-white/40 text-xs mt-1 line-clamp-2">{playlist.description}</p>
        )}
      </div>
    </div>
  );
}
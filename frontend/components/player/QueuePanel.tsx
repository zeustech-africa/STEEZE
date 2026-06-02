"use client";

import { X, Trash2, Repeat, Shuffle } from "lucide-react";

interface QueueSong {
  id: string;
  title: string;
  artistName: string;
  duration?: string;
}

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong?: QueueSong | null;
  queue: QueueSong[];
  onPlay: (song: QueueSong, index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onRepeat: () => void;
  onShuffle: () => void;
  repeatMode: "off" | "one" | "all";
  shuffled: boolean;
}

export default function QueuePanel({
  isOpen,
  onClose,
  currentSong,
  queue,
  onPlay,
  onRemove,
  onClear,
  onRepeat,
  onShuffle,
  repeatMode,
  shuffled,
}: QueuePanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-black/95 backdrop-blur-md border-l border-white/10 z-50 shadow-xl">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-white font-bold">Queue</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-white/10 flex justify-around">
        <button
          onClick={onShuffle}
          className={`p-2 rounded-lg transition-all ${shuffled ? "text-gold" : "text-white/50 hover:text-white"}`}
          title="Shuffle"
        >
          <Shuffle size={18} />
        </button>
        <button
          onClick={onRepeat}
          className={`p-2 rounded-lg transition-all ${repeatMode !== "off" ? "text-gold" : "text-white/50 hover:text-white"}`}
          title={`Repeat: ${repeatMode}`}
        >
          <Repeat size={18} />
          {repeatMode === "one" && <span className="text-xs ml-1">1</span>}
        </button>
        <button onClick={onClear} className="p-2 text-white/50 hover:text-red-400 rounded-lg transition-all" title="Clear Queue">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Queue List */}
      <div className="overflow-y-auto h-[calc(100%-120px)] p-2 space-y-1">
        {queue.length === 0 ? (
          <div className="text-center text-white/40 py-8">Queue is empty</div>
        ) : (
          queue.map((song, index) => (
            <div
              key={`${song.id}-${index}`}
              onClick={() => onPlay(song, index)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                currentSong?.id === song.id ? "bg-gold/20 border border-gold" : "hover:bg-white/5"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{song.title}</p>
                <p className="text-white/40 text-xs truncate">{song.artistName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-xs">{song.duration || "3:45"}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                  className="text-white/30 hover:text-red-400 transition-all"
                  title="Remove from queue"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
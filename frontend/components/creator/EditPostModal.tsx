"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";

interface Post {
  id: string;
  title: string;
  description?: string;
  price: number;
  isFree: boolean;
  type: string;
  thumbnailUrl?: string;
  coverArtUrl?: string;
  lyrics?: string;
  album?: string;
}

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditPostModal({ post, onClose, onSaved }: EditPostModalProps) {
  const [title, setTitle] = useState(post.title || "");
  const [description, setDescription] = useState(post.description || "");
  const [price, setPrice] = useState(post.price || 0);
  const [isFree, setIsFree] = useState(post.isFree);
  const [lyrics, setLyrics] = useState(post.lyrics || "");
  const [album, setAlbum] = useState(post.album || "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(post.thumbnailUrl || post.coverArtUrl || null);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(post.coverArtUrl || null);
  const [saving, setSaving] = useState(false);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverArtFile(file);
      setCoverArtPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    try {
      // Upload thumbnails if changed
      let thumbnailUrl = post.thumbnailUrl;
      let coverArtUrl = post.coverArtUrl;

      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        const res = await fetch("/api/creators/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) thumbnailUrl = data.post?.mediaUrl || thumbnailUrl;
      }

      if (coverArtFile) {
        const formData = new FormData();
        formData.append("file", coverArtFile);
        const res = await fetch("/api/creators/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) coverArtUrl = data.post?.mediaUrl || coverArtUrl;
      }

      const res = await fetch(`/api/creators/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: isFree ? 0 : price,
          isFree,
          thumbnailUrl,
          coverArtUrl,
          lyrics: lyrics.trim() || null,
          album: album.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSaved();
      }
    } catch (e) {
      console.error("Edit post failed", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-lg rounded-2xl p-6 border border-white/5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Edit Post</h3>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-white/60 text-xs mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/60 text-xs mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/50 resize-none"
            />
          </div>

          {/* Pricing */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="accent-gold"
              />
              <span className="text-white/60 text-xs">Free content</span>
            </label>
            {!isFree && (
              <div className="mt-2">
                <label className="block text-white/60 text-xs mb-1.5">Price (R)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={1}
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
            )}
          </div>

          {/* Video thumbnail */}
          {post.type === "video" && (
            <div>
              <label className="block text-white/60 text-xs mb-1.5">Custom Thumbnail (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="block w-full text-white/30 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gold/20 file:text-gold hover:file:bg-gold/30 file:cursor-pointer cursor-pointer"
              />
              {thumbnailPreview && (
                <img src={thumbnailPreview} className="w-32 h-20 object-cover rounded-lg mt-2" alt="Thumbnail preview" />
              )}
            </div>
          )}

          {/* Cover art for audio */}
          {post.type === "audio" && (
            <div>
              <label className="block text-white/60 text-xs mb-1.5">Cover Art (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverArtChange}
                className="block w-full text-white/30 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gold/20 file:text-gold hover:file:bg-gold/30 file:cursor-pointer cursor-pointer"
              />
              {coverArtPreview && (
                <img src={coverArtPreview} className="w-16 h-16 rounded object-cover mt-2" alt="Cover art preview" />
              )}
            </div>
          )}

          {/* Lyrics for audio */}
          {post.type === "audio" && (
            <div>
              <label className="block text-white/60 text-xs mb-1.5">Song Lyrics (optional)</label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={4}
                placeholder="Song lyrics..."
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/50 resize-none"
              />
            </div>
          )}

          {/* Album */}
          {post.type === "audio" && (
            <div>
              <label className="block text-white/60 text-xs mb-1.5">Album/EP Name (optional)</label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Album or EP name"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/50"
              />
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="w-full py-2.5 bg-gold/20 text-gold rounded-full font-semibold text-sm hover:bg-gold/30 disabled:opacity-30 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
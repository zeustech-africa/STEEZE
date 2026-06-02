"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, Film } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface Video {
  id: string;
  title: string;
  thumbnailUrl?: string;
  price?: number;
  isPaid?: boolean;
  mediaUrl: string;
  views?: number;
}

interface EditVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
  onUpdate: (updatedVideo: Video) => void;
  onDelete: (videoId: string) => void;
}

export default function EditVideoModal({ isOpen, onClose, video, onUpdate, onDelete }: EditVideoModalProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [isPaid, setIsPaid] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setPrice(video.price || 0);
      setIsPaid(video.isPaid || false);
      setThumbnailPreview(video.thumbnailUrl || null);
    }
  }, [video]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Thumbnail must be less than 2MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Thumbnail must be an image file");
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Video title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("isPaid", String(isPaid));
      formData.append("price", String(price));
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      const response = await fetch(`${API_URL}/api/creators/videos/${video?.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate({
          ...video!,
          title,
          price: isPaid ? price : 0,
          isPaid,
          thumbnailUrl: data.thumbnailUrl || thumbnailPreview,
        });
        onClose();
      } else {
        setError(data.error || "Failed to update video");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/creators/videos/${video?.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        onDelete(video!.id);
        setShowDeleteConfirm(false);
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete video");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !video) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl max-w-md w-full">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">Edit Video</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Thumbnail */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Thumbnail</label>
              <div
                className="aspect-video bg-white/5 rounded-lg border border-white/20 overflow-hidden cursor-pointer hover:border-gold transition-all"
                onClick={() => document.getElementById("thumbnailInput")?.click()}
              >
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={32} className="text-white/40" />
                  </div>
                )}
              </div>
              <input id="thumbnailInput" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleThumbnailChange} />
              <p className="text-white/30 text-xs mt-1">JPG, PNG, WEBP. Max 2MB.</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-white/80 text-sm mb-1">Video Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>

            {/* Paid Content Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-white/80 text-sm">This is paid content</span>
              </label>
            </div>

            {/* Price (if paid) */}
            {isPaid && (
              <div>
                <label className="block text-white/80 text-sm mb-1">Price (R)</label>
                <select
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  <option value={5}>R5</option>
                  <option value={10}>R10</option>
                  <option value={25}>R25</option>
                  <option value={50}>R50</option>
                </select>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Delete Video
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Video"
        message={`Are you sure you want to delete "${video.title}"? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
}
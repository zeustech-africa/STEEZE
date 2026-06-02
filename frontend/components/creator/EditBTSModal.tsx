"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, Mic, Image as ImageIcon, Film } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface BTSPost {
  id: string;
  title: string;
  description: string;
  date: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  likes?: number;
  comments?: number;
}

interface EditBTSModalProps {
  isOpen: boolean;
  onClose: () => void;
  bts: BTSPost | null;
  onUpdate: (updatedBTS: BTSPost) => void;
  onDelete: (btsId: string) => void;
}

export default function EditBTSModal({ isOpen, onClose, bts, onUpdate, onDelete }: EditBTSModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (bts) {
      setTitle(bts.title || "");
      setDescription(bts.description || "");
      setDate(bts.date || "");
      setMediaPreview(bts.mediaUrl || null);
      setMediaType(bts.mediaType || "image");
    }
  }, [bts]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Media file must be less than 10MB");
        return;
      }
      if (file.type.startsWith("image/")) {
        setMediaType("image");
      } else if (file.type.startsWith("video/")) {
        setMediaType("video");
      } else {
        setError("File must be an image or video");
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (!date.trim()) {
      setError("Date is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("date", date);
      if (mediaFile) {
        formData.append("media", mediaFile);
        formData.append("mediaType", mediaType);
      }

      const response = await fetch(`${API_URL}/api/creators/bts/${bts?.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate({
          ...bts!,
          title: title.trim(),
          description: description.trim(),
          date,
          mediaUrl: data.mediaUrl || mediaPreview,
          mediaType: data.mediaType || mediaType,
        });
        onClose();
      } else {
        setError(data.error || "Failed to update BTS post");
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
      const response = await fetch(`${API_URL}/api/creators/bts/${bts?.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        onDelete(bts!.id);
        setShowDeleteConfirm(false);
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete BTS post");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !bts) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl max-w-md w-full">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">Edit Behind the Scenes</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Media Preview */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Media (Image or Video)</label>
              <div
                className="aspect-video bg-white/5 rounded-lg border border-white/20 overflow-hidden cursor-pointer hover:border-gold transition-all"
                onClick={() => document.getElementById("mediaInput")?.click()}
              >
                {mediaPreview ? (
                  mediaType === "video" ? (
                    <video src={mediaPreview} className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Mic size={32} className="text-white/40" />
                  </div>
                )}
              </div>
              <input id="mediaInput" type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
              <p className="text-white/30 text-xs mt-1">JPG, PNG, GIF, MP4. Max 10MB.</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-white/80 text-sm mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Studio Session, Rehearsals"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/80 text-sm mb-1">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Tell the story behind this moment..."
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold resize-none"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-white/80 text-sm mb-1">Date *</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g., 2 days ago, May 15, 2025"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>

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
                Delete Post
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
        title="Delete BTS Post"
        message={`Are you sure you want to delete "${bts.title}"? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
}
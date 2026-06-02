"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface Photo {
  id: string;
  imageUrl: string;
  story?: string;
  likes?: number;
  comments?: number;
}

interface EditPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo | null;
  onUpdate: (updatedPhoto: Photo) => void;
  onDelete: (photoId: string) => void;
}

export default function EditPhotoModal({ isOpen, onClose, photo, onUpdate, onDelete }: EditPhotoModalProps) {
  const [story, setStory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (photo) {
      setStory(photo.story || "");
      setImageFile(null);
      setImagePreview(photo.imageUrl || null);
      setError(null);
    }
  }, [photo]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("File must be an image");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("story", story);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(`${API_URL}/api/creators/photos/${photo?.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate({
          ...photo!,
          story,
          imageUrl: data.imageUrl || photo!.imageUrl,
        });
        onClose();
      } else {
        setError(data.error || "Failed to update photo");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/creators/photos/${photo?.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        onDelete(photo!.id);
        setShowDeleteConfirm(false);
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete photo");
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !photo) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl max-w-md w-full">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">Edit Photo</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Image Preview */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Photo</label>
              <div
                className="aspect-square bg-white/5 rounded-lg border border-white/20 overflow-hidden cursor-pointer hover:border-gold transition-all"
                onClick={() => document.getElementById("photoImageInput")?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={32} className="text-white/40" />
                  </div>
                )}
              </div>
              <input id="photoImageInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageChange} />
              <p className="text-white/30 text-xs mt-1">JPG, PNG, WEBP, GIF. Max 5MB.</p>
            </div>

            {/* Story/Caption */}
            <div>
              <label className="block text-white/80 text-sm mb-1">Story / Caption</label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Tell the story behind this photo..."
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold resize-none"
              />
              <p className="text-white/30 text-xs mt-1">Optional. Max 500 characters.</p>
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
                Delete Photo
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
        title="Delete Photo"
        message={`Are you sure you want to delete this photo? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
}
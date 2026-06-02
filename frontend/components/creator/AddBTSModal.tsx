"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, Mic, Image as ImageIcon, Film } from "lucide-react";

interface AddBTSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBTS: any) => void;
}

export default function AddBTSModal({ isOpen, onClose, onSuccess }: AddBTSModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setMediaFile(null);
    setMediaPreview(null);
    setUploadProgress(0);
    setError(null);
    setMediaType("image");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    if (!mediaFile) {
      setError("Please select an image or video");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("date", date);
    formData.append("media", mediaFile);
    formData.append("mediaType", mediaType);

    try {
      const token = localStorage.getItem("token");
      
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/api/creators/bts`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          onSuccess(response.bts);
          handleClose();
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            setError(errorResponse.error || "Failed to add BTS post");
          } catch {
            setError("Failed to add BTS post");
          }
        }
        setLoading(false);
      };
      
      xhr.onerror = () => {
        setError("Network error. Please try again.");
        setLoading(false);
      };
      
      xhr.send(formData);
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">Add Behind the Scenes</h2>
          <button onClick={handleClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Media Upload */}
          <div>
            <label className="block text-white/80 text-sm mb-2">Media (Image or Video) *</label>
            <div
              className="aspect-video bg-white/5 rounded-lg border-2 border-dashed border-white/20 overflow-hidden cursor-pointer hover:border-gold transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              {mediaPreview ? (
                mediaType === "video" ? (
                  <video src={mediaPreview} className="w-full h-full object-cover" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Upload size={32} className="text-white/40 mb-2" />
                  <p className="text-white/50 text-sm">Click to upload</p>
                  <p className="text-white/30 text-xs">JPG, PNG, GIF, MP4 (Max 10MB)</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaChange}
            />
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
              required
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
              required
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
              required
            />
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div>
              <div className="flex justify-between text-white/60 text-sm mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Add BTS Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
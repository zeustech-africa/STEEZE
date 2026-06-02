"use client";

import { useState, useRef } from "react";
import { X, Upload, Music, Film, Camera, Loader2 } from "lucide-react";
import { uploadManager } from "@/lib/uploadManager";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  onUploadSuccess?: (newContent: any) => void;
}

type ContentType = "music" | "video" | "photo";

export default function UploadModal({ isOpen, onClose, creatorId, onUploadSuccess }: UploadModalProps) {
  const [contentType, setContentType] = useState<ContentType>("music");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [isPaid, setIsPaid] = useState(false);
  const [story, setStory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice(0);
    setIsPaid(false);
    setStory("");
    setFile(null);
    setPreview(null);
    setUploadProgress(0);
    setError(null);
    setContentType("music");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    const maxSize = contentType === "photo" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Validate file type
    if (contentType === "music" && !selectedFile.type.startsWith("audio/")) {
      setError("Please select an audio file (MP3, WAV, etc.)");
      return;
    }
    if (contentType === "video" && !selectedFile.type.startsWith("video/")) {
      setError("Please select a video file (MP4, MOV, etc.)");
      return;
    }
    if (contentType === "photo" && !selectedFile.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (contentType === "photo" && !story.trim()) {
      setError("Story/caption is required for photos");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setError(null);

    // Use upload manager for resumable uploads
    const taskId = uploadManager.addFile(file);

    // Store metadata on the task for the backend to use
    const task = uploadManager.getTask(taskId);
    if (task) {
      (task as any).metadata = {
        type: contentType,
        title: title.trim(),
        description,
        isPaid,
        price: isPaid ? price : 0,
        story,
      };
    }

    // Set up callbacks
    uploadManager.setOptions({
      onProgress: (id, progress) => {
        if (id === taskId) {
          setUploadProgress(progress);
        }
      },
      onComplete: (id, data) => {
        if (id === taskId) {
          if (onUploadSuccess) onUploadSuccess(data.content);
          setLoading(false);
          handleClose();
        }
      },
      onError: (id, err) => {
        if (id === taskId) {
          setError(`Upload failed: ${err}`);
          setLoading(false);
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">Upload Content</h2>
          <button onClick={handleClose} className="text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Content Type Selector */}
          <div>
            <label className="block text-white/80 text-sm mb-2">Content Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setContentType("music")}
                className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  contentType === "music"
                    ? "bg-gold text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <Music size={18} /> Music
              </button>
              <button
                type="button"
                onClick={() => setContentType("video")}
                className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  contentType === "video"
                    ? "bg-gold text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <Film size={18} /> Video
              </button>
              <button
                type="button"
                onClick={() => setContentType("photo")}
                className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  contentType === "photo"
                    ? "bg-gold text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <Camera size={18} /> Photo
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-white/80 text-sm mb-2">
              {contentType === "music" ? "Audio File" : contentType === "video" ? "Video File" : "Image File"} *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                file ? "border-gold bg-gold/5" : "border-white/20 hover:border-gold"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                contentType === "video" ? (
                  <video src={preview} className="max-h-32 mx-auto rounded" controls={false} />
                ) : contentType === "photo" ? (
                  <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Music size={48} className="text-gold mb-2" />
                    <p className="text-white text-sm">{file?.name}</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center">
                  <Upload size={48} className="text-white/40 mb-2" />
                  <p className="text-white/50">Click to select file</p>
                  <p className="text-white/30 text-xs mt-1">
                    {contentType === "music" ? "MP3, WAV (Max 50MB)" :
                     contentType === "video" ? "MP4, MOV (Max 50MB)" :
                     "JPG, PNG, WEBP (Max 5MB)"}
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={contentType === "music" ? "audio/*" : contentType === "video" ? "video/*" : "image/*"}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={contentType === "music" ? "Song title" : contentType === "video" ? "Video title" : "Photo title"}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
            />
          </div>

          {/* Description (for music/video) */}
          {(contentType === "music" || contentType === "video") && (
            <div>
              <label className="block text-white/80 text-sm mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Tell fans about this content..."
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold resize-none"
              />
            </div>
          )}

          {/* Story (for photos) */}
          {contentType === "photo" && (
            <div>
              <label className="block text-white/80 text-sm mb-1">Story / Caption *</label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={3}
                placeholder="Tell the story behind this photo..."
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold resize-none"
              />
            </div>
          )}

          {/* Paid Content Toggle (for music/video) */}
          {(contentType === "music" || contentType === "video") && (
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
          )}

          {/* Price (if paid) */}
          {isPaid && (contentType === "music" || contentType === "video") && (
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold transition-all">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading || !file}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
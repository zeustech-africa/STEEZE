"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  Music,
  Video,
  ImageIcon,
  Type,
  DollarSign,
  Globe,
  Lock,
  Unlock,
  Clock,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
}

type ContentType = "audio" | "video" | "image" | "text";

interface DistributionOption {
  key: string;
  label: string;
}
const distributionOptions: DistributionOption[] = [
  { key: "distrokid", label: "DistroKid" },
  { key: "youtube", label: "YouTube" },
  { key: "spotify", label: "Spotify" },
  { key: "appleMusic", label: "Apple Music" },
  { key: "tidal", label: "Tidal" },
];

const contentTypes: {
  type: ContentType;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  accept: string;
}[] = [
  { type: "audio", icon: Music, label: "Audio", accept: "audio/*" },
  { type: "video", icon: Video, label: "Video", accept: "video/*" },
  { type: "image", icon: ImageIcon, label: "Image", accept: "image/*" },
  { type: "text", icon: Type, label: "Text Post", accept: "" },
];

export default function UploadModal({
  isOpen,
  onClose,
  creatorId,
}: UploadModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [contentType, setContentType] = useState<ContentType>("audio");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState<number>(0);
  const [distribution, setDistribution] = useState<Record<string, boolean>>({
    distrokid: false,
    youtube: true,
    spotify: true,
    appleMusic: true,
    tidal: false,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FEATURE 20: Thumbnail for videos
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // FEATURE 21: Cover art for audio
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);

  // FEATURE 22: Lyrics
  const [lyrics, setLyrics] = useState("");

  // FEATURE 23: Album/EP grouping
  const [album, setAlbum] = useState("");

  // FEATURE 24: Schedule post
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  // FEATURE 25: Draft
  const [savingDraft, setSavingDraft] = useState(false);

  // AGE RESTRICTION: 18+ content flag
  const [isAgeRestricted, setIsAgeRestricted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectType = (type: ContentType) => {
    setContentType(type);
    if (type === "text") {
      setFile(null);
      setPreview(null);
      setStep(2);
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.accept =
          type === "audio" ? "audio/*" : type === "video" ? "video/*" : "image/*";
        fileInputRef.current.click();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
    setStep(2);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setThumbnailFile(f);
      setThumbnailPreview(URL.createObjectURL(f));
    }
  };

  const handleCoverArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setCoverArtFile(f);
      setCoverArtPreview(URL.createObjectURL(f));
    }
  };

  const toggleDistribution = (key: string) => {
    setDistribution((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const uploadFile = async (fileToUpload: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", fileToUpload);
    try {
      const res = await fetch("/api/creators/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      return data.post?.mediaUrl || null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (asDraft = false) => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (contentType !== "text" && !file) {
      setError("File is required");
      return;
    }

    if (asDraft) {
      setSavingDraft(true);
    } else {
      setUploading(true);
    }
    setError(null);

    try {
      // Upload thumbnail if present
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile);
      }

      // Upload cover art if present
      let coverArtUrl: string | null = null;
      if (coverArtFile) {
        coverArtUrl = await uploadFile(coverArtFile);
      }

      const formData = new FormData();
      formData.append("type", contentType);
      if (file) formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("isFree", String(isFree));
      formData.append("price", String(price));
      formData.append("distribution", JSON.stringify(distribution));
      formData.append("creatorId", creatorId);
      formData.append("isAgeRestricted", String(isAgeRestricted));

      // New fields
      if (thumbnailUrl) formData.append("thumbnailUrl", thumbnailUrl);
      if (coverArtUrl) formData.append("coverArtUrl", coverArtUrl);
      if (lyrics.trim()) formData.append("lyrics", lyrics.trim());
      if (album.trim()) formData.append("album", album.trim());

      // Schedule or Draft
      if (asDraft) {
        formData.append("status", "draft");
      } else if (scheduleEnabled && scheduledDate) {
        formData.append("status", "scheduled");
        formData.append("scheduledFor", scheduledDate);
      } else {
        formData.append("status", "pending_admin");
      }

      const res = await fetch("/api/creators/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        onClose();
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.message || "Upload failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
      setSavingDraft(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    setIsFree(true);
    setPrice(0);
    setError(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setCoverArtFile(null);
    setCoverArtPreview(null);
    setLyrics("");
    setAlbum("");
    setScheduleEnabled(false);
    setScheduledDate("");
    setIsAgeRestricted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gold flex items-center gap-2">
                <Upload size={20} /> Upload Content
              </h2>
              <button
                onClick={handleClose}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step 1: Type selection */}
            {step === 1 && (
              <div>
                <p className="text-white/50 text-sm mb-4">
                  What do you want to share with your fans?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {contentTypes.map((ct) => (
                    <button
                      key={ct.type}
                      onClick={() => selectType(ct.type)}
                      className="p-5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-gold/30 rounded-xl text-center transition-all group"
                    >
                      <span className="mx-auto mb-2 block text-gold/70 group-hover:text-gold transition-colors">
                        <ct.icon size={28} />
                      </span>
                      <span className="text-white text-sm font-medium">
                        {ct.label}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="audio/*"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Preview */}
                {preview && (
                  <div className="rounded-xl overflow-hidden bg-black/30">
                    {contentType === "audio" && (
                      <audio src={preview} controls className="w-full" />
                    )}
                    {contentType === "video" && (
                      <video src={preview} poster={thumbnailPreview || undefined} controls className="w-full max-h-48" />
                    )}
                    {contentType === "image" && (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full max-h-48 object-contain"
                      />
                    )}
                  </div>
                )}

                {file && (
                  <p className="text-white/30 text-xs truncate">{file.name}</p>
                )}

                {/* FEATURE 20: Video thumbnail upload */}
                {contentType === "video" && (
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Custom Thumbnail (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="block w-full text-white/30 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gold/20 file:text-gold hover:file:bg-gold/30 file:cursor-pointer cursor-pointer"
                    />
                    {thumbnailPreview && (
                      <img src={thumbnailPreview} className="w-32 h-20 object-cover rounded-lg mt-2" alt="Thumbnail preview" />
                    )}
                  </div>
                )}

                {/* FEATURE 21: Cover art for audio */}
                {contentType === "audio" && (
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Cover Art (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverArtUpload}
                      className="block w-full text-white/30 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gold/20 file:text-gold hover:file:bg-gold/30 file:cursor-pointer cursor-pointer"
                    />
                    {coverArtPreview && (
                      <img src={coverArtPreview} className="w-16 h-16 rounded object-cover mt-2" alt="Cover art preview" />
                    )}
                  </div>
                )}

                {/* Title */}
                <div>
                  <input
                    type="text"
                    placeholder="Title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm resize-none"
                  />
                </div>

                {/* FEATURE 22: Lyrics */}
                {contentType === "audio" && (
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Song Lyrics (optional)</label>
                    <textarea
                      placeholder="Enter song lyrics..."
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm resize-none"
                    />
                  </div>
                )}

                {/* FEATURE 23: Album grouping */}
                {contentType === "audio" && (
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Album/EP Name (optional)</label>
                    <input
                      type="text"
                      placeholder="Album or EP name"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                    />
                  </div>
                )}

                {/* Free / Paid */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="access"
                      checked={isFree}
                      onChange={() => setIsFree(true)}
                      className="accent-gold"
                    />
                    <span className="text-white text-sm flex items-center gap-1.5">
                      <Unlock size={13} color="#4ade80" /> Free
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="access"
                      checked={!isFree}
                      onChange={() => setIsFree(false)}
                      className="accent-gold"
                    />
                    <span className="text-white text-sm flex items-center gap-1.5">
                      <Lock size={13} color="#FFD700" /> Paid
                    </span>
                  </label>
                </div>

                {!isFree && (
                  <div>
                    <label className="flex items-center gap-1 text-white/40 text-xs mb-1 ml-1">
                      <DollarSign size={12} /> Price (ZAR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="50"
                      value={price || ""}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                    />
                  </div>
                )}

                {/* Distribution (music only) */}
                {contentType === "audio" && (
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-white/40 text-xs flex items-center gap-1.5 mb-3">
                      <Globe size={12} /> Distribution
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {distributionOptions.map((opt) => (
                        <label
                          key={opt.key}
                          className="flex items-center gap-2 cursor-pointer text-sm text-white/60 hover:text-white transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={distribution[opt.key]}
                            onChange={() => toggleDistribution(opt.key)}
                            className="accent-gold rounded"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* AGE RESTRICTION: 18+ content flag */}
                <div className="border-t border-white/5 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAgeRestricted}
                      onChange={(e) => setIsAgeRestricted(e.target.checked)}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-white">This content is for adults only (18+)</span>
                  </label>
                  {isAgeRestricted && (
                    <p className="text-white/40 text-xs mt-2 ml-7">Age-restricted content will only be visible to users over 18.</p>
                  )}
                </div>

                {/* FEATURE 24: Schedule toggle */}
                <div className="border-t border-white/5 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleEnabled}
                      onChange={() => setScheduleEnabled(!scheduleEnabled)}
                      className="accent-gold rounded"
                    />
                    <span className="text-white/60 text-xs flex items-center gap-1.5">
                      <Clock size={12} /> Schedule for later
                    </span>
                  </label>
                  {scheduleEnabled && (
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold/50 transition-colors"
                    />
                  )}
                </div>

                {/* Error */}
                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 flex-wrap">
                  <button
                    onClick={() => setStep(1)}
                    disabled={uploading || savingDraft}
                    className="px-4 py-2 text-white/50 hover:text-white border border-white/10 rounded-full text-sm transition-colors disabled:opacity-30"
                  >
                    Back
                  </button>

                  {/* FEATURE 25: Save Draft */}
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={uploading || savingDraft}
                    className="px-4 py-2 text-white/40 hover:text-white border border-white/10 rounded-full text-sm transition-colors flex items-center gap-1.5 disabled:opacity-30"
                  >
                    <FileText size={14} />
                    {savingDraft ? "Saving..." : "Save Draft"}
                  </button>

                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={uploading || savingDraft}
                    className="flex-1 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg hover:shadow-gold/20 transition-all text-sm disabled:opacity-50"
                  >
                    {uploading ? "Publishing..." : scheduleEnabled ? "Schedule" : "Publish"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
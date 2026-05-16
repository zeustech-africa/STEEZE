"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Camera,
  Save,
  Globe,
  Eye,
  LayoutTemplate,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: any;
}

const TEMPLATES = ["classic", "premium", "feminine", "muscular", "minimal"];

export default function EditProfileModal({
  isOpen,
  onClose,
  creator,
}: EditProfileModalProps) {
  const router = useRouter();
  const [artistName, setArtistName] = useState(creator.artistName || "");
  const [tagline, setTagline] = useState(creator.tagline || "");
  const [bio, setBio] = useState(creator.fullBio || "");
  const [musicJourney, setMusicJourney] = useState(creator.musicJourney || "");
  const [category, setCategory] = useState(creator.category || "");
  const [template, setTemplate] = useState(creator.template || "classic");
  const [socialLinks, setSocialLinks] = useState({
    instagram: creator.socialLinks?.instagram || "",
    twitter: creator.socialLinks?.twitter || "",
    tiktok: creator.socialLinks?.tiktok || "",
    youtube: creator.socialLinks?.youtube || "",
    spotify: creator.socialLinks?.spotify || "",
    appleMusic: creator.socialLinks?.appleMusic || "",
    facebook: creator.socialLinks?.facebook || "",
    website: creator.socialLinks?.website || "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updateSocial = (key: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  };

  const updateTemplate = async (t: string) => {
    setTemplate(t);
    try {
      await fetch(`/api/creators/${creator.id}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: t }),
      });
    } catch {
      // non-blocking
    }
  };

  const handleSave = async () => {
    if (!artistName.trim()) {
      setError("Artist name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const formData = new FormData();
    formData.append("artistName", artistName);
    formData.append("tagline", tagline);
    formData.append("fullBio", bio);
    formData.append("musicJourney", musicJourney);
    formData.append("category", category);
    formData.append("template", template);
    formData.append("socialLinks", JSON.stringify(socialLinks));
    if (coverFile) formData.append("coverImage", coverFile);

    try {
      const res = await fetch(`/api/creators/${creator.id}/update`, {
        method: "PUT",
        body: formData,
      });
      if (res.ok) {
        onClose();
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to save");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const username = creator.username || creator.artistName || "";

  if (!isOpen) return null;

  const socialFields = [
    { key: "instagram", label: "Instagram", placeholder: "@username" },
    { key: "twitter", label: "Twitter", placeholder: "@username" },
    { key: "tiktok", label: "TikTok", placeholder: "@username" },
    { key: "youtube", label: "YouTube", placeholder: "Channel URL" },
    { key: "spotify", label: "Spotify", placeholder: "Artist URL" },
    { key: "appleMusic", label: "Apple Music", placeholder: "Artist URL" },
    { key: "facebook", label: "Facebook", placeholder: "Page URL" },
    { key: "website", label: "Website", placeholder: "https://..." },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gold">Edit Profile</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Feature 18: Preview as Fan */}
              <button
                onClick={() => router.push(`/creator/${username}?preview=true`)}
                className="w-full py-2 border border-gold/30 text-gold rounded-full text-sm hover:bg-gold/10 transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={14} />
                Preview as Fan
              </button>

              {/* Feature 19: Template Selector */}
              <div>
                <label className="text-white/40 text-xs mb-2 flex items-center gap-1.5">
                  <LayoutTemplate size={12} /> Template Style
                </label>
                <div className="grid grid-cols-5 gap-2 mt-1.5">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t}
                      onClick={() => updateTemplate(t)}
                      className={`p-2 rounded-lg text-xs capitalize transition-all ${
                        template === t
                          ? "bg-gold text-black font-semibold"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className="text-white/40 text-xs mb-1 block">Cover Image</label>
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-32 bg-white/[0.03] border border-white/10 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-gold/30 transition-colors overflow-hidden relative"
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  ) : creator.coverImage ? (
                    <img src={creator.coverImage} alt="Current cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-white/20">
                      <Camera size={24} className="mx-auto mb-1" />
                      <span className="text-xs">Upload cover</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>

              {/* Artist name */}
              <input
                type="text"
                placeholder="Artist Name *"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm"
              />

              {/* Tagline */}
              <input
                type="text"
                placeholder="Tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm"
              />

              {/* Category */}
              <input
                type="text"
                placeholder="Category (e.g., Hip Hop, Pop, R&B)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm"
              />

              {/* Bio */}
              <textarea
                placeholder="Full Biography"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm resize-none"
              />

              {/* Music Journey */}
              <textarea
                placeholder="Music Journey"
                value={musicJourney}
                onChange={(e) => setMusicJourney(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm resize-none"
              />

              {/* Social Links */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-white/40 text-xs flex items-center gap-1.5 mb-3">
                  <Globe size={12} /> Social Links
                </p>
                <div className="space-y-2">
                  {socialFields.map((field) => (
                    <input
                      key={field.key}
                      type="text"
                      placeholder={field.label + " - " + field.placeholder}
                      value={(socialLinks as any)[field.key]}
                      onChange={(e) => updateSocial(field.key, e.target.value)}
                      className="w-full px-4 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                    />
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && <p className="text-red-400 text-xs">{error}</p>}

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg hover:shadow-gold/20 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
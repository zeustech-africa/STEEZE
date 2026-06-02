"use client";

import { useState, useEffect } from "react";
import { X, Upload, Camera, Image as ImageIcon, Loader2 } from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: {
    id: string;
    artistName: string;
    tagline?: string;
    shortBio?: string;
    fullBio?: string;
    profilePicUrl?: string;
    coverPhotoUrl?: string;
    coverVideoUrl?: string;
    socialLinks?: {
      instagram?: string;
      tiktok?: string;
      youtube?: string;
      spotify?: string;
      appleMusic?: string;
      twitter?: string;
    };
  };
  onUpdate: (updatedCreator: any) => void;
}

export default function EditProfileModal({ isOpen, onClose, creator, onUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    artistName: "",
    tagline: "",
    shortBio: "",
    fullBio: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    spotify: "",
    appleMusic: "",
    twitter: "",
  });
  
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverType, setCoverType] = useState<"image" | "video">("image");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (creator) {
      setFormData({
        artistName: creator.artistName || "",
        tagline: creator.tagline || "",
        shortBio: creator.shortBio || "",
        fullBio: creator.fullBio || "",
        instagram: creator.socialLinks?.instagram || "",
        tiktok: creator.socialLinks?.tiktok || "",
        youtube: creator.socialLinks?.youtube || "",
        spotify: creator.socialLinks?.spotify || "",
        appleMusic: creator.socialLinks?.appleMusic || "",
        twitter: creator.socialLinks?.twitter || "",
      });
      setProfilePicPreview(creator.profilePicUrl || null);
      setCoverPreview(creator.coverPhotoUrl || creator.coverVideoUrl || null);
      if (creator.coverVideoUrl) setCoverType("video");
    }
  }, [creator]);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Profile picture must be less than 2MB");
        return;
      }
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        setCoverType("video");
      } else if (file.type.startsWith("image/")) {
        setCoverType("image");
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      
      // First, update profile text fields
      const profileResponse = await fetch(`${API_URL}/api/creators/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          artistName: formData.artistName,
          tagline: formData.tagline,
          shortBio: formData.shortBio,
          fullBio: formData.fullBio,
          socialLinks: {
            instagram: formData.instagram,
            tiktok: formData.tiktok,
            youtube: formData.youtube,
            spotify: formData.spotify,
            appleMusic: formData.appleMusic,
            twitter: formData.twitter,
          }
        })
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      // Upload profile picture if changed
      if (profilePicFile) {
        const picFormData = new FormData();
        picFormData.append("profilePic", profilePicFile);
        
        const picResponse = await fetch(`${API_URL}/api/creators/creator/profile-picture`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: picFormData
        });
        
        if (!picResponse.ok) {
          console.error("Profile picture upload failed");
        }
      }

      // Upload cover if changed
      if (coverFile) {
        const coverFormData = new FormData();
        coverFormData.append("cover", coverFile);
        coverFormData.append("type", coverType);
        
        const coverResponse = await fetch(`${API_URL}/api/creators/cover`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: coverFormData
        });
        
        if (!coverResponse.ok) {
          console.error("Cover upload failed");
        }
      }

      // Fetch updated creator data
      const updatedResponse = await fetch(`${API_URL}/api/creators/${creator.artistName?.toLowerCase().replace(/\s+/g, "")}`);
      const updatedData = await updatedResponse.json();
      
      if (updatedData.success) {
        onUpdate(updatedData.creator);
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">Edit Profile</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-white/80 text-sm mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-gold overflow-hidden">
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold">
                    <Camera size={32} />
                  </div>
                )}
              </div>
              <label className="px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm cursor-pointer hover:bg-gold/30 transition-all">
                Change Picture
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProfilePicChange} />
              </label>
            </div>
            <p className="text-white/30 text-xs mt-2">JPG, PNG, WEBP. Max 2MB.</p>
          </div>

          {/* Cover Image/Video */}
          <div>
            <label className="block text-white/80 text-sm mb-2">Cover Image/Video</label>
            <div className="relative aspect-video bg-white/5 rounded-lg border border-white/20 overflow-hidden">
              {coverPreview ? (
                coverType === "video" ? (
                  <video src={coverPreview} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40">
                  <ImageIcon size={32} />
                </div>
              )}
              <label className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-sm rounded cursor-pointer hover:bg-gold/70 transition-all">
                Change Cover
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleCoverChange} />
              </label>
            </div>
            <p className="text-white/30 text-xs mt-2">JPG, PNG, WEBP, MP4. Max 10MB.</p>
          </div>

          {/* Artist Name */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Artist Name *</label>
            <input
              type="text"
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
              required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g., Rapper • Singer • Songwriter"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
            />
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Short Bio (1-2 sentences)</label>
            <input
              type="text"
              value={formData.shortBio}
              onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
              placeholder="Brief description of you"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
            />
          </div>

          {/* Full Bio */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Full Biography</label>
            <textarea
              value={formData.fullBio}
              onChange={(e) => setFormData({ ...formData, fullBio: e.target.value })}
              rows={5}
              placeholder="Your full story, achievements, journey..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold resize-none"
            />
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-white/80 text-sm mb-3">Social Media Links</label>
            <div className="space-y-3">
              <input type="text" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="Instagram URL" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
              <input type="text" value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} placeholder="TikTok URL" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
              <input type="text" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} placeholder="YouTube URL" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
              <input type="text" value={formData.spotify} onChange={(e) => setFormData({ ...formData, spotify: e.target.value })} placeholder="Spotify URL" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
              <input type="text" value={formData.appleMusic} onChange={(e) => setFormData({ ...formData, appleMusic: e.target.value })} placeholder="Apple Music URL" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
              <input type="text" value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} placeholder="Twitter/X URL" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-500/20 border border-green-500 rounded-lg">
              <p className="text-green-400 text-sm">Profile updated successfully!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
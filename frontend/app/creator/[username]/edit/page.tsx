'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Save, Loader2, Palette, Camera } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function EditCreatorProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    website: '',
    location: '',
    instagram: '',
    twitter: '',
    youtube: '',
    spotify: '',
    tiktok: '',
    subscriptionPrice: 0,
    genre: '',
    profilePhotoUrl: '',
    profilePicUrl: '',
    coverPhotoUrl: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.getUser(username);
        setProfile(data);
          setForm({
            displayName: data.displayName || data.artistName || '',
            bio: data.bio || '',
            website: data.website || '',
            location: data.location || '',
            instagram: data.instagram || '',
            twitter: data.twitter || '',
            youtube: data.youtube || '',
            spotify: data.spotify || '',
            tiktok: data.tiktok || '',
            subscriptionPrice: data.subscriptionPrice || 0,
            genre: data.genre || '',
            profilePhotoUrl: data.profilePhotoUrl || data.profilePicUrl || '',
            profilePicUrl: data.profilePicUrl || data.profilePhotoUrl || '',
            coverPhotoUrl: data.coverPhotoUrl || '',
          });
      } catch (err: any) {
        setError(err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    if (username) loadProfile();
  }, [username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'subscriptionPrice' ? Number(value) : value,
    }));
  };

  const handleProfilePicUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must be less than 2MB');
      return;
    }

    setUploadingPic(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('profilePic', file);

      const result = await api.uploadProfilePicture(formData);

      if (result.success && result.profilePicUrl) {
        setForm((prev) => ({
          ...prev,
          profilePicUrl: result.profilePicUrl,
          profilePhotoUrl: result.profilePicUrl,
        }));
        setSuccessMsg('Profile picture updated!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(result.error || 'Failed to upload profile picture');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.updateProfile(username, form);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => router.push(`/creator/${username}`), 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2 bg-gold text-black rounded-full font-semibold hover:bg-gold/80 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
            <p className="text-gray-400 text-sm">@{username}</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
            {successMsg}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Template Selector */}
        <div className="mb-8">
          <Link
            href={`/creator/${username}/edit/templates`}
            className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
          >
            <Palette size={18} className="text-gold" />
            <span className="text-white">Website Templates</span>
            <span className="ml-auto text-white/30 text-xs">Change look</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder="Your artist name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors resize-none"
              placeholder="Tell your fans about yourself..."
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Primary Genre</label>
            <select
              name="genre"
              value={form.genre}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"
            >
              <option value="" className="bg-black">Select a genre</option>
              <option value="Pop" className="bg-black">Pop</option>
              <option value="Hip Hop" className="bg-black">Hip Hop</option>
              <option value="R&B" className="bg-black">R&B</option>
              <option value="Rock" className="bg-black">Rock</option>
              <option value="Electronic" className="bg-black">Electronic</option>
              <option value="Jazz" className="bg-black">Jazz</option>
              <option value="Classical" className="bg-black">Classical</option>
              <option value="Country" className="bg-black">Country</option>
              <option value="Afrobeats" className="bg-black">Afrobeats</option>
              <option value="Amapiano" className="bg-black">Amapiano</option>
              <option value="Gospel" className="bg-black">Gospel</option>
              <option value="Reggae" className="bg-black">Reggae</option>
              <option value="Other" className="bg-black">Other</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder="City, Country"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder="https://your-website.com"
            />
          </div>

          {/* Subscription Price */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Subscription Price (ZAR/month)
            </label>
            <input
              type="number"
              name="subscriptionPrice"
              value={form.subscriptionPrice}
              onChange={handleChange}
              min={0}
              step={1}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Social Links</h3>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Instagram</label>
              <input
                type="text"
                name="instagram"
                value={form.instagram}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Twitter / X</label>
              <input
                type="text"
                name="twitter"
                value={form.twitter}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">YouTube</label>
              <input
                type="text"
                name="youtube"
                value={form.youtube}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
                placeholder="Channel URL"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Spotify</label>
              <input
                type="text"
                name="spotify"
                value={form.spotify}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
                placeholder="Artist URL or ID"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">TikTok</label>
              <input
                type="text"
                name="tiktok"
                value={form.tiktok}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
                placeholder="@username"
              />
            </div>
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-white text-sm font-medium mb-3">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/5 border-[3px] border-gold overflow-hidden flex-shrink-0">
                {form.profilePicUrl ? (
                  <Image
                    src={form.profilePicUrl}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gold">
                    {form.displayName?.charAt(0) || profile?.artistName?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('editProfilePic')?.click()}
                  disabled={uploadingPic}
                  className="flex items-center gap-2 px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm hover:bg-gold/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPic ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera size={16} />
                      Change Picture
                    </>
                  )}
                </button>
                <p className="text-white/30 text-xs">JPG, PNG, WEBP. Max 2MB.</p>
              </div>
              <input
                id="editProfilePic"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleProfilePicUpdate}
              />
            </div>
          </div>

          {/* Cover Photo URL */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Cover Photo URL</label>
            <input
              type="url"
              name="coverPhotoUrl"
              value={form.coverPhotoUrl}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder="https://..."
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gold text-black rounded-full font-semibold hover:bg-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white/5 text-white rounded-full font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
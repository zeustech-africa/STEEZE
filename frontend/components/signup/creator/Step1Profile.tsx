"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface Step1ProfileProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  markComplete: () => void;
}

export default function Step1Profile({ data, updateData, onNext, markComplete }: Step1ProfileProps) {
  const [formData, setFormData] = useState({
    artistName: data.artistName || "",
    aka: data.aka || "",
    email: data.email || "",
    password: data.password || "",
    confirmPassword: data.confirmPassword || "",
    category: data.category || "music",
    tagline: data.tagline || "",
    shortBio: data.shortBio || "",
    fullBio: data.fullBio || "",
    musicJourney: data.musicJourney || "",
    achievements: data.achievements || "",
    phoneNumber: data.phoneNumber || "",
    emergencyContact: data.emergencyContact || "",
    physicalAddress: data.physicalAddress || "",
    instagram: data.instagram || "",
    twitter: data.twitter || "",
    tiktok: data.tiktok || "",
    youtube: data.youtube || "",
    spotify: data.spotify || "",
    appleMusic: data.appleMusic || "",
    website: data.website || "",
    templatePreference: data.templatePreference || "classic",
    brandColors: data.brandColors || "#FFD700",
    brandPersonality: data.brandPersonality || "luxury",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    updateData(formData);
  }, [formData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.artistName) newErrors.artistName = "Artist name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.email.includes("@")) newErrors.email = "Valid email required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.tagline) newErrors.tagline = "Tagline is required (e.g., 'Afrobeat King')";
    if (!formData.shortBio) newErrors.shortBio = "Short bio is required";
    if (!formData.fullBio) newErrors.fullBio = "Full biography is required";
    if (!formData.phoneNumber) newErrors.phoneNumber = "Phone number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setTouched({ artistName: true, email: true, password: true, confirmPassword: true, tagline: true, shortBio: true, fullBio: true, phoneNumber: true });
    if (validate()) {
      markComplete();
      onNext();
    }
  };

  const categories = [
    { value: "music", label: "🎵 Music" },
    { value: "comedy", label: "😂 Comedy" },
    { value: "dance", label: "💃 Dance" },
    { value: "drama", label: "🎭 Drama" },
  ];

  const templates = [
    { value: "classic", label: "Classic", description: "Elegant, timeless" },
    { value: "premium", label: "Premium", description: "Luxurious, high-end" },
    { value: "feminine", label: "Feminine", description: "Soft, graceful" },
    { value: "muscular", label: "Muscular", description: "Bold, urban" },
    { value: "minimal", label: "Minimal", description: "Clean, modern" },
  ];

  const personalities = [
    { value: "luxury", label: "Luxury / High-end" },
    { value: "dark", label: "Dark / Cinematic" },
    { value: "afrobeat", label: "Afrobeat / Vibrant" },
    { value: "street", label: "Street / Urban" },
    { value: "soulful", label: "Soulful / Emotional" },
  ];

  return (
    <div className="space-y-6">
      {/* Artist Identity */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="artistName" className="block text-white/80 text-sm mb-1">Artist / Stage Name <span className="text-gold">*</span></label>
          <input id="artistName" type="text" value={formData.artistName} onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
            aria-required="true" aria-describedby="artistName-error"
            className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.artistName && touched.artistName ? "border-red-500" : "border-white/20"}`}
            placeholder="e.g., Burna Boy" />
          {errors.artistName && touched.artistName && <p id="artistName-error" className="text-red-500 text-xs mt-1" role="alert">{errors.artistName}</p>}
        </div>
        <div>
          <label htmlFor="aka" className="block text-white/80 text-sm mb-1">Also Known As (AKA)</label>
          <input id="aka" type="text" value={formData.aka} onChange={(e) => setFormData({ ...formData, aka: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
            placeholder="e.g., African Giant" />
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-white/80 text-sm mb-1">Email <span className="text-gold">*</span></label>
          <input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            aria-required="true" aria-describedby="email-error"
            className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.email && touched.email ? "border-red-500" : "border-white/20"}`}
            placeholder="you@example.com" />
          {errors.email && touched.email && <p id="email-error" className="text-red-500 text-xs mt-1" role="alert">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-white/80 text-sm mb-1">Phone Number <span className="text-gold">*</span></label>
          <input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            aria-required="true" aria-describedby="phoneNumber-error"
            className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.phoneNumber && touched.phoneNumber ? "border-red-500" : "border-white/20"}`}
            placeholder="+27 XX XXX XXXX" />
          {errors.phoneNumber && touched.phoneNumber && <p id="phoneNumber-error" className="text-red-500 text-xs mt-1" role="alert">{errors.phoneNumber}</p>}
        </div>
      </div>

      {/* Password */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="block text-white/80 text-sm mb-1">Password <span className="text-gold">*</span></label>
          <input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            aria-required="true" aria-describedby="password-error"
            className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.password && touched.password ? "border-red-500" : "border-white/20"}`}
            placeholder="••••••••" />
          {errors.password && touched.password && <p id="password-error" className="text-red-500 text-xs mt-1" role="alert">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-white/80 text-sm mb-1">Confirm Password <span className="text-gold">*</span></label>
          <input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            aria-required="true" aria-describedby="confirmPassword-error"
            className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.confirmPassword && touched.confirmPassword ? "border-red-500" : "border-white/20"}`}
            placeholder="••••••••" />
          {errors.confirmPassword && touched.confirmPassword && <p id="confirmPassword-error" className="text-red-500 text-xs mt-1" role="alert">{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* Category & Tagline */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-white/80 text-sm mb-1">Category <span className="text-gold">*</span></label>
          <div className="flex gap-3">
            {categories.map((cat) => (
              <button key={cat.value} type="button" onClick={() => setFormData({ ...formData, category: cat.value })}
                aria-pressed={formData.category === cat.value} aria-label={cat.label}
                className={`px-4 py-2 rounded-lg transition-all ${formData.category === cat.value ? "bg-gold text-black" : "bg-white/10 text-white/70"}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="tagline" className="block text-white/80 text-sm mb-1">Tagline <span className="text-gold">*</span></label>
          <input id="tagline" type="text" value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            aria-required="true" aria-describedby="tagline-error"
            className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.tagline && touched.tagline ? "border-red-500" : "border-white/20"}`}
            placeholder="e.g., Afrobeat King" />
          {errors.tagline && touched.tagline && <p id="tagline-error" className="text-red-500 text-xs mt-1" role="alert">{errors.tagline}</p>}
        </div>
      </div>

      {/* Brand Personality & Colors */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="brandPersonality" className="block text-white/80 text-sm mb-1">Brand Personality</label>
          <select id="brandPersonality" value={formData.brandPersonality} onChange={(e) => setFormData({ ...formData, brandPersonality: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold">
            {personalities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="brandColors" className="block text-white/80 text-sm mb-1">Brand Color (Hex)</label>
          <div className="flex items-center gap-3">
            <input id="brandColors-picker" type="color" value={formData.brandColors} onChange={(e) => setFormData({ ...formData, brandColors: e.target.value })}
              aria-label="Brand color picker"
              className="w-12 h-12 rounded-lg cursor-pointer" />
            <input id="brandColors" type="text" value={formData.brandColors} onChange={(e) => setFormData({ ...formData, brandColors: e.target.value })}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
          </div>
        </div>
      </div>

      {/* Bios */}
      <div>
        <label htmlFor="shortBio" className="block text-white/80 text-sm mb-1">Short Bio (1-2 sentences) <span className="text-gold">*</span></label>
        <textarea id="shortBio" rows={2} value={formData.shortBio} onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
          aria-required="true" aria-describedby="shortBio-error"
          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.shortBio && touched.shortBio ? "border-red-500" : "border-white/20"}`}
          placeholder="Brief description of who you are..." />
        {errors.shortBio && touched.shortBio && <p id="shortBio-error" className="text-red-500 text-xs mt-1" role="alert">{errors.shortBio}</p>}
      </div>

      <div>
        <label htmlFor="fullBio" className="block text-white/80 text-sm mb-1">Full Biography <span className="text-gold">*</span></label>
        <textarea id="fullBio" rows={5} value={formData.fullBio} onChange={(e) => setFormData({ ...formData, fullBio: e.target.value })}
          aria-required="true" aria-describedby="fullBio-error"
          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.fullBio && touched.fullBio ? "border-red-500" : "border-white/20"}`}
          placeholder="Your story, background, journey..." />
        {errors.fullBio && touched.fullBio && <p id="fullBio-error" className="text-red-500 text-xs mt-1" role="alert">{errors.fullBio}</p>}
      </div>

      <div>
        <label htmlFor="musicJourney" className="block text-white/80 text-sm mb-1">Music / Creation Journey</label>
        <textarea id="musicJourney" rows={4} value={formData.musicJourney} onChange={(e) => setFormData({ ...formData, musicJourney: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
          placeholder="How did you start? What influenced you?" />
      </div>

      <div>
        <label htmlFor="achievements" className="block text-white/80 text-sm mb-1">Achievements & Awards</label>
        <textarea id="achievements" rows={3} value={formData.achievements} onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
          placeholder="List awards, features, milestones..." />
      </div>

      {/* Admin-only fields */}
      <div className="border-t border-white/10 pt-4">
        <p className="text-white/50 text-xs mb-3">🔒 Admin-only information (not public)</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergencyContact" className="block text-white/60 text-sm mb-1">Emergency Contact</label>
            <input id="emergencyContact" type="text" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label htmlFor="physicalAddress" className="block text-white/60 text-sm mb-1">Physical Address</label>
            <input id="physicalAddress" type="text" value={formData.physicalAddress} onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="border-t border-white/10 pt-4">
        <p className="text-white/50 text-xs mb-3">Social Media Links (appear on your public profile)</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm w-20">Instagram:</span>
            <input type="text" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold text-sm" placeholder="@username" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm w-20">Twitter/X:</span>
            <input type="text" value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold text-sm" placeholder="@username" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm w-20">TikTok:</span>
            <input type="text" value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold text-sm" placeholder="@username" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm w-20">YouTube:</span>
            <input type="text" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold text-sm" placeholder="/channel/..." />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm w-20">Spotify:</span>
            <input type="text" value={formData.spotify} onChange={(e) => setFormData({ ...formData, spotify: e.target.value })}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold text-sm" placeholder="Artist ID or URL" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm w-20">Apple Music:</span>
            <input type="text" value={formData.appleMusic} onChange={(e) => setFormData({ ...formData, appleMusic: e.target.value })}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold text-sm" placeholder="Artist URL" />
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <span className="block text-white/80 text-sm mb-2">Preferred Template (can change later)</span>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {templates.map((tpl) => (
            <button key={tpl.value} type="button" onClick={() => setFormData({ ...formData, templatePreference: tpl.value })}
              className={`py-2 px-3 rounded-lg border text-center transition-all ${formData.templatePreference === tpl.value ? "border-gold bg-gold/20 text-gold" : "border-white/20 text-white/60 hover:border-gold/50"}`}>
              <div className="text-sm font-medium">{tpl.label}</div>
              <div className="text-xs opacity-70">{tpl.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-white/10">
        <button onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all flex items-center gap-2">
          Next Step <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
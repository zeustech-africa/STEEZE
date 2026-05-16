"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, Upload, User, Mail, Lock } from "lucide-react";

interface Step1ProfileProps {
  data: Record<string, unknown>;
  updateData: (data: Record<string, unknown>) => void;
  onNext: () => void;
  markComplete: () => void;
}

export default function Step1Profile({ data, updateData, onNext, markComplete }: Step1ProfileProps) {
  const [formData, setFormData] = useState({
    fullName: (data.fullName as string) || "",
    username: (data.username as string) || "",
    email: (data.email as string) || "",
    password: (data.password as string) || "",
    confirmPassword: (data.confirmPassword as string) || "",
    bio: (data.bio as string) || "",
    profilePic: (data.profilePic as File | null) || null,
    profilePicPreview: (data.profilePicPreview as string | null) || null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    updateData(formData as unknown as Record<string, unknown>);
  }, [formData, updateData]);

  const handleProfilePicUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, profilePic: file, profilePicPreview: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.username) newErrors.username = "Username is required";
    if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.email.includes("@")) newErrors.email = "Valid email required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setTouched({ fullName: true, username: true, email: true, password: true, confirmPassword: true });
    if (validate()) {
      markComplete();
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <p className="text-white/60 text-sm">Create your VIBE identity on STEEZE</p>
      </div>

      {/* Profile Picture */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white/10 border-2 border-gold cursor-pointer" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}
            aria-label="Upload profile picture" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { fileInputRef.current?.click(); } }}>
            {formData.profilePicPreview ? (
              <img src={formData.profilePicPreview} alt={`Profile picture of ${formData.fullName || 'user'}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={40} className="text-white/40" aria-hidden="true" />
              </div>
            )}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-gold rounded-full text-black"
            aria-label="Upload profile picture">
            <Upload size={14} aria-hidden="true" />
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleProfilePicUpload(e.target.files[0])} className="hidden"
            aria-label="Select profile picture file" />
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="vibe-fullName" className="block text-white/80 text-sm mb-1">Full Name <span className="text-gold">*</span></label>
        <input id="vibe-fullName" type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          aria-required="true" aria-describedby="vibe-fullName-error"
          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.fullName && touched.fullName ? "border-red-500" : "border-white/20"}`}
          placeholder="Your real name" />
        {errors.fullName && touched.fullName && <p id="vibe-fullName-error" className="text-red-500 text-xs mt-1" role="alert">{errors.fullName}</p>}
      </div>

      {/* Username */}
      <div>
        <label htmlFor="vibe-username" className="block text-white/80 text-sm mb-1">Username <span className="text-gold">*</span></label>
        <input id="vibe-username" type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
          aria-required="true" aria-describedby="vibe-username-error vibe-username-help"
          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.username && touched.username ? "border-red-500" : "border-white/20"}`}
          placeholder="e.g., musiclover_123" />
        {errors.username && touched.username && <p id="vibe-username-error" className="text-red-500 text-xs mt-1" role="alert">{errors.username}</p>}
        <p id="vibe-username-help" className="text-white/30 text-xs mt-1">Only lowercase letters, numbers, and underscores</p>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="vibe-email" className="block text-white/80 text-sm mb-1">Email <span className="text-gold">*</span></label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
          <input id="vibe-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            aria-required="true" aria-describedby="vibe-email-error"
            className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.email && touched.email ? "border-red-500" : "border-white/20"}`}
            placeholder="you@example.com" />
        </div>
        {errors.email && touched.email && <p id="vibe-email-error" className="text-red-500 text-xs mt-1" role="alert">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vibe-password" className="block text-white/80 text-sm mb-1">Password <span className="text-gold">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
            <input id="vibe-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              aria-required="true" aria-describedby="vibe-password-error"
              className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.password && touched.password ? "border-red-500" : "border-white/20"}`}
              placeholder="••••••••" />
          </div>
          {errors.password && touched.password && <p id="vibe-password-error" className="text-red-500 text-xs mt-1" role="alert">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="vibe-confirmPassword" className="block text-white/80 text-sm mb-1">Confirm Password <span className="text-gold">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
            <input id="vibe-confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              aria-required="true" aria-describedby="vibe-confirmPassword-error"
              className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.confirmPassword && touched.confirmPassword ? "border-red-500" : "border-white/20"}`}
              placeholder="••••••••" />
          </div>
          {errors.confirmPassword && touched.confirmPassword && <p id="vibe-confirmPassword-error" className="text-red-500 text-xs mt-1" role="alert">{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="vibe-bio" className="block text-white/80 text-sm mb-1">Bio (Optional)</label>
        <textarea id="vibe-bio" rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
          placeholder="Tell us about yourself..." />
        <p className="text-white/30 text-xs mt-1">This will appear on your profile</p>
      </div>

      <div className="flex justify-end pt-4 border-t border-white/10">
        <button type="button" onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all flex items-center gap-2">
          Next Step <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
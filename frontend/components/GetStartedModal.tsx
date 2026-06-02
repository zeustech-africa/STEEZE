"use client";

import { useState, useEffect } from "react";
import { X, Mic, Headphones, Sparkles, Shield, DollarSign, MessageCircle, Video, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GetStartedModal({ isOpen, onClose }: GetStartedModalProps) {
  const [selected, setSelected] = useState<"creator" | "vibes" | "just-vibes" | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Close on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl mx-4"
          >
            {/* Glass Card */}
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute top-4 right-4 z-10 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} aria-hidden="true" />
              </button>

              {/* Header */}
              <div className="text-center pt-8 pb-4 px-6 border-b border-white/10">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold to-gold-dark bg-clip-text text-transparent">
                  Choose Your Path
                </h2>
                <p className="text-white/60 mt-2">Three ways to experience STEEZE</p>
              </div>

              {/* Cards */}
              <div className="p-6 grid md:grid-cols-3 gap-6">
                {/* Creator Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    selected === "creator"
                      ? "border-gold bg-gold/10 shadow-lg shadow-gold/20"
                      : "border-white/20 bg-white/5 hover:border-gold/50"
                  }`}
                  onClick={() => setSelected("creator")}
                >
                  {selected === "creator" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold animate-pulse-slow" />
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-gold to-gold-dark">
                      <Mic className="text-black" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">CREATOR</h3>
                  </div>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-gold" /> Upload music, videos, images</li>
                    <li className="flex items-center gap-2"><DollarSign size={14} className="text-gold" /> Earn money from your content</li>
                    <li className="flex items-center gap-2"><Shield size={14} className="text-gold" /> Get verified (ID + selfie)</li>
                    <li className="flex items-center gap-2"><MessageCircle size={14} className="text-gold" /> Communicate with your fans</li>
                    <li className="flex items-center gap-2"><Video size={14} className="text-gold" /> Video calls with Gold subscribers</li>
                  </ul>
                  <div className="mt-4 p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-white/40">Keep 50% (signed) or 70% (independent)</p>
                  </div>
                </motion.div>

                {/* Vibes Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    selected === "vibes"
                      ? "border-gold bg-gold/10 shadow-lg shadow-gold/20"
                      : "border-white/20 bg-white/5 hover:border-gold/50"
                  }`}
                  onClick={() => setSelected("vibes")}
                >
                  {selected === "vibes" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold animate-pulse-slow" />
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-gold to-gold-dark">
                      <Headphones className="text-black" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">VIBES</h3>
                  </div>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-gold" /> Listen to music (Spotify-style player)</li>
                    <li className="flex items-center gap-2"><Headphones size={14} className="text-gold" /> Watch videos (YouTube-style player)</li>
                    <li className="flex items-center gap-2"><Shield size={14} className="text-gold" /> Like, comment, save, follow</li>
                    <li className="flex items-center gap-2"><MessageCircle size={14} className="text-gold" /> Subscribe for exclusive content</li>
                    <li className="flex items-center gap-2"><Video size={14} className="text-gold" /> Gold: DM + request video calls</li>
                  </ul>
                  <div className="mt-4 p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-white/40">Free • Basic (R50) • Premium (R99) • Gold (R199)</p>
                  </div>
                </motion.div>

                {/* Just VIBES Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    selected === "just-vibes"
                      ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                      : "border-white/20 bg-white/5 hover:border-purple-500/50"
                  }`}
                  onClick={() => setSelected("just-vibes")}
                >
                  {selected === "just-vibes" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 animate-pulse-slow" />
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-700">
                      <Eye className="text-white" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Just VIBES</h3>
                  </div>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li className="flex items-center gap-2"><Eye size={14} className="text-purple-400" /> Browse content with limited access</li>
                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-purple-400" /> 30-second video previews</li>
                    <li className="flex items-center gap-2"><Headphones size={14} className="text-purple-400" /> 1-hour session limit</li>
                    <li className="flex items-center gap-2"><Shield size={14} className="text-purple-400" /> No sign-up required</li>
                  </ul>
                  <div className="mt-4 p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-white/40">Free • No account needed • 1 hour per session</p>
                  </div>
                </motion.div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0 flex justify-center">
                {selected && (
                  <motion.a
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    href={selected === "creator" ? "/signup/creator" : selected === "vibes" ? "/signup/vibes" : "/just-vibes/signup"}
                    className={`px-8 py-3 font-bold rounded-full hover:shadow-lg transition-all ${
                      selected === "just-vibes"
                        ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-purple-500/30"
                        : "bg-gradient-to-r from-gold to-gold-dark text-black hover:shadow-gold/30"
                    }`}
                  >
                    Join as {selected === "creator" ? "Creator" : selected === "vibes" ? "VIBES" : "Just VIBES"} →
                  </motion.a>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pb-6 px-6">
                <p className="text-white/40 text-sm">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      onClose();
                      // Dispatch custom event to open login modal
                      const event = new CustomEvent("openLoginModal");
                      window.dispatchEvent(event);
                    }}
                    className="text-gold hover:underline"
                  >
                    ENTER THE VIBES
                  </button>
                </p>
              </div>

              {/* Info Banner */}
              <div className="border-t border-white/10 bg-gold/5 p-4">
                <p className="text-white/50 text-xs text-center italic">
                  "STEEZE is not Facebook. No politics. No news. No violence. Just pure entertainment. Every account is verified. Every creator is real. Every VIBE is authentic."
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
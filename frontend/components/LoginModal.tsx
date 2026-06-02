"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToGetStarted: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToGetStarted }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Listen for custom event from GetStartedModal
  useEffect(() => {
    const handleOpenLogin = () => {
      // onClose is not quite right — this event means "open the login modal"
      // which is handled by the parent (Navbar). So here we just notify parent.
      // But if the Navbar is listening, it'll set isOpen=true. We don't need
      // to do anything extra here. This listener just prevents stale closures.
    };
    window.addEventListener("openLoginModal", handleOpenLogin);
    return () => window.removeEventListener("openLoginModal", handleOpenLogin);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "admin") {
          setError("Admin login is not available here. Please use the admin portal.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return;
        }

        if (data.user.userType === "creator") {
          router.push(`/creator/${data.user.username || data.user.artistName}`);
        } else if (data.user.userType === "vibe") {
          router.push("/");
        } else {
          setError("Invalid account type");
        }
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch {
      setError("Login failed. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
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
            className="relative w-full max-w-md mx-4"
          >
            {/* Glass Card */}
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close login dialog"
                className="absolute top-4 right-4 z-10 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} aria-hidden="true" />
              </button>

              {/* Header */}
              <div className="text-center pt-8 pb-4 px-6">
                <h2 className="text-2xl font-bold text-gold">Welcome Back</h2>
                <p className="text-white/50 text-sm mt-1">Login to your STEEZE account</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="login-email" className="block text-white/70 text-sm mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} aria-hidden="true" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold transition-colors"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="login-password" className="block text-white/70 text-sm mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} aria-hidden="true" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <p id="login-error" role="alert" aria-live="assertive" className="text-red-500 text-sm text-center">{error}</p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg hover:shadow-gold/30 transition-all disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                {/* Switch to Get Started */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToGetStarted();
                    }}
                    className="text-white/50 text-sm hover:text-gold transition-colors"
                  >
                    Don't have an account? GET STEEZE →
                  </button>
                </div>
              </form>

              {/* Info Banner */}
              <div className="border-t border-white/10 bg-gold/5 p-4">
                <p className="text-white/50 text-xs text-center italic">
                  "No fake accounts. Every STEEZE account is verified. Real creators. Real VIBES. Real entertainment."
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertTriangle, Lock, Fingerprint, Loader2 } from "lucide-react";
import Captcha from "@/components/Captcha";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, cfTurnstileResponse: captchaToken }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.user.role === "admin") {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push("/admin");
        } else {
          setError("Access denied. Admin privileges required.");
        }
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950/30 via-black to-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Security pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,#000,#000_20px,#FFD70020_20px,#FFD70020_40px)]" />
      </div>

      {/* Red alert glow */}
      <div className="absolute inset-0 bg-red-600/5 blur-3xl" />

      <div className="glass-card p-8 w-full max-w-md relative z-10 border-t-2 border-red-500 shadow-2xl shadow-red-500/10">
        {/* Security Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <Shield className="text-red-500" size={32} />
            <span className="text-red-500 text-xl font-bold tracking-wider">STEEZE ADMIN</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="text-yellow-500" size={16} />
            <h1 className="text-xl font-bold text-white">Restricted Access</h1>
            <AlertTriangle className="text-yellow-500" size={16} />
          </div>
          <p className="text-white/50 text-sm">Authorized personnel only</p>
        </div>

        {/* Warning banner */}
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs text-center flex items-center justify-center gap-2">
            <Lock size={14} aria-hidden="true" /> Unauthorized access is prohibited. All activities are monitored and logged.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1" htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              placeholder="admin@steeze.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-1" htmlFor="admin-password">Security Key</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex justify-center my-4">
            <Captcha
              onVerify={setCaptchaToken}
              onError={() => setCaptchaError(true)}
            />
          </div>
          {captchaError && (
            <p className="text-red-400 text-xs text-center mt-1">CAPTCHA verification failed. Please try again.</p>
          )}

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg" role="alert">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full py-3 bg-red-600/20 border border-red-500 text-red-400 font-bold rounded-full hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
            {loading ? "Authenticating..." : "Authenticate Access"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-white/30 text-xs">
            ⚠️ This is a secure administrative interface. All access attempts are recorded.
          </p>
          <p className="text-white/20 text-xs mt-2">
            STEEZE Admin v1.0 | ZeusTech
          </p>
        </div>
      </div>
    </div>
  );
}
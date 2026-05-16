"use client";

import { useState, useEffect } from "react";
import { Mail, X, Loader2, RefreshCw } from "lucide-react";

export default function EmailVerificationBanner() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

  useEffect(() => {
    // Check if user is logged in and unverified
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) return;

    try {
      const user = JSON.parse(userData);
      if (!user.isVerified && user.email) {
        setVisible(true);
        setEmail(user.email);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  async function handleResend() {
    if (!email) return;
    setSending(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.message || "Failed to resend verification email");
      }
    } catch {
      setError("Failed to connect to server");
    }
    setSending(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <Mail size={16} className="text-yellow-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium">Verify your email address</p>
            <p className="text-white/60 text-xs">
              {sent
                ? `Verification email sent to ${email}. Check your inbox.`
                : error
                ? error
                : `A verification link was sent to ${email}. Verify your account to unlock all features.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!sent && (
            <button
              onClick={handleResend}
              disabled={sending}
              className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Resend
            </button>
          )}
          <button
            onClick={() => setVisible(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Key, Loader2, Check, Copy, Trash2, QrCode, Eye, EyeOff } from "lucide-react";

export default function TwoFAPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"checking" | "disabled" | "enabled">("checking");
  const [step, setStep] = useState<"idle" | "setup" | "verify">("idle");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableToken, setDisableToken] = useState("");
  const [disableError, setDisableError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

  useEffect(() => {
    check2FAStatus();
  }, []);

  async function api(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase}/api/2fa${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    return res.json();
  }

  async function check2FAStatus() {
    try {
      const data = await api("/status");
      if (data.enabled) {
        setStatus("enabled");
      } else {
        setStatus("disabled");
      }
    } catch {
      setStatus("disabled");
    }
  }

  async function handleSetup() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/setup", { method: "POST" });
      if (data.success) {
        setQrCodeData(data.qrCodeDataUrl);
        setSecret(data.secret);
        setStep("setup");
      } else {
        setError(data.message || "Failed to setup 2FA");
      }
    } catch {
      setError("Failed to connect to server");
    }
    setLoading(false);
  }

  async function handleVerify() {
    if (!token || token.length < 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api("/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (data.success) {
        setBackupCodes(data.backupCodes || []);
        setStep("verify");
        setStatus("enabled");
        setMessage("2FA has been enabled successfully!");
      } else {
        setError(data.message || "Invalid verification code");
      }
    } catch {
      setError("Failed to verify code");
    }
    setLoading(false);
  }

  async function handleDisable() {
    if (!disableToken || disableToken.length < 6) {
      setDisableError("Please enter a valid 6-digit code");
      return;
    }
    setLoading(true);
    setDisableError("");
    try {
      const data = await api("/disable", {
        method: "POST",
        body: JSON.stringify({ token: disableToken }),
      });
      if (data.success) {
        setStatus("disabled");
        setShowDisableConfirm(false);
        setDisableToken("");
        setStep("idle");
        setQrCodeData(null);
        setSecret(null);
        setBackupCodes([]);
        setMessage("2FA has been disabled.");
      } else {
        setDisableError(data.message || "Invalid code");
      }
    } catch {
      setDisableError("Failed to disable 2FA");
    }
    setLoading(false);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setMessage("Backup codes copied to clipboard!");
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-24 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Back */}
        <Link href="/settings" className="text-white/50 hover:text-gold text-sm mb-6 inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Settings
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Shield size={28} className="text-gold" />
          <h1 className="text-3xl font-bold text-gold">Two-Factor Authentication</h1>
        </div>

        {message && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg p-4 mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        {status === "checking" && (
          <div className="flex items-center gap-2 text-white/50">
            <Loader2 size={20} className="animate-spin" />
            Checking 2FA status...
          </div>
        )}

        {/* 2FA Disabled State */}
        {status === "disabled" && step === "idle" && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Shield size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium">Two-factor authentication is disabled</p>
                <p className="text-white/50 text-sm">Add an extra layer of security to your account</p>
              </div>
            </div>
            <button
              onClick={handleSetup}
              disabled={loading}
              className="px-6 py-3 bg-gold hover:bg-gold-dark text-black font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
              Enable 2FA
            </button>
          </div>
        )}

        {/* Setup Step - QR Code */}
        {step === "setup" && qrCodeData && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Set up your authenticator app</h2>
            <ol className="list-decimal list-inside text-white/70 space-y-2 text-sm">
              <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Scan this QR code with your authenticator app</li>
              <li>Enter the 6-digit code from the app below to verify</li>
            </ol>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCodeData} alt="QR Code for 2FA setup" className="w-48 h-48" />
              </div>
            </div>

            {/* Manual secret */}
            {secret && (
              <div className="bg-black/50 rounded-lg p-4 text-center">
                <p className="text-white/50 text-sm mb-1">Or enter this code manually:</p>
                <code className="text-gold font-mono text-lg break-all">{secret}</code>
              </div>
            )}

            {/* Token input */}
            <div>
              <label className="text-white/70 text-sm block mb-2">Enter 6-digit verification code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder:text-white/20 focus:border-gold focus:outline-none"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || token.length < 6}
              className="w-full py-3 bg-gold hover:bg-gold-dark text-black font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Verify & Enable
            </button>
          </div>
        )}

        {/* Backup Codes */}
        {backupCodes.length > 0 && (
          <div className="bg-gold/10 border border-gold/30 rounded-lg p-6 mt-4 space-y-4">
            <h3 className="text-gold font-bold text-lg flex items-center gap-2">
              <Key size={20} />
              Backup Codes
            </h3>
            <p className="text-white/70 text-sm">
              Save these backup codes in a safe place. Each code can be used once to sign in if you lose access to your
              authenticator app.
            </p>
            <div className={`grid grid-cols-2 gap-2 ${showBackupCodes ? "" : "blur-sm hover:blur-none transition-all cursor-pointer"}`}
                 onClick={() => !showBackupCodes && setShowBackupCodes(true)}>
              {backupCodes.map((code, i) => (
                <code key={i} className="bg-black/50 px-3 py-2 rounded text-gold font-mono text-sm text-center">
                  {code}
                </code>
              ))}
            </div>
            {!showBackupCodes && (
              <p className="text-white/40 text-xs text-center italic">Click to reveal backup codes</p>
            )}
            <button
              onClick={copyBackupCodes}
              className="flex items-center gap-2 text-gold hover:text-gold-light text-sm transition-colors"
            >
              <Copy size={14} />
              Copy all codes to clipboard
            </button>
          </div>
        )}

        {/* 2FA Enabled State */}
        {status === "enabled" && !showDisableConfirm && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={24} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Two-factor authentication is enabled</p>
                <p className="text-white/50 text-sm">Your account is protected with an extra layer of security</p>
              </div>
            </div>
            <button
              onClick={() => setShowDisableConfirm(true)}
              className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={18} />
              Disable 2FA
            </button>
          </div>
        )}

        {/* Disable 2FA Confirmation */}
        {showDisableConfirm && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 space-y-4">
            <h3 className="text-red-400 font-bold text-lg">Disable Two-Factor Authentication?</h3>
            <p className="text-white/70 text-sm">
              This will remove the extra layer of security from your account. You will only need your password to sign
              in.
            </p>

            {disableError && (
              <div className="bg-red-500/20 text-red-400 rounded-lg p-3 text-sm">
                {disableError}
              </div>
            )}

            <div>
              <label className="text-white/70 text-sm block mb-2">Enter 6-digit code from your authenticator app to confirm</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder:text-white/20 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisableConfirm(false);
                  setDisableToken("");
                  setDisableError("");
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable}
                disabled={loading || disableToken.length < 6}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Disable 2FA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
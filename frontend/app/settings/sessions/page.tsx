"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, Smartphone, Globe, X, Loader2, AlertTriangle, LogIn } from "lucide-react";

type Session = {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoutTarget, setLogoutTarget] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(120);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

  useEffect(() => {
    fetchSessions();
    setupSessionTimeoutWarning();
  }, []);

  async function api(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase}/api/sessions${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    return res.json();
  }

  async function fetchSessions() {
    setLoading(true);
    try {
      const data = await api("/");
      if (data.sessions) {
        setSessions(data.sessions);
      } else if (data.success && data.data) {
        setSessions(data.data);
      } else {
        setSessions([]);
      }
    } catch {
      setError("Failed to load sessions");
      setSessions([]);
    }
    setLoading(false);
  }

  function setupSessionTimeoutWarning() {
    // Simulated session timeout warning - in production this would be driven by server-side session TTL
    // Show warning after 25 minutes of inactivity (configurable)
    const warningTimer = setTimeout(() => {
      const lastActivity = localStorage.getItem("lastActivity");
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity);
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        const warningTime = sessionTimeout - 5 * 60 * 1000; // 5 min before
        if (elapsed >= warningTime && elapsed < sessionTimeout) {
          setShowTimeoutWarning(true);
          const remaining = Math.floor((sessionTimeout - elapsed) / 1000);
          setTimeoutSeconds(remaining);
          const countdown = setInterval(() => {
            setTimeoutSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(countdown);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    }, 25 * 60 * 1000);

    // Update last activity on user interaction
    const updateActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString());
    };
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);

    return () => {
      clearTimeout(warningTimer);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
    };
  }

  async function handleRemoteLogout(sessionId: string) {
    setLogoutLoading(true);
    try {
      const data = await api(`/logout/${sessionId}`, { method: "DELETE" });
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setSuccess("Session has been logged out");
        setLogoutTarget(null);
      } else {
        setError(data.message || "Failed to log out session");
      }
    } catch {
      setError("Failed to log out remote session");
    }
    setLogoutLoading(false);
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return d.toLocaleDateString();
  }

  function getDeviceIcon(device: string) {
    const d = device?.toLowerCase() || "";
    if (d.includes("phone") || d.includes("mobile")) return <Smartphone size={18} />;
    if (d.includes("desktop") || d.includes("windows") || d.includes("mac")) return <Monitor size={18} />;
    return <Globe size={18} />;
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-24 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Back */}
        <Link href="/settings" className="text-white/50 hover:text-gold text-sm mb-6 inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Settings
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Monitor size={28} className="text-gold" />
          <h1 className="text-3xl font-bold text-gold">Active Sessions</h1>
        </div>

        <p className="text-white/50 mb-6">
          You can sign out of other sessions remotely. Sessions expire after 30 minutes of inactivity.
        </p>

        {/* Session timeout warning */}
        {showTimeoutWarning && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-yellow-400 font-medium">Session Expiring Soon</p>
              <p className="text-white/70 text-sm">
                Your session will expire in {timeoutSeconds} seconds due to inactivity.{" "}
                <button
                  onClick={() => {
                    setShowTimeoutWarning(false);
                    localStorage.setItem("lastActivity", Date.now().toString());
                  }}
                  className="text-gold hover:underline"
                >
                  Stay signed in
                </button>
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg p-4 mb-4">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Monitor size={48} className="mx-auto mb-4 opacity-30" />
            <p>No active sessions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`bg-white/5 border rounded-lg p-4 transition-colors ${
                  session.isCurrent
                    ? "border-gold/30 bg-gold/5"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-1 ${session.isCurrent ? "text-gold" : "text-white/50"}`}>
                      {getDeviceIcon(session.device)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">
                          {session.browser || session.device || "Unknown Device"}
                        </p>
                        {session.isCurrent && (
                          <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded-full shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-white/40 text-sm space-y-1 mt-1">
                        <p className="flex items-center gap-1">
                          <LogIn size={12} />
                          {session.ip && <span>{session.ip}</span>}
                          {session.location && <span>• {session.location}</span>}
                        </p>
                        <p>Last active: {formatDate(session.lastActive)}</p>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      onClick={() => {
                        if (logoutTarget === session.id) {
                          handleRemoteLogout(session.id);
                        } else {
                          setLogoutTarget(session.id);
                        }
                      }}
                      disabled={logoutLoading}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg p-2 transition-colors shrink-0"
                      title="Sign out this session"
                    >
                      {logoutTarget === session.id ? (
                        <span className="text-xs font-medium px-2">Confirm?</span>
                      ) : (
                        <X size={18} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
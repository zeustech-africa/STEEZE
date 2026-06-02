"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Smartphone, Laptop, Tablet, Globe, LogOut, Loader2, AlertCircle, Monitor, X } from "lucide-react";

interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions || []);
      } else {
        setError(data.error || "Failed to load sessions");
      }
    } catch {
      setError("Network error — could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      // silently fail, session list may be stale
    } finally {
      setRevoking(null);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm("Log out from all devices? You will need to log in again on all devices.")) return;

    setLogoutAllLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/logout-all`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem("user");
        router.push("/login");
      }
    } catch {
      // fallback — clear local and redirect
      localStorage.removeItem("user");
      router.push("/login");
    } finally {
      setLogoutAllLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = (userAgent || "").toLowerCase();
    if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) return <Smartphone size={18} />;
    if (ua.includes("tablet") || ua.includes("ipad")) return <Tablet size={18} />;
    if (ua.includes("mac") || ua.includes("windows") || ua.includes("linux")) return <Laptop size={18} />;
    return <Globe size={18} />;
  };

  const getDeviceName = (userAgent: string): string => {
    if (!userAgent) return "Unknown device";
    // Return a truncated but meaningful portion
    const ua = userAgent;
    if (ua.length > 60) return ua.substring(0, 57) + "...";
    return ua;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatRelative = (date: string): string => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/settings" className="text-gold hover:underline text-sm">
            ← Back to Settings
          </Link>
          <h1 className="text-white text-2xl font-bold">Active Sessions</h1>
        </div>

        {/* Info banner */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/70 text-sm">
                These are the devices currently logged into your account. If you don't recognize a device,
                revoke its access immediately. Sessions are secured with HttpOnly cookies.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Sessions list */}
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Monitor size={48} className="mx-auto mb-4 opacity-30" />
              <p>No active sessions found</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`bg-white/5 rounded-xl p-4 border transition-all ${
                  session.isCurrent
                    ? "border-gold bg-gold/5"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">
                          {getDeviceName(session.userAgent)}
                        </p>
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs rounded-full whitespace-nowrap">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs">
                        IP: {session.ipAddress || "Unknown"} • Last active: {formatRelative(session.lastActiveAt)}
                      </p>
                      <p className="text-white/30 text-xs">
                        Created: {formatDate(session.createdAt)}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all disabled:opacity-50 flex-shrink-0"
                    >
                      {revoking === session.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <span className="flex items-center gap-1">
                          <X size={14} /> Revoke
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Logout all devices */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <button
            onClick={handleLogoutAllDevices}
            disabled={logoutAllLoading}
            className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {logoutAllLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogOut size={18} />
            )}
            Log Out From All Devices
          </button>
        </div>
      </div>
    </div>
  );
}
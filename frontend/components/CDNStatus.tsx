"use client";

import { useState, useEffect } from "react";
import { Activity, CheckCircle, AlertCircle } from "lucide-react";

interface CDNEndpoint {
  name: string;
  url: string;
  priority: number;
  isActive: boolean;
}

interface CDNStatusData {
  activeCDN: string;
  activeCDNName: string;
  endpoints: Record<string, CDNEndpoint>;
  lastHealthCheck: string;
  healthCheckIntervalMs: number;
  timestamp: string;
}

export default function CDNStatus() {
  const [status, setStatus] = useState<CDNStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/cdn/status");
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch CDN status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) return null;

  const isHealthy = status.activeCDN === "primary" || status.activeCDN === "secondary";
  const cdnName = status.activeCDNName;

  return (
    <div className="fixed bottom-4 left-4 z-50 glass-card px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
      {isHealthy ? (
        <CheckCircle size={12} className="text-green-500" />
      ) : (
        <AlertCircle size={12} className="text-red-500" />
      )}
      <span className="text-white/60">CDN: {cdnName}</span>
      <Activity size={10} className="text-gold animate-pulse" />
    </div>
  );
}
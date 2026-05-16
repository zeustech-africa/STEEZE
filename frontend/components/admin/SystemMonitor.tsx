"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle, AlertCircle, XCircle, Wifi, Database, HardDrive, Video, CreditCard, Globe } from "lucide-react";

interface HealthCheck {
  component: string;
  status: "healthy" | "warning" | "down";
  message?: string;
  details?: any;
}

const componentIcons: Record<string, any> = {
  api: Wifi,
  database: Database,
  storage: HardDrive,
  payfast: CreditCard,
  video: Video,
  frontend: Globe,
};

const SystemMonitor = () => {
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/admin/health", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setHealth(data.health);
      }
    } catch (error) {
      console.error("Failed to fetch health:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="text-green-500" size={18} />;
      case "warning":
        return <AlertCircle className="text-yellow-500" size={18} />;
      case "down":
        return <XCircle className="text-red-500" size={18} />;
      default:
        return <Activity className="text-gray-500" size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const healthyCount = health.filter(h => h.status === "healthy").length;
  const totalCount = health.length;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-gold" size={20} />
          <h3 className="text-white font-semibold">System Monitor</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${healthyCount === totalCount ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
          {healthyCount}/{totalCount} Healthy
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {health.map((check) => {
          const Icon = componentIcons[check.component] || Activity;
          return (
            <div
              key={check.component}
              className={`p-3 rounded-lg border ${
                check.status === "healthy"
                  ? "border-green-500/30 bg-green-500/5"
                  : check.status === "warning"
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={16} className="text-white/60" />
                {getStatusIcon(check.status)}
              </div>
              <p className="text-white/80 text-xs font-medium capitalize">{check.component}</p>
              {check.message && (
                <p className="text-white/40 text-[10px] mt-1 truncate">{check.message}</p>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/10">
        <p className="text-white/30 text-xs text-center">
          Health checks run on page load. Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default SystemMonitor;
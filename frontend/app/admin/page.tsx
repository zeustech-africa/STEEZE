"use client";

import { useState, useEffect } from "react";
import {
  Users, UserCheck, FileText, AlertTriangle, DollarSign,
  Activity, Shield, Crown, TrendingUp, Clock, Server, Globe,
} from "lucide-react";
import Link from 'next/link';

interface DashboardData {
  totalUsers: number;
  totalCreators: number;
  totalVibes: number;
  totalZLS: number;
  totalIndependent: number;
  pendingPosts: number;
  pendingVerifications: number;
  pendingReports: number;
  pendingPayouts: number;
  anomalyAlerts: number;
}

interface SecurityData {
  rateLimitHits: number;
  botDetections: number;
  suspiciousLogins: number;
  activeSessions: number;
}

interface HealthData {
  database: string;
  api: string;
  storage: string;
  cdn?: string;
  uptime?: string;
}

interface ActivityItem {
  id: string;
  action: string;
  adminId: string;
  targetType: string;
  targetId: string;
  details?: any;
  createdAt: string;
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [security, setSecurity] = useState<SecurityData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [dashboardRes, securityRes, healthRes, activityRes] = await Promise.all([
        fetch("/api/admin/dashboard", { headers }),
        fetch("/api/admin/security/dashboard", { headers }),
        fetch("/api/admin/health", { headers }),
        fetch("/api/admin/audit-logs?limit=10", { headers }),
      ]);
      const [dashboardData, securityData, healthData, activityData] = await Promise.all([
        dashboardRes.json(),
        securityRes.json(),
        healthRes.json(),
        activityRes.json(),
      ]);
      setDashboard(dashboardData.dashboard);
      setSecurity(securityData.security);
      setHealth(healthData.health);
      setActivities(activityData.logs || []);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-gold text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    { label: "Total Users", value: dashboard?.totalUsers || 0, icon: Users, color: "text-blue-400" },
    { label: "ZLS Artists", value: dashboard?.totalZLS || 0, icon: Crown, color: "text-gold" },
    { label: "Independent", value: dashboard?.totalIndependent || 0, icon: Users, color: "text-green-400" },
    { label: "VIBES", value: dashboard?.totalVibes || 0, icon: UserCheck, color: "text-purple-400" },
    { label: "Pending Posts", value: dashboard?.pendingPosts || 0, icon: FileText, color: "text-yellow-400" },
    { label: "Pending Verifications", value: dashboard?.pendingVerifications || 0, icon: Clock, color: "text-cyan-400" },
    { label: "Pending Reports", value: dashboard?.pendingReports || 0, icon: AlertTriangle, color: "text-red-400" },
    { label: "Pending Payouts", value: dashboard?.pendingPayouts || 0, icon: DollarSign, color: "text-gold" },
    { label: "Anomaly Alerts (24h)", value: dashboard?.anomalyAlerts || 0, icon: Shield, color: "text-orange-400" },
    { label: "Total Creators", value: dashboard?.totalCreators || 0, icon: TrendingUp, color: "text-pink-400" },
  ];

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      ban_user: "Banned user",
      suspend_user: "Suspended user",
      approve_post: "Approved post",
      reject_post: "Rejected post",
      approve_verification: "Approved verification",
      reject_verification: "Rejected verification",
      impersonate_user: "Impersonated user",
      change_user_role: "Changed user role",
      restore_user: "Restored user",
    };
    return labels[action] || action;
  };

  const getHealthColor = (status: string | undefined) => {
    if (!status) return "text-white/40";
    if (status === "healthy") return "text-green-400";
    if (status === "degraded") return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gold mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => {
          // Define navigation paths for each card
          const getLinkPath = (label: string) => {
            const paths: Record<string, string> = {
              "Total Users": "/admin/users",
              "ZLS Artists": "/admin/users?role=zls_artist",
              "Independent": "/admin/users?role=independent",
              "VIBES": "/admin/users?role=vibes",
              "Pending Posts": "/admin/posts/pending",
              "Pending Verifications": "/admin/verification",
              "Pending Reports": "/admin/reports/pending",
              "Pending Payouts": "/admin/payouts/pending",
              "Anomaly Alerts (24h)": "/admin/security/alerts",
              "Total Creators": "/admin/users?role=creator",
            };
            return paths[stat.label] || "#";
          };

          return (
            <Link key={stat.label} href={getLinkPath(stat.label)}>
              <div className="glass-card p-4 rounded-xl border border-white/10 hover:border-gold/30 hover:bg-white/5 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={stat.color} size={24} />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-white/50 text-sm">{stat.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* System Health */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Activity size={20} className="text-gold" /> System Health
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Database</span>
              <span className={health?.database === "healthy" ? "text-green-400" : "text-red-400"}>
                {health?.database || "unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">API</span>
              <span className={health?.api === "healthy" ? "text-green-400" : "text-red-400"}>
                {health?.api || "unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Storage</span>
              <span className={health?.storage === "healthy" ? "text-green-400" : "text-red-400"}>
                {health?.storage || "unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">CDN</span>
              <span className={getHealthColor(health?.cdn)}>
                {health?.cdn || "unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Uptime</span>
              <span className="text-green-400">{health?.uptime || "99.9%"}</span>
            </div>
          </div>
        </div>

        {/* Security Monitor */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Shield size={20} className="text-gold" /> Security Monitor (24h)
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Rate Limit Hits</span>
              <span className="text-white font-mono">{security?.rateLimitHits || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Bot Detections</span>
              <span className={(security?.botDetections || 0) > 10 ? "text-red-400" : "text-white"}>
                {security?.botDetections ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Suspicious Logins</span>
              <span className={(security?.suspiciousLogins || 0) > 5 ? "text-red-400" : "text-white"}>
                {security?.suspiciousLogins ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Active Sessions</span>
              <span className="text-white font-mono">{security?.activeSessions || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-card p-6 rounded-xl border border-white/10">
        <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
          <Clock size={20} className="text-gold" /> Recent Activity
        </h2>
        {activities.length === 0 ? (
          <p className="text-white/40 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                    <Activity size={14} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-white text-sm">{getActionLabel(activity.action)}</p>
                    <p className="text-white/40 text-xs">
                      {activity.targetType}: {activity.targetId?.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <span className="text-white/30 text-xs">{formatTimestamp(activity.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
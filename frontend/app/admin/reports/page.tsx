"use client";

import { useEffect, useState } from "react";
import { Flag, CheckCircle, XCircle, User, FileText, MessageSquare, Eye, Ban } from "lucide-react";

interface ReportData {
  id: string;
  reporterId: string;
  reporter?: { username: string; email: string };
  targetId: string;
  targetType: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

const ReportsPage = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setReports(data.reports || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const resolveReport = async (id: string, action: string) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/reports/${id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) fetchReports();
    } catch (err) {
      console.error("Failed to resolve report:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case "user": return <User size={16} />;
      case "post": return <FileText size={16} />;
      case "comment": return <MessageSquare size={16} />;
      default: return <Flag size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Flag className="text-red-400" size={28} /> Reported Content Queue
        </h1>
        <p className="text-white/50 mt-1">{reports.length} pending reports</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4 mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
          <p className="text-white/60 text-lg">All clear! No pending reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="glass-card p-5 rounded-xl border border-white/10 hover:border-red-500/20 transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                    {getTargetIcon(report.targetType)}
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">
                      {report.targetType}: {report.targetId.slice(0, 8)}...
                    </p>
                    <p className="text-white/40 text-xs">
                      Reported by {report.reporter?.username || "unknown"} · {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                  Pending
                </span>
              </div>

              <div className="bg-white/5 rounded-lg p-3 mb-3">
                <p className="text-white/80 text-sm font-medium">{report.reason}</p>
                {report.description && (
                  <p className="text-white/50 text-sm mt-1">{report.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => resolveReport(report.id, "dismiss")}
                  disabled={actionLoading === report.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white text-xs transition disabled:opacity-50"
                >
                  <XCircle size={14} /> Dismiss
                </button>
                <button
                  onClick={() => resolveReport(report.id, "delete_post")}
                  disabled={actionLoading === report.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition disabled:opacity-50"
                >
                  <Trash2Icon size={14} /> Delete Content
                </button>
                <button
                  onClick={() => resolveReport(report.id, "warn_user")}
                  disabled={actionLoading === report.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs transition disabled:opacity-50"
                >
                  <Eye size={14} /> Warn User
                </button>
                <button
                  onClick={() => resolveReport(report.id, "ban_user")}
                  disabled={actionLoading === report.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs transition disabled:opacity-50"
                >
                  <Ban size={14} /> Ban User
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Little inline Trash2 icon (avoid extra import complexity)
const Trash2Icon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default ReportsPage;
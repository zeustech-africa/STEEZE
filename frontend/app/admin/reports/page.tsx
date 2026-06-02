"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, Eye, CheckCircle, XCircle, Loader2, AlertTriangle, X } from "lucide-react";

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  customReason?: string;
  status: string;
  createdAt: string;
  reporter: {
    id: string;
    fullName: string;
    email: string;
  };
  targetContent?: any;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState("pending");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    checkAdminAuth();
    fetchReports();
    fetchStats();
  }, [filter]);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || user.email !== "admin@steeze.com") {
      router.push("/admin/login");
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/reports?status=${filter}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Fetch reports error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/reports/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  const handleUpdateStatus = async (reportId: string, status: string, action?: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status, action })
      });

      if (response.ok) {
        fetchReports();
        fetchStats();
        setSelectedReport(null);
      }
    } catch (error) {
      console.error("Update report error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Pending</span>;
      case "reviewing": return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Reviewing</span>;
      case "resolved": return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Resolved</span>;
      case "dismissed": return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">Dismissed</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Content Reports</h1>
            <p className="text-white/50 text-sm">Manage reported content from users</p>
          </div>
          <Link href="/admin" className="text-gray-400 hover:text-gold transition-colors">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-white/50 text-sm">Pending</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-blue-400">{stats.reviewing}</div>
              <div className="text-white/50 text-sm">Reviewing</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
              <div className="text-white/50 text-sm">Resolved</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-gray-400">{stats.dismissed}</div>
              <div className="text-white/50 text-sm">Dismissed</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {["pending", "reviewing", "resolved", "dismissed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                filter === tab
                  ? "text-gold border-b-2 border-gold"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {stats && stats[tab] > 0 && ` (${stats[tab]})`}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Flag size={48} className="mx-auto mb-4 text-white/20" />
              No reports found
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-gold/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag size={16} className="text-red-400" />
                      <span className="text-white font-medium">Report #{report.id.slice(0, 8)}</span>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-white/60 text-sm mb-1">
                      <strong className="text-white">Type:</strong> {report.targetType}
                    </p>
                    <p className="text-white/60 text-sm mb-1">
                      <strong className="text-white">Reason:</strong> {report.reason}
                      {report.customReason && ` - ${report.customReason}`}
                    </p>
                    <p className="text-white/60 text-sm">
                      <strong className="text-white">Reported by:</strong> {report.reporter?.fullName || "Unknown"}
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-all"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(report.id, "dismissed")}
                      className="px-3 py-1.5 bg-gray-600/20 text-gray-400 rounded-lg text-sm hover:bg-gray-600/30 transition-all"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(report.id, "resolved", "delete_content")}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-all"
                    >
                      Delete & Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900">
              <h2 className="text-white text-xl font-bold">Report Details</h2>
              <button onClick={() => setSelectedReport(null)} className="text-white/50 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-1">Report Information</h3>
                  <p className="text-white/60 text-sm">ID: {selectedReport.id}</p>
                  <p className="text-white/60 text-sm">Type: {selectedReport.targetType}</p>
                  <p className="text-white/60 text-sm">Reason: {selectedReport.reason}</p>
                  {selectedReport.customReason && (
                    <p className="text-white/60 text-sm">Custom Reason: {selectedReport.customReason}</p>
                  )}
                  <p className="text-white/60 text-sm">Status: {selectedReport.status}</p>
                  <p className="text-white/60 text-sm">Reported at: {new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-1">Reported Content</h3>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    {selectedReport.targetContent ? (
                      <pre className="text-white/60 text-sm whitespace-pre-wrap">
                        {JSON.stringify(selectedReport.targetContent, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-white/40 text-sm">Content not found (may have been deleted)</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-1">Reporter</h3>
                  <p className="text-white/60 text-sm">Name: {selectedReport.reporter?.fullName}</p>
                  <p className="text-white/60 text-sm">Email: {selectedReport.reporter?.email}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReport.id, "dismissed");
                      setSelectedReport(null);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReport.id, "resolved", "delete_content");
                      setSelectedReport(null);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    Delete Content & Resolve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
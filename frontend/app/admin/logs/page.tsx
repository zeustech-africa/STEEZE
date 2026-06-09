"use client";

import { useEffect, useState } from "react";
import { ScrollText, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  ipAddress: string;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  approve_creator: "bg-green-500/20 text-green-400",
  reject_creator: "bg-red-500/20 text-red-400",
  approve_post: "bg-green-500/20 text-green-400",
  reject_post: "bg-red-500/20 text-red-400",
  delete_post: "bg-red-500/20 text-red-400",
  ban_user: "bg-red-500/20 text-red-400",
  suspend_user: "bg-yellow-500/20 text-yellow-400",
  delete_user: "bg-red-500/20 text-red-400",
  push_distribution: "bg-blue-500/20 text-blue-400",
  toggle_maintenance: "bg-purple-500/20 text-purple-400",
  broadcast_message: "bg-blue-500/20 text-blue-400",
};

const LogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", (page * pageSize).toString());
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) setLogs(data.logs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="text-white/50 mt-1">Complete history of admin actions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-gold/50 appearance-none cursor-pointer"
          >
            <option value="">All Actions</option>
            {Object.keys(actionColors).map((action) => (
              <option key={action} value={action}>
                {formatAction(action)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ScrollText className="mx-auto text-white/20 mb-4" size={48} />
          <p className="text-white/50">No audit logs found</p>
          {actionFilter && (
            <button
              onClick={() => setActionFilter("")}
              className="mt-2 text-gold text-sm hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Action</th>
                    <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Target</th>
                    <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Details</th>
                    <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Admin</th>
                    <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">IP</th>
                    <th className="text-right p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${actionColors[log.action] || "bg-white/10 text-white/60"}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white/60 text-xs capitalize">{log.targetType}</p>
                          <p className="text-white/20 text-[10px] font-mono">{log.targetId?.slice(0, 12)}...</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white/30 text-xs max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-white/30 text-xs font-mono">{log.adminId?.slice(0, 8)}...</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white/20 text-xs font-mono">{log.ipAddress || "—"}</p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-white/30 text-xs">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-white/15 text-[10px]">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-white/20 text-xs">Showing {logs.length} logs</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-white/10 text-white/40 hover:border-white/20 hover:text-white transition disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="flex items-center px-3 text-white/40 text-sm">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={logs.length < pageSize}
                className="p-2 rounded-lg border border-white/10 text-white/40 hover:border-white/20 hover:text-white transition disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LogsPage;
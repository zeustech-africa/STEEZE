"use client";

import { useEffect, useState } from "react";
import { MessageCircle, CheckCircle, XCircle, User } from "lucide-react";

interface AppealData {
  id: string;
  userId: string;
  user?: { username: string; email: string; artistName: string };
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}

const AppealsPage = () => {
  const [appeals, setAppeals] = useState<AppealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const fetchAppeals = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/appeals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAppeals(data.appeals || []);
    } catch (err) {
      console.error("Failed to fetch appeals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppeals(); }, []);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      const url = `/api/admin/appeals/${id}/${status === "approved" ? "approve" : "reject"}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (data.success) {
        setNote("");
        fetchAppeals();
      }
    } catch (err) {
      console.error("Failed to process appeal:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <MessageCircle className="text-blue-400" size={28} /> Appeals Queue
        </h1>
        <p className="text-white/50 mt-1">{appeals.length} pending appeals</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : appeals.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
          <p className="text-white/60 text-lg">No pending appeals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appeals.map((appeal) => (
            <div key={appeal.id} className="glass-card p-5 rounded-xl border border-white/10 hover:border-blue-500/20 transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {appeal.user?.artistName || appeal.user?.username || "Unknown User"}
                    </p>
                    <p className="text-white/40 text-xs">
                      {appeal.targetType}: {appeal.targetId.slice(0, 8)}... · {new Date(appeal.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                  Pending
                </span>
              </div>

              <div className="bg-white/5 rounded-lg p-3 mb-3">
                <p className="text-white/80 text-sm">{appeal.reason}</p>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Admin note (optional)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction(appeal.id, "approved")}
                  disabled={actionLoading === appeal.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm transition disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Approve Appeal
                </button>
                <button
                  onClick={() => handleAction(appeal.id, "rejected")}
                  disabled={actionLoading === appeal.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition disabled:opacity-50"
                >
                  <XCircle size={16} /> Reject Appeal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppealsPage;
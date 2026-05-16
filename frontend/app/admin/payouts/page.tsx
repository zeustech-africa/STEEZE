"use client";

import { useEffect, useState } from "react";
import { DollarSign, CheckCircle, Clock, XCircle, User } from "lucide-react";

interface PayoutData {
  id: string;
  creatorId: string;
  creator?: { username: string; artistName: string; email: string };
  amount: number;
  status: string;
  payfastId?: string;
  createdAt: string;
  processedAt?: string;
}

const PayoutsPage = () => {
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/payouts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPayouts(data.payouts || []);
    } catch (err) {
      console.error("Failed to fetch payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayouts(); }, []);

  const approvePayout = async (id: string) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/payouts/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchPayouts();
    } catch (err) {
      console.error("Failed to approve payout:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return { icon: <CheckCircle size={14} />, className: "bg-green-500/20 text-green-400", label: "Completed" };
      case "processing":
        return { icon: <Clock size={14} />, className: "bg-blue-500/20 text-blue-400", label: "Processing" };
      case "failed":
        return { icon: <XCircle size={14} />, className: "bg-red-500/20 text-red-400", label: "Failed" };
      default:
        return { icon: <Clock size={14} />, className: "bg-yellow-500/20 text-yellow-400", label: "Pending" };
    }
  };

  const filtered = filter === "all" ? payouts : payouts.filter((p) => p.status === filter);
  const totalPending = payouts.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <DollarSign className="text-gold" size={28} /> Payout Queue
        </h1>
        <p className="text-white/50 mt-1">
          {payouts.filter((p) => p.status === "pending").length} pending · R {totalPending.toFixed(2)} to pay out
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["pending", "processing", "completed", "failed", "all"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition ${
              filter === tab
                ? "bg-gold/20 text-gold border border-gold/30"
                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
        <button onClick={fetchPayouts} className="ml-auto px-4 py-2 rounded-lg bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 text-sm transition">
          Refresh
        </button>
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
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
          <p className="text-white/60 text-lg">No {filter} payouts found.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Creator</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Amount</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Status</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">PayFast ID</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Requested</th>
                  <th className="text-right p-4 text-white/40 text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payout) => {
                  const status = getStatusBadge(payout.status);
                  return (
                    <tr key={payout.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-white/30" />
                          <div>
                            <p className="text-white text-sm font-medium">
                              {payout.creator?.artistName || payout.creator?.username || payout.creatorId.slice(0, 8)}
                            </p>
                            <p className="text-white/30 text-xs">{payout.creator?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gold font-semibold">R {payout.amount.toFixed(2)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${status.className}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-white/30 text-xs">{payout.payfastId || "—"}</td>
                      <td className="p-4 text-white/30 text-xs">{new Date(payout.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        {payout.status === "pending" && (
                          <button
                            onClick={() => approvePayout(payout.id)}
                            disabled={actionLoading === payout.id}
                            className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs transition disabled:opacity-50"
                          >
                            {actionLoading === payout.id ? "Processing..." : "Approve"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsPage;
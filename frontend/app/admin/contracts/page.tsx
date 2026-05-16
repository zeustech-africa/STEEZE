"use client";

import { useEffect, useState } from "react";
import { Crown, CheckCircle2, XCircle, FileText, Calendar, Clock, User } from "lucide-react";

interface Contract {
  id: string;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    artistName?: string;
    email: string;
    profilePicUrl?: string;
  };
  status: string;
  contractType: string;
  revenueSplit: number;
  durationMonths?: number;
  signedAt?: string;
  expiresAt?: string;
  approvedBy?: string;
  rejectedReason?: string;
  createdAt: string;
}

const ContractsPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/contracts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setContracts(data.contracts || []);
    } catch (err) {
      console.error("Failed to fetch contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveContract = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/contracts/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setContracts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
        );
        setSelectedContract((prev) => (prev?.id === id ? { ...prev, status: "approved" } : prev));
      }
    } catch (err) {
      console.error("Failed to approve contract:", err);
    }
  };

  const openRejectModal = (contract: Contract) => {
    setSelectedContract(contract);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const rejectContract = async () => {
    if (!selectedContract) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/contracts/${selectedContract.id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        setContracts((prev) =>
          prev.map((c) =>
            c.id === selectedContract.id ? { ...c, status: "rejected", rejectedReason: rejectReason } : c
          )
        );
        setShowRejectModal(false);
        setSelectedContract(null);
      }
    } catch (err) {
      console.error("Failed to reject contract:", err);
    }
  };

  const filtered = contracts.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      approved: "bg-green-500/20 text-green-400 border-green-500/30",
      rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return badges[status] || "bg-white/10 text-white/50 border-white/10";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Crown className="text-gold" size={28} /> Contract Management
        </h1>
        <p className="text-white/50 mt-1">Review and approve ZLS artist contracts</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-lg text-sm transition ${
              filter === f.value
                ? "bg-gold/20 text-gold border border-gold/30"
                : "bg-white/5 text-white/40 border border-white/10 hover:text-white/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <FileText className="mx-auto text-white/20 mb-4" size={48} />
          <p className="text-white/60 text-lg">No contracts found.</p>
          <p className="text-white/30 text-sm mt-1">
            {filter === "pending"
              ? "All contracts have been processed."
              : "Try changing the filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((contract) => (
            <div key={contract.id} className="glass-card rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                    {contract.creator?.artistName?.charAt(0) || contract.creator?.username?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-semibold">
                        {contract.creator?.artistName || contract.creator?.username || "Unknown Creator"}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs border ${getStatusBadge(contract.status)}`}>
                        {contract.status}
                      </span>
                    </div>
                    <p className="text-white/40 text-sm">{contract.creator?.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                      <span className="flex items-center gap-1">
                        <FileText size={12} /> {contract.contractType || "ZLS Contract"}
                      </span>
                      <span>Revenue Split: {contract.revenueSplit}%</span>
                      {contract.durationMonths && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {contract.durationMonths} months
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Created {new Date(contract.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {contract.rejectedReason && (
                      <p className="text-red-400/70 text-xs mt-2">
                        Rejection reason: {contract.rejectedReason}
                      </p>
                    )}
                  </div>
                </div>

                {contract.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveContract(contract.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm border border-green-500/30 hover:bg-green-500/30 transition"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(contract)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm border border-red-500/30 hover:bg-red-500/30 transition"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass-card rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-1">Reject Contract</h2>
            <p className="text-white/40 text-sm mb-4">
              Rejecting contract for {selectedContract?.creator?.artistName || selectedContract?.creator?.username}
            </p>
            <textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50 transition resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={rejectContract}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm border border-red-500/30 hover:bg-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/50 text-sm border border-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;
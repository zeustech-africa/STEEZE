"use client";

import { useState, useEffect } from "react";
import { Download, CheckCircle, Clock, AlertCircle, Trash2, Loader2, FileArchive, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const dataTypeOptions = [
  { id: "profile", label: "Profile Information", description: "Name, email, username, bio, profile picture" },
  { id: "posts", label: "Posts", description: "All content you have uploaded" },
  { id: "interactions", label: "Interactions", description: "Likes, comments, reposts, saves" },
  { id: "social", label: "Social Graph", description: "Followers and following lists" },
  { id: "subscriptions", label: "Subscriptions & Payments", description: "Active subscriptions and payment history" },
  { id: "messages", label: "Messages", description: "Direct messages" },
  { id: "login_history", label: "Login History", description: "IP addresses and timestamps of your logins" },
];

export default function DataExportPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["profile", "posts", "interactions"]);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchExportHistory();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchExportHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data-export/history`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setExportHistory(data.exports);
      }
    } catch (error) {
      console.error("Failed to fetch export history:", error);
    }
  };

  const toggleDataType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
    );
  };

  const requestExport = async () => {
    if (selectedTypes.length === 0) {
      setRequestStatus("error");
      setRequestMessage("Please select at least one data type to export.");
      return;
    }

    setLoading(true);
    setRequestStatus(null);
    setRequestMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/data-export/request`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ dataTypes: selectedTypes }),
      });
      const data = await res.json();
      if (data.success) {
        setRequestStatus("success");
        setRequestMessage(data.message);
        fetchExportHistory();
      } else {
        setRequestStatus("error");
        setRequestMessage(data.message);
      }
    } catch (error) {
      setRequestStatus("error");
      setRequestMessage("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestAccountDeletion = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm account deletion.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const res = await fetch(`${API_BASE}/api/data-export/delete-account`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteConfirm(false);
        setDeletePassword("");
        localStorage.clear();
        window.location.href = "/";
      } else {
        setDeleteError(data.message);
      }
    } catch (error) {
      setDeleteError("An error occurred. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Completed</span>;
      case 'processing':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1"><Clock size={12} /> Processing</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 flex items-center gap-1"><Clock size={12} /> Pending</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 flex items-center gap-1"><AlertCircle size={12} /> Failed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">{status}</span>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Back link */}
        <a href="/settings" className="text-white/50 hover:text-gold text-sm mb-6 inline-block">&larr; Back to Settings</a>

        <h1 className="text-3xl font-bold text-gold mb-2">Data & Privacy</h1>
        <p className="text-white/50 mb-8">Download your data or delete your account (GDPR compliant)</p>

        {/* Data Export Section */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Download size={20} className="text-gold" /> Download Your Data
          </h2>
          <p className="text-white/60 text-sm mb-6">
            Select what you want to include in your export. You'll receive an email with a secure download link when it's ready. The link expires in 7 days.
          </p>

          <div className="space-y-3 mb-6">
            {dataTypeOptions.map((option) => (
              <label
                key={option.id}
                className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-all border border-white/5 hover:border-gold/20"
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(option.id)}
                  onChange={() => toggleDataType(option.id)}
                  className="mt-1 w-4 h-4 rounded accent-gold"
                />
                <div className="flex-1">
                  <p className="text-white font-medium">{option.label}</p>
                  <p className="text-white/40 text-sm">{option.description}</p>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={requestExport}
            disabled={loading || selectedTypes.length === 0}
            className="w-full py-3 bg-gold text-black rounded-full font-bold hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <FileArchive size={18} />}
            {loading ? "Requesting..." : "Request Data Export"}
          </button>

          {requestStatus === "success" && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 shrink-0" />
              <span>{requestMessage}</span>
            </div>
          )}
          {requestStatus === "error" && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{requestMessage}</span>
            </div>
          )}

          {exportHistory.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-white font-semibold mb-3">Previous Exports</h3>
              <div className="space-y-2">
                {exportHistory.map((exp) => (
                  <div key={exp.id} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">{new Date(exp.requestedAt).toLocaleDateString()}</span>
                      {getStatusBadge(exp.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {exp.fileSize && <span className="text-white/30 text-xs">{(exp.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
                      {exp.status === 'completed' && exp.fileUrl && new Date(exp.expiresAt) > new Date() && (
                        <a
                          href={exp.fileUrl}
                          className="text-gold hover:underline text-xs flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download size={14} /> Download
                        </a>
                      )}
                      {exp.status === 'completed' && exp.expiresAt && new Date(exp.expiresAt) <= new Date() && (
                        <span className="text-red-400/60 text-xs">Expired</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account Deletion Section */}
        <div className="glass-card p-6 border border-red-500/30">
          <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <Trash2 size={20} /> Delete Account
          </h2>
          <p className="text-white/60 text-sm mb-4">
            Permanently delete your account and all associated data. This is your GDPR right to be forgotten.
          </p>
          <ul className="text-white/50 text-sm mb-4 space-y-1 list-disc list-inside">
            <li>You have a 30-day grace period to change your mind</li>
            <li>After 30 days, all your data will be permanently deleted</li>
            <li>This action cannot be reversed after the grace period</li>
            <li>You will be logged out and your account will be suspended immediately</li>
          </ul>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 bg-red-500/20 border border-red-500 text-red-400 rounded-full font-bold hover:bg-red-500 hover:text-black transition-all"
          >
            Request Account Deletion
          </button>
        </div>

        {/* GDPR Compliance Info */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg text-white/40 text-xs">
          <p className="font-medium text-white/60 mb-1">GDPR Compliance</p>
          <p>
            STEEZE complies with GDPR regulations. You have the right to access, rectify, export, and delete your personal data.
            For questions about your data, contact <a href="mailto:privacy@steeze.com" className="text-gold hover:underline">privacy@steeze.com</a>.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}>
          <div className="glass-card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-400">Delete Account</h2>
              <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-white/70 mb-4 text-sm">
              This will permanently delete your account and all associated data. Your account will be suspended immediately and permanently deleted after 30 days.
            </p>
            <input
              type="password"
              placeholder="Enter your password to confirm"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4 focus:border-red-500 focus:outline-none"
            />
            {deleteError && (
              <p className="text-red-400 text-sm mb-4 flex items-center gap-1">
                <AlertCircle size={14} /> {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={requestAccountDeletion}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleteLoading ? "Processing..." : "Delete Permanently"}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
                className="flex-1 py-2.5 border border-white/30 text-white rounded-full font-bold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
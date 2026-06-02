"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Flag } from "lucide-react";

interface ReportReason {
  value: string;
  label: string;
  description: string;
}

interface ReportContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "post" | "comment" | "user";
  targetId: string;
  targetTitle?: string;
  onSuccess?: () => void;
}

export default function ReportContentModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onSuccess
}: ReportContentModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (isOpen) {
      fetchReasons();
    }
  }, [isOpen]);

  const fetchReasons = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/reports/reasons`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setReasons(data.reasons);
      }
    } catch (err) {
      console.error("Fetch reasons error:", err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/reports/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: selectedReason,
          customReason: selectedReason === "other" ? customReason : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setSelectedReason("");
          setCustomReason("");
        }, 2000);
      } else {
        setError(data.error || "Failed to submit report");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Flag size={20} className="text-red-400" />
            <h2 className="text-white text-xl font-bold">Report Content</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Flag size={32} className="text-green-400" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Report Submitted</h3>
              <p className="text-white/50 text-sm">
                Thank you for helping keep STEEZE safe. Our team will review this content.
              </p>
            </div>
          ) : (
            <>
              <p className="text-white/60 text-sm mb-4">
                Reporting: <span className="text-white font-medium">{targetTitle || "This content"}</span>
              </p>

              <div className="space-y-3">
                {reasons.map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      selectedReason === reason.value
                        ? "bg-red-500/20 border border-red-500"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-1 accent-red-500"
                    />
                    <div>
                      <p className="text-white font-medium">{reason.label}</p>
                      <p className="text-white/40 text-xs">{reason.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {selectedReason === "other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please provide more details..."
                  rows={3}
                  className="mt-4 w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold resize-none"
                />
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Submit Report"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
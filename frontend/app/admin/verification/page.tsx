"use client";

import { useEffect, useState } from "react";
import {
  UserCheck,
  XCircle,
  CheckCircle,
  MessageCircle,
  Search,
  Image as ImageIcon,
} from "lucide-react";

interface Creator {
  id: string;
  email: string;
  artistName: string;
  bio: string;
  category: string;
  idPhotoUrl: string;
  selfiePhotoUrl: string;
  createdAt: string;
  verificationMessages: VerificationMessage[];
}

interface VerificationMessage {
  id: string;
  message: string;
  fileUrl: string | null;
  isFromAdmin: boolean;
  createdAt: string;
}

const VerificationPage = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchCreators = async () => {
    try {
      const res = await fetch("/api/admin/verification/pending", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) setCreators(data.pending);
    } catch (error) {
      console.error("Failed to fetch creators:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const sendMessage = async (creatorId: string) => {
    if (!chatMessage.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch(`/api/admin/verification/${creatorId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: chatMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setChatMessage("");
        fetchCreators();
        if (selectedCreator) {
          setSelectedCreator({
            ...selectedCreator,
            verificationMessages: [
              ...selectedCreator.verificationMessages,
              data.message,
            ],
          });
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const approveCreator = async (creatorId: string) => {
    try {
      const res = await fetch(`/api/admin/verification/${creatorId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchCreators();
        setSelectedCreator(null);
      }
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const rejectCreator = async (creatorId: string) => {
    if (!rejectReason.trim()) return;
    try {
      const res = await fetch(`/api/admin/verification/${creatorId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCreators();
        setSelectedCreator(null);
        setShowRejectModal(false);
        setRejectReason("");
      }
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  const filtered = creators.filter(
    (c) =>
      c.artistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Verification Queue</h1>
          <p className="text-white/50 mt-1">
            {creators.length} creator{creators.length !== 1 ? "s" : ""} awaiting verification
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input
          type="text"
          placeholder="Search by artist name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
        />
      </div>

      {/* Creators List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UserCheck className="mx-auto text-white/20 mb-4" size={48} />
          <p className="text-white/50">No pending verifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((creator) => (
            <div key={creator.id} className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold text-lg">
                      {creator.artistName || "Unnamed Creator"}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 capitalize">
                      {creator.category || "Uncategorized"}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mb-1">{creator.email}</p>
                  <p className="text-white/40 text-sm mb-3">
                    {creator.bio || "No bio provided"}
                  </p>

                  {/* ID Photos */}
                  {(creator.idPhotoUrl || creator.selfiePhotoUrl) && (
                    <div className="flex gap-3 mb-4">
                      {creator.idPhotoUrl && (
                        <div className="w-24 h-32 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                          <img
                            src={creator.idPhotoUrl}
                            alt="ID Photo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {creator.selfiePhotoUrl && (
                        <div className="w-24 h-32 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                          <img
                            src={creator.selfiePhotoUrl}
                            alt="Selfie"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-white/20 text-xs">
                    Applied {new Date(creator.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setSelectedCreator(creator)}
                    className="p-2 rounded-lg border border-white/10 hover:bg-white/10 transition text-white/60 hover:text-white"
                    title="Open Chat"
                  >
                    <MessageCircle size={18} />
                  </button>
                  <button
                    onClick={() => approveCreator(creator.id)}
                    className="p-2 rounded-lg border border-green-500/30 hover:bg-green-500/10 transition text-green-400"
                    title="Approve"
                  >
                    <CheckCircle size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCreator(creator);
                      setShowRejectModal(true);
                    }}
                    className="p-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition text-red-400"
                    title="Reject"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === CHAT MODAL === */}
      {selectedCreator && !showRejectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">
                  Chat with {selectedCreator.artistName || "Creator"}
                </h3>
                <p className="text-white/40 text-xs">{selectedCreator.email}</p>
              </div>
              <button
                onClick={() => setSelectedCreator(null)}
                className="text-white/40 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
              {selectedCreator.verificationMessages?.length === 0 && (
                <p className="text-white/30 text-sm text-center py-8">
                  No messages yet. Start the conversation.
                </p>
              )}
              {selectedCreator.verificationMessages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isFromAdmin ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                      msg.isFromAdmin
                        ? "bg-gold/20 text-white"
                        : "bg-white/5 text-white/80"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className="text-white/20 text-[10px] mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && sendMessage(selectedCreator.id)
                  }
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
                />
                <button
                  onClick={() => sendMessage(selectedCreator.id)}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="px-4 py-2 bg-gold text-black rounded-lg font-medium disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === REJECT MODAL === */}
      {showRejectModal && selectedCreator && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-white font-semibold text-lg mb-2">
              Reject {selectedCreator.artistName || "Creator"}
            </h3>
            <p className="text-white/50 text-sm mb-4">
              Provide a reason for rejection. This will be sent to the creator.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., ID photo is blurry, please re-upload..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 min-h-[100px] mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-white/10 rounded-lg text-white/60 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectCreator(selectedCreator.id)}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Reject Creator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;
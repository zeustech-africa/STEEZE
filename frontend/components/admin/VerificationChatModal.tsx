"use client";

import { useEffect, useState, useRef } from "react";
import { X, Send, Paperclip, CheckCircle, XCircle } from "lucide-react";

interface Message {
  id: string;
  creatorId: string;
  adminId: string | null;
  message: string;
  fileUrl: string | null;
  isFromAdmin: boolean;
  readAt: string | null;
  createdAt: string;
}

interface Creator {
  id: string;
  email: string;
  artistName: string;
  idPhotoUrl: string;
  selfiePhotoUrl: string;
}

interface VerificationChatModalProps {
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const VerificationChatModal = ({
  creator,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: VerificationChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verification/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) {
        const creatorData = data.pending.find((c: any) => c.id === creator.id);
        if (creatorData?.verificationMessages) {
          setMessages(creatorData.verificationMessages);
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, creator.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    setSending(true);
    try {
      let fileUrl: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) fileUrl = uploadData.url;
      }

      const res = await fetch(`/api/admin/verification/${creator.id}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: newMessage,
          fileUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="text-white font-semibold text-lg">
              {creator.artistName || creator.email}
            </h3>
            <p className="text-white/40 text-xs">Verification Chat</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* ID and Selfie Photos */}
        <div className="flex gap-4 p-4 border-b border-white/10">
          {creator.idPhotoUrl && (
            <div className="flex-1">
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">ID Photo</p>
              <img
                src={creator.idPhotoUrl}
                alt="ID"
                className="w-full h-32 object-cover rounded-lg border border-white/10"
              />
            </div>
          )}
          {creator.selfiePhotoUrl && (
            <div className="flex-1">
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Selfie</p>
              <img
                src={creator.selfiePhotoUrl}
                alt="Selfie"
                className="w-full h-32 object-cover rounded-lg border border-white/10"
              />
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/30 text-sm">No messages yet</p>
              <p className="text-white/15 text-xs mt-1">
                Start the conversation with this creator.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isFromAdmin ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${
                    msg.isFromAdmin
                      ? "bg-gold/20 border border-gold/20"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <p className="text-white/80 text-sm">{msg.message}</p>
                  {msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-gold text-xs underline"
                    >
                      View attachment
                    </a>
                  )}
                  <p className="text-white/20 text-[10px] mt-1">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <label className="p-3 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/20 cursor-pointer transition">
              <Paperclip size={18} />
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
            </label>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
            />
            <button
              onClick={handleSend}
              disabled={sending || (!newMessage.trim() && !selectedFile)}
              className="p-3 rounded-lg bg-gold text-black hover:bg-gold/80 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          {selectedFile && (
            <p className="text-white/40 text-xs mt-2">
              File selected: {selectedFile.name}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          {showRejectInput ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="flex-1 bg-white/5 border border-red-500/30 rounded-lg px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:border-red-500"
              />
              <button
                onClick={() => {
                  if (rejectReason.trim()) {
                    onReject(creator.id, rejectReason);
                    setShowRejectInput(false);
                    setRejectReason("");
                  }
                }}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition disabled:opacity-30"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectReason("");
                }}
                className="px-3 py-2 rounded-lg border border-white/10 text-white/40 text-sm hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowRejectInput(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
              >
                <XCircle size={18} />
                Reject
              </button>
              <button
                onClick={() => onApprove(creator.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
              >
                <CheckCircle size={18} />
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationChatModal;
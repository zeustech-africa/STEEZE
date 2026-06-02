"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Shield, MessageCircle, X, Send, Paperclip, CheckCircle, AlertTriangle, Camera, RefreshCw } from "lucide-react";

interface ChatMessage {
  id: string;
  userId: string;
  userType: string;
  userName: string;
  userEmail: string;
  message: string;
  fileUrl: string | null;
  fileName: string | null;
  isFromUser: boolean;
  isRead: boolean;
  isReadByUser: boolean;
  createdAt: string;
}

interface VerificationStatus {
  status: string;
  hasSelfie: boolean;
  hasIdDocument: boolean;
  userType?: string;
  message?: string;
  rejectionReason?: string;
  rejectionCustomNote?: string;
}

function VerifyStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Redirect if no userId
  useEffect(() => {
    if (!userId) {
      router.push("/signup/vibes");
    }
  }, [userId, router]);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll status
  useEffect(() => {
    if (!userId) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/verification/status/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);

          // Stop polling if final state
          if (data.status === "approved" || data.status === "rejected") {
            if (pollInterval) clearInterval(pollInterval);
            fetchMessages();
          }
        } else {
          setError("Failed to check verification status");
        }
      } catch (err) {
        console.error("Status check error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    setPollInterval(interval);

    return () => clearInterval(interval);
  }, [userId]);

  // Fetch messages
  const fetchMessages = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/verification/messages/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && !chatFile) return;
    setChatLoading(true);

    try {
      const formData = new FormData();
      formData.append("userId", userId || "");
      formData.append("message", newMessage.trim());
      if (chatFile) {
        formData.append("attachment", chatFile);
      }

      const response = await fetch(`${API_URL}/api/verification/send-message`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setNewMessage("");
        setChatFile(null);
        fetchMessages();
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Retry registration
  const handleTryAgain = () => {
    router.push("/signup/vibes");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-gold" size={48} />
          <p className="text-gray-400">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-gray-400 mb-4">{error}</p>
          <Link href="/signup/vibes" className="text-gold hover:underline">
            Back to Signup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold/20 to-black border-b border-gold/30">
        <div className="container mx-auto px-6 py-6">
          <Link href="/" className="text-gold font-bold text-2xl">
            STEEZE
          </Link>
          <p className="text-gray-400 mt-1">Identity Verification Status</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        {/* STATUS: PENDING SELFIE */}
        {status?.status === "pending_selfie" && (
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
            <Camera className="mx-auto mb-4 text-gold" size={64} />
            <h2 className="text-white text-2xl font-bold mb-4">Selfie Required</h2>
            <p className="text-gray-400 mb-6">
              Your ID document has been uploaded. Please take a live selfie to complete verification.
            </p>
            <Link
              href={`/verification/selfie?userId=${userId}`}
              className="inline-block px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Take Selfie Now
            </Link>
          </div>
        )}

        {/* STATUS: PENDING ADMIN APPROVAL */}
        {status?.status === "pending_admin_approval" && (
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
            <Clock className="mx-auto mb-4 text-gold animate-pulse" size={64} />
            <h2 className="text-white text-2xl font-bold mb-4">Verification in Progress</h2>
            <p className="text-gray-400 mb-2">
              Your identity documents have been submitted and are being reviewed by our team.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              This usually takes 1-24 hours. You can check this page for updates or message us below.
            </p>

            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle size={16} />
                <span>ID Document uploaded</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle size={16} />
                <span>Selfie captured</span>
              </div>
            </div>

            <div className="animate-pulse text-gold text-sm flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin" />
              <span>Auto-checking status...</span>
            </div>
          </div>
        )}

        {/* STATUS: APPROVED */}
        {status?.status === "approved" && (
          <div className="bg-white/5 rounded-2xl p-8 border border-gold/30 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">🎉 Verification Approved!</h2>
            <p className="text-gray-400 mb-2">
              Your identity has been verified. You can now log in and start using STEEZE.
            </p>
            {status.message && (
              <div className="bg-white/5 rounded-lg p-4 my-4 text-left text-gray-300 text-sm whitespace-pre-wrap border border-white/10">
                {status.message}
              </div>
            )}
            <Link
              href="/login"
              className="inline-block mt-6 px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Login Now
            </Link>
          </div>
        )}

        {/* STATUS: REJECTED */}
        {status?.status === "rejected" && (
          <div className="bg-white/5 rounded-2xl p-8 border border-red-500/30 text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-400" size={40} />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Verification Not Approved</h2>
            <p className="text-gray-400 mb-4">
              Unfortunately, your identity verification could not be completed.
            </p>
            {status.message && (
              <div className="bg-red-500/10 rounded-lg p-4 my-4 text-left text-gray-300 text-sm whitespace-pre-wrap border border-red-500/20">
                {status.message}
              </div>
            )}
            {status.rejectionReason && (
              <p className="text-gray-500 text-sm mb-2">
                Reason: <span className="text-red-400">{status.rejectionReason.replace(/_/g, " ")}</span>
              </p>
            )}
            <button
              onClick={handleTryAgain}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Try Again - Register
            </button>
          </div>
        )}

        {/* MESSAGE/CHAT BUTTON (always show if pending) */}
        {(status?.status === "pending_admin_approval" || status?.status === "pending_selfie" || status?.status === "rejected") && (
          <div className="mt-6">
            {!isChatOpen ? (
              <button
                onClick={() => {
                  setIsChatOpen(true);
                  fetchMessages();
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition"
              >
                <MessageCircle size={20} className="text-gold" />
                <span>Message Verification Team</span>
              </button>
            ) : (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-gold" />
                    <span className="text-white font-semibold">Verification Team</span>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No messages yet. Send a message to the verification team.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.isFromUser
                              ? "bg-gradient-to-r from-gold to-gold-dark text-black"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          {msg.fileUrl && (
                            <a
                              href={`${API_URL}${msg.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline mt-1 block opacity-70"
                            >
                              📎 {msg.fileName || "Download attachment"}
                            </a>
                          )}
                          <p className="text-xs opacity-60 mt-1">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-white/10">
                  {chatFile && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-white/5 rounded-lg">
                      <Paperclip size={14} className="text-gold" />
                      <span className="text-gray-300 text-sm flex-1 truncate">{chatFile.name}</span>
                      <button onClick={() => setChatFile(null)} className="text-gray-400 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      rows={2}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none text-sm"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-white/10 border border-white/20 rounded-lg text-gray-400 hover:text-white transition"
                        title="Attach file"
                      >
                        <Paperclip size={16} />
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={chatLoading || (!newMessage.trim() && !chatFile)}
                        className="p-2 bg-gradient-to-r from-gold to-gold-dark text-black rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        title="Send message"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setChatFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <RefreshCw className="animate-spin text-gold" size={48} />
        </div>
      }
    >
      <VerifyStatusContent />
    </Suspense>
  );
}
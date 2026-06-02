"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Shield, MessageCircle, X, Send, Paperclip, Crown, CheckCircle, AlertTriangle } from "lucide-react";

interface ChatMessage {
  id?: string;
  message: string;
  text?: string;
  isFromAdmin?: boolean;
  isAdmin?: boolean;
  fileUrl?: string | null;
  createdAt?: string;
  timestamp?: Date;
}

function PendingApprovalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(!!userId);
  const [chatLoading, setChatLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Fetch verification status from backend
  useEffect(() => {
    if (!userId) return;
    
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/verification/status/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setVerificationStatus(data.status);
          setRejectionReason(data.rejectionReason || null);
          setUserType(data.userType || null);
          setUsername(data.username || null);

          // Role-based redirect on approval
          if (data.status === 'approved') {
            const token = localStorage.getItem('token');
            if (token) {
              setTimeout(() => {
                if (data.userType === 'creator') {
                  router.push(`/${data.username}`);
                } else {
                  router.push('/');
                }
              }, 2000);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch verification status:", err);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [userId, router, API_URL]);

  // Fetch chat messages from backend
  useEffect(() => {
    if (!userId) return;

    const fetchChat = async () => {
      try {
        const response = await fetch(`${API_URL}/api/verification/messages/${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.messages) {
            setMessages(data.messages);
          } else if (data.messages && data.messages.length === 0) {
            // No messages yet, set default welcome message
            setMessages([{
              message: "Welcome to STEEZE! Your application has been submitted. Admin will review your documents within 24-48 hours. You'll receive a notification once approved. As a VIBE, you'll be able to subscribe to creators, download content, and if you choose Gold, DM creators and request video calls.",
              isFromAdmin: true,
              createdAt: new Date().toISOString(),
            }]);
          }
        } else {
          // Fallback to default welcome message
          setMessages([{
            message: "Welcome to STEEZE! Your application has been submitted. Admin will review your documents within 24-48 hours. You'll receive a notification once approved. As a VIBE, you'll be able to subscribe to creators, download content, and if you choose Gold, DM creators and request video calls.",
            isFromAdmin: true,
            createdAt: new Date().toISOString(),
          }]);
        }
      } catch (err) {
        console.error("Failed to fetch chat:", err);
        setMessages([{
          message: "Welcome to STEEZE! Your application has been submitted. Admin will review your documents within 24-48 hours.",
          isFromAdmin: true,
          createdAt: new Date().toISOString(),
        }]);
      }
    };

    fetchChat();
    const chatInterval = setInterval(fetchChat, 5000);
    return () => clearInterval(chatInterval);
  }, [userId, API_URL]);

  const sendMessage = async () => {
    if (!newMessage.trim() && !file) return;
    if (!userId) return;

    setChatLoading(true);
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("message", newMessage || "(file attachment)");
      formData.append("isFromAdmin", "false");
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch(`${API_URL}/api/verification/send-message`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      setNewMessage("");
      setFile(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const getDisplayText = (msg: ChatMessage) => msg.message || msg.text || "";
  const getIsFromAdmin = (msg: ChatMessage) => msg.isFromAdmin !== undefined ? msg.isFromAdmin : (msg.isAdmin !== undefined ? msg.isAdmin : false);
  const getTimestamp = (msg: ChatMessage) => {
    if (msg.createdAt) return new Date(msg.createdAt);
    if (msg.timestamp) return new Date(msg.timestamp);
    return new Date();
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 relative overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-30">
        <source src="/videos/verified-bg.mp4" type="video/mp4" />
      </video>

      <div className="container mx-auto max-w-2xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
          {/* Verification Status */}
          {verificationStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              verificationStatus === "approved" ? "bg-green-500/20 border border-green-500" :
              verificationStatus === "rejected" ? "bg-red-500/20 border border-red-500" :
              "bg-gold/10 border border-gold/30"
            }`}>
              <div className="flex items-center gap-2 justify-center">
                {verificationStatus === "approved" ? (
                  <div>
                    <CheckCircle className="text-green-400 mx-auto mb-2" size={24} />
                    <span className="text-green-400 font-semibold">Your account has been approved! Redirecting...</span>
                  </div>
                ) : verificationStatus === "rejected" ? (
                  <div>
                    <AlertTriangle className="text-red-400 mx-auto mb-2" size={24} />
                    <span className="text-red-400 font-semibold block">Verification declined</span>
                    {rejectionReason && (
                      <p className="text-red-300 text-sm mt-1">{rejectionReason}</p>
                    )}
                    <p className="text-white/60 text-xs mt-2">Please fix the issues and submit a new registration at steeze.zeustechafrica.com/signup</p>
                  </div>
                ) : (
                  <><Clock className="text-gold" size={20} /><span className="text-gold font-semibold">Verification pending admin review</span></>
                )}
              </div>
            </div>
          )}
          
          {statusLoading && (
            <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-white/50 text-sm animate-pulse">Fetching verification status...</p>
            </div>
          )}

          {!verificationStatus && !statusLoading && (
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center"><Clock className="text-gold" size={40} /></div>
          )}
          {(!verificationStatus || statusLoading) && (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-gold mb-3">Verification in Progress</h1>
              <p className="text-white/70 mb-6">Your VIBE application has been submitted. Admin will review your documents and selfie.</p>
            </>
          )}
          {verificationStatus && verificationStatus !== "approved" && verificationStatus !== "rejected" && (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-gold mb-3">Verification in Progress</h1>
              <p className="text-white/70 mb-6">Your VIBE application has been submitted. Admin will review your documents and selfie.</p>
            </>
          )}
          
          <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3"><Shield size={18} className="text-gold" /><span className="text-white font-semibold">Why verification?</span></div>
            <p className="text-white/60 text-sm">STEEZE is different from Facebook, Instagram, and TikTok. Every single account is verified. No bots. No fake accounts. When you follow a creator, you know they are real. When you get a like, it's from a real person. This is what makes STEEZE the premier entertainment platform.</p>
          </div>

          <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><Crown size={18} className="text-gold" /><span className="text-gold font-semibold">Gold Members Get More</span></div>
            <p className="text-white/70 text-sm">Gold VIBES can direct message creators and request video calls. Upgrade anytime from your profile settings.</p>
          </div>
        </motion.div>
      </div>

      <button type="button" onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-gold to-gold-dark text-black p-4 rounded-full shadow-lg hover:shadow-xl transition-all animate-bounce"><MessageCircle size={24} /></button>

      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 glass-card border border-white/20 shadow-2xl">
          <div className="flex justify-between items-center p-4 border-b border-white/10"><h3 className="text-gold font-semibold">Admin Support</h3><button type="button" onClick={() => setIsChatOpen(false)} className="text-white/50 hover:text-white"><X size={18} /></button></div>
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => {
              const isAdmin = getIsFromAdmin(msg);
              return (
                <div key={msg.id || idx} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${isAdmin ? "bg-white/10 text-white" : "bg-gold text-black"}`}>
                    <p className="text-sm">{getDisplayText(msg)}</p>
                    <span className="text-xs opacity-50 mt-1 block">{getTimestamp(msg).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-white/10 flex gap-2">
            <label className="cursor-pointer text-white/50 hover:text-gold"><Paperclip size={18} /><input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type your message..." className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold" />
            <button type="button" onClick={sendMessage} disabled={chatLoading} className="p-2 bg-gold rounded-lg text-black disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Did You Know? Section - STEEZE Value Proposition */}
      <div className="container mx-auto max-w-2xl relative z-10 mt-8">
        <div className="p-5 bg-gradient-to-r from-gold/5 to-transparent rounded-xl border-l-4 border-gold">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚡</div>
            <div className="flex-1">
              <h4 className="text-gold font-bold text-sm uppercase tracking-wider mb-2">Did You Know?</h4>
              <p className="text-white/80 text-sm leading-relaxed mb-3">
                STEEZE is the world's ONLY entertainment-first platform where every piece of content 
                is curated to uplift, not disrupt your peace of mind.
              </p>
              <p className="text-white/60 text-xs leading-relaxed mb-3">
                We believe social media should inspire and energize — helping you unwind after a demanding day 
                or enhancing your daily routine — never a source of anxiety or emotional distress.
              </p>
              <p className="text-white/70 text-xs font-semibold mb-3">
                This commitment makes STEEZE the global leader in pure entertainment media.
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <span className="text-red-400">✘</span> No fake news
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <span className="text-red-400">✘</span> No political agendas
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <span className="text-red-400">✘</span> No tragic stories
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <span className="text-red-400">✘</span> No religious content
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <span className="text-red-400">✘</span> No war coverage
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <span className="text-red-400">✘</span> No divisive rhetoric
                </div>
              </div>
              <p className="text-gold/80 text-xs italic">
                Creators deliver the STEEZE your VIBES deserve.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VibesPendingApprovalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <PendingApprovalContent />
    </Suspense>
  );
}
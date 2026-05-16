"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Shield, MessageCircle, X, Send, Paperclip, Crown } from "lucide-react";

export default function VibesPendingApprovalPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isAdmin: boolean; timestamp: Date }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("steeze_vibes_pending_messages");
    if (saved) setMessages(JSON.parse(saved));
    else setMessages([{ text: "Welcome to STEEZE! Your application has been submitted. Admin will review your documents within 24-48 hours. You'll receive a notification once approved. As a VIBE, you'll be able to subscribe to creators, download content, and if you choose Gold, DM creators and request video calls.", isAdmin: true, timestamp: new Date() }]);
  }, []);

  useEffect(() => { localStorage.setItem("steeze_vibes_pending_messages", JSON.stringify(messages)); }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim() || file) {
      setMessages([...messages, { text: newMessage, isAdmin: false, timestamp: new Date() }]);
      setNewMessage("");
      setFile(null);
      setTimeout(() => {
        setMessages((prev) => [...prev, { text: "Thank you for your message. Admin will respond shortly.", isAdmin: true, timestamp: new Date() }]);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 relative overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-30">
        <source src="/videos/verified-bg.mp4" type="video/mp4" />
      </video>

      <div className="container mx-auto max-w-2xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center"><Clock className="text-gold" size={40} /></div>
          <h1 className="text-2xl md:text-3xl font-bold text-gold mb-3">Verification in Progress</h1>
          <p className="text-white/70 mb-6">Your VIBE application has been submitted. Admin will review your documents and selfie.</p>
          
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
          <div className="h-80 overflow-y-auto p-4 space-y-3">{messages.map((msg, idx) => (<div key={idx} className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}><div className={`max-w-[80%] p-3 rounded-lg ${msg.isAdmin ? "bg-white/10 text-white" : "bg-gold text-black"}`}><p className="text-sm">{msg.text}</p><span className="text-xs opacity-50 mt-1 block">{new Date(msg.timestamp).toLocaleTimeString()}</span></div></div>))}</div>
          <div className="p-4 border-t border-white/10 flex gap-2"><label className="cursor-pointer text-white/50 hover:text-gold"><Paperclip size={18} /><input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label><input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type your message..." className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold" /><button type="button" onClick={sendMessage} className="p-2 bg-gold rounded-lg text-black"><Send size={16} /></button></div>
        </div>
      )}
    </div>
  );
}
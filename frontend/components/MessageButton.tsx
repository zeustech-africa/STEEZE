"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Paperclip } from "lucide-react";

interface MessageButtonProps {
  userId: string;
  userName: string;
}

export default function MessageButton({ userId, userName }: MessageButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleSend = async () => {
    if (!message.trim() && !attachment) return;

    setSending(true);
    const formData = new FormData();
    formData.append("toUserId", userId);
    formData.append("message", message);
    if (attachment) {
      formData.append("attachment", attachment);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/message-request`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setMessage("");
        setAttachment(null);
        if (data.type === "direct") {
          alert("Message sent!");
        } else {
          alert("Message request sent. They will see it in their requests.");
        }
        router.refresh();
      } else {
        alert(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Send message error:", error);
      alert("Network error");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-all"
      >
        <MessageCircle size={18} /> Message
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-xl font-bold">Message {userName}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
              autoFocus
            />

            <div className="mt-3">
              <input
                type="file"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="hidden"
                id="message-attachment"
              />
              <label
                htmlFor="message-attachment"
                className="flex items-center gap-2 text-white/50 hover:text-gold cursor-pointer"
              >
                <Paperclip size={16} /> Attach file
              </label>
              {attachment && (
                <p className="text-white/40 text-sm mt-1">📎 {attachment.name}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || (!message.trim() && !attachment)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
"use client";

import { useState } from "react";
import { Send, Users, UserCheck, Radio } from "lucide-react";

const BroadcastPage = () => {
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<string>("all_creators");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState("");

  const sendBroadcast = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message, recipientType }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setMessage("");
      } else {
        setError(data.message || "Failed to send broadcast");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const recipientOptions = [
    { value: "all_creators", label: "All Creators", icon: UserCheck, description: "Send to every creator on the platform" },
    { value: "all_fans", label: "All Fans", icon: Users, description: "Send to every fan on the platform" },
    { value: "all_users", label: "All Users", icon: Radio, description: "Send to every user (creators + fans)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Broadcast Message</h1>
          <p className="text-white/50 mt-1">Send a platform-wide announcement</p>
        </div>
      </div>

      {/* Recipient Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recipientOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setRecipientType(opt.value)}
              className={`glass-card p-6 text-left transition border ${
                recipientType === opt.value
                  ? "border-gold bg-gold/5"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <Icon
                className={recipientType === opt.value ? "text-gold" : "text-white/40"}
                size={24}
              />
              <h3 className="text-white font-semibold mt-3 mb-1">{opt.label}</h3>
              <p className="text-white/30 text-xs">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {/* Message Composer */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Compose Message</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your broadcast message here. This will be sent to all selected recipients as a notification..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-gold/50 min-h-[150px] resize-y"
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-white/20 text-xs">{message.length} characters</span>
          <button
            onClick={sendBroadcast}
            disabled={sending || !message.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gold text-black rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50"
          >
            <Send size={16} />
            {sending ? "Sending..." : "Send Broadcast"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-green-400 text-sm font-medium">Broadcast sent successfully!</p>
            <p className="text-green-400/60 text-sm mt-1">
              Delivered to {result.count} user{result.count !== 1 ? "s" : ""}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BroadcastPage;
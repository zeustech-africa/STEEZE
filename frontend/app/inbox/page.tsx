"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Send, Paperclip, X, MessageCircle, UserPlus, Check, XCircle } from "lucide-react";
import BottomNav from "../../components/layout/BottomNav";

interface MessageRequest {
  id: string;
  message: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  fromUser: {
    id: string;
    fullName: string;
    username: string;
    profilePicUrl: string;
    userType: string;
  };
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    fullName: string;
    username: string;
    profilePicUrl: string;
    userType: string;
  };
  lastMessage: string;
  lastMessageAt: string;
}

interface DirectMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

export default function InboxPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"requests" | "messages">("requests");
  const [pendingRequests, setPendingRequests] = useState<MessageRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
    fetchPendingRequests();
    fetchConversations();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/message-requests/pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPendingRequests(data.pendingRequests || []);
        setPendingCount(data.pendingCount || 0);
      }
    } catch (error) {
      console.error("Fetch pending requests error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/conversations`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/messages/unread-count`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.total > 0) {
        document.title = `(${data.total}) Inbox - STEEZE`;
      }
    } catch (error) {
      console.error("Fetch unread count error:", error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/message-requests/${requestId}/accept`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPendingRequests();
        fetchConversations();
      }
    } catch (error) {
      console.error("Accept request error:", error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/message-requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPendingRequests();
      }
    } catch (error) {
      console.error("Reject request error:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;
    if (!selectedConversation) return;

    setSending(true);
    const formData = new FormData();
    formData.append("message", newMessage);
    if (attachment) {
      formData.append("attachment", attachment);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setNewMessage("");
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchMessages(selectedConversation.id);
        fetchConversations();
      }
    } catch (error) {
      console.error("Send message error:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">Loading inbox...</div>
      </div>
    );
  }

  const currentUser = user;

  return (
    <div className="min-h-screen bg-black pt-12 pb-20">
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-gold">
            ← Back
          </button>
          <h1 className="text-white text-2xl font-bold">Messages</h1>
          {pendingCount > 0 && (
            <span className="px-2 py-1 bg-gold text-black text-xs rounded-full">
              {pendingCount} requests
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 px-4 transition-all ${
              activeTab === "requests"
                ? "text-gold border-b-2 border-gold"
                : "text-white/50 hover:text-white"
            }`}
          >
            Message Requests {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`pb-3 px-4 transition-all ${
              activeTab === "messages"
                ? "text-gold border-b-2 border-gold"
                : "text-white/50 hover:text-white"
            }`}
          >
            Conversations
          </button>
        </div>

        {/* Message Requests Tab */}
        {activeTab === "requests" && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus size={48} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/50">No pending message requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {request.fromUser.profilePicUrl ? (
                          <Image src={request.fromUser.profilePicUrl} alt={request.fromUser.fullName} width={48} height={48} className="object-cover" />
                        ) : (
                          <span className="text-gold text-xl">{request.fromUser.fullName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-semibold">{request.fromUser.fullName}</p>
                            <p className="text-white/40 text-sm">@{request.fromUser.username || request.fromUser.fullName}</p>
                          </div>
                          <p className="text-white/30 text-xs">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-white/70 text-sm mt-2">{request.message}</p>
                        {request.fileUrl && (
                          <a
                            href={`${API_URL}${request.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold text-xs mt-2 inline-block"
                          >
                            📎 View Attachment
                          </a>
                        )}
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                          >
                            <Check size={16} /> Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                          >
                            <XCircle size={16} /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conversation List */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-white font-semibold">Conversations</h2>
              </div>
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="mx-auto text-white/20 mb-2" />
                  <p className="text-white/40 text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-4 hover:bg-white/5 transition-all ${
                        selectedConversation?.id === conv.id ? "bg-white/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {conv.otherUser.profilePicUrl ? (
                            <Image src={conv.otherUser.profilePicUrl} alt={conv.otherUser.fullName} width={40} height={40} className="object-cover" />
                          ) : (
                            <span className="text-gold">{conv.otherUser.fullName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{conv.otherUser.fullName}</p>
                          <p className="text-white/40 text-sm truncate">{conv.lastMessage || "No messages yet"}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 bg-white/5 rounded-xl border border-white/10 flex flex-col h-[500px]">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                      {selectedConversation.otherUser.profilePicUrl ? (
                        <Image src={selectedConversation.otherUser.profilePicUrl} alt={selectedConversation.otherUser.fullName} width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-gold">{selectedConversation.otherUser.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{selectedConversation.otherUser.fullName}</p>
                      <p className="text-white/40 text-xs">{selectedConversation.otherUser.userType}</p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-white/40">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.fromUserId === currentUser?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.fromUserId === currentUser?.id
                                ? "bg-gradient-to-r from-gold to-gold-dark text-black"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            {msg.fileUrl && (
                              <a
                                href={`${API_URL}${msg.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline mt-1 block"
                              >
                                📎 Download Attachment
                              </a>
                            )}
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-3">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        rows={2}
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                          className="hidden"
                          id="msg-attachment"
                        />
                        <label
                          htmlFor="msg-attachment"
                          className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 cursor-pointer text-center"
                        >
                          <Paperclip size={18} />
                        </label>
                        <button
                          onClick={handleSendMessage}
                          disabled={sending || (!newMessage.trim() && !attachment)}
                          className="p-2 bg-gradient-to-r from-gold to-gold-dark text-black rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {sending ? "..." : <Send size={18} />}
                        </button>
                      </div>
                    </div>
                    {attachment && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gold">
                        <span>📎 {attachment.name}</span>
                        <button onClick={() => setAttachment(null)} className="text-white/50 hover:text-white">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-white/40">Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNav isCreator={user?.role === "creator"} onUploadClick={() => {}} />
    </div>
  );
}
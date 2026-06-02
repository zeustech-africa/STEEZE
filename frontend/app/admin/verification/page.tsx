'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface VerificationUser {
  id: string;
  userType: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  username?: string;
  artistName?: string;
  idDocumentUrl: string;
  selfieUrl: string;
  registeredAt: string;
  selfieCapturedAt: string;
}

interface MessageGroup {
  userId: string;
  userName: string;
  userEmail: string;
  userType: string;
  messages: any[];
  unreadCount: number;
}

export default function AdminVerificationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'messages' | 'approved' | 'rejected'>('pending');
  const [pendingUsers, setPendingUsers] = useState<VerificationUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<VerificationUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Message state
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [selectedMessageUser, setSelectedMessageUser] = useState<MessageGroup | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Approval/Rejection state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [congratulatoryMessage, setCongratulatoryMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCustomNote, setRejectionCustomNote] = useState('');

  // History state
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedMessageUser?.messages]);

  // Check admin auth
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/admin/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.email !== 'admin@steeze.com') {
        router.push('/admin/login');
        return;
      }
    } catch {
      router.push('/admin/login');
    }
  }, [router]);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingUsers();
    } else if (activeTab === 'messages') {
      fetchMessages();
    } else if (activeTab === 'approved') {
      fetchApprovedUsers();
    } else if (activeTab === 'rejected') {
      fetchRejectedUsers();
    }
  }, [activeTab]);

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/verification/admin/pending-verifications`);
      const data = await response.json();
      setPendingUsers(data);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/verification/admin/messages`);
      const data = await response.json();
      setMessageGroups(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchApprovedUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/verification/admin/approved-users`);
      const data = await response.json();
      setApprovedUsers(data);
    } catch (error) {
      console.error('Failed to fetch approved users:', error);
    }
  };

  const fetchRejectedUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/verification/admin/rejected-users`);
      const data = await response.json();
      setRejectedUsers(data);
    } catch (error) {
      console.error('Failed to fetch rejected users:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    const adminEmail = JSON.parse(localStorage.getItem('user') || '{}').email || 'admin@steeze.com';

    try {
      const response = await fetch(`${API_URL}/api/verification/admin/approve/${selectedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          congratulatoryMessage,
          adminEmail
        })
      });

      if (response.ok) {
        setShowApproveModal(false);
        setPendingUsers(pendingUsers.filter(u => u.id !== selectedUser.id));
        setSelectedUser(null);
        setCongratulatoryMessage('');
        fetchPendingUsers();
        alert('User approved successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve user');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    if (!rejectionReason) {
      alert('Please select a rejection reason');
      return;
    }

    setActionLoading(true);
    const adminEmail = JSON.parse(localStorage.getItem('user') || '{}').email || 'admin@steeze.com';

    let rejectionMessage = '';
    switch (rejectionReason) {
      case 'id_issue':
        rejectionMessage = `❌ Registration Not Approved - ID Document Issue\n\nYour registration could not be approved because the identification document you uploaded was not clear or could not be verified.\n\nWhat you need to do:\n• Register again with a CLEAR, readable ID document\n• Make sure all text and your photo on the ID is visible\n• No glare, no shadows, no blurry images\n\n${rejectionCustomNote ? `\nAdmin Note: ${rejectionCustomNote}` : ''}\n\n- STEEZE Verification Team`;
        break;
      case 'selfie_mismatch':
        rejectionMessage = `❌ Registration Not Approved - Selfie Mismatch\n\nYour registration could not be approved because your live selfie does not clearly match the photo on your identification document.\n\nWhat you need to do:\n• Register again with a CLEAR live selfie\n• Good lighting on your face\n• No sunglasses, hats, or face coverings\n• Look directly at the camera\n\n${rejectionCustomNote ? `\nAdmin Note: ${rejectionCustomNote}` : ''}\n\n- STEEZE Verification Team`;
        break;
      case 'document_expired':
        rejectionMessage = `❌ Registration Not Approved - Invalid Document\n\nYour registration could not be approved because the identification document you provided appears to be expired or invalid.\n\nWhat you need to do:\n• Register again with a valid, unexpired ID document\n• Government-issued ID only\n• No temporary documents\n\n${rejectionCustomNote ? `\nAdmin Note: ${rejectionCustomNote}` : ''}\n\n- STEEZE Verification Team`;
        break;
      default:
        rejectionMessage = `❌ Registration Not Approved\n\nYour registration could not be approved.\n\n${rejectionCustomNote || 'Please contact support for more information.'}\n\n- STEEZE Verification Team`;
    }

    try {
      const response = await fetch(`${API_URL}/api/verification/admin/reject/${selectedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason,
          rejectionCustomNote,
          rejectionMessage,
          adminEmail
        })
      });

      if (response.ok) {
        setShowRejectModal(false);
        setPendingUsers(pendingUsers.filter(u => u.id !== selectedUser.id));
        setSelectedUser(null);
        setRejectionReason('');
        setRejectionCustomNote('');
        fetchPendingUsers();
        alert('User rejected');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject user');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selectedMessageUser || !replyMessage.trim()) return;

    setSendingReply(true);

    try {
      const response = await fetch(`${API_URL}/api/verification/admin/reply/${selectedMessageUser.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage })
      });

      if (response.ok) {
        setReplyMessage('');
        await fetch(`${API_URL}/api/verification/admin/mark-read/${selectedMessageUser.userId}`, {
          method: 'POST'
        });
        fetchMessages();
        const updatedGroup = messageGroups.find(g => g.userId === selectedMessageUser.userId);
        if (updatedGroup) {
          setSelectedMessageUser(updatedGroup);
        }
      }
    } catch (error) {
      console.error('Send reply error:', error);
    } finally {
      setSendingReply(false);
    }
  };

  const getCongratulatoryTemplate = (userType: string, userName: string, artistName?: string) => {
    if (userType === 'vibes') {
      return `🎉 Welcome to STEEZE, ${userName}!

Your identity has been verified successfully. You are now officially a STEEZE VIBER.

Here's what you can do now:
• Login to your account using your email and password
• Explore the global feed and discover amazing creators
• Follow your favorite artists
• Save and repost content you love
• Upgrade your subscription anytime for exclusive content

Important: Keep your account secure. Never share your password with anyone.

Need help? Contact us at support@steeze.com

Enjoy the entertainment!
- The STEEZE Team`;
    } else if (userType === 'zls_artist') {
      return `🎉 Welcome to STEEZE, ${artistName || userName}!

Your identity has been verified successfully. You are now officially a STEEZE ZLS Artist (ZeusLiveStudio signed).

Here's what you can do now:
• Login to your creator account using your email and password
• Set up your ZLS artist profile (bio, photos, music, videos)
• Upload your first post - all content gets ZLS watermark
• Your revenue split is 50/50 (ZLS partnership)
• Platform access is FREE as a signed ZLS artist

Important:
• Your contract is active and approved
• All content is auto-distributed to all channels
• You get priority support from ZeusLiveStudio

Need help? Contact ZLS management directly at zls@zeustechafrica.com

Welcome to the ZLS family!
- ZeusLiveStudio & STEEZE Team`;
    } else {
      return `🎉 Welcome to STEEZE, ${artistName || userName}!

Your identity has been verified successfully. You are now officially a STEEZE Independent Creator.

Here's what you can do now:
• Login to your creator account using your email and password
• Set up your creator profile (bio, photos, music, videos)
• Upload your first post to start building your audience
• Your revenue split is 70/30 (you keep 70%)

Important: 
• You need an active subscription to maintain your creator status
• All content must follow our community guidelines
• Your payout threshold is R500

Need help? Contact your creator support at creators@steeze.com

Start creating!
- The STEEZE Team`;
    }
  };

  if (loading && activeTab === 'pending') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading verification queue...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold/20 to-black border-b border-gold/30 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/dashboard" className="text-gray-400 hover:text-gold transition">
                ← Dashboard
              </Link>
              <span className="text-white font-bold ml-4">Identity Verification</span>
              <span className="ml-2 text-gold text-sm">
                ({pendingUsers.length} pending)
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-4 border-b border-white/10">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-2 px-2 transition-all ${activeTab === 'pending' ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-white'}`}
            >
              Pending Verifications ({pendingUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-2 px-2 transition-all ${activeTab === 'messages' ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-white'}`}
            >
              User Messages ({messageGroups.reduce((acc, g) => acc + g.unreadCount, 0)})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`pb-2 px-2 transition-all ${activeTab === 'approved' ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-white'}`}
            >
              Approved Users
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`pb-2 px-2 transition-all ${activeTab === 'rejected' ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-white'}`}
            >
              Rejected Users
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* PENDING VERIFICATIONS TAB */}
        {activeTab === 'pending' && (
          <>
            {/* Pending List */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
              <h2 className="text-white font-bold mb-4">Pending Verification Queue</h2>

              {pendingUsers.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No pending verifications</div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`bg-white/5 rounded-lg p-4 border cursor-pointer transition ${
                        selectedUser?.id === user.id
                          ? 'border-gold bg-white/10'
                          : 'border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-semibold">{user.fullName}</h3>
                          <p className="text-gray-400 text-sm">{user.userType}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-xs">
                            Registered: {new Date(user.registeredAt).toLocaleDateString()}
                          </p>
                          <p className="text-green-400 text-xs">Selfie: ✓</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2-IMAGE COMPARISON VIEW */}
            {selectedUser && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-white font-bold text-xl mb-4">Verify Identity</h2>

                {/* ONLY 2 IMAGES: ID Document + Live Selfie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <h3 className="text-gold font-semibold mb-2">Identification Document</h3>
                    <img
                      src={`${API_URL}${selectedUser.idDocumentUrl}`}
                      alt="ID Document"
                      className="rounded-lg w-full object-contain max-h-64 bg-black/30"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/no-image.png';
                      }}
                    />
                    <p className="text-gray-400 text-xs mt-2">
                      User's official ID (passport, driver's license, or national ID)
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <h3 className="text-green-400 font-semibold mb-2">Live Selfie</h3>
                    <img
                      src={`${API_URL}${selectedUser.selfieUrl}`}
                      alt="Live Selfie"
                      className="rounded-lg w-full object-contain max-h-64 bg-black/30"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/no-image.png';
                      }}
                    />
                    {selectedUser.selfieCapturedAt && (
                      <p className="text-gray-400 text-xs mt-2">
                        Captured: {new Date(selectedUser.selfieCapturedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* User Information */}
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <h3 className="text-white font-semibold mb-2">User Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Full Name:</span>
                      <span className="text-white ml-2">{selectedUser.fullName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">User Type:</span>
                      <span className="text-white ml-2">{selectedUser.userType}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white ml-2">{selectedUser.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white ml-2">{selectedUser.phoneNumber}</span>
                    </div>
                    {selectedUser.artistName && (
                      <div>
                        <span className="text-gray-400">Artist Name:</span>
                        <span className="text-white ml-2">{selectedUser.artistName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setCongratulatoryMessage(getCongratulatoryTemplate(
                        selectedUser.userType,
                        selectedUser.fullName,
                        selectedUser.artistName
                      ));
                      setShowApproveModal(true);
                    }}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                  >
                    ✓ Approve - Identity Verified
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                  >
                    ✗ Reject - Verification Failed
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h2 className="text-white font-bold mb-4">Users with Messages</h2>
              {messageGroups.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No messages from users</div>
              ) : (
                <div className="space-y-2">
                  {messageGroups.map((group) => (
                    <div
                      key={group.userId}
                      onClick={() => setSelectedMessageUser(group)}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        selectedMessageUser?.userId === group.userId
                          ? 'bg-gold/20 border border-gold'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-semibold">{group.userName}</h3>
                          <p className="text-gray-400 text-xs">{group.userEmail}</p>
                          <p className="text-gray-500 text-xs">{group.userType}</p>
                        </div>
                        {group.unreadCount > 0 && (
                          <span className="bg-gold text-black text-xs font-bold px-2 py-1 rounded-full">
                            {group.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 bg-white/5 rounded-xl p-4 border border-white/10">
              {selectedMessageUser ? (
                <>
                  <h2 className="text-white font-bold mb-4">
                    Conversation with {selectedMessageUser.userName}
                  </h2>

                  <div className="bg-black/30 rounded-xl p-4 mb-4 h-96 overflow-y-auto">
                    {selectedMessageUser.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'} mb-3`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.isFromUser
                              ? 'bg-gradient-to-r from-gold to-gold-dark text-black'
                              : 'bg-white/10 text-white'
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
                              📎 Download ({msg.fileName})
                            </a>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex gap-3">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type admin reply..."
                      rows={2}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  Select a user to view conversation
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPROVED USERS TAB */}
        {activeTab === 'approved' && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-white font-bold mb-4">Approved Users History</h2>
            {approvedUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No approved users yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">User Type</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Approved At</th>
                      <th className="text-left py-2">Approved By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5">
                        <td className="py-2 text-white">{user.fullName}</td>
                        <td className="py-2 text-gray-300">{user.userType}</td>
                        <td className="py-2 text-gray-300">{user.email}</td>
                        <td className="py-2 text-gray-300">{new Date(user.approvedAt).toLocaleString()}</td>
                        <td className="py-2 text-gray-300">{user.approvedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* REJECTED USERS TAB */}
        {activeTab === 'rejected' && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-white font-bold mb-4">Rejected Users History</h2>
            {rejectedUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No rejected users</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">User Type</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Rejection Reason</th>
                      <th className="text-left py-2">Rejected At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5">
                        <td className="py-2 text-white">{user.fullName}</td>
                        <td className="py-2 text-gray-300">{user.userType}</td>
                        <td className="py-2 text-gray-300">{user.email}</td>
                        <td className="py-2 text-red-400">{user.rejectionReason}</td>
                        <td className="py-2 text-gray-300">{new Date(user.rejectedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* APPROVE MODAL */}
      {showApproveModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-white text-xl font-bold mb-4">Approve User</h2>
              <p className="text-gray-300 mb-4">
                Approving: <span className="text-gold">{selectedUser.fullName}</span>
              </p>

              <label className="block text-gray-300 text-sm mb-2">Congratulatory Message</label>
              <textarea
                value={congratulatoryMessage}
                onChange={(e) => setCongratulatoryMessage(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-white text-xl font-bold mb-4">Reject User</h2>
              <p className="text-gray-300 mb-4">
                Rejecting: <span className="text-gold">{selectedUser.fullName}</span>
              </p>

              <label className="block text-gray-300 text-sm mb-2">Rejection Reason</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
              >
                <option value="">Select a reason...</option>
                <option value="id_issue">ID Document Issue - Not Clear/Readable</option>
                <option value="selfie_mismatch">Selfie Doesn't Match ID Photo</option>
                <option value="document_expired">Document Expired or Invalid</option>
              </select>

              <label className="block text-gray-300 text-sm mb-2">Custom Note (Optional)</label>
              <textarea
                value={rejectionCustomNote}
                onChange={(e) => setRejectionCustomNote(e.target.value)}
                placeholder="Add specific details about why this registration was rejected..."
                rows={3}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
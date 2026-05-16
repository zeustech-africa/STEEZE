"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Music,
  Video,
  Heart,
  DollarSign,
  Calendar,
  X,
  ShieldBan,
  AlertTriangle,
  Wallet,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AnalyticsPanelProps {
  creator: any;
  username: string;
}

interface Stats {
  songCount: number;
  videoCount: number;
  postCount: number;
  followerCount: number;
  subscriberCount: number;
  totalLikes: number;
  totalViews: number;
  engagementRate: string;
  revenue?: number;
  monthlyGrowth?: string;
}

interface Follower {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isFollowingBack: boolean;
}

interface Subscriber {
  id: string;
  username: string;
  name: string;
  avatar: string;
  tier: string;
  joinedDate: string;
  lifetimeValue: number;
}

interface Withdrawal {
  id: string;
  date: string;
  amount: number;
  status: string;
}

const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Fake account",
  "Underage",
  "Other",
];

export default function AnalyticsPanel({ creator, username }: AnalyticsPanelProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  // Feature 7: Follower List
  const [showFollowers, setShowFollowers] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  // Feature 8: Subscriber List
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [basicRevenue, setBasicRevenue] = useState(0);
  const [premiumRevenue, setPremiumRevenue] = useState(0);
  const [goldRevenue, setGoldRevenue] = useState(0);

  // Feature 10: Report User modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  // Feature 16: Withdrawal History
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false);

  // Feature 17: Withdraw modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const MIN_WITHDRAWAL = 500;

  useEffect(() => {
    const s: Stats = {
      songCount: creator.songs?.length || 0,
      videoCount: creator.videos?.length || 0,
      postCount: creator.posts?.length || 0,
      followerCount: creator.followerCount || 0,
      subscriberCount: creator.subscriberCount || 0,
      totalLikes: creator.totalLikes || 0,
      totalViews: creator.totalViews || 0,
      engagementRate: creator.engagementRate || "0%",
      revenue: creator.revenue || 0,
      monthlyGrowth: creator.monthlyGrowth || "0%",
    };
    setStats(s);
  }, [creator]);

  // Feature 7: Load followers
  const loadFollowers = async () => {
    setLoadingFollowers(true);
    try {
      const res = await fetch(`/api/creators/${creator.id}/followers`);
      const data = await res.json();
      if (data.success) setFollowers(data.followers || []);
    } catch {
      // fallback
    } finally {
      setLoadingFollowers(false);
    }
  };

  // Feature 8: Load subscribers
  const loadSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const res = await fetch(`/api/creators/${creator.id}/subscribers`);
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers || []);
        setTotalRevenue(data.totalRevenue || 0);
        setBasicRevenue(data.basicRevenue || 0);
        setPremiumRevenue(data.premiumRevenue || 0);
        setGoldRevenue(data.goldRevenue || 0);
      }
    } catch {
      // fallback
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // Feature 16: Load withdrawal history
  const loadWithdrawals = async () => {
    try {
      const res = await fetch(`/api/creators/withdrawals`);
      const data = await res.json();
      if (data.success) setWithdrawals(data.withdrawals || []);
    } catch {
      // fallback
    }
  };

  // Feature 9: Block user
  const handleBlockUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setFollowers((prev) => prev.filter((f) => f.id !== userId));
        setSubscribers((prev) => prev.filter((s) => s.id !== userId));
      }
    } catch {
      // fallback
    }
  };

  // Feature 10: Report user
  const openReportModal = (userId: string) => {
    setReportTargetId(userId);
    setReportReason("");
    setReportDetails("");
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportReason || !reportTargetId) return;
    setReporting(true);
    try {
      const res = await fetch(`/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId: reportTargetId,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      const data = await res.json();
      if (data.success) setShowReportModal(false);
    } catch {
      // fallback
    } finally {
      setReporting(false);
    }
  };

  // Feature 17: Withdraw
  const handleWithdraw = async () => {
    if (withdrawAmount < MIN_WITHDRAWAL) {
      setWithdrawError(`Minimum withdrawal amount is R${MIN_WITHDRAWAL}`);
      return;
    }
    setWithdrawError(null);
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/creators/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: withdrawAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setShowWithdrawModal(false);
        setWithdrawAmount(0);
        loadWithdrawals();
      } else {
        setWithdrawError(data.message || "Withdrawal failed");
      }
    } catch {
      setWithdrawError("Network error");
    } finally {
      setWithdrawing(false);
    }
  };

  if (!stats) return null;

  const cards = [
    { label: "Total Plays", value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-blue-400" },
    { label: "Songs", value: stats.songCount, icon: Music, color: "text-purple-400" },
    { label: "Videos", value: stats.videoCount, icon: Video, color: "text-pink-400" },
    { label: "Total Likes", value: stats.totalLikes.toLocaleString(), icon: Heart, color: "text-red-400" },
    { label: "Engagement", value: stats.engagementRate, icon: TrendingUp, color: "text-cyan-400" },
    { label: "Growth", value: stats.monthlyGrowth, icon: BarChart3, color: "text-emerald-400" },
  ];

  return (
    <>
      <motion.section
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="container mx-auto max-w-6xl px-4 py-0 overflow-hidden"
      >
        <div className="glass-card rounded-2xl p-6 mb-6 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} color="#FFD700" />
            <h2 className="text-lg font-bold text-gold">Creator Analytics</h2>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center"
              >
                <card.icon size={18} className={`mx-auto mb-1 ${card.color}`} />
                <p className="text-lg font-bold text-white">{card.value}</p>
                <p className="text-white/40 text-xs">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Feature 7: Follower count + button */}
          <button
            onClick={() => {
              setShowFollowers(true);
              loadFollowers();
            }}
            className="text-gold font-semibold hover:underline flex items-center gap-1.5 text-sm mr-4"
          >
            <Users size={14} />
            {stats.followerCount.toLocaleString()} Followers
          </button>

          {/* Feature 8: Subscriber count + button */}
          <button
            onClick={() => {
              setShowSubscribers(true);
              loadSubscribers();
            }}
            className="text-gold font-semibold hover:underline flex items-center gap-1.5 text-sm"
          >
            <Calendar size={14} />
            {stats.subscriberCount.toLocaleString()} Subscribers
          </button>

          {/* Revenue */}
          {stats.revenue !== undefined && (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <DollarSign size={14} color="#FFD700" />
                Estimated revenue: <span className="text-gold font-semibold">R{stats.revenue.toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                {/* Feature 17: Withdraw button */}
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-3 py-1.5 bg-gold/20 text-gold rounded-full text-xs hover:bg-gold/30 transition-colors flex items-center gap-1"
                >
                  <Wallet size={12} />
                  Withdraw
                </button>
                {/* Feature 16: Withdrawal history */}
                <button
                  onClick={() => {
                    setShowWithdrawalHistory(true);
                    loadWithdrawals();
                  }}
                  className="px-3 py-1.5 bg-white/5 text-white/60 rounded-full text-xs hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <History size={12} />
                  History
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* ====== MODALS ====== */}

      {/* Feature 7: Follower List Modal */}
      <AnimatePresence>
        {showFollowers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowFollowers(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-6 border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">Followers</h3>
                <button onClick={() => setShowFollowers(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              {loadingFollowers ? (
                <p className="text-white/40 text-sm">Loading...</p>
              ) : followers.length === 0 ? (
                <p className="text-white/40 text-sm">No followers yet</p>
              ) : (
                <div className="space-y-2">
                  {followers.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        <img src={f.avatar || "/icons/steeze-icon-square.png"} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="text-white text-sm font-medium">{f.name}</p>
                          <p className="text-white/40 text-xs">@{f.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Feature 9: Block */}
                        <button
                          onClick={() => handleBlockUser(f.id)}
                          className="text-red-500 text-xs hover:underline flex items-center gap-1"
                        >
                          <ShieldBan size={12} />
                          Block
                        </button>
                        {/* Feature 10: Report */}
                        <button
                          onClick={() => openReportModal(f.id)}
                          className="text-red-400 text-xs hover:underline flex items-center gap-1"
                        >
                          <AlertTriangle size={12} />
                          Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature 8: Subscriber List Modal */}
      <AnimatePresence>
        {showSubscribers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowSubscribers(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-6 border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">Subscribers</h3>
                <button onClick={() => setShowSubscribers(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Feature 15: Subscriber Revenue Summary */}
              {totalRevenue > 0 && (
                <div className="bg-gold/10 p-3 rounded-lg mb-4">
                  <p className="text-gold font-bold">Total Subscriber Revenue: R{totalRevenue.toLocaleString()}</p>
                  <p className="text-white/50 text-sm">Basic: R{basicRevenue.toLocaleString()} | Premium: R{premiumRevenue.toLocaleString()} | Gold: R{goldRevenue.toLocaleString()}</p>
                </div>
              )}

              {loadingSubscribers ? (
                <p className="text-white/40 text-sm">Loading...</p>
              ) : subscribers.length === 0 ? (
                <p className="text-white/40 text-sm">No subscribers yet</p>
              ) : (
                <div className="space-y-2">
                  {subscribers.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        <img src={s.avatar || "/icons/steeze-icon-square.png"} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="text-white text-sm font-medium">{s.name}</p>
                          <p className="text-white/40 text-xs">@{s.username}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.tier === "Gold" ? "bg-gold/20 text-gold" :
                          s.tier === "Premium" ? "bg-purple-400/20 text-purple-300" :
                          "bg-white/10 text-white/50"
                        }`}>{s.tier}</span>
                        {s.lifetimeValue > 0 && (
                          <p className="text-gold text-xs mt-0.5">R{s.lifetimeValue}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature 10: Report User Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm rounded-2xl p-6 border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Report User</h3>
                <button onClick={() => setShowReportModal(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <label className="block text-white/60 text-xs">Reason</label>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((reason) => (
                    <label key={reason} className="flex items-center gap-2 cursor-pointer text-white/70 text-sm">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={() => setReportReason(reason)}
                        className="accent-gold"
                      />
                      {reason}
                    </label>
                  ))}
                </div>
                <textarea
                  placeholder="Additional details..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/50 resize-none"
                />
                <button
                  onClick={submitReport}
                  disabled={!reportReason || reporting}
                  className="w-full py-2 bg-red-500/20 text-red-400 rounded-full font-semibold text-sm hover:bg-red-500/30 disabled:opacity-30 transition-colors"
                >
                  {reporting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature 16: Withdrawal History Modal */}
      <AnimatePresence>
        {showWithdrawalHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowWithdrawalHistory(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm rounded-2xl p-6 border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-1.5">
                  <History size={16} />
                  Withdrawal History
                </h3>
                <button onClick={() => setShowWithdrawalHistory(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              {withdrawals.length === 0 ? (
                <p className="text-white/40 text-sm">No withdrawals yet</p>
              ) : (
                <div className="space-y-2">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                      <span className="text-white/70">{new Date(w.date).toLocaleDateString()}</span>
                      <span className="text-gold font-semibold">R{w.amount}</span>
                      <span className={w.status === "completed" ? "text-green-500 text-xs" : "text-yellow-500 text-xs"}>
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature 17: Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => { setShowWithdrawModal(false); setWithdrawError(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm rounded-2xl p-6 border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-1.5">
                  <Wallet size={16} />
                  Withdraw Funds
                </h3>
                <button onClick={() => { setShowWithdrawModal(false); setWithdrawError(null); }} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Amount (ZAR)</label>
                  <input
                    type="number"
                    min={0}
                    value={withdrawAmount || ""}
                    onChange={(e) => { setWithdrawAmount(Number(e.target.value)); setWithdrawError(null); }}
                    placeholder={`Min R${MIN_WITHDRAWAL}`}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 text-sm"
                  />
                  <p className="text-white/30 text-xs mt-1">Minimum withdrawal: R{MIN_WITHDRAWAL}</p>
                </div>
                {withdrawError && <p className="text-red-400 text-xs">{withdrawError}</p>}
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || withdrawAmount < MIN_WITHDRAWAL}
                  className="w-full py-2.5 bg-gold/20 text-gold rounded-full font-semibold text-sm hover:bg-gold/30 disabled:opacity-30 transition-colors"
                >
                  {withdrawing ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
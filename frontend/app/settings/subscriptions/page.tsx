"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Crown, CreditCard, XCircle, ChevronDown, Clock, RefreshCw, Mail } from "lucide-react";
import Link from "next/link";

export default function SubscriptionManagementPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayments, setShowPayments] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchPayments();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/vibes/subscriptions");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/vibes/payments");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelSubscription = async (id: string) => {
    await fetch(`/api/vibes/subscriptions/${id}`, {
      method: "DELETE",
    });
    fetchSubscriptions();
  };

  const changeTier = async (id: string, tier: string) => {
    await fetch(`/api/vibes/subscriptions/${id}/tier`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    fetchSubscriptions();
  };

  const tierColors: Record<string, string> = {
    basic: "text-blue-400",
    premium: "text-purple-400",
    gold: "text-gold",
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold animate-pulse">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gold mb-6">Subscriptions</h1>

        {/* Consumer Rights Notice (CPA cooling-off) */}
        <div className="mb-6 p-4 bg-gold/5 border border-gold/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Clock className="text-gold mt-1" size={18} />
            <div>
              <h4 className="text-gold text-sm font-semibold mb-1">Cancel within 7 days for a full refund (CPA)</h4>
              <p className="text-white/50 text-xs mb-2">
                Under the South African Consumer Protection Act, you may cancel any subscription within 7 days of purchase for a full refund — no penalty, no questions asked.
              </p>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1"><RefreshCw size={10} className="text-gold" /> Refunds in 30 days</span>
                <span className="flex items-center gap-1"><Mail size={10} className="text-gold" /> support@steeze.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowPayments(false)}
            className={`px-4 py-2 rounded-full transition-all ${
              !showPayments ? "bg-gold text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Active Subscriptions
          </button>
          <button
            onClick={() => setShowPayments(true)}
            className={`px-4 py-2 rounded-full transition-all ${
              showPayments ? "bg-gold text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Payment History
          </button>
        </div>

        {!showPayments ? (
          subscriptions.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Crown className="text-gold mx-auto mb-4" size={48} />
              <p className="text-white/70 mb-4">You don't have any active subscriptions.</p>
              <Link href="/explore" className="inline-block px-6 py-2 bg-gold text-black rounded-full">
                Discover Creators
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={sub.creator?.profilePicUrl || "/icons/steeze-icon-square.png"}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {sub.creator?.artistName || sub.creator?.username}
                      </h3>
                      <p className="text-white/50 text-sm">
                        @{sub.creator?.username || sub.creator?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4 p-3 bg-white/5 rounded-lg">
                    <div>
                      <span className="text-white/50 text-sm">Tier</span>
                      <p className={`font-semibold uppercase ${tierColors[sub.tier] || "text-white"}`}>
                        {sub.tier}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-white/50 text-sm">Price</span>
                      <p className="text-white font-semibold">R{sub.price}/month</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white/50 text-sm">Since</span>
                      <p className="text-white text-sm">
                        {new Date(sub.startDate || sub.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <select
                        value={sub.tier}
                        onChange={(e) => changeTier(sub.id, e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold text-sm appearance-none cursor-pointer"
                      >
                        <option value="basic">Basic (R50/mo)</option>
                        <option value="premium">Premium (R99/mo)</option>
                        <option value="gold">Gold (R199/mo)</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                      />
                    </div>
                    <button
                      onClick={() => cancelSubscription(sub.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-1 hover:bg-red-500/30 transition-colors"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : payments.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <CreditCard className="mx-auto mb-4 text-white/40" size={48} />
            <p className="text-white/50">No payment history yet.</p>
          </div>
        ) : (
          <div className="glass-card p-4">
            <div className="divide-y divide-white/10">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center py-3"
                >
                  <div>
                    <p className="text-white font-medium">
                      {payment.creator?.artistName || payment.creator?.username || "Creator"}
                    </p>
                    <p className="text-white/40 text-xs">
                      {new Date(payment.createdAt).toLocaleDateString()}
                      {" · "}
                      <span className="capitalize">{payment.status}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold font-semibold">R{payment.amount}</p>
                    <p className="text-white/40 text-xs capitalize">{payment.tier}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
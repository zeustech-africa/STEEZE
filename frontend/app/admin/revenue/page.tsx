"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users, Wallet } from "lucide-react";

interface RevenueData {
  monthlySubscriptions: number;
  paidPostEarnings: number;
  totalPlatformRevenue: number;
  totalCreatorWalletBalance: number;
}

const RevenuePage = () => {
  const [revenue, setRevenue] = useState<RevenueData>({
    monthlySubscriptions: 0,
    paidPostEarnings: 0,
    totalPlatformRevenue: 0,
    totalCreatorWalletBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const res = await fetch("/api/admin/revenue", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) setRevenue(data.revenue);
    } catch (error) {
      console.error("Failed to fetch revenue:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      label: "Monthly Subscriptions",
      value: `$${(revenue.monthlySubscriptions || 0).toLocaleString()}`,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
    },
    {
      label: "Paid Post Earnings",
      value: `$${(revenue.paidPostEarnings || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
    },
    {
      label: "Total Platform Revenue",
      value: `$${(revenue.totalPlatformRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-gold",
      bg: "bg-gold/10",
      border: "border-gold/30",
    },
    {
      label: "Creator Wallet Balances",
      value: `$${(revenue.totalCreatorWalletBalance || 0).toLocaleString()}`,
      icon: Wallet,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Revenue Dashboard</h1>
          <p className="text-white/50 mt-1">Platform earnings overview</p>
        </div>
        <button
          onClick={fetchRevenue}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Revenue Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
              <div className="h-8 bg-white/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`glass-card p-6 border ${card.border} ${card.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/50 text-sm">{card.label}</p>
                  <Icon className={card.color} size={20} />
                </div>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Platform Breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Revenue Breakdown</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-white/70 text-sm">Subscription Revenue</span>
            <span className="text-white font-medium">
              ${(revenue.monthlySubscriptions || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-white/70 text-sm">Paid Content Revenue</span>
            <span className="text-white font-medium">
              ${(revenue.paidPostEarnings || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gold/10 border border-gold/20">
            <span className="text-gold font-medium text-sm">Total Platform Revenue</span>
            <span className="text-gold font-bold text-lg">
              ${(revenue.totalPlatformRevenue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;
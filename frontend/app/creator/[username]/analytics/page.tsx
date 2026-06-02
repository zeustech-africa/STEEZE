"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  BarChart3, Eye, Heart, MessageCircle, Share2, Clock, Music, 
  DollarSign, TrendingUp, Users, MapPin, Globe, Download, 
  Loader2, Calendar, ChevronDown 
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalWatchTime: number;
    totalStreams: number;
    totalEarnings: number;
    engagementRate: string;
    totalPosts: number;
  };
  topContent: Array<{
    id: string;
    title: string;
    type: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    earnings: number;
    engagementRate: number;
  }>;
  topRevenue: Array<{
    id: string;
    title: string;
    earnings: number;
  }>;
  monthlyEarnings: Array<{
    month: string;
    amount: number;
  }>;
  audienceInsights: {
    ageRanges: Array<{ range: string; percentage: number }>;
    topCountries: Array<{ country: string; count: number }>;
    gender: { male: number; female: number; other: number };
  };
  trafficSources: {
    direct: number;
    search: number;
    social: number;
    external: number;
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");
  const [exporting, setExporting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/analytics/creator?period=${period}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || "Failed to load analytics");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${API_URL}/api/analytics/export`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "R0";
    return `R${amount.toLocaleString()}`;
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return "0 min";
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Failed to load analytics"}</p>
          <button onClick={() => router.back()} className="text-gold hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gold hover:underline">
              ← Back
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm hover:bg-gold/30 transition-all flex items-center gap-2"
            >
              <Download size={16} />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Eye size={14} /> Views
            </div>
            <div className="text-xl font-bold text-white">{formatNumber(analytics.summary.totalViews)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Heart size={14} /> Likes
            </div>
            <div className="text-xl font-bold text-white">{formatNumber(analytics.summary.totalLikes)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <MessageCircle size={14} /> Comments
            </div>
            <div className="text-xl font-bold text-white">{formatNumber(analytics.summary.totalComments)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Share2 size={14} /> Shares
            </div>
            <div className="text-xl font-bold text-white">{formatNumber(analytics.summary.totalShares)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Clock size={14} /> Watch Time
            </div>
            <div className="text-xl font-bold text-white">{formatTime(analytics.summary.totalWatchTime)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <DollarSign size={14} /> Earnings
            </div>
            <div className="text-xl font-bold text-gold">{formatCurrency(analytics.summary.totalEarnings)}</div>
          </div>
        </div>

        {/* Engagement Rate Card */}
        <div className="bg-gradient-to-r from-gold/10 to-transparent rounded-xl p-6 border border-gold/20 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/50 text-sm">Engagement Rate</p>
              <p className="text-3xl font-bold text-gold">{analytics.summary.engagementRate}%</p>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min(parseFloat(analytics.summary.engagementRate), 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Performing Content */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-gold" /> Top Performing Content
            </h2>
            <div className="space-y-3">
              {analytics.topContent.map((content, idx) => (
                <div key={content.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-gold font-bold w-6">#{idx + 1}</span>
                    <div>
                      <p className="text-white font-medium">{content.title}</p>
                      <div className="flex gap-3 text-white/40 text-xs">
                        <span>👁 {formatNumber(content.views)}</span>
                        <span>❤️ {formatNumber(content.likes)}</span>
                        <span>💬 {formatNumber(content.comments)}</span>
                        <span>↻ {formatNumber(content.shares)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gold text-sm font-semibold">{content.engagementRate.toFixed(1)}%</p>
                    <p className="text-white/40 text-xs">engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Revenue Content */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-gold" /> Best Performing by Revenue
            </h2>
            <div className="space-y-3">
              {analytics.topRevenue.map((content, idx) => (
                <div key={content.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-gold font-bold w-6">#{idx + 1}</span>
                    <p className="text-white font-medium">{content.title}</p>
                  </div>
                  <p className="text-gold font-semibold">{formatCurrency(content.earnings)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Earnings Chart */}
        <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-gold" /> Monthly Earnings
          </h2>
          {analytics.monthlyEarnings.length === 0 ? (
            <p className="text-white/40 text-center py-8">No earnings data yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.monthlyEarnings.slice(0, 6).map((month) => {
                const maxEarnings = Math.max(...analytics.monthlyEarnings.map(m => m.amount), 1);
                const percentage = (month.amount / maxEarnings) * 100;
                return (
                  <div key={month.month} className="flex items-center gap-4">
                    <span className="text-white/50 text-sm w-20">{month.month}</span>
                    <div className="flex-1 h-8 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-gold font-semibold w-24 text-right">{formatCurrency(month.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Traffic Sources & Retention */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Globe size={20} className="text-gold" /> Traffic Sources
            </h2>
            <div className="space-y-3">
              {Object.entries(analytics.trafficSources).map(([source, percentage]) => (
                <div key={source}>
                  <div className="flex justify-between text-white/70 text-sm mb-1">
                    <span className="capitalize">{source}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users size={20} className="text-gold" /> Audience Retention
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-white/70 text-sm mb-1">
                  <span>Day 1 Retention</span>
                  <span>{analytics.retention.day1}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: `${analytics.retention.day1}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-white/70 text-sm mb-1">
                  <span>Day 7 Retention</span>
                  <span>{analytics.retention.day7}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: `${analytics.retention.day7}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-white/70 text-sm mb-1">
                  <span>Day 30 Retention</span>
                  <span>{analytics.retention.day30}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: `${analytics.retention.day30}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
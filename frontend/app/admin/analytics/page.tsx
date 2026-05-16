"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { format, subDays, subMonths } from "date-fns";
import {
  Download, TrendingUp, Users, Eye, Heart, Repeat,
  DollarSign, Calendar, Activity, BarChart3, FileText, MessageSquare
} from "lucide-react";

const COLORS = ['#FFD700', '#00A3FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD'];

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [activeChart, setActiveChart] = useState<'area' | 'bar'>('area');
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchPlatformAnalytics();
  }, [dateRange, groupBy]);

  const fetchPlatformAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/analytics/platform?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=${groupBy}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics || []);
      } else {
        setError(data.message || 'Failed to fetch platform analytics');
      }
    } catch (err: any) {
      console.error("Failed to fetch platform analytics:", err);
      setError('Network error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const token = localStorage.getItem("token");
    window.open(
      `/api/analytics/export/csv?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&type=platform&token=${token}`,
      '_blank'
    );
  };

  const exportPDF = () => {
    const token = localStorage.getItem("token");
    window.open(
      `/api/analytics/export/pdf?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&type=platform&token=${token}`,
      '_blank'
    );
  };

  const getTotals = () => {
    return analytics.reduce((acc, curr) => ({
      totalUsers: acc.totalUsers + (curr.totalUsers || 0),
      totalCreators: acc.totalCreators + (curr.totalCreators || 0),
      totalVibes: acc.totalVibes + (curr.totalVibes || 0),
      totalPosts: acc.totalPosts + (curr.totalPosts || 0),
      totalViews: acc.totalViews + (curr.totalViews || 0),
      totalLikes: acc.totalLikes + (curr.totalLikes || 0),
      totalComments: acc.totalComments + (curr.totalComments || 0),
      totalReposts: acc.totalReposts + (curr.totalReposts || 0),
      totalSaves: acc.totalSaves + (curr.totalSaves || 0),
      totalRevenue: acc.totalRevenue + (curr.totalRevenue || 0),
      platformRevenue: acc.platformRevenue + (curr.platformRevenue || 0),
      creatorPayouts: acc.creatorPayouts + (curr.creatorPayouts || 0),
    }), {
      totalUsers: 0, totalCreators: 0, totalVibes: 0, totalPosts: 0,
      totalViews: 0, totalLikes: 0, totalComments: 0, totalReposts: 0,
      totalSaves: 0, totalRevenue: 0, platformRevenue: 0, creatorPayouts: 0,
    });
  };

  const totals = getTotals();

  // Revenue breakdown data
  const revenueBreakdown = totals.totalRevenue > 0 ? [
    { name: 'Platform Revenue', value: totals.platformRevenue, color: '#FFD700' },
    { name: 'Creator Payouts', value: totals.creatorPayouts, color: '#00A3FF' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-gold" size={28} /> Platform Analytics
          </h1>
          <p className="text-white/50 mt-1">Comprehensive platform-wide metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition"
          >
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Date Range & Controls */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-white/60 text-sm block mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-white/60 text-sm block mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-white/60 text-sm block mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveChart(activeChart === 'area' ? 'bar' : 'area')}
            className="px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition"
          >
            {activeChart === 'area' ? 'Bar View' : 'Area View'}
          </button>
          <button
            onClick={() => setDateRange({
              startDate: subDays(new Date(), 7).toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            })}
            className="px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition"
          >
            7D
          </button>
          <button
            onClick={() => setDateRange({
              startDate: subDays(new Date(), 30).toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            })}
            className="px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition"
          >
            30D
          </button>
          <button
            onClick={() => setDateRange({
              startDate: subMonths(new Date(), 3).toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            })}
            className="px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition"
          >
            90D
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Activity className="text-gold animate-spin" size={32} />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard icon={Users} label="Total Users" value={totals.totalUsers.toLocaleString()} />
            <KpiCard icon={TrendingUp} label="Creators" value={totals.totalCreators.toLocaleString()} />
            <KpiCard icon={Users} label="Vibes" value={totals.totalVibes.toLocaleString()} />
            <KpiCard icon={FileText} label="Posts" value={totals.totalPosts.toLocaleString()} />
            <KpiCard icon={Eye} label="Total Views" value={totals.totalViews.toLocaleString()} />
            <KpiCard icon={DollarSign} label="Total Revenue" value={`R${totals.totalRevenue.toLocaleString()}`} />
          </div>

          {/* Engagement KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={Heart} label="Likes" value={totals.totalLikes.toLocaleString()} color="text-pink-400" />
            <KpiCard icon={MessageSquare} label="Comments" value={totals.totalComments.toLocaleString()} color="text-blue-400" />
            <KpiCard icon={Repeat} label="Reposts" value={totals.totalReposts.toLocaleString()} color="text-green-400" />
            <KpiCard icon={Activity} label="Saves" value={totals.totalSaves.toLocaleString()} color="text-purple-400" />
          </div>

          {/* Main Chart - Views & Engagement Over Time */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity size={18} className="text-gold" /> Platform Activity Overview
            </h3>
            {analytics.length === 0 ? (
              <p className="text-white/40 text-sm py-8 text-center">No data for the selected period.</p>
            ) : activeChart === 'area' ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#888" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      borderColor: '#FFD700',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="totalViews" stroke="#FFD700" fill="#FFD700" fillOpacity={0.2} name="Views" />
                  <Area type="monotone" dataKey="totalLikes" stroke="#00A3FF" fill="#00A3FF" fillOpacity={0.2} name="Likes" />
                  <Area type="monotone" dataKey="totalComments" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.2} name="Comments" />
                  <Area type="monotone" dataKey="totalReposts" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.2} name="Reposts" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#888" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      borderColor: '#FFD700',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="totalViews" fill="#FFD700" name="Views" />
                  <Bar dataKey="totalLikes" fill="#00A3FF" name="Likes" />
                  <Bar dataKey="totalComments" fill="#FF6B6B" name="Comments" />
                  <Bar dataKey="totalReposts" fill="#4ECDC4" name="Reposts" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue & User Growth */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-gold" /> Revenue & Payouts
              </h3>
              {analytics.length === 0 ? (
                <p className="text-white/40 text-sm py-8 text-center">No revenue data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#888" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        borderColor: '#FFD700',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="totalRevenue" stroke="#FFD700" strokeWidth={2} dot={false} name="Total Revenue" />
                    <Line type="monotone" dataKey="platformRevenue" stroke="#FF6B6B" strokeWidth={2} dot={false} name="Platform Take" />
                    <Line type="monotone" dataKey="creatorPayouts" stroke="#00A3FF" strokeWidth={2} dot={false} name="Creator Payouts" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* User Growth Chart */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users size={18} className="text-gold" /> User Growth
              </h3>
              {analytics.length === 0 ? (
                <p className="text-white/40 text-sm py-8 text-center">No user data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#888" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        borderColor: '#FFD700',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="totalUsers" stroke="#FFD700" fill="#FFD700" fillOpacity={0.2} name="Total Users" />
                    <Area type="monotone" dataKey="totalCreators" stroke="#00A3FF" fill="#00A3FF" fillOpacity={0.2} name="Creators" />
                    <Area type="monotone" dataKey="totalVibes" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.2} name="Vibes" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Revenue Breakdown Pie + Summary */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Revenue Breakdown</h3>
              {revenueBreakdown.length === 0 ? (
                <p className="text-white/40 text-sm py-8 text-center">No revenue data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`rev-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `R${Number(value ?? 0).toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#FFD700', borderRadius: '8px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex justify-center gap-6 mt-4">
                <div className="text-center">
                  <div className="w-3 h-3 bg-gold rounded-full mx-auto mb-1" />
                  <p className="text-white/50 text-xs">Platform Revenue</p>
                  <p className="text-white font-semibold">R{totals.platformRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-1" />
                  <p className="text-white/50 text-xs">Creator Payouts</p>
                  <p className="text-white font-semibold">R{totals.creatorPayouts.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Period Summary */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Period Summary</h3>
              <div className="space-y-3">
                <SummaryRow label="Total Views" value={totals.totalViews.toLocaleString()} />
                <SummaryRow label="Total Engagement (Likes + Comments)" value={(totals.totalLikes + totals.totalComments).toLocaleString()} />
                <SummaryRow label="Total Reposts" value={totals.totalReposts.toLocaleString()} />
                <SummaryRow label="Total Saves" value={totals.totalSaves.toLocaleString()} />
                <SummaryRow label="New Posts" value={totals.totalPosts.toLocaleString()} />
                <SummaryRow label="Total Revenue" value={`R${totals.totalRevenue.toLocaleString()}`} highlight />
                <SummaryRow label="Engagement Rate" value={totals.totalViews > 0 ? `${((totals.totalLikes + totals.totalComments + totals.totalReposts) / totals.totalViews * 100).toFixed(2)}%` : '0%'} />
                <SummaryRow label="Avg Revenue Per Post" value={totals.totalPosts > 0 ? `R${(totals.totalRevenue / totals.totalPosts).toFixed(2)}` : 'R0.00'} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <Icon className={`mx-auto mb-2 ${color || 'text-gold'}`} size={24} />
      <p className="text-white/50 text-xs mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${highlight ? 'pb-2 border-b border-white/10' : ''}`}>
      <span className="text-white/50">{label}</span>
      <span className={highlight ? 'text-gold font-semibold' : 'text-white'}>{value}</span>
    </div>
  );
}
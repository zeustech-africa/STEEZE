"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { Download, TrendingUp, TrendingDown, Users, Eye, Heart, Repeat, DollarSign, Calendar } from "lucide-react";

const COLORS = ['#FFD700', '#00A3FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

export default function AnalyticsDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [demographics, setDemographics] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [activeMetric, setActiveMetric] = useState<'views' | 'likes' | 'revenue'>('views');
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user, dateRange, groupBy]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/analytics/creator?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=${groupBy}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics || []);
        setTopPosts(data.topPosts || []);
        setDemographics(data.demographics || null);
      } else {
        setError(data.message || 'Failed to fetch analytics');
      }
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError('Network error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const token = localStorage.getItem("token");
    window.open(
      `/api/analytics/export/csv?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&type=creator&token=${token}`,
      '_blank'
    );
  };

  const exportPDF = () => {
    const token = localStorage.getItem("token");
    window.open(
      `/api/analytics/export/pdf?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&type=creator&token=${token}`,
      '_blank'
    );
  };

  const getTotals = () => {
    return analytics.reduce((acc, curr) => ({
      views: acc.views + (curr.views || 0),
      likes: acc.likes + (curr.likes || 0),
      comments: acc.comments + (curr.comments || 0),
      reposts: acc.reposts + (curr.reposts || 0),
      saves: acc.saves + (curr.saves || 0),
      followersGain: acc.followersGain + (curr.followersGain || 0),
      revenue: acc.revenue + (curr.revenue || 0),
    }), { views: 0, likes: 0, comments: 0, reposts: 0, saves: 0, followersGain: 0, revenue: 0 });
  };

  const totals = getTotals();

  const isCreator = user?.userType === 'zls_artist' || user?.userType === 'independent_creator';

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-bold text-gold mb-2">Login Required</h1>
          <p className="text-white/60">Please login to view your analytics dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-bold text-gold mb-2">Creator Access Only</h1>
          <p className="text-white/60">This dashboard is only available for creators (ZLS Artists & Independent Creators).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-gold">Analytics</span> Dashboard
          </h1>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-gold/20 transition-all flex items-center gap-2 text-sm"
            >
              <Download size={16} /> CSV
            </button>
            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-gold/20 transition-all flex items-center gap-2 text-sm"
            >
              <Download size={16} /> PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="glass-card p-4 mb-6 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Date Range Picker */}
        <div className="glass-card p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDateRange({
                startDate: subDays(new Date(), 7).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition"
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRange({
                startDate: subDays(new Date(), 30).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition"
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRange({
                startDate: subMonths(new Date(), 3).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition"
            >
              Last 90 days
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-gold animate-pulse text-lg">Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <StatCard icon={Eye} label="Total Views" value={totals.views.toLocaleString()} />
              <StatCard icon={Heart} label="Total Likes" value={totals.likes.toLocaleString()} />
              <StatCard icon={Repeat} label="Total Reposts" value={totals.reposts.toLocaleString()} />
              <StatCard icon={Users} label="New Followers" value={totals.followersGain.toLocaleString()} />
              <StatCard icon={DollarSign} label="Revenue" value={`R${totals.revenue.toLocaleString()}`} />
              <StatCard icon={TrendingUp} label="Saves" value={totals.saves.toLocaleString()} />
            </div>

            {/* Metric Selector */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <button
                onClick={() => setActiveMetric('views')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  activeMetric === 'views' ? 'bg-gold text-black font-semibold' : 'bg-white/10 text-white/70'
                }`}
              >
                <Eye size={14} className="inline mr-1" /> Views
              </button>
              <button
                onClick={() => setActiveMetric('likes')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  activeMetric === 'likes' ? 'bg-gold text-black font-semibold' : 'bg-white/10 text-white/70'
                }`}
              >
                <Heart size={14} className="inline mr-1" /> Likes
              </button>
              <button
                onClick={() => setActiveMetric('revenue')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  activeMetric === 'revenue' ? 'bg-gold text-black font-semibold' : 'bg-white/10 text-white/70'
                }`}
              >
                <DollarSign size={14} className="inline mr-1" /> Revenue
              </button>
            </div>

            {/* Main Chart */}
            <div className="glass-card p-4 mb-6">
              <h3 className="text-white font-semibold mb-4">Performance Overview</h3>
              {analytics.length === 0 ? (
                <p className="text-white/40 text-sm py-8 text-center">No data for the selected period.</p>
              ) : (
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
                    {activeMetric === 'views' && (
                      <Area type="monotone" dataKey="views" stroke="#FFD700" fill="#FFD700" fillOpacity={0.3} name="Views" />
                    )}
                    {activeMetric === 'likes' && (
                      <Area type="monotone" dataKey="likes" stroke="#00A3FF" fill="#00A3FF" fillOpacity={0.3} name="Likes" />
                    )}
                    {activeMetric === 'revenue' && (
                      <Area type="monotone" dataKey="revenue" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.3} name="Revenue (R)" />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Posts */}
            <div className="glass-card p-4 mb-6">
              <h3 className="text-white font-semibold mb-4">Top Performing Content</h3>
              {topPosts.length === 0 ? (
                <p className="text-white/40 text-sm py-4">No content data available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-2 text-white/60 text-sm">Content</th>
                        <th className="text-left p-2 text-white/60 text-sm">Type</th>
                        <th className="text-right p-2 text-white/60 text-sm">Views</th>
                        <th className="text-right p-2 text-white/60 text-sm">Likes</th>
                        <th className="text-right p-2 text-white/60 text-sm">Comments</th>
                        <th className="text-right p-2 text-white/60 text-sm">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPosts.map((post) => (
                        <tr key={post.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-2 text-white text-sm max-w-[200px] truncate">{post.title}</td>
                          <td className="p-2 text-white/60 text-sm capitalize">{post.type}</td>
                          <td className="p-2 text-right text-white text-sm">{post.views.toLocaleString()}</td>
                          <td className="p-2 text-right text-white text-sm">{post.likes.toLocaleString()}</td>
                          <td className="p-2 text-right text-white text-sm">{post.comments.toLocaleString()}</td>
                          <td className="p-2 text-right text-gold text-sm">R{post.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Demographics */}
            {demographics && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-card p-4">
                  <h3 className="text-white font-semibold mb-4">Age Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={Object.entries(demographics.age).map(([name, value]) => ({ name, value: value as number }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {Object.entries(demographics.age).map((_, index) => (
                          <Cell key={`age-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass-card p-4">
                  <h3 className="text-white font-semibold mb-4">Device Usage</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={Object.entries(demographics.device).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: value as number }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {Object.entries(demographics.device).map((_, index) => (
                          <Cell key={`device-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass-card p-4">
                  <h3 className="text-white font-semibold mb-4">Top Locations</h3>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {Object.entries(demographics.location as Record<string, number>)
                      .sort(([, a], [, b]) => b - a)
                      .map(([country, count]) => (
                        <div key={country} className="flex justify-between text-sm">
                          <span className="text-white/60">{country}</span>
                          <span className="text-white">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <Icon className="text-gold mx-auto mb-2" size={24} />
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
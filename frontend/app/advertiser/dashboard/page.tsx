'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { 
  Megaphone, 
  TrendingUp, 
  Smartphone,
  Tablet,
  Monitor,
  Play,
  Pause,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Campaign {
  id: string;
  name: string;
  description: string;
  placement: string;
  status: string;
  budget: number;
  spent: number;
  remainingBudget: number;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  deviceBreakdown?: {
    mobile: number;
    tablet: number;
    desktop: number;
    android: number;
    ios: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  pending_review: { label: 'Pending Review', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  approved: { label: 'Approved', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  active: { label: 'Active', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  paused: { label: 'Paused', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  rejected: { label: 'Rejected', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  completed: { label: 'Completed', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  suspended: { label: 'Suspended', color: 'text-red-600', bgColor: 'bg-red-600/10' }
};

const PLACEMENT_LABELS: Record<string, string> = {
  feed_standard: 'Standard Feed',
  feed_premium: 'Premium Feed',
  video_short: 'Short Video',
  video_premium: 'Premium Video',
  explore: 'Explore Page',
  trending: 'Trending Section',
  homepage_hero: 'Homepage Hero'
};

export default function AdvertiserDashboardPage() {
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const isAdvertiser = user?.userType === 'advertiser';

  const fetchCampaigns = async () => {
    if (!token || !isAdvertiser) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/advertiser/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns);
        setLastUpdated(new Date());
      } else if (response.status === 401) {
        router.push('/advertiser/login');
      } else {
        setError('Failed to load campaigns');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePause = async (campaignId: string) => {
    setActionLoading(campaignId);
    try {
      const response = await fetch(`${API_URL}/api/advertiser/campaigns/${campaignId}/pause`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchCampaigns();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to pause campaign');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (campaignId: string) => {
    setActionLoading(campaignId);
    try {
      const response = await fetch(`${API_URL}/api/advertiser/campaigns/${campaignId}/resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchCampaigns();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to resume campaign');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  const getCTR = (campaign: Campaign) => {
    if (campaign.impressions === 0) return '0%';
    return `${((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%`;
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

  useEffect(() => {
    if (isAuthenticated && isAdvertiser) {
      fetchCampaigns();
    } else if (isAuthenticated && !isAdvertiser) {
      router.push('/');
    } else if (!isAuthenticated) {
      router.push('/advertiser/login');
    }
  }, [isAuthenticated, isAdvertiser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">Advertiser Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchCampaigns}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm text-gray-300">Refresh</span>
            </button>
            <Link
              href="/advertise"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
            >
              + New Campaign
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Budget</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Spent</p>
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Impressions</p>
            <p className="text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Overall CTR</p>
            <p className="text-2xl font-bold text-green-500">{overallCTR}%</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-right text-xs text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button onClick={fetchCampaigns} className="text-red-400 underline mt-2">Try again</button>
          </div>
        )}

        {/* Campaigns List */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Your Campaigns</h2>
            <p className="text-gray-400 text-sm">{campaigns.length} campaigns</p>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No campaigns yet</p>
              <Link href="/advertise" className="inline-block mt-4 text-purple-400 hover:text-purple-300">
                Create your first campaign →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {campaigns.map((campaign) => {
                const statusInfo = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                const isPendingPayment = campaign.status === 'approved' && campaign.spent === 0;
                
                return (
                  <div key={campaign.id} className="p-4 hover:bg-gray-800/50 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {PLACEMENT_LABELS[campaign.placement] || campaign.placement}
                          </span>
                          <span className="text-xs text-gray-500">
                            Created: {formatDate(campaign.createdAt)}
                          </span>
                        </div>
                        <Link href={`/advertiser/campaigns/${campaign.id}`}>
                          <h3 className="text-white font-semibold hover:text-purple-400 transition">
                            {campaign.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{campaign.description}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          <span className="text-gray-500">Budget: {formatCurrency(campaign.budget)}</span>
                          <span className="text-gray-500">Spent: {formatCurrency(campaign.spent)}</span>
                          <span className="text-gray-500">Remaining: {formatCurrency(campaign.remainingBudget)}</span>
                          <span className="text-gray-500">Impressions: {campaign.impressions.toLocaleString()}</span>
                          <span className="text-gray-500">CTR: {getCTR(campaign)}</span>
                        </div>
                        
                        {/* Device Breakdown Mini */}
                        {campaign.deviceBreakdown && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              <span>{campaign.deviceBreakdown.mobile}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Tablet className="w-3 h-3" />
                              <span>{campaign.deviceBreakdown.tablet}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              <span>{campaign.deviceBreakdown.desktop}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">iOS</span>
                              <span>{campaign.deviceBreakdown.ios}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Android</span>
                              <span>{campaign.deviceBreakdown.android}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/advertiser/campaigns/${campaign.id}`}
                          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-300" />
                        </Link>
                        {campaign.status === 'active' && (
                          <button
                            onClick={() => handlePause(campaign.id)}
                            disabled={actionLoading === campaign.id}
                            className="p-2 bg-orange-600/20 hover:bg-orange-600/30 rounded-lg transition"
                            title="Pause Campaign"
                          >
                            <Pause className="w-4 h-4 text-orange-400" />
                          </button>
                        )}
                        {campaign.status === 'paused' && (
                          <button
                            onClick={() => handleResume(campaign.id)}
                            disabled={actionLoading === campaign.id}
                            className="p-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition"
                            title="Resume Campaign"
                          >
                            <Play className="w-4 h-4 text-green-400" />
                          </button>
                        )}
                        {isPendingPayment && (
                          <Link
                            href={`/advertise?id=${campaign.id}`}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition"
                          >
                            Pay Now
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
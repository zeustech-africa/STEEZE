'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { 
  Megaphone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Eye,
  DollarSign,
  TrendingUp,
  Loader2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  placement: string;
  cpm: number;
  budget: number;
  spent: number;
  remainingBudget: number;
  status: string;
  impressions: number;
  clicks: number;
  mediaUrl: string;
  mediaType: string;
  destinationUrl: string;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  advertiser: {
    id: string;
    email: string;
    companyName: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export default function AdminCampaignsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action modals
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'suspend' | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const limit = 20;
  const isAdmin = user?.userType === 'admin';

  // Fetch campaigns
  const fetchCampaigns = useCallback(async (resetOffset = true) => {
    const token = getToken();
    if (!token || !isAdmin) return;
    
    const currentOffset = resetOffset ? 0 : offset;
    setLoading(resetOffset);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', currentOffset.toString());
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${API_URL}/api/admin/campaigns?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (resetOffset) {
          setCampaigns(data.campaigns);
          setOffset(limit);
        } else {
          setCampaigns(prev => [...prev, ...data.campaigns]);
          setOffset(currentOffset + data.campaigns.length);
        }
        
        setHasMore(data.hasMore);
        setTotal(data.total);
      } else if (response.status === 403) {
        setError('Admin access required');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to load campaigns');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, offset, limit, statusFilter, searchQuery]);

  // Execute action
  const executeAction = async (campaignId: string, action: string) => {
    const token = getToken();
    if (!token) return;
    
    setActionLoading(true);
    
    try {
      const body: Record<string, string> = {};
      if (action === 'reject' || action === 'suspend') {
        body.reason = reason;
      }
      
      const response = await fetch(`${API_URL}/api/admin/campaigns/${campaignId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: Object.keys(body).length ? JSON.stringify(body) : undefined
      });
      
      if (response.ok) {
        setSelectedCampaign(null);
        setActionType(null);
        setReason('');
        fetchCampaigns(true);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || `Failed to ${action} campaign`);
      }
    } catch (err) {
      console.error(`Error ${action} campaign:`, err);
      setError(`Network error. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const refreshAll = () => {
    setRefreshing(true);
    setOffset(0);
    fetchCampaigns(true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchCampaigns(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  const getCTR = (campaign: Campaign) => {
    if (campaign.impressions === 0) return '0%';
    return `${((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%`;
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchCampaigns(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, statusFilter, searchQuery]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Megaphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to access admin panel</h2>
          <p className="text-gray-400">Please log in with your admin account.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            Return to Home
          </Link>
        </div>
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
            <h1 className="text-2xl font-bold text-white">Ad Campaigns</h1>
          </div>
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm text-gray-300">Refresh</span>
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Campaigns</p>
            <p className="text-2xl font-bold text-white">{total}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-500">
              {campaigns.filter(c => c.status === 'pending_review').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-green-500">
              {campaigns.filter(c => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Spend</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(campaigns.reduce((sum, c) => sum + c.spent, 0))}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-gray-400 block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">All Status</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-gray-400 block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or advertiser..."
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button onClick={refreshAll} className="text-red-400 underline mt-2">Try again</button>
          </div>
        )}

        {/* Campaigns List */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Campaigns</h2>
            <p className="text-gray-400 text-sm">Total: {total} campaigns</p>
          </div>
          
          {loading && campaigns.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No campaigns found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-800">
                {campaigns.map((campaign) => {
                  const statusInfo = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                  
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
                          <Link href={`/admin/campaigns/${campaign.id}`}>
                            <h3 className="text-white font-semibold hover:text-purple-400 transition">
                              {campaign.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-400 mt-1">
                            {campaign.advertiser.companyName} ({campaign.advertiser.email})
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm">
                            <span className="text-gray-500">Budget: {formatCurrency(campaign.budget)}</span>
                            <span className="text-gray-500">Spent: {formatCurrency(campaign.spent)}</span>
                            <span className="text-gray-500">Impressions: {campaign.impressions.toLocaleString()}</span>
                            <span className="text-gray-500">CTR: {getCTR(campaign)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/campaigns/${campaign.id}`}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-300" />
                          </Link>
                          {campaign.status === 'pending_review' && (
                            <>
                              <button
                                onClick={() => executeAction(campaign.id, 'approve')}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setActionType('reject');
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                          {campaign.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setActionType('suspend');
                              }}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm transition"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              Suspend
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {hasMore && (
                <div className="p-4 border-t border-gray-800 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rejection/Suspension Modal */}
      {actionType && selectedCampaign && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {actionType === 'reject' ? 'Reject Campaign' : 'Suspend Campaign'}
            </h2>
            <p className="text-gray-400 mb-4">
              {actionType === 'reject' 
                ? `Rejecting campaign: ${selectedCampaign.name}`
                : `Suspending campaign: ${selectedCampaign.name}`}
            </p>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={3}
                placeholder={actionType === 'reject' 
                  ? "Please provide a reason for rejection..."
                  : "Please provide a reason for suspension..."}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSelectedCampaign(null);
                  setActionType(null);
                  setReason('');
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(selectedCampaign.id, actionType)}
                disabled={!reason.trim() || actionLoading}
                className={`px-4 py-2 rounded-lg text-white transition disabled:opacity-50 ${
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
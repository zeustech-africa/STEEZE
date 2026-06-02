'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Megaphone, 
  DollarSign, 
  TrendingUp, 
  MousePointer, 
  Eye,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

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

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuthStore();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!token || !isAdmin) return;
      
      try {
        const response = await fetch(`${API_URL}/api/admin/campaigns/${campaignId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCampaign(data.campaign);
        } else if (response.status === 404) {
          setError('Campaign not found');
        } else {
          setError('Failed to load campaign');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaign();
  }, [campaignId, token, isAdmin]);

  const executeAction = async (action: string) => {
    if (!token) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/campaigns/${campaignId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        router.push('/admin/campaigns');
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} campaign`);
      }
    } catch (err) {
      setError(`Network error. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('en-ZA') : 'Not set';
  const getCTR = () => {
    if (!campaign) return '0%';
    if (campaign.impressions === 0) return '0%';
    return `${((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%`;
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Megaphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-gray-400">Admin access required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Megaphone className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Error</h2>
          <p className="text-gray-400">{error || 'Campaign not found'}</p>
          <Link href="/admin/campaigns" className="mt-4 inline-block text-purple-400">
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/campaigns" className="text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Action Buttons for Pending Review */}
        {campaign.status === 'pending_review' && (
          <div className="bg-gray-900 rounded-xl p-4 mb-6 flex gap-3">
            <button
              onClick={() => executeAction('approve')}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition"
            >
              Approve Campaign
            </button>
            <button
              onClick={() => executeAction('reject')}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition"
            >
              Reject Campaign
            </button>
          </div>
        )}

        {/* Campaign Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Creative Preview */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Creative Preview</h2>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                {campaign.mediaType === 'image' ? (
                  <img src={campaign.mediaUrl} alt={campaign.name} className="max-w-full rounded-lg mx-auto" />
                ) : (
                  <video src={campaign.mediaUrl} controls className="max-w-full rounded-lg mx-auto" />
                )}
                <p className="text-sm text-gray-400 mt-3">
                  Destination: <a href={campaign.destinationUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    {campaign.destinationUrl}
                  </a>
                </p>
              </div>
            </div>

            {/* Campaign Info */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Campaign Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-white">{campaign.description || 'No description provided'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Placement</p>
                  <p className="text-white">{PLACEMENT_LABELS[campaign.placement] || campaign.placement}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Advertiser</p>
                  <p className="text-white">{campaign.advertiser?.companyName}</p>
                  <p className="text-gray-500 text-sm">{campaign.advertiser?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Budget & Performance */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Budget & Performance</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Budget</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(campaign.budget)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Spent</p>
                  <p className="text-2xl font-bold text-yellow-500">{formatCurrency(campaign.spent)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Remaining</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(campaign.remainingBudget)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">CPM</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(campaign.cpm)}</p>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Analytics</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-800 rounded-lg">
                  <Eye className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{campaign.impressions.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Impressions</p>
                </div>
                <div className="text-center p-3 bg-gray-800 rounded-lg">
                  <MousePointer className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{campaign.clicks.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Clicks</p>
                </div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{getCTR()}</p>
                <p className="text-gray-400 text-xs">Click-through Rate (CTR)</p>
              </div>
            </div>

            {/* Scheduling */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Schedule</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Start Date:</span>
                  <span className="text-white">{formatDate(campaign.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">End Date:</span>
                  <span className="text-white">{formatDate(campaign.endDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{formatDate(campaign.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Targeting */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Targeting</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> Countries</p>
                  <p className="text-white">{campaign.countries?.length ? campaign.countries.join(', ') : 'All countries'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-1"><Users className="w-3 h-3" /> Interests</p>
                  <p className="text-white">{campaign.interests?.length ? campaign.interests.join(', ') : 'All interests'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Age Range</p>
                  <p className="text-white">
                    {campaign.ageRange?.min && campaign.ageRange?.max 
                      ? `${campaign.ageRange.min} - ${campaign.ageRange.max} years`
                      : 'All ages'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
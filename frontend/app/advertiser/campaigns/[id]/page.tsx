'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import {
  ArrowLeft,
  Megaphone,
  TrendingUp,
  MousePointer,
  Eye,
  MapPin,
  Users,
  Smartphone,
  Tablet,
  Monitor,
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

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuthStore();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAdvertiser = user?.userType === 'advertiser';

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!token || !isAdvertiser) return;
      
      try {
        const response = await fetch(`${API_URL}/api/advertiser/campaigns/${campaignId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCampaign(data.campaign);
        } else if (response.status === 404) {
          setError('Campaign not found');
        } else if (response.status === 401) {
          router.push('/advertiser/login');
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
  }, [campaignId, token, isAdvertiser]);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-ZA');
  };
  const getCTR = () => {
    if (!campaign) return '0%';
    if (campaign.impressions === 0) return '0%';
    return `${((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%`;
  };

  if (!isAuthenticated || !isAdvertiser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Megaphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Advertiser Access Required</h2>
          <Link href="/advertiser/login" className="mt-4 inline-block text-purple-400">
            Go to Login
          </Link>
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
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Megaphone className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Error</h2>
          <p className="text-gray-400">{error || 'Campaign not found'}</p>
          <Link href="/advertiser/dashboard" className="mt-4 inline-block text-purple-400">
            Back to Dashboard
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
          <Link href="/advertiser/dashboard" className="text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Campaign Info */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Campaign Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-white">{campaign.description || 'No description provided'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Placement</p>
                  <p className="text-white">{campaign.placement}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Created</p>
                  <p className="text-white">{formatDate(campaign.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Schedule</p>
                  <p className="text-white">
                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                  </p>
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

          {/* Right Column - Analytics */}
          <div className="space-y-6">
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
                  <p className="text-2xl font-bold text-white">{formatCurrency(campaign.cpm || 0)}</p>
                </div>
              </div>
            </div>

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

            {/* Device Breakdown */}
            {campaign.deviceBreakdown && (
              <div className="bg-gray-900 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Device Breakdown</h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Mobile</span>
                      <span>{campaign.deviceBreakdown.mobile}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${campaign.deviceBreakdown.mobile}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><Tablet className="w-3 h-3" /> Tablet</span>
                      <span>{campaign.deviceBreakdown.tablet}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${campaign.deviceBreakdown.tablet}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> Desktop</span>
                      <span>{campaign.deviceBreakdown.desktop}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${campaign.deviceBreakdown.desktop}%` }} />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-800">
                    <p className="text-gray-400 text-sm mb-2">Mobile OS Breakdown</p>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">iOS</span>
                        <span className="text-white text-sm">{campaign.deviceBreakdown.ios}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">Android</span>
                        <span className="text-white text-sm">{campaign.deviceBreakdown.android}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
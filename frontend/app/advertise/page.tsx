'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, Mail, Lock, Phone, MapPin, Globe,
  Megaphone, DollarSign, Target, Eye, EyeOff,
  Loader2, CheckCircle, XCircle, Clock, Sparkles
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Placement options
const PLACEMENTS = [
  { id: 'feed_standard', name: 'Standard Feed Ad', minCpm: 3, maxCpm: 5, recommended: 4 },
  { id: 'feed_premium', name: 'Premium Feed Ad', minCpm: 6, maxCpm: 10, recommended: 8 },
  { id: 'video_short', name: 'Short Video Ad', minCpm: 5, maxCpm: 8, recommended: 6 },
  { id: 'video_premium', name: 'Premium Video Ad', minCpm: 10, maxCpm: 15, recommended: 12 },
  { id: 'explore', name: 'Explore Page Ad', minCpm: 4, maxCpm: 7, recommended: 5 },
  { id: 'trending', name: 'Trending Section Ad', minCpm: 8, maxCpm: 12, recommended: 10 },
  { id: 'homepage_hero', name: 'Homepage Hero Ad', minCpm: 15, maxCpm: 30, recommended: 20 }
];

// Countries for targeting
const COUNTRIES = [
  'South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Ghana',
  'Morocco', 'Tanzania', 'Uganda', 'Zimbabwe', 'Botswana'
];

export default function AdvertisePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');
  
  const [step, setStep] = useState<'form' | 'pending' | 'approved' | 'rejected'>('form');
  const [appId, setAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Advertiser info
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    taxId: '',
    phone: '',
    address: '',
    website: '',
    // Campaign info
    campaignName: '',
    description: '',
    placement: 'feed_standard',
    cpm: 4,
    budget: 1000,
    mediaUrl: '',
    destinationUrl: '',
    countries: [] as string[],
    ageMin: '',
    ageMax: '',
    startDate: '',
    endDate: ''
  });

  const selectedPlacement = PLACEMENTS.find(p => p.id === formData.placement);
  const estimatedImpressions = Math.floor((formData.budget / formData.cpm) * 1000);

  // Check application status if ID in URL
  useEffect(() => {
    if (applicationId) {
      checkApplicationStatus(applicationId);
    }
  }, [applicationId]);

  const checkApplicationStatus = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/advertise/application/${id}/status`);
      const data = await response.json();
      
      setAppId(id);
      
      if (data.status === 'approved') {
        setStep('approved');
      } else if (data.status === 'rejected') {
        setRejectionReason(data.rejectionReason);
        setStep('rejected');
      } else {
        setStep('pending');
        // Poll for status changes
        pollStatus(id);
      }
    } catch (err) {
      console.error('Status check error:', err);
    }
  };

  const pollStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/advertise/application/${id}/status`);
        const data = await response.json();
        
        if (data.status === 'approved') {
          clearInterval(interval);
          setStep('approved');
        } else if (data.status === 'rejected') {
          clearInterval(interval);
          setRejectionReason(data.rejectionReason);
          setStep('rejected');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (formData.budget < 1000) {
      setError('Minimum budget is $10');
      return;
    }
    
    if (!formData.mediaUrl || !formData.destinationUrl) {
      setError('Please provide ad creative URL and destination URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/advertise/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiser: {
            companyName: formData.companyName,
            email: formData.email,
            password: formData.password,
            taxId: formData.taxId,
            phone: formData.phone,
            address: formData.address,
            website: formData.website
          },
          campaign: {
            name: formData.campaignName,
            description: formData.description,
            placement: formData.placement,
            cpm: formData.cpm * 100,
            budget: formData.budget * 100,
            mediaUrl: formData.mediaUrl,
            mediaType: 'image',
            destinationUrl: formData.destinationUrl,
            countries: formData.countries,
            ageRange: { min: formData.ageMin ? parseInt(formData.ageMin) : null, max: formData.ageMax ? parseInt(formData.ageMax) : null },
            startDate: formData.startDate || null,
            endDate: formData.endDate || null
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        router.push(`/advertise?id=${data.applicationId}`);
      } else {
        setError(data.error || 'Application failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!appId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/advertise/application/${appId}/pay`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok && data.payfastUrl) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.payfastUrl;
        
        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        setError(data.error || 'Payment initiation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pending page
  if (step === 'pending') {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-yellow-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Application Pending</h1>
          <p className="text-gray-400 mb-4">
            Your application is being reviewed by our admin team.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You will receive a notification once reviewed. This page will update automatically.
          </p>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Application ID</p>
            <p className="text-white font-mono">{appId}</p>
          </div>
          <Link href="/" className="mt-6 inline-block text-purple-400 hover:text-purple-300">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Approved page - Show Pay Now button
  if (step === 'approved') {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Application Approved!</h1>
          <p className="text-gray-400 mb-4">
            Your application has been approved. Make payment to activate your campaign.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-gray-400 text-sm">Amount to Pay</p>
            <p className="text-3xl font-bold text-white">${(formData.budget / 100).toFixed(2)}</p>
            <p className="text-gray-500 text-xs mt-1">Estimated impressions: {estimatedImpressions.toLocaleString()}</p>
          </div>
          <button
            onClick={handlePayNow}
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Pay Now'}
          </button>
          <p className="text-gray-500 text-xs mt-4">
            Payment secured by PayFast. Your campaign will start immediately after payment.
          </p>
        </div>
      </div>
    );
  }

  // Rejected page
  if (step === 'rejected') {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Application Not Approved</h1>
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">Reason:</p>
            <p className="text-white mt-1">{rejectionReason || 'Your application did not meet our advertising guidelines.'}</p>
          </div>
          <button
            onClick={() => {
              setStep('form');
              setRejectionReason(null);
              setError(null);
            }}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition"
          >
            Try Again
          </button>
          <Link href="/" className="mt-4 inline-block text-gray-400 hover:text-white text-sm">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Form page
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Advertise on STEEZE</h1>
          <p className="text-gray-400">Reach millions of entertainment lovers across Africa</p>
        </div>
        
        <div className="bg-gray-900 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Company Information */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-500" />
                Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
            
            {/* Section 2: Campaign Details */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-500" />
                Campaign Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    value={formData.campaignName}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignName: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Placement *</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => {
                      const placement = PLACEMENTS.find(p => p.id === e.target.value);
                      setFormData(prev => ({ ...prev, placement: e.target.value, cpm: placement?.recommended || 4 }));
                    }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    {PLACEMENTS.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.minCpm}-${p.maxCpm} CPM)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CPM (USD) *</label>
                  <input
                    type="number"
                    value={formData.cpm}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpm: parseFloat(e.target.value) }))}
                    min={selectedPlacement?.minCpm}
                    max={selectedPlacement?.maxCpm}
                    step="0.5"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Budget (USD) *</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) }))}
                    min={10}
                    step={10}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum $10</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estimated Impressions</label>
                  <p className="text-white text-lg font-semibold">{estimatedImpressions.toLocaleString()}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ad Creative URL *</label>
                  <input
                    type="url"
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="https://example.com/ad-image.jpg"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Destination URL *</label>
                  <input
                    type="url"
                    value={formData.destinationUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, destinationUrl: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="https://example.com/landing-page"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Section 3: Targeting */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Targeting
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Countries</label>
                  <select
                    multiple
                    value={formData.countries}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData(prev => ({ ...prev, countries: selected }));
                    }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-32"
                  >
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Age Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={formData.ageMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageMin: e.target.value }))}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                    <span className="text-white">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={formData.ageMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageMax: e.target.value }))}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Schedule (Optional)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg text-white font-semibold transition"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
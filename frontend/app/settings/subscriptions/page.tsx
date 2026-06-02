'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { 
  Crown, 
  CheckCircle, 
  CreditCard, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Plan {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  features: string[];
  badgeColor: string;
  badgeBgColor: string;
  buttonColor: string;
  popular?: boolean;
}

interface PaymentHistory {
  id: string;
  amount: number;
  amountRands: string;
  status: string;
  createdAt: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'FREE VIBES',
    price: 0,
    priceDisplay: 'Free',
    features: [
      'Browse global feed',
      'Like, comment, save posts',
      'Follow creators',
      'Create playlists',
      'Standard streaming quality',
      'Ads supported'
    ],
    badgeColor: 'text-gray-400',
    badgeBgColor: 'bg-gray-500/10',
    buttonColor: 'bg-gray-600 hover:bg-gray-700'
  },
  {
    id: 'basic',
    name: 'BASIC VIBES',
    price: 49,
    priceDisplay: 'R49',
    features: [
      'Everything in FREE VIBES',
      'No ads',
      'Download offline content',
      'Background playback',
      'Better streaming quality',
      'Early access drops'
    ],
    badgeColor: 'text-amber-500',
    badgeBgColor: 'bg-amber-500/10',
    buttonColor: 'bg-amber-600 hover:bg-amber-700',
    popular: true
  },
  {
    id: 'premium',
    name: 'PREMIUM VIBES',
    price: 99,
    priceDisplay: 'R99',
    features: [
      'Everything in BASIC VIBES',
      'Subscriber-only content',
      'Early access to releases',
      'Premium creator rooms',
      'Watch parties',
      'Top-fan recognition'
    ],
    badgeColor: 'text-gray-400',
    badgeBgColor: 'bg-gray-500/10',
    buttonColor: 'bg-gray-600 hover:bg-gray-700'
  },
  {
    id: 'gold',
    name: 'GOLDEN VIBES',
    price: 199,
    priceDisplay: 'R199',
    features: [
      'Everything in PREMIUM VIBES',
      'VIP creator experiences',
      'Exclusive livestreams',
      'Behind-the-scenes access',
      'Golden badge on profile',
      'Priority support'
    ],
    badgeColor: 'text-yellow-500',
    badgeBgColor: 'bg-yellow-500/10',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
  }
];

export default function SubscriptionsPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('active');
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!token || !isAuthenticated) return;
      
      try {
        const [statusRes, historyRes] = await Promise.all([
          fetch(`${API_URL}/api/user/subscription/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/user/payments`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (statusRes.ok) {
          const data = await statusRes.json();
          setCurrentTier(data.tier || 'free');
          setSubscriptionStatus(data.status || 'active');
          setSubscriptionExpiresAt(data.expiresAt);
        }
        
        if (historyRes.ok) {
          const data = await historyRes.json();
          setPaymentHistory(data.payments || []);
        }
      } catch (err) {
        console.error('Fetch subscription error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscriptionData();
  }, [token, isAuthenticated]);

  // Get tier display name
  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'basic': return 'BASIC VIBES';
      case 'premium': return 'PREMIUM VIBES';
      case 'gold': return 'GOLDEN VIBES';
      default: return 'FREE VIBES';
    }
  };

  // Get badge color for current tier
  const getBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'basic': return { color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'premium': return { color: 'text-gray-400', bg: 'bg-gray-500/10' };
      case 'gold': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      default: return { color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
  };

  // Upgrade to a plan
  const handleUpgrade = async (planId: string) => {
    if (!token) {
      router.push('/login');
      return;
    }
    
    setUpgrading(planId);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/subscribe/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });
      
      const data = await response.json();
      
      if (response.ok && data.payfastUrl) {
        // Redirect to PayFast
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
        setError(data.error || 'Failed to initiate upgrade');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  // Cancel subscription
  const handleCancel = async () => {
    if (!token) return;
    
    setCancelling(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/subscribe/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSuccess('Your subscription has been cancelled. You will retain access until the end of your billing period.');
        setShowCancelModal(false);
        // Refresh subscription data
        const statusRes = await fetch(`${API_URL}/api/user/subscription/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statusRes.ok) {
          const data = await statusRes.json();
          setCurrentTier(data.tier || 'free');
          setSubscriptionStatus(data.status || 'active');
          setSubscriptionExpiresAt(data.expiresAt);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toFixed(2)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to manage subscriptions</h2>
          <p className="text-gray-400">Please log in to view and manage your subscription.</p>
          <Link href="/login" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
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

  const badgeStyle = getBadgeStyle(currentTier);

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Subscription Management</h1>
        <p className="text-gray-400 mb-8">Manage your VIBES subscription and billing</p>

        {/* Current Plan Card */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-sm">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-2xl font-bold text-white">{getTierDisplayName(currentTier)}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${badgeStyle.bg} ${badgeStyle.color}`}>
                  {subscriptionStatus === 'active' ? 'Active' : subscriptionStatus}
                </span>
              </div>
              {subscriptionExpiresAt && subscriptionStatus !== 'active' && (
                <p className="text-gray-500 text-sm mt-2">
                  Valid until {formatDate(subscriptionExpiresAt)}
                </p>
              )}
            </div>
            {currentTier !== 'free' && subscriptionStatus === 'active' && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500 rounded-lg">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Plan Comparison Cards */}
        <h2 className="text-xl font-semibold text-white mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentTier === plan.id;
            const isUpgrading = upgrading === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`bg-gray-900 rounded-xl p-6 transition-all ${
                  plan.popular ? 'border-2 border-amber-500 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-amber-500 text-black text-xs px-3 py-1 rounded-full font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold text-white mt-2">{plan.priceDisplay}</p>
                {plan.price > 0 && (
                  <p className="text-gray-500 text-sm">per month</p>
                )}
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan || isUpgrading}
                  className={`w-full mt-6 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${plan.buttonColor}`}
                >
                  {isCurrentPlan ? (
                    'Current Plan'
                  ) : isUpgrading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `Upgrade to ${plan.name.split(' ')[0]}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Payment History</h2>
              <p className="text-gray-400 text-sm">Your recent transactions</p>
            </div>
            <div className="divide-y divide-gray-800">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-white font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-gray-500 text-sm">{formatDate(payment.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    payment.status === 'completed' 
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-8 bg-gray-900 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <p className="text-white font-medium">Can I cancel anytime?</p>
              <p className="text-gray-400 text-sm">Yes, you can cancel your subscription at any time. You will retain access until the end of your billing period.</p>
            </div>
            <div>
              <p className="text-white font-medium">What happens if my payment fails?</p>
              <p className="text-gray-400 text-sm">We will retry automatically on day 1, 3, and 7. You have a 7-day grace period to update your payment method before downgrading to FREE VIBES.</p>
            </div>
            <div>
              <p className="text-white font-medium">Can I change my plan?</p>
              <p className="text-gray-400 text-sm">Yes, you can upgrade or downgrade anytime. Changes take effect immediately.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Cancel Subscription</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Are you sure you want to cancel your {getTierDisplayName(currentTier)} subscription?
            </p>
            <p className="text-gray-500 text-sm mb-6">
              You will lose access to premium features at the end of your billing period.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
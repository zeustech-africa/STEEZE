'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Clock, AlertCircle, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function JustVibesLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownInfo, setCooldownInfo] = useState<{
    inCooldown: boolean;
    remainingMinutes: number;
    remainingHours: number;
    remainingMinutesDisplay: number;
    cooldownEndsAt: string | null;
  } | null>(null);
  const [checkingCooldown, setCheckingCooldown] = useState(false);
  const [cooldownEmail, setCooldownEmail] = useState('');

  // Check cooldown status when email is entered
  const checkCooldownStatus = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCooldownInfo(null);
      return;
    }

    setCheckingCooldown(true);
    try {
      const response = await fetch(`${API_URL}/api/just-vibes/check-cooldown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.inCooldown) {
          const remainingHours = Math.floor(data.remainingMinutes / 60);
          const remainingMinutesDisplay = data.remainingMinutes % 60;
          setCooldownInfo({
            inCooldown: true,
            remainingMinutes: data.remainingMinutes,
            remainingHours,
            remainingMinutesDisplay,
            cooldownEndsAt: data.cooldownEndsAt
          });
        } else {
          setCooldownInfo(null);
        }
      }
    } catch (error) {
      console.error('Cooldown check error:', error);
    } finally {
      setCheckingCooldown(false);
    }
  };

  // Debounced cooldown check
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (formData.email) {
        checkCooldownStatus(formData.email);
        setCooldownEmail(formData.email);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [formData.email]);

  // Countdown timer for cooldown display
  useEffect(() => {
    if (!cooldownInfo?.inCooldown) return;

    const interval = setInterval(() => {
      setCooldownInfo(prev => {
        if (!prev || prev.remainingMinutes <= 0) {
          clearInterval(interval);
          checkCooldownStatus(cooldownEmail);
          return null;
        }
        const newRemainingMinutes = prev.remainingMinutes - 1;
        return {
          ...prev,
          remainingMinutes: newRemainingMinutes,
          remainingHours: Math.floor(newRemainingMinutes / 60),
          remainingMinutesDisplay: newRemainingMinutes % 60
        };
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [cooldownInfo?.inCooldown, cooldownEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/just-vibes/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('just_vibes_token', data.data.token);
        localStorage.setItem('just_vibes_user', JSON.stringify(data.data.user));
        localStorage.setItem('just_vibes_session', JSON.stringify(data.data.session));
        router.push('/');
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Just VIBES</h1>
          <p className="text-gray-400">Login to continue your visit</p>
        </div>

        {/* Expiry Message */}
        {expired && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-yellow-500 font-medium">Your 1-hour visit has ended</p>
                <p className="text-gray-400 text-sm mt-1">
                  Please wait 3 hours before logging in again, or upgrade to VIBER for unlimited access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cooldown Message */}
        {cooldownInfo?.inCooldown && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500 rounded-xl">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-purple-500 font-medium">Cooldown Period Active</p>
                <p className="text-gray-400 text-sm mt-1">
                  Your next visit will be available in{' '}
                  <span className="text-white font-bold">
                    {cooldownInfo.remainingHours}h {cooldownInfo.remainingMinutesDisplay}m
                  </span>
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Or upgrade to VIBER below for unlimited access with no wait times.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
                placeholder="your@email.com"
                required
                disabled={checkingCooldown}
              />
              {checkingCooldown && (
                <p className="text-xs text-gray-500 mt-1">Checking session status...</p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition pr-10"
                  placeholder="Enter your password"
                  required
                  disabled={cooldownInfo?.inCooldown}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={cooldownInfo?.inCooldown}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button - Disabled during cooldown */}
            <button
              type="submit"
              disabled={loading || cooldownInfo?.inCooldown}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : cooldownInfo?.inCooldown ? (
                'Wait for Cooldown'
              ) : (
                'Login'
              )}
            </button>

            {/* Signup Link */}
            <p className="text-center text-gray-400 text-sm mt-4">
              Don't have an account?{' '}
              <Link href="/just-vibes/signup" className="text-purple-400 hover:text-purple-300">
                Create Just VIBES account
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-500">OR</span>
            </div>
          </div>

          {/* Become a VIBER Section */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-white font-medium">Want unlimited access?</span>
            </div>
            <Link
              href="/signup"
              className="block w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg text-white font-medium transition"
            >
              Become a VIBER
            </Link>
            <p className="text-gray-500 text-xs mt-3">
              Unlimited access • Full playback • Like & Comment • Save & Download
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
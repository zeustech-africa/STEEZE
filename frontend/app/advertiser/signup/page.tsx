'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Building, Mail, Lock, Phone, MapPin } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdvertiserSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    website: '',
    taxId: '',
    phone: '',
    address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/advertiser/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          website: formData.website,
          taxId: formData.taxId,
          phone: formData.phone,
          address: formData.address
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || data.errors?.map((e: any) => e.msg).join(', ') || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center">
          <Building className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Application Submitted!</h1>
          <p className="text-gray-400 mb-4">
            Your advertiser account has been created and is pending admin approval.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You will receive an email notification once your account is approved.
          </p>
          <Link
            href="/advertiser/login"
            className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Advertise on STEEZE</h1>
          <p className="text-gray-400">Reach millions of entertainment lovers across Africa</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password *
                </label>
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
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tax/VAT Number
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Business Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={2}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg text-white font-medium transition"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Advertiser Account'}
            </button>

            <p className="text-center text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/advertiser/login" className="text-purple-400 hover:text-purple-300">
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
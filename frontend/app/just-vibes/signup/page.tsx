'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Password strength checker
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score <= 2) return { score, label: 'Weak', color: 'text-red-500' };
  if (score <= 4) return { score, label: 'Medium', color: 'text-yellow-500' };
  return { score, label: 'Strong', color: 'text-green-500' };
}

export default function JustVibesSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [emailAvailable, setEmailAvailable] = useState<{ available: boolean; message: string } | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid = 
    formData.email.trim() !== '' &&
    emailAvailable?.available === true &&
    formData.password.length >= 6 &&
    passwordsMatch &&
    termsAccepted;

  // Check email availability (debounced)
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAvailable(null);
      return;
    }
    
    setCheckingEmail(true);
    try {
      const response = await fetch(`${API_URL}/api/just-vibes/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setEmailAvailable({
        available: data.available,
        message: data.message
      });
      
      if (!data.available) {
        setErrors(prev => ({ ...prev, email: data.message }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Email check error:', error);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  // Debounced email check
  useEffect(() => {
    if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
    
    const timeout = setTimeout(() => {
      if (formData.email) {
        checkEmailAvailability(formData.email);
      }
    }, 500);
    
    setEmailCheckTimeout(timeout);
    
    return () => clearTimeout(timeout);
  }, [formData.email, checkEmailAvailability]);

  // Validate form on changes
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.confirmPassword && !passwordsMatch) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
  }, [formData.password, formData.confirmPassword, passwordsMatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const response = await fetch(`${API_URL}/api/just-vibes/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        // Clear form
        setFormData({ email: '', password: '', confirmPassword: '' });
        setTermsAccepted(false);
      } else {
        setErrors({ general: data.error || data.errors?.join(', ') || 'Signup failed. Please try again.' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h1>
          <p className="text-gray-400 mb-4">
            Your Just VIBES account has been created and is pending admin approval.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You will receive an email notification once your account is approved.
            This typically takes 24-48 hours.
          </p>
          <Link
            href="/just-vibes/login"
            className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Just VIBES</h1>
          <p className="text-gray-400">Create your limited access account</p>
        </div>

        {/* Info Cards */}
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">What you can do:</p>
              <ul className="text-gray-400 text-sm mt-1 space-y-1">
                <li>• Browse the global feed</li>
                <li>• Watch 30-second previews of content</li>
                <li>• Visit creator profiles</li>
                <li>• Discover new entertainment</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">Important Notes:</p>
              <ul className="text-gray-400 text-sm mt-1 space-y-1">
                <li>• 1 hour visit time per session</li>
                <li>• 3 hour cooldown between visits</li>
                <li>• Cannot like, comment, or save content</li>
                <li>• Admin approval required before first login</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
                placeholder="your@email.com"
                required
              />
              {checkingEmail && (
                <div className="flex items-center gap-1 mt-1">
                  <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
                  <span className="text-xs text-gray-500">Checking availability...</span>
                </div>
              )}
              {emailAvailable && !emailAvailable.available && (
                <div className="flex items-center gap-1 mt-1">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-500">{emailAvailable.message}</span>
                </div>
              )}
              {emailAvailable && emailAvailable.available && formData.email && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">Email available</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition pr-10"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition ${
                          level <= passwordStrength.score
                            ? passwordStrength.label === 'Weak'
                              ? 'bg-red-500'
                              : passwordStrength.label === 'Medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition pr-10"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="mb-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-400">
                  I agree to the{' '}
                  <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Just VIBES Account'
              )}
            </button>

            {/* Login Link */}
            <p className="text-center text-gray-400 text-sm mt-4">
              Already have an account?{' '}
              <Link href="/just-vibes/login" className="text-purple-400 hover:text-purple-300">
                Login here
              </Link>
            </p>

            {/* Upgrade to VIBER Link */}
            <p className="text-center text-gray-500 text-xs mt-4">
              Want full access?{' '}
              <Link href="/signup" className="text-purple-400 hover:text-purple-300">
                Become a VIBER
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
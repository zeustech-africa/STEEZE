"use client";

import React, { useState } from "react";
import Link from "next/link";
import Captcha from "@/components/Captcha";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), cfTurnstileResponse: captchaToken }),
      });
      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err: any) {
      setError("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-[#FFD700] tracking-tight">STEEZE</h1>
          </Link>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFD700]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#FFD700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                If an account exists for <span className="text-[#FFD700]">{email}</span>, we've sent a password reset link. Please check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="inline-block mt-6 text-[#FFD700] hover:text-[#FFD700]/80 text-sm font-medium transition-colors"
              >
                &larr; Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
              <p className="text-gray-400 text-sm mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div id="forgot-password-error" role="alert" className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-describedby={error ? "forgot-password-error" : undefined}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700] transition-colors"
                    autoComplete="email"
                  />
                </div>

                <div className="flex justify-center my-4">
                  <Captcha
                    onVerify={setCaptchaToken}
                    onError={() => setCaptchaError(true)}
                  />
                </div>
                {captchaError && (
                  <p className="text-red-400 text-xs text-center mt-1">CAPTCHA verification failed. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !captchaToken}
                  className="w-full py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-[#FFD700] hover:text-[#FFD700]/80 text-sm font-medium transition-colors"
                >
                  &larr; Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
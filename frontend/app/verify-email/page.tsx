"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided. Please check your email link.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`${apiBase}/api/auth/verify-email?token=${encodeURIComponent(token!)}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully! You can now access all features.");
          // Update local storage user data
          try {
            const userData = localStorage.getItem("user");
            if (userData) {
              const user = JSON.parse(userData);
              user.isVerified = true;
              localStorage.setItem("user", JSON.stringify(user));
            }
          } catch {
            // ignore
          }
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify email. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Failed to connect to server. Please try again.");
      }
    }

    verify();
  }, [token, apiBase]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 size={32} className="animate-spin text-gold" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
            <p className="text-white/50">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-white/50 mb-6">{message}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-full hover:bg-gold/90 transition"
            >
              Go to Home <ArrowRight size={18} />
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-white/50 mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-full hover:bg-gold/90 transition"
            >
              Back to Login <ArrowRight size={18} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 size={32} className="animate-spin text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading verification...</h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
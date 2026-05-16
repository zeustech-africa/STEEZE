"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reason, setReason] = useState("");

  useEffect(() => {
    const pfMessage = searchParams.get("pf_message");
    if (pfMessage) {
      setReason(pfMessage);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <XCircle className="text-red-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
        <p className="text-white/60 mb-4">
          Your payment was not completed. No charges have been made.
        </p>

        {reason && (
          <p className="text-white/40 text-xs mb-6 bg-white/5 rounded-lg p-3">
            Reason: {reason}
          </p>
        )}

        <div className="space-y-3 pt-4 border-t border-white/10">
          <button
            onClick={() => router.back()}
            className="w-full py-2 bg-white/10 text-white rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2 bg-gold text-black rounded-full font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Return to STEEZE
          </button>
        </div>

        <div className="mt-4">
          <a href="/terms" className="text-gold text-sm hover:underline">
            Terms of Service
          </a>
          <span className="text-white/30 mx-2">|</span>
          <a href="/privacy" className="text-gold text-sm hover:underline">
            Privacy Policy
          </a>
          <span className="text-white/30 mx-2">|</span>
          <a href="/help" className="text-gold text-sm hover:underline">
            Help Center
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    }>
      <PaymentCancelledContent />
    </Suspense>
  );
}
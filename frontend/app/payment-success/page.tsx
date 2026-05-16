"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowRight } from "lucide-react";
import ConsumerRightsNotice from "../../components/ConsumerRightsNotice";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    const pfPaymentId = searchParams.get("pf_payment_id");
    if (pfPaymentId) {
      setTransactionId(pfPaymentId);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="text-green-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-white/60 mb-4">
          Your transaction has been completed successfully.
        </p>

        {transactionId && (
          <p className="text-white/40 text-xs mb-6">
            Transaction ID: {transactionId}
          </p>
        )}

        <div className="text-left mb-6">
          <ConsumerRightsNotice variant="payment-confirmation" />
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => router.push("/")}
            className="w-full py-2 bg-gold text-black rounded-full font-semibold flex items-center justify-center gap-2"
          >
            Continue to STEEZE <ArrowRight size={16} />
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
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold animate-pulse">Loading...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
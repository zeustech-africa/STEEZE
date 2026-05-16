"use client";

import { Clock, RefreshCw, Mail, AlertCircle } from "lucide-react";

interface ConsumerRightsNoticeProps {
  variant?: "checkout" | "subscription" | "payment-confirmation";
  productName?: string;
  price?: number;
}

export default function ConsumerRightsNotice({ variant = "checkout", productName, price }: ConsumerRightsNoticeProps) {
  const isCheckout = variant === "checkout";
  const isSubscription = variant === "subscription";
  const isPaymentConfirmation = variant === "payment-confirmation";

  return (
    <div className={`rounded-lg p-4 ${isCheckout ? "border border-gold/30 bg-gold/5" : "bg-white/5"}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <Clock className="text-gold" size={16} />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm mb-1">Your Consumer Rights (CPA)</h4>
          <p className="text-white/60 text-xs mb-2">
            Under the South African Consumer Protection Act, you have the right to cancel this transaction within{" "}
            <span className="text-gold font-semibold">7 days</span> without penalty or reason.
          </p>

          <div className="space-y-1 text-white/50 text-xs">
            <p className="flex items-center gap-2">
              <RefreshCw size={12} className="text-gold flex-shrink-0" />
              Cancel within 7 days for a full refund (if service not yet consumed)
            </p>
            <p className="flex items-center gap-2">
              <Mail size={12} className="text-gold flex-shrink-0" />
              To cancel, email{" "}
              <a href="mailto:support@steeze.com" className="text-gold hover:underline">
                support@steeze.com
              </a>{" "}
              with your transaction ID
            </p>
            <p className="flex items-center gap-2">
              <AlertCircle size={12} className="text-gold flex-shrink-0" />
              Refunds processed within 30 days of cancellation
            </p>
          </div>

          {isSubscription && (
            <p className="text-white/40 text-xs mt-2">
              Your subscription will renew automatically unless cancelled. You can cancel anytime in Settings → Subscriptions.
            </p>
          )}

          {isCheckout && (
            <p className="text-white/40 text-xs mt-2">
              By completing this purchase, you acknowledge your 7-day cooling-off rights.{" "}
              <a href="/terms" className="text-gold hover:underline">
                View full terms
              </a>
            </p>
          )}

          {isPaymentConfirmation && (
            <p className="text-white/40 text-xs mt-2">
              A confirmation email with your cooling-off rights has been sent to your email address.{" "}
              <a href="/terms" className="text-gold hover:underline">
                View full terms
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { CreditCard, Lock } from "lucide-react";
import ConsumerRightsNotice from "./ConsumerRightsNotice";

interface CheckoutButtonProps {
  tier: "basic" | "premium" | "gold";
  price: number;
  creatorId?: string;
  creatorName?: string;
}

export default function CheckoutButton({ tier, price, creatorId, creatorName }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, creatorId, price }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowNotice(true)}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <CreditCard size={18} />
        {loading ? "Processing..." : `Subscribe - R${price}/month`}
      </button>

      {showNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gold mb-4">Confirm Subscription</h2>
            <p className="text-white/70 mb-4">
              You are about to subscribe to{" "}
              <span className="text-gold font-semibold">
                {creatorName || tierLabel}
              </span>{" "}
              for{" "}
              <span className="text-gold font-semibold">
                R{price}/month
              </span>
              .
            </p>

            <ConsumerRightsNotice
              variant="subscription"
              productName={`${tier} subscription`}
              price={price}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCheckout}
                className="flex-1 py-2 bg-gold text-black rounded-full font-semibold flex items-center justify-center gap-2"
              >
                <Lock size={14} /> Confirm & Pay
              </button>
              <button
                onClick={() => setShowNotice(false)}
                className="flex-1 py-2 border border-white/30 text-white rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
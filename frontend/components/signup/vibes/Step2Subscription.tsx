"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, Download, MessageCircle, Crown, Sparkles } from "lucide-react";

interface Step2SubscriptionProps {
  data: Record<string, unknown>;
  updateData: (data: Record<string, unknown>) => void;
  onNext: () => void;
  onBack: () => void;
  markComplete: () => void;
}

const tiers = [
  {
    id: "free",
    name: "Free",
    price: "R0",
    period: "forever",
    description: "Basic access to STEEZE",
    features: [
      "Listen to free posts",
      "Like and comment",
      "Save posts to profile",
      "See ads",
    ],
    icon: Sparkles,
    popular: false,
    color: "from-gray-500 to-gray-600",
  },
  {
    id: "basic",
    name: "Basic",
    price: "R50",
    period: "/month",
    description: "Download free posts, no ads",
    features: [
      "Everything in Free",
      "Download free posts",
      "No ads",
      "Early access to some content",
    ],
    icon: Download,
    popular: false,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "premium",
    name: "Premium",
    price: "R99",
    period: "/month",
    description: "Download paid posts, exclusive content",
    features: [
      "Everything in Basic",
      "Download paid posts",
      "Exclusive creator content",
      "Priority support",
      "Early access to new releases",
    ],
    icon: Crown,
    popular: true,
    color: "from-gold to-gold-dark",
  },
  {
    id: "gold",
    name: "Gold",
    price: "R199",
    period: "/month",
    description: "DM creators, request video calls",
    features: [
      "Everything in Premium",
      "Direct message creators",
      "Request video calls",
      "Gold badge on profile",
      "Priority in comments",
    ],
    icon: MessageCircle,
    popular: false,
    color: "from-amber-500 to-orange-600",
  },
];

export default function Step2Subscription({ data, updateData, onNext, onBack, markComplete }: Step2SubscriptionProps) {
  const [selectedTier, setSelectedTier] = useState((data.subscriptionTier as string) || "free");

  const handleNext = () => {
    updateData({ subscriptionTier: selectedTier });
    markComplete();
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <p className="text-white/60 text-sm">Choose how you want to experience STEEZE. Upgrade anytime.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.id;
          return (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`relative cursor-pointer rounded-xl border-2 transition-all p-4 ${
                isSelected ? "border-gold bg-gold/10 shadow-lg shadow-gold/20" : "border-white/20 bg-white/5 hover:border-gold/50"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold text-black text-xs font-bold rounded-full">
                  POPULAR
                </div>
              )}
              <div className="text-center">
                <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${tier.color} mb-3`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-gold">{tier.price}</span>
                  <span className="text-white/50 text-sm">{tier.period}</span>
                </div>
                <p className="text-white/50 text-xs mt-2">{tier.description}</p>
                <ul className="mt-4 space-y-1 text-left">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-white/60">
                      <CheckCircle size={12} className="text-gold" /> {feature}
                    </li>
                  ))}
                </ul>
                {isSelected && (
                  <div className="mt-3 flex justify-center">
                    <CheckCircle size={20} className="text-gold" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
        <p className="text-white/70 text-sm text-center">
          <span className="text-gold font-semibold">Gold members</span> get direct access to creators via DM and can request video calls.
          All subscriptions support creators you follow. Cancel anytime.
        </p>
      </div>

      <div className="flex justify-between pt-4 border-t border-white/10">
        <button type="button" onClick={onBack} className="px-8 py-3 border border-white/30 text-white rounded-full hover:border-gold transition-all flex items-center gap-2">
          <ChevronLeft size={18} /> Back
        </button>
        <button type="button" onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all flex items-center gap-2">
          Next Step <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
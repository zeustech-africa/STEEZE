'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Crown, CheckCircle, X, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  message?: string;
}

const TIER_FEATURES = {
  basic: ['Download content', 'Background playback', 'No ads', 'Early access to drops'],
  premium: ['All Basic features', 'Subscriber-only content', 'Premium creator rooms', 'Watch parties'],
  gold: ['All Premium features', 'VIP experiences', 'Exclusive livestreams', 'BTS access', 'Golden badge']
};

export function UpgradeModal({ isOpen, onClose, feature, message }: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'gold'>('basic');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-8"
    >
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 md:m-0">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" aria-hidden="true" />
            <h2 id="modal-title" className="text-xl font-bold text-white">Unlock {feature}</h2>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Message */}
        <div className="p-4 bg-purple-500/10 border-b border-purple-500">
          <p className="text-purple-400 text-sm">
            {message || `Upgrade to VIBES subscription to unlock ${feature.toLowerCase()} and many more features.`}
          </p>
        </div>

        {/* Tier Selection */}
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedTier('basic')}
              className={`flex-1 py-2 rounded-lg transition ${
                selectedTier === 'basic' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              Basic • R50
            </button>
            <button
              onClick={() => setSelectedTier('premium')}
              className={`flex-1 py-2 rounded-lg transition ${
                selectedTier === 'premium' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              Premium • R99
            </button>
            <button
              onClick={() => setSelectedTier('gold')}
              className={`flex-1 py-2 rounded-lg transition ${
                selectedTier === 'gold' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              Gold • R199
            </button>
          </div>

          {/* Features List */}
          <div className="space-y-2 mb-6">
            {TIER_FEATURES[selectedTier].map((featureItem, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{featureItem}</span>
              </div>
            ))}
          </div>

          {/* Upgrade Button */}
          <Link
            href="/settings/subscriptions"
            onClick={onClose}
            aria-label={`Upgrade to ${selectedTier} plan`}
            className="block w-full text-center py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition"
          >
            Upgrade Now
          </Link>

          <p className="text-center text-gray-500 text-xs mt-4">
            Cancel anytime. No commitment.
          </p>
        </div>
      </div>
    </div>
  );
}
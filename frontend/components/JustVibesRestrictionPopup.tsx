'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { useJustVibes } from '@/hooks/useJustVibes';

interface JustVibesRestrictionPopupProps {
  action: 'like' | 'comment' | 'share' | 'save' | 'download' | 'purchase' | 'profile';
  onClose?: () => void;
}

const ACTION_MESSAGES: Record<string, { title: string; message: string }> = {
  like: {
    title: 'Become a VIBER to Like',
    message: 'Liking content is a VIBER feature. Upgrade to show your support for creators.'
  },
  comment: {
    title: 'Become a VIBER to Comment',
    message: 'Commenting is a VIBER feature. Join the conversation by upgrading your account.'
  },
  share: {
    title: 'Become a VIBER to Share',
    message: 'Sharing content is a VIBER feature. Spread the vibe by upgrading your account.'
  },
  save: {
    title: 'Become a VIBER to Save',
    message: 'Saving content is a VIBER feature. Build your collection by upgrading.'
  },
  download: {
    title: 'Become a VIBER to Download',
    message: 'Downloading content is a VIBER feature. Take your favorite content offline.'
  },
  purchase: {
    title: 'Become a VIBER to Purchase',
    message: 'Purchasing content is a VIBER feature. Unlock exclusive content by upgrading.'
  },
  profile: {
    title: 'Become a VIBER to Create a Profile',
    message: 'Profiles are for VIBER members only. Upgrade to create your profile, connect with creators, and build your community.'
  }
};

export function JustVibesRestrictionPopup({ action, onClose }: JustVibesRestrictionPopupProps) {
  const [visible, setVisible] = useState(true);
  const messages = ACTION_MESSAGES[action] || ACTION_MESSAGES.like;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{messages.title}</h2>
          <p className="text-gray-400 mb-4">{messages.message}</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/signup"
            onClick={handleClose}
            className="block w-full text-center py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition"
          >
            Become a VIBER
          </Link>
          <button
            onClick={handleClose}
            className="block w-full text-center py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm transition"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Just VIBES accounts have limited access. Upgrade to VIBER for full features.
        </p>
      </div>
    </div>
  );
}

// Hook to use restriction popup
export function useJustVibesRestriction() {
  const [popupAction, setPopupAction] = useState<string | null>(null);
  const { isAuthenticated: isJustVibesAuth } = useJustVibes();

  const showRestrictionPopup = (action: 'like' | 'comment' | 'share' | 'save' | 'download' | 'purchase' | 'profile') => {
    if (isJustVibesAuth) {
      setPopupAction(action);
    }
  };

  const RestrictionPopup = () => {
    if (!popupAction) return null;
    return (
      <JustVibesRestrictionPopup
        action={popupAction as 'like' | 'comment' | 'share' | 'save' | 'download' | 'purchase' | 'profile'}
        onClose={() => setPopupAction(null)}
      />
    );
  };

  return { showRestrictionPopup, RestrictionPopup, isJustVibesAuth };
}
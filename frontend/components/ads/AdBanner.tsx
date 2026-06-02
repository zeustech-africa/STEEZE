'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAdVisibility } from '@/hooks/useAdVisibility';
import { AdImpressionTracker } from './AdImpressionTracker';
import Link from 'next/link';

interface AdBannerProps {
  position?: 'feed' | 'sidebar' | 'between' | 'explore';
  campaign?: {
    id: string;
    title: string;
    description: string;
    cta: string;
    imageUrl: string;
    destinationUrl: string;
  } | null;
  onClose?: () => void;
}

export function AdBanner({ position = 'feed', onClose }: AdBannerProps) {
  const { showAds } = useAdVisibility();
  const [isVisible, setIsVisible] = useState(true);
  const [adData, setAdData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // If user shouldn't see ads, don't render anything
  if (!showAds) {
    return null;
  }

  // If user closed this ad, don't show it
  if (!isVisible) {
    return null;
  }

  // Different ad styling based on position
  const getPositionClasses = () => {
    switch (position) {
      case 'sidebar':
        return 'rounded-xl overflow-hidden mb-4';
      case 'between':
        return 'rounded-xl overflow-hidden my-4';
      case 'explore':
        return 'rounded-xl overflow-hidden my-4';
      default:
        return 'rounded-xl overflow-hidden mb-4';
    }
  };

  const getSizeClasses = () => {
    switch (position) {
      case 'sidebar':
        return 'w-full h-[250px]';
      default:
        return 'w-full h-[120px]';
    }
  };

  // Mock ad data (in production, fetch from ad server)
  useEffect(() => {
    // Simulate fetching ad
    const mockAd = {
      id: 'ad_1',
      title: 'Discover New Music',
      description: 'Get 3 months free on Premium',
      cta: 'Learn More',
      imageUrl: '/ads/music-ad-placeholder.jpg',
      destinationUrl: '/subscription',
    };
    setAdData(mockAd);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className={`bg-gray-800 animate-pulse ${getPositionClasses()} ${getSizeClasses()}`}>
        <div className="w-full h-full bg-gray-700 rounded"></div>
      </div>
    );
  }

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const campaignId = adData?.id || 'ad_1';

  return (
    <AdImpressionTracker
      campaignId={campaignId}
      onImpression={() => console.log('Impression tracked')}
    >
      <div className={`relative bg-gradient-to-r from-purple-900 to-pink-900 ${getPositionClasses()}`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 p-1 bg-black/50 rounded-full hover:bg-black/70 transition"
          aria-label="Close ad"
        >
          <X className="w-3 h-3 text-white" />
        </button>

        {/* Ad content */}
        <Link href={adData?.destinationUrl || '#'} target="_blank" rel="noopener noreferrer">
          <div className={`flex items-center gap-4 p-4 ${getSizeClasses()}`}>
            {/* Ad icon/placeholder */}
            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎵</span>
            </div>

            {/* Ad text */}
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">{adData?.title}</h3>
              <p className="text-gray-300 text-xs mt-1">{adData?.description}</p>
              <span className="inline-block mt-2 text-xs text-purple-300 font-medium">
                {adData?.cta} →
              </span>
            </div>

            {/* Ad badge */}
            <div className="absolute bottom-2 left-2">
              <span className="text-[10px] text-white/40">Ad</span>
            </div>
          </div>
        </Link>
      </div>
    </AdImpressionTracker>
  );
}
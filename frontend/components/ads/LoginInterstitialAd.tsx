'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface LoginInterstitialAdProps {
  campaign: {
    id: string;
    mediaUrl: string;
    mediaType: string;
    destinationUrl: string;
    advertiser: { companyName: string };
  };
  onComplete: () => void;
  onSkip: () => void;
}

export function LoginInterstitialAd({ campaign, onComplete, onSkip }: LoginInterstitialAdProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(5);
  const [isMuted, setIsMuted] = useState(true);
  const [canSkip, setCanSkip] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Countdown timer for skip button
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Progress bar animation over 15 seconds
  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 15000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgressWidth(progress);
      
      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Auto-complete after ad duration (15 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      trackCompletion();
      onComplete();
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const trackImpression = async () => {
    try {
      await fetch(`${API_URL}/api/ad/track/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, duration: 15 })
      });
    } catch (error) {
      console.error('Track impression error:', error);
    }
  };

  const trackClick = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ad/track/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id })
      });
      const data = await response.json();
      if (data.destinationUrl) {
        window.open(data.destinationUrl, '_blank');
      }
    } catch (error) {
      console.error('Track click error:', error);
    }
  };

  const trackCompletion = async () => {
    try {
      await fetch(`${API_URL}/api/ad/track/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, duration: 15, completed: true })
      });
    } catch (error) {
      console.error('Track completion error:', error);
    }
  };

  const handleSkip = () => {
    if (canSkip) {
      onSkip();
    }
  };

  const handleAdClick = () => {
    trackClick();
  };

  useEffect(() => {
    trackImpression();
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Ad Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {campaign.mediaType === 'video' && (
          <video
            ref={videoRef}
            src={campaign.mediaUrl}
            autoPlay
            muted={isMuted}
            loop={false}
            playsInline
            className="w-full h-full object-cover"
            onClick={handleAdClick}
          />
        )}
        {campaign.mediaType === 'image' && (
          <img
            src={campaign.mediaUrl}
            alt="Advertisement"
            className="w-full h-full object-cover cursor-pointer"
            onClick={handleAdClick}
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />

        {/* Ad Info */}
        <div className="absolute bottom-8 left-4 right-4 text-center pointer-events-none">
          <p className="text-white text-lg font-semibold">Sponsored</p>
          <p className="text-gray-300 text-sm">{campaign.advertiser.companyName}</p>
          <div className="mt-2 h-1 w-24 bg-gray-600 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          disabled={!canSkip}
          className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
            canSkip ? 'bg-black/50 hover:bg-black/70 text-white' : 'bg-gray-800/50 text-gray-400 cursor-not-allowed'
          }`}
        >
          {!canSkip && <Loader2 className="w-3 h-3 animate-spin" />}
          <span className="text-sm">Skip {!canSkip && `in ${timeLeft}s`}</span>
        </button>

        {/* Mute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  );
}
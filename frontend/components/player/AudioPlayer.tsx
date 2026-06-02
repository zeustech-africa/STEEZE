'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Download, Heart, Share2 } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/UpgradeModal';

interface AudioPlayerProps {
  postId: string;
  title: string;
  artistName: string;
  audioUrl: string;
  coverArt?: string;
}

export function AudioPlayer({ postId, title, artistName, audioUrl, coverArt }: AudioPlayerProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');

  const userTier = user?.subscriptionTier;
  const canBackgroundPlay = userTier === 'basic' || userTier === 'premium' || userTier === 'gold';
  const shouldShowPreRollAd = userTier === 'free' || !userTier || userTier === 'basic';

  const [showPreRollAd, setShowPreRollAd] = useState(false);
  const [preRollAd, setPreRollAd] = useState<any>(null);
  const [adCompleted, setAdCompleted] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  const { isPlaying, duration, currentTime, canBackgroundPlay: hookCanBgPlay, play, pause, seekTo, setVolume } = useAudioPlayer({
    src: audioUrl,
    onEnded: () => console.log('Playback ended'),
    onTimeUpdate: (time) => console.log('Current time:', time),
  });

  // Fetch pre-roll ad before audio playback
  useEffect(() => {
    const fetchPreRollAd = async () => {
      if (!shouldShowPreRollAd || adCompleted || !audioStarted) return;

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/ad/placement?placement=pre_audio`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.campaign) {
          setPreRollAd(data.campaign);
          setShowPreRollAd(true);
        } else {
          setAdCompleted(true);
        }
      } catch (error) {
        console.error('Fetch pre-roll ad error:', error);
        setAdCompleted(true);
      }
    };

    fetchPreRollAd();
  }, [shouldShowPreRollAd, adCompleted, audioStarted]);

  const handleAdComplete = () => {
    setShowPreRollAd(false);
    setAdCompleted(true);
    // Start actual audio playback
    play();
  };

  // Listen for upgrade modal events
  useEffect(() => {
    const handleShowUpgradeModal = (event: CustomEvent) => {
      setUpgradeFeature(event.detail.feature);
      setShowUpgradeModal(true);
    };

    window.addEventListener('show-upgrade-modal', handleShowUpgradeModal as EventListener);
    return () => window.removeEventListener('show-upgrade-modal', handleShowUpgradeModal as EventListener);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      if (!audioStarted) {
        setAudioStarted(true);
      }
      if (!shouldShowPreRollAd || adCompleted) {
        play();
      }
      // If pre-roll ad needed, the ad fetch useEffect will handle it
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  // Pre-roll ad overlay
  if (showPreRollAd && preRollAd) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          {preRollAd.advertiser?.companyName && (
            <p className="text-white/50 text-xs uppercase tracking-wider mb-4">Advertisement</p>
          )}
          {preRollAd.mediaType === 'image' && preRollAd.mediaUrl && (
            <img
              src={preRollAd.mediaUrl}
              alt={preRollAd.advertiser?.companyName || 'Ad'}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <p className="text-white text-xl font-bold mb-2">{title}</p>
          <p className="text-gray-400 text-sm mb-2">{artistName}</p>
          {preRollAd.advertiser?.companyName && (
            <p className="text-purple-400 text-sm mb-4">Sponsored by {preRollAd.advertiser.companyName}</p>
          )}
          <div className="w-64 h-1 bg-gray-700 rounded-full mx-auto mb-4 overflow-hidden">
            <div className="w-full h-full bg-purple-500 rounded-full animate-[progress_5s_ease-in-out]" />
          </div>
          <button
            onClick={handleAdComplete}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-full text-white font-medium transition"
          >
            Listen Now
          </button>
          <p className="text-gray-500 text-xs mt-3">Audio will begin after this message</p>
        </div>
        <style jsx>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <>
        <div className="fixed bottom-20 left-0 right-0 bg-gray-900 border-t border-gray-800 p-3 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            {coverArt && (
              <img src={coverArt} alt={title} className="w-10 h-10 rounded object-cover" />
            )}
            <div>
              <p className="text-white text-sm font-medium">{title}</p>
              <p className="text-gray-400 text-xs">{artistName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handlePlayPause} className="text-white">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={() => setIsMinimized(false)} className="text-gray-400">
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={upgradeFeature}
          message="Upgrade to Basic, Premium, or Gold to enjoy background playback and many more features."
        />
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-40">
        <div className="max-w-4xl mx-auto">
          {/* Player Controls */}
          <div className="flex items-center gap-4">
            {/* Cover Art */}
            {coverArt && (
              <img src={coverArt} alt={title} className="w-14 h-14 rounded object-cover hidden sm:block" />
            )}

            {/* Track Info */}
            <div className="flex-1">
              <p className="text-white font-medium">{title}</p>
              <p className="text-gray-400 text-sm">{artistName}</p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3">
              <button onClick={handlePlayPause} className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition">
                {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
              </button>

              <button onClick={() => setIsMinimized(true)} className="text-gray-400 hover:text-white transition">
                <Minimize2 size={18} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Background Playback Indicator */}
          {!canBackgroundPlay && (
            <div className="mt-2 text-center">
              <button
                onClick={() => {
                  setUpgradeFeature('Background Playback');
                  setShowUpgradeModal(true);
                }}
                className="text-xs text-purple-400 hover:text-purple-300 underline"
              >
                ⚡ Upgrade to Basic for background playback
              </button>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
        message="Upgrade to Basic, Premium, or Gold to enjoy background playback and many more features."
      />
    </>
  );
}
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface AudioPlayerOptions {
  src: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export function useAudioPlayer({ src, autoPlay = false, onEnded, onTimeUpdate }: AudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [canBackgroundPlay, setCanBackgroundPlay] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  // Check if user can use background playback
  useEffect(() => {
    const userTier = user?.subscriptionTier;
    const canPlayBg = userTier === 'basic' || userTier === 'premium' || userTier === 'gold';
    setCanBackgroundPlay(canPlayBg);
  }, [user]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdateHandler = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };
    const onEndedHandler = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdateHandler);
    audio.addEventListener('ended', onEndedHandler);

    if (autoPlay) {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdateHandler);
      audio.removeEventListener('ended', onEndedHandler);
    };
  }, [src, autoPlay, onEnded, onTimeUpdate]);

  // Handle page visibility change (background playback lock)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isTabActive = document.visibilityState === 'visible';

      if (!isTabActive && audioRef.current && isPlaying) {
        if (!canBackgroundPlay) {
          // Non-subscriber: pause when tab loses focus
          audioRef.current.pause();
          setIsPlaying(false);

          // Show upgrade notification
          const event = new CustomEvent('show-upgrade-modal', {
            detail: {
              feature: 'Background Playback',
              message:
                'Background playback is available for Basic, Premium, and Gold subscribers. Upgrade to listen while using other apps.',
            },
          });
          window.dispatchEvent(event);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [canBackgroundPlay, isPlaying]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, volume));
    }
  }, []);

  return {
    isPlaying,
    duration,
    currentTime,
    canBackgroundPlay,
    play,
    pause,
    seekTo,
    setVolume,
  };
}
'use client';

import { useAuthStore } from '@/stores/authStore';
import { useJustVibes } from '@/hooks/useJustVibes';

export function useAdVisibility() {
  const { user, isAuthenticated } = useAuthStore();
  const { isAuthenticated: isJustVibesAuth } = useJustVibes();

  const userTier = user?.subscriptionTier;

  // Determine if user should see ads
  // Show ads only for Free VIBER (no subscription) and Just VIBES
  const showAds = (): boolean => {
    // Just VIBES users see ads
    if (isJustVibesAuth) return true;

    // Not authenticated users (shouldn't happen, but fallback)
    if (!isAuthenticated) return true;

    // Free VIBER (no subscription tier) sees ads
    if (!userTier) return true;

    // Basic, Premium, Gold subscribers do NOT see ads
    return false;
  };

  // Get ad placement positions
  const getAdPositions = (totalItems: number, interval = 5): number[] => {
    if (!showAds()) return [];

    const positions: number[] = [];
    for (let i = interval; i < totalItems; i += interval) {
      positions.push(i);
    }
    return positions;
  };

  return {
    showAds: showAds(),
    getAdPositions,
  };
}
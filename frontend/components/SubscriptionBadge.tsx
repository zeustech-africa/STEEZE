'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Sparkles, Star, Zap } from 'lucide-react';

interface SubscriptionBadgeProps {
  tier: 'free' | 'basic' | 'premium' | 'gold';
  showUpgradeLink?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const BADGE_CONFIG = {
  free: {
    label: 'FREE VIBES',
    bgColor: 'bg-gray-600',
    textColor: 'text-white',
    borderColor: 'border-gray-500',
    icon: Zap,
    upgradeLink: true
  },
  basic: {
    label: 'BASIC VIBES',
    bgColor: 'bg-amber-600',
    textColor: 'text-white',
    borderColor: 'border-amber-500',
    icon: Star,
    upgradeLink: false
  },
  premium: {
    label: 'PREMIUM VIBES',
    bgColor: 'bg-gray-400',
    textColor: 'text-black',
    borderColor: 'border-gray-300',
    icon: Sparkles,
    upgradeLink: false
  },
  gold: {
    label: 'GOLDEN VIBES',
    bgColor: 'bg-yellow-500',
    textColor: 'text-black',
    borderColor: 'border-yellow-400',
    icon: Crown,
    upgradeLink: false
  }
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-base px-4 py-1.5 gap-2'
};

const ICON_SIZES = {
  sm: 12,
  md: 14,
  lg: 16
};

export function SubscriptionBadge({ tier, showUpgradeLink = true, size = 'md' }: SubscriptionBadgeProps) {
  const config = BADGE_CONFIG[tier];
  const Icon = config.icon;
  const iconSize = ICON_SIZES[size];
  
  const badgeContent = (
    <div className={`inline-flex items-center rounded-full font-medium ${SIZE_CLASSES[size]} ${config.bgColor} ${config.textColor} ${config.borderColor} border`}>
      <Icon size={iconSize} />
      <span>{config.label}</span>
    </div>
  );
  
  if (tier === 'free' && showUpgradeLink) {
    return (
      <Link href="/settings/subscriptions" className="hover:opacity-80 transition-opacity">
        {badgeContent}
      </Link>
    );
  }
  
  return badgeContent;
}
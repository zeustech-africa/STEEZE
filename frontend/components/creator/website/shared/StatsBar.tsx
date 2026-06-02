'use client';

import React, { useEffect, useState } from 'react';
import { Users, Heart, UserPlus } from 'lucide-react';

export interface StatsData {
  followers: number;
  following: number;
  totalLikes: number;
}

interface StatsBarProps {
  stats: StatsData;
  layout?: 'horizontal' | 'vertical';
  animate?: boolean;
  showIcons?: boolean;
  iconColor?: string;
  textColor?: string;
  valueColor?: string;
  labelColor?: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onLikesClick?: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const animateNumber = (target: number, duration: number = 1000): number => {
  // This is a helper - actual animation handled in component state
  return target;
};

export function StatsBar({
  stats,
  layout = 'horizontal',
  animate = true,
  showIcons = true,
  iconColor = 'text-gold',
  textColor = 'text-white',
  valueColor = 'text-white',
  labelColor = 'text-gray-400',
  onFollowersClick,
  onFollowingClick,
  onLikesClick
}: StatsBarProps) {
  const [displayStats, setDisplayStats] = useState({
    followers: animate ? 0 : stats.followers,
    following: animate ? 0 : stats.following,
    totalLikes: animate ? 0 : stats.totalLikes
  });

  // Animate numbers on mount
  useEffect(() => {
    if (!animate) return;

    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;

    const incrementFollowers = stats.followers / steps;
    const incrementFollowing = stats.following / steps;
    const incrementLikes = stats.totalLikes / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setDisplayStats({
        followers: Math.min(Math.floor(incrementFollowers * currentStep), stats.followers),
        following: Math.min(Math.floor(incrementFollowing * currentStep), stats.following),
        totalLikes: Math.min(Math.floor(incrementLikes * currentStep), stats.totalLikes)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayStats({
          followers: stats.followers,
          following: stats.following,
          totalLikes: stats.totalLikes
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [stats, animate]);

  const statItems = [
    {
      key: 'followers',
      label: 'Followers',
      value: displayStats.followers,
      rawValue: stats.followers,
      icon: Users,
      onClick: onFollowersClick,
      href: '/followers'
    },
    {
      key: 'following',
      label: 'Following',
      value: displayStats.following,
      rawValue: stats.following,
      icon: UserPlus,
      onClick: onFollowingClick,
      href: '/following'
    },
    {
      key: 'likes',
      label: 'Likes',
      value: displayStats.totalLikes,
      rawValue: stats.totalLikes,
      icon: Heart,
      onClick: onLikesClick,
      href: '/likes'
    }
  ];

  const containerClasses = layout === 'horizontal'
    ? 'flex flex-wrap justify-around items-center gap-6 py-4'
    : 'flex flex-col items-center gap-4 py-4';

  const statItemClasses = layout === 'horizontal'
    ? 'text-center hover:scale-105 transition-transform duration-300 cursor-pointer'
    : 'text-center w-full hover:scale-105 transition-transform duration-300 cursor-pointer';

  const renderStatItem = (item: typeof statItems[0]) => {
    const Icon = item.icon;
    const formattedValue = formatNumber(item.value);
    const hasAction = item.onClick || (item.key !== 'likes'); // Default navigation for followers/following

    const content = (
      <>
        <div className="flex items-center justify-center gap-2">
          {showIcons && (
            <div className={`${iconColor} ${layout === 'horizontal' ? '' : 'mb-1'}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <span className={`text-2xl md:text-3xl font-bold ${valueColor}`}>
            {formattedValue}
          </span>
        </div>
        <p className={`text-xs md:text-sm ${labelColor} mt-1`}>
          {item.label}
        </p>
      </>
    );

    if (hasAction) {
      return (
        <button
          key={item.key}
          onClick={item.onClick}
          className={statItemClasses}
          aria-label={`View ${item.label}`}
        >
          {content}
        </button>
      );
    }

    return (
      <div key={item.key} className={statItemClasses}>
        {content}
      </div>
    );
  };

  // Don't render if all stats are zero (and not animating)
  if (stats.followers === 0 && stats.following === 0 && stats.totalLikes === 0 && !animate) {
    return null;
  }

  return (
    <div className={`w-full border-y border-white/10 ${textColor}`}>
      <div className="container mx-auto px-4">
        <div className={containerClasses}>
          {statItems.map(renderStatItem)}
        </div>
      </div>
    </div>
  );
}
'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
  animate = true 
}: SkeletonProps) {
  const baseClasses = 'bg-gray-800 rounded';
  const animateClass = animate ? 'animate-pulse' : '';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animateClass} ${className}`}
      style={style}
    />
  );
}

// Feed Card Skeleton
export function FeedCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden mb-6">
      <div className="relative bg-black">
        <Skeleton variant="rectangular" height={300} width="100%" />
      </div>
      <div className="p-4">
        <div className="flex gap-2 mb-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1">
            <Skeleton width="60%" height={16} className="mb-2" />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
        <Skeleton width="80%" height={14} className="mb-2" />
        <Skeleton width="50%" height={14} />
      </div>
    </div>
  );
}

// Profile Header Skeleton
export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="flex-1">
          <Skeleton width="60%" height={24} className="mb-2" />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton width="90%" height={14} className="mb-2" />
        <Skeleton width="70%" height={14} />
      </div>
    </div>
  );
}

// Search Result Skeleton
export function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton width="60%" height={16} className="mb-2" />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
  );
}

export default Skeleton;
'use client';

import React from 'react';
import Image from 'next/image';

export interface AsymmetricGridItem {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  link?: string;
  onClick?: () => void;
  size?: 'large' | 'medium' | 'small';
  metadata?: {
    views?: number;
    likes?: number;
    comments?: number;
    duration?: string;
  };
}

interface AsymmetricGridProps {
  items: AsymmetricGridItem[];
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  gap?: string;
  itemClassName?: string;
  onItemClick?: (item: AsymmetricGridItem) => void;
  renderCustomContent?: (item: AsymmetricGridItem) => React.ReactNode;
}

export function AsymmetricGrid({
  items,
  title,
  subtitle,
  columns = 3,
  gap = 'gap-4',
  itemClassName = '',
  onItemClick,
  renderCustomContent
}: AsymmetricGridProps) {
  // For asymmetric layout, first item is featured (larger)
  const featuredItem = items[0];
  const remainingItems = items.slice(1);

  const handleItemClick = (item: AsymmetricGridItem) => {
    if (onItemClick) {
      onItemClick(item);
    } else if (item.link) {
      window.open(item.link, '_blank');
    } else if (item.onClick) {
      item.onClick();
    }
  };

  const renderMedia = (item: AsymmetricGridItem, isFeatured: boolean = false) => {
    const className = isFeatured 
      ? 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
      : 'w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500';

    if (item.mediaType === 'video' && item.videoUrl) {
      return (
        <video
          src={item.videoUrl}
          className={className}
          muted
          loop
          playsInline
        />
      );
    }
    
    if (item.imageUrl) {
      return (
        <Image
          src={item.imageUrl}
          alt={item.title || 'Grid item'}
          fill={isFeatured}
          width={!isFeatured ? 400 : undefined}
          height={!isFeatured ? 300 : undefined}
          className={className}
        />
      );
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
        <span className="text-white/40 text-sm">No media</span>
      </div>
    );
  };

  const renderContent = (item: AsymmetricGridItem) => {
    if (renderCustomContent) {
      return renderCustomContent(item);
    }

    return (
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        {item.title && (
          <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">
            {item.title}
          </h3>
        )}
        {item.description && (
          <p className="text-white/70 text-sm line-clamp-2">
            {item.description}
          </p>
        )}
        {item.metadata && (
          <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
            {item.metadata.views !== undefined && <span>👁 {item.metadata.views.toLocaleString()}</span>}
            {item.metadata.likes !== undefined && <span>❤️ {item.metadata.likes.toLocaleString()}</span>}
            {item.metadata.comments !== undefined && <span>💬 {item.metadata.comments}</span>}
            {item.metadata.duration && <span>⏱ {item.metadata.duration}</span>}
          </div>
        )}
      </div>
    );
  };

  // Determine grid columns class
  const gridColsClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-4'
  }[columns];

  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {subtitle && (
              <p className="text-gold uppercase tracking-wider text-sm mb-2">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* Asymmetric Grid */}
        {items.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            No items to display
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured Item - Large */}
            {featuredItem && (
              <div
                onClick={() => handleItemClick(featuredItem)}
                className={`relative rounded-xl overflow-hidden cursor-pointer group ${itemClassName}`}
              >
                <div className="aspect-video md:aspect-[21/9] relative">
                  {renderMedia(featuredItem, true)}
                </div>
                {renderContent(featuredItem)}
              </div>
            )}

            {/* Remaining Items Grid */}
            {remainingItems.length > 0 && (
              <div className={`grid ${gridColsClass} ${gap}`}>
                {remainingItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer group ${itemClassName}`}
                  >
                    {renderMedia(item, false)}
                    {renderContent(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
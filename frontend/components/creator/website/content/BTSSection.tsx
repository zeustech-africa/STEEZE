'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Calendar, Eye, ChevronDown, ChevronUp } from 'lucide-react';

export interface BTSItem {
  id: string;
  title: string;
  description: string;
  date: string;
  likes?: number;
  comments?: number;
  views?: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

interface BTSSectionProps {
  items: BTSItem[];
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'list';
  columns?: 2 | 3 | 4;
  showMetadata?: boolean;
  maxItems?: number;
  onLike?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
}

export function BTSSection({
  items,
  title,
  subtitle,
  layout = 'grid',
  columns = 3,
  showMetadata = true,
  maxItems,
  onLike,
  onComment
}: BTSSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Limit items if maxItems specified
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  // Grid columns class
  const gridColsClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[columns];

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isExpanded = (itemId: string) => expandedItems.has(itemId);

  const truncateDescription = (description: string, maxLength: number = 120) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  if (displayItems.length === 0) {
    return null;
  }

  // Grid Layout
  const renderGrid = () => (
    <div className={`grid ${gridColsClass} gap-6`}>
      {displayItems.map((item) => {
        const expanded = isExpanded(item.id);
        const displayDescription = expanded ? item.description : truncateDescription(item.description);
        
        return (
          <div
            key={item.id}
            className="group bg-gray-900 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {/* Media (Image/Video) */}
            {item.mediaUrl && (
              <div className="relative aspect-video overflow-hidden">
                {item.mediaType === 'video' ? (
                  <video
                    src={item.mediaUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    controls={false}
                    muted
                  />
                ) : (
                  <Image
                    src={item.mediaUrl}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {/* Play icon overlay for videos */}
                {item.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center">
                      <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {/* Date */}
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(item.date)}</span>
                {item.views !== undefined && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <Eye className="w-3 h-3" />
                    <span>{formatNumber(item.views)}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed">
                {displayDescription}
              </p>

              {/* Read More button */}
              {item.description.length > 120 && (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="flex items-center gap-1 text-gold text-xs mt-2 hover:text-gold-dark transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Read More
                    </>
                  )}
                </button>
              )}

              {/* Metadata (Likes, Comments) */}
              {showMetadata && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => onLike?.(item.id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors text-xs"
                  >
                    <Heart className="w-3 h-3" />
                    {formatNumber(item.likes)}
                  </button>
                  <button
                    onClick={() => onComment?.(item.id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors text-xs"
                  >
                    <MessageCircle className="w-3 h-3" />
                    {formatNumber(item.comments)}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // List Layout
  const renderList = () => (
    <div className="space-y-4">
      {displayItems.map((item) => {
        const expanded = isExpanded(item.id);
        const displayDescription = expanded ? item.description : truncateDescription(item.description, 200);
        
        return (
          <div
            key={item.id}
            className="bg-gray-900 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row">
              {/* Media (Image/Video) - smaller on list view */}
              {item.mediaUrl && (
                <div className="relative w-full md:w-48 h-48 flex-shrink-0 overflow-hidden">
                  {item.mediaType === 'video' ? (
                    <video
                      src={item.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <Image
                      src={item.mediaUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(item.date)}</span>
                  {item.views !== undefined && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <Eye className="w-3 h-3" />
                      <span>{formatNumber(item.views)}</span>
                    </>
                  )}
                </div>

                <h3 className="text-white font-bold text-lg mb-2">
                  {item.title}
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed">
                  {displayDescription}
                </p>

                {item.description.length > 200 && (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="flex items-center gap-1 text-gold text-xs mt-2 hover:text-gold-dark transition-colors"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Read More
                      </>
                    )}
                  </button>
                )}

                {showMetadata && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => onLike?.(item.id)}
                      className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors text-xs"
                    >
                      <Heart className="w-3 h-3" />
                      {formatNumber(item.likes)}
                    </button>
                    <button
                      onClick={() => onComment?.(item.id)}
                      className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors text-xs"
                    >
                      <MessageCircle className="w-3 h-3" />
                      {formatNumber(item.comments)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

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

        {/* BTS Content */}
        {layout === 'list' ? renderList() : renderGrid()}

        {/* View All Link */}
        {maxItems && items.length > maxItems && (
          <div className="text-center mt-8">
            <button className="text-gold hover:text-gold-dark transition-colors text-sm font-medium">
              View All Behind The Scenes →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  story?: string;
  likes?: number;
  comments?: number;
  createdAt?: string;
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'masonry';
  columns?: 2 | 3 | 4;
  showMetadata?: boolean;
  onLike?: (photoId: string) => void;
  onComment?: (photoId: string) => void;
}

export function PhotoGallery({
  photos,
  title,
  subtitle,
  layout = 'grid',
  columns = 3,
  showMetadata = true,
  onLike,
  onComment
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Grid columns class
  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }[columns];

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const openLightbox = (photo: GalleryPhoto, index: number) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    document.body.style.overflow = 'unset';
  };

  const goToPrevious = () => {
    const newIndex = currentIndex - 1;
    if (newIndex >= 0) {
      setCurrentIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const goToNext = () => {
    const newIndex = currentIndex + 1;
    if (newIndex < photos.length) {
      setCurrentIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, currentIndex]);

  if (photos.length === 0) {
    return null;
  }

  // Masonry layout uses columns with space-y
  const renderMasonry = () => {
    const columnCount = columns;
    const columnArrays: GalleryPhoto[][] = Array(columnCount).fill(null).map(() => []);
    
    photos.forEach((photo, index) => {
      const columnIndex = index % columnCount;
      columnArrays[columnIndex].push(photo);
    });

    return (
      <div className={`flex gap-6`}>
        {columnArrays.map((column, colIdx) => (
          <div key={colIdx} className="flex-1 space-y-6">
            {column.map((photo) => (
              <div
                key={photo.id}
                onClick={() => openLightbox(photo, photos.findIndex(p => p.id === photo.id))}
                className="group cursor-pointer relative overflow-hidden rounded-xl"
              >
                <div className="relative w-full">
                  <Image
                    src={photo.imageUrl}
                    alt="Gallery"
                    width={400}
                    height={500}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-center">
                      {showMetadata && (
                        <div className="flex items-center justify-center gap-4 text-white">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" /> {formatNumber(photo.likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" /> {formatNumber(photo.comments)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {photo.story && (
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">{photo.story}</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Grid layout
  const renderGrid = () => (
    <div className={`grid ${gridColsClass} gap-6`}>
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          onClick={() => openLightbox(photo, index)}
          className="group cursor-pointer"
        >
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-900">
            <Image
              src={photo.imageUrl}
              alt="Gallery"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              {showMetadata && (
                <div className="flex items-center gap-4 text-white">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" /> {formatNumber(photo.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" /> {formatNumber(photo.comments)}
                  </span>
                </div>
              )}
            </div>
          </div>
          {photo.story && (
            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{photo.story}</p>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
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

          {/* Gallery */}
          {layout === 'masonry' ? renderMasonry() : renderGrid()}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {currentIndex < photos.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={selectedPhoto.imageUrl}
              alt="Gallery"
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {/* Caption/Story */}
            {selectedPhoto.story && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white text-sm">{selectedPhoto.story}</p>
                {showMetadata && (
                  <div className="flex items-center gap-4 mt-2 text-white/70 text-xs">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {formatNumber(selectedPhoto.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {formatNumber(selectedPhoto.comments)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselItem {
  id: string;
  content: React.ReactNode;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number; // milliseconds
  showDots?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  onItemChange?: (index: number) => void;
}

export function Carousel({
  items,
  autoPlay = false,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  loop = true,
  onItemChange
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const totalItems = items.length;

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    if (currentIndex === totalItems - 1) {
      if (loop) {
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex(currentIndex + 1);
    }
    onItemChange?.(currentIndex === totalItems - 1 ? 0 : currentIndex + 1);
    
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentIndex, totalItems, loop, isTransitioning, onItemChange]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    if (currentIndex === 0) {
      if (loop) {
        setCurrentIndex(totalItems - 1);
      }
    } else {
      setCurrentIndex(currentIndex - 1);
    }
    onItemChange?.(currentIndex === 0 ? totalItems - 1 : currentIndex - 1);
    
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentIndex, totalItems, loop, isTransitioning, onItemChange]);

  const goToIndex = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    onItemChange?.(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay || totalItems <= 1) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, goToNext, totalItems]);

  if (totalItems === 0) {
    return null;
  }

  if (totalItems === 1) {
    return <div className="w-full">{items[0].content}</div>;
  }

  return (
    <div className="relative w-full group">
      {/* Carousel Container */}
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item) => (
            <div key={item.id} className="w-full flex-shrink-0">
              {item.content}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {showDots && totalItems > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-gold w-4'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
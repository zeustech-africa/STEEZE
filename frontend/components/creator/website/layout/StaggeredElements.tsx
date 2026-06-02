'use client';

import { ReactNode } from 'react';

interface StaggeredItem {
  id: string;
  content: ReactNode;
  span?: number; // Optional: how many columns this item spans
  offset?: number; // Optional: custom vertical offset in pixels
}

interface StaggeredElementsProps {
  items: StaggeredItem[];
  columns?: 2 | 3 | 4;
  staggerAmount?: number; // Vertical offset in pixels between items
  overlap?: boolean; // Enable negative margins for overlapping effect
  className?: string;
  itemClassName?: string;
}

export default function StaggeredElements({
  items,
  columns = 3,
  staggerAmount = 40,
  overlap = false,
  className = '',
  itemClassName = ''
}: StaggeredElementsProps) {
  // Calculate column classes based on columns prop
  const columnClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4'
  };

  // Calculate overlap margin (negative for overlap, positive for spacing)
  const overlapMargin = overlap ? '-mt-8' : 'mt-0';

  return (
    <div className={`w-full py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className={`grid grid-cols-1 ${columnClasses[columns]} gap-6`}>
          {items.map((item, index) => {
            // Calculate vertical offset based on index and stagger amount
            const verticalOffset = overlap 
              ? `-mt-${Math.min(staggerAmount / 8, 8)}` 
              : `mt-${Math.min((index % columns) * (staggerAmount / 8), 8)}`;
            
            // Calculate column span
            const spanClass = item.span 
              ? `md:col-span-${item.span}` 
              : 'md:col-span-1';
            
            // Custom offset if provided
            const customOffset = item.offset 
              ? { marginTop: `${item.offset}px` }
              : {};

            return (
              <div
                key={item.id}
                className={`
                  ${spanClass}
                  ${overlap ? overlapMargin : verticalOffset}
                  transition-all duration-300 hover:scale-105
                  ${itemClassName}
                `}
                style={customOffset}
              >
                {item.content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
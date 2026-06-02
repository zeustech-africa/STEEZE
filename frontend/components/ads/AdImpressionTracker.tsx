'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AdImpressionTrackerProps {
  campaignId: string;
  children: React.ReactNode;
  onImpression?: () => void;
  onVisible?: () => void;
}

export function AdImpressionTracker({ campaignId, children, onImpression, onVisible }: AdImpressionTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasImpression, setHasImpression] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Track impression when ad is visible for sufficient duration
  useEffect(() => {
    if (!containerRef.current) return;

    const trackImpression = async () => {
      if (hasImpression) return;

      const duration = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
      if (duration >= 1.5) { // 1.5 seconds minimum visibility
        setHasImpression(true);
        onImpression?.();

        try {
          await fetch(`${API_URL}/api/ad/track/impression`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId, duration: Math.floor(duration) })
          });
        } catch (error) {
          console.error('Failed to track impression:', error);
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasImpression) {
            // Ad became visible - start timer
            if (!startTimeRef.current) {
              startTimeRef.current = Date.now();
              onVisible?.();
            }

            // Set timeout to track impression after 1.5 seconds
            const timeoutId = setTimeout(() => {
              if (startTimeRef.current && (Date.now() - startTimeRef.current) / 1000 >= 1.5) {
                trackImpression();
              }
            }, 1500);

            return () => clearTimeout(timeoutId);
          } else if (!entry.isIntersecting && startTimeRef.current) {
            // Ad no longer visible - check if enough time passed
            const duration = (Date.now() - startTimeRef.current) / 1000;
            if (duration >= 1.5 && !hasImpression) {
              trackImpression();
            }
            startTimeRef.current = null;
          }
        });
      },
      { threshold: 0.5 } // 50% visible to count
    );

    observer.observe(containerRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [campaignId, hasImpression, onImpression, onVisible]);

  // Track click
  const handleClick = async (e: React.MouseEvent) => {
    if (hasClicked) return;
    setHasClicked(true);

    try {
      await fetch(`${API_URL}/api/ad/track/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  return (
    <div ref={containerRef} onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}
'use client';

import React from 'react';

interface AnimatedMarqueeProps {
  text: string;
  speed?: number; // seconds for one complete scroll
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  gap?: string;
}

export function AnimatedMarquee({
  text,
  speed = 20,
  backgroundColor = 'bg-gold',
  textColor = 'text-black',
  fontSize = 'text-base',
  fontWeight = 'font-bold',
  gap = 'gap-8'
}: AnimatedMarqueeProps) {
  // Repeat the text enough times to create seamless loop
  const repeatCount = 10;
  const repeatedText = Array(repeatCount).fill(text).join(' • ');

  return (
    <div className={`w-full overflow-hidden whitespace-nowrap ${backgroundColor} py-3`}>
      <div
        className={`inline-flex ${gap} ${fontSize} ${fontWeight} ${textColor} uppercase tracking-wider animate-marquee`}
        style={{
          animation: `marquee ${speed}s linear infinite`,
        }}
      >
        <span>{repeatedText}</span>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
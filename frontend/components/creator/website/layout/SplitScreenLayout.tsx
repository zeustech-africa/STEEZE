'use client';

import React from 'react';
import Image from 'next/image';

interface SplitScreenLayoutProps {
  // Image/Media side
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaAlt?: string;
  // Text side
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonOnClick?: () => void;
  // Layout options
  imagePosition?: 'left' | 'right';
  // Styling
  backgroundColor?: string;
  textColor?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  // Children for custom content
  children?: React.ReactNode;
}

export function SplitScreenLayout({
  mediaUrl,
  mediaType = 'image',
  mediaAlt = 'Split screen media',
  title,
  subtitle,
  description,
  buttonText,
  buttonLink,
  buttonOnClick,
  imagePosition = 'left',
  backgroundColor = 'bg-black',
  textColor = 'text-white',
  titleClassName = 'text-3xl md:text-4xl lg:text-5xl font-bold mb-4',
  descriptionClassName = 'text-gray-300 leading-relaxed',
  children
}: SplitScreenLayoutProps) {
  
  const MediaSection = () => (
    <div className="relative h-64 md:h-full min-h-[300px] overflow-hidden">
      {mediaType === 'video' && mediaUrl ? (
        <video
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : mediaUrl ? (
        <Image
          src={mediaUrl}
          alt={mediaAlt}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
          <span className="text-white/50">No media provided</span>
        </div>
      )}
    </div>
  );

  const TextSection = () => (
    <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
      {subtitle && (
        <p className="text-gold uppercase tracking-wider text-sm mb-2">
          {subtitle}
        </p>
      )}
      {title && (
        <h2 className={titleClassName} style={{ color: textColor !== 'text-white' ? undefined : undefined }}>
          {title}
        </h2>
      )}
      {description && (
        <div className={`mt-4 space-y-4 ${descriptionClassName}`}>
          {description.split('\n').map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      )}
      {children}
      {(buttonText && (buttonLink || buttonOnClick)) && (
        <div className="mt-8">
          {buttonLink ? (
            <a
              href={buttonLink}
              className="inline-block px-6 py-3 bg-gold text-black font-bold rounded-full hover:bg-gold-dark transition-colors"
            >
              {buttonText}
            </a>
          ) : (
            <button
              onClick={buttonOnClick}
                className="inline-block px-6 py-3 bg-gold text-black font-bold rounded-full hover:bg-gold-dark transition-colors"
              >
                {buttonText}
              </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className={`w-full ${backgroundColor}`}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
          {imagePosition === 'left' ? (
            <>
              <MediaSection />
              <TextSection />
            </>
          ) : (
            <>
              <TextSection />
              <MediaSection />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
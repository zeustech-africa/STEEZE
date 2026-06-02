'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface FullscreenHeroProps {
  // Background media
  backgroundVideo?: string;
  backgroundImage?: string;
  backgroundOverlay?: string; // Tailwind class for overlay (e.g., 'bg-black/50')
  
  // Profile picture (optional)
  profilePicUrl?: string;
  buttonStyle?: string;
  
  // Text content
  title?: string;
  tagline?: string;
  shortBio?: string;
  
  // Buttons
  primaryButtonText?: string;
  primaryButtonLink?: string;
  primaryButtonOnClick?: () => void;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  secondaryButtonOnClick?: () => void;
  
  // Layout options
  contentAlignment?: 'center' | 'left' | 'right';
  titleClassName?: string;
  taglineClassName?: string;
  
  // Animation
  animateText?: boolean;
  showScrollIndicator?: boolean;
  
  // Additional content
  children?: React.ReactNode;
}

export function FullscreenHero({
  backgroundVideo,
  backgroundImage,
  backgroundOverlay = 'bg-black/40',
  profilePicUrl,
  buttonStyle,
  title,
  tagline,
  shortBio,
  primaryButtonText,
  primaryButtonLink,
  primaryButtonOnClick,
  secondaryButtonText,
  secondaryButtonLink,
  secondaryButtonOnClick,
  contentAlignment = 'center',
  titleClassName = 'text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4',
  taglineClassName = 'text-gold text-xl md:text-2xl mb-4',
  animateText = true,
  showScrollIndicator = true,
  children
}: FullscreenHeroProps) {
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const bioRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Animation on mount
  useEffect(() => {
    if (!animateText) return;
    
    const elements = [titleRef.current, taglineRef.current, bioRef.current, buttonRef.current];
    elements.forEach((el, index) => {
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
          if (el) {
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }
        }, 100 * index);
      }
    });
  }, [animateText]);

  // Alignment classes
  const alignmentClasses = {
    center: 'text-center items-center',
    left: 'text-left items-start',
    right: 'text-right items-end'
  }[contentAlignment];

  const handlePrimaryClick = () => {
    if (primaryButtonOnClick) {
      primaryButtonOnClick();
    } else if (primaryButtonLink) {
      window.location.href = primaryButtonLink;
    }
  };

  const handleSecondaryClick = () => {
    if (secondaryButtonOnClick) {
      secondaryButtonOnClick();
    } else if (secondaryButtonLink) {
      window.location.href = secondaryButtonLink;
    }
  };

  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Media */}
      {backgroundVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={backgroundVideo}
        />
      ) : backgroundImage ? (
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={backgroundImage}
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {/* Overlay */}
      <div className={`absolute inset-0 ${backgroundOverlay}`} />

      {/* Content */}
      <div className={`relative z-10 container mx-auto px-4 py-20 flex flex-col justify-center min-h-screen ${alignmentClasses}`}>
        {/* Profile Picture (Optional) */}
        {profilePicUrl && (
          <div className={`mb-6 ${contentAlignment === 'center' ? 'flex justify-center' : ''}`}>
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-gold">
              <Image
                src={profilePicUrl}
                alt={`Profile photo of ${title || 'creator'}`}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Tagline */}
        {tagline && (
          <p ref={taglineRef} className={taglineClassName}>
            {tagline}
          </p>
        )}

        {/* Title */}
        {title && (
          <h1 ref={titleRef} className={titleClassName}>
            {title}
          </h1>
        )}

        {/* Short Bio */}
        {shortBio && (
          <p ref={bioRef} className="text-white/80 text-lg md:text-xl max-w-2xl mb-8">
            {shortBio}
          </p>
        )}

        {/* Custom Children */}
        {children}

        {/* CTA Buttons */}
        {(primaryButtonText || secondaryButtonText) && (
          <div ref={buttonRef} className={`flex flex-wrap gap-4 mt-4 ${contentAlignment === 'center' ? 'justify-center' : contentAlignment === 'right' ? 'justify-end' : 'justify-start'}`}>
            {primaryButtonText && (
              <button
                onClick={handlePrimaryClick}
                className={buttonStyle || "px-8 py-3 bg-gold text-black font-bold rounded-full hover:bg-gold-dark transition-colors focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"}
                aria-label={`${primaryButtonText} ${title || ''}`}
              >
                {primaryButtonText}
              </button>
            )}
            {secondaryButtonText && (
              <button
                onClick={handleSecondaryClick}
                className="px-8 py-3 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
                aria-label={`${secondaryButtonText} ${title || ''}`}
              >
                {secondaryButtonText}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <button
          onClick={scrollToNextSection}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce cursor-pointer focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-8 h-8 text-white/70 hover:text-gold transition-colors" />
        </button>
      )}
    </section>
  );
}
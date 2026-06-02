'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import SocialLinks from './SocialLinks';

interface FooterProps {
  artistName: string;
  templateId: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
    appleMusic?: string;
    website?: string;
  };
  theme?: {
    borderColor?: string;
    accentColor?: string;
  };
}

const templateDisplayNames: Record<string, string> = {
  icon: 'ICON',
  rebel: 'REBEL',
  diva: 'DIVA',
  visionary: 'VISIONARY',
  pure: 'PURE',
  spectrum: 'SPECTRUM',
  luminary: 'LUMINARY',
};

const navigationLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
  { label: 'About', href: '/about' },
];

export default function Footer({ 
  artistName, 
  templateId, 
  socialLinks, 
  theme = {} 
}: FooterProps) {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { borderColor = 'border-gray-800', accentColor = 'text-gold' } = theme;
  const templateName = templateDisplayNames[templateId] || 'ICON';
  const currentYear = new Date().getFullYear();
  const displayName = artistName || 'Creator';

  // Check if social links exist and have any values
  const hasSocialLinks = socialLinks && Object.values(socialLinks).some(link => link && link.trim() !== '');

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Error boundary - if something fails, return null (footer doesn't render)
  if (hasError) {
    return null;
  }

  try {
    return (
      <>
        <footer className={`w-full border-t ${borderColor} py-8 md:py-12`}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {/* Desktop Layout (row) */}
            <div className="hidden md:flex md:justify-between md:items-center">
              {/* Copyright */}
              <div className="text-sm text-gray-400">
                © {currentYear} {displayName} · {templateName} STEEZE
              </div>

              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                {navigationLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`text-sm text-gray-400 ${accentColor} transition-colors hover:opacity-80 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Social Links */}
              {hasSocialLinks && (
                <div>
                  <SocialLinks links={socialLinks} variant="icons" showLabels={false} />
                </div>
              )}
            </div>

            {/* Mobile Layout (stacked vertically) */}
            <div className="flex flex-col items-center space-y-4 md:hidden">
              {/* Copyright */}
              <div className="text-sm text-gray-400 text-center">
                © {currentYear} {displayName} · {templateName} STEEZE
              </div>

              {/* Navigation Links */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {navigationLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`text-sm text-gray-400 ${accentColor} transition-colors hover:opacity-80 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Social Links */}
              {hasSocialLinks && (
                <div>
                  <SocialLinks links={socialLinks} variant="icons" showLabels={false} />
                </div>
              )}
            </div>
          </div>
        </footer>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 bg-gold rounded-full shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5 text-black" />
          </button>
        )}
      </>
    );
  } catch (error) {
    console.error('Footer failed to render:', error);
    setHasError(true);
    return null;
  }
}
"use client";

import { useState, useEffect } from "react";

export default function SkipToContent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsVisible(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSkip = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  };

  if (!isVisible) return null;

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="fixed top-4 left-4 z-50 px-4 py-2 bg-gold text-black rounded-md font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-black"
      onBlur={() => setIsVisible(false)}
    >
      Skip to main content
    </a>
  );
}
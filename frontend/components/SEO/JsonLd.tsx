'use client';

import { useEffect } from 'react';

interface JsonLdProps {
  data: Record<string, any>;
}

export default function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    // Remove any existing JSON-LD script tags to avoid duplicates
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add new JSON-LD script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [data]);

  return null;
}
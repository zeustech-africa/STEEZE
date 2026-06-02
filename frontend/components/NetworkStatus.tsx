'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOffline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-600 text-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You are offline</span>
    </div>
  );
}
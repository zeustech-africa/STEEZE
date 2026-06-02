'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}
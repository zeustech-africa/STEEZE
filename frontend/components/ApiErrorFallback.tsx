'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ApiErrorFallbackProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ApiErrorFallback({ error, onRetry, onDismiss }: ApiErrorFallbackProps) {
  return (
    <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-1">
            Please check your connection and try again.
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400 text-sm transition"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
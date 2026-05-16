"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
          <WifiOff className="text-gold" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">You're Offline</h1>
        <p className="text-white/60 mb-6">
          Please check your internet connection and try again.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-gold text-black rounded-full font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> Retry
          </button>
          <Link
            href="/"
            className="block w-full py-3 border border-white/30 text-white rounded-full text-center hover:border-gold transition-all"
          >
            <Home size={18} className="inline mr-2" /> Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
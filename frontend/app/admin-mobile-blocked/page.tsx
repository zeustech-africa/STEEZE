"use client";

import Link from "next/link";
import { Monitor, Shield } from "lucide-react";

export default function AdminMobileBlocked() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <Monitor className="text-red-500" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Admin Access Restricted
        </h1>
        <p className="text-white/60 mb-4">
          The Admin Control Room is only accessible on desktop/laptop for
          security reasons.
        </p>
        <p className="text-white/40 text-sm mb-6">
          Please use a computer with a larger screen to access the admin
          dashboard.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-gold text-black rounded-full"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
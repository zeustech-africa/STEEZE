"use client";

import Link from "next/link";
import { Shield, Users, Sparkles, Crown } from "lucide-react";

export default function MobileHero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-black to-gold/5">
      {/* No video on mobile – just gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent" />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 mb-6">
          <Crown className="text-gold" size={14} />
          <span className="text-gold text-xs">Powered by ZeusLiveStudio</span>
        </div>

        <h1 className="text-3xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-gold to-gold-dark bg-clip-text text-transparent">
            You want style, entertainment,
          </span>
          <br />
          <span className="text-white">you want music... you need STEEZE.</span>
        </h1>

        <p className="text-white/60 text-sm md:text-base mb-6 max-w-md mx-auto">
          No politics. No news. No violence. Just pure entertainment.
        </p>

        <div className="flex gap-2 justify-center flex-wrap">
          <div className="flex items-center gap-1 text-white/50 text-xs">
            <Shield size={12} /> No fake accounts
          </div>
          <div className="flex items-center gap-1 text-white/50 text-xs">
            <Users size={12} /> Verified only
          </div>
          <div className="flex items-center gap-1 text-white/50 text-xs">
            <Sparkles size={12} /> Entertainment only
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/signup/creator"
            className="px-6 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-full text-sm"
          >
            Join as Creator
          </Link>
          <Link
            href="/signup/vibes"
            className="px-6 py-2.5 border border-neon-blue text-neon-blue font-semibold rounded-full text-sm"
          >
            Join as VIBES
          </Link>
        </div>
      </div>
    </section>
  );
}
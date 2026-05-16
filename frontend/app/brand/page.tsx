"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";
import Image from "next/image";
import { Download, Palette, Type } from "lucide-react";

export default function BrandPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24">
        <div className="max-w-4xl mx-auto px-4">
          <BackToHomeButton />
        </div>
        {/* Hero */}
        <section className="relative py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                Brand Center
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              STEEZE brand assets, guidelines, and usage rules.
            </p>
          </div>
        </section>

        {/* Logo Downloads */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Download className="text-gold" size={28} />
                <h2 className="text-2xl font-bold text-gold">Logo Downloads</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="glass p-6 rounded-xl text-center">
                  <Image
                    src="/icons/steeze-logo-horizontal.png"
                    alt="STEEZE Horizontal Logo"
                    width={240}
                    height={69}
                    className="mx-auto mb-4 object-contain"
                  />
                  <p className="text-white text-sm mb-2">Horizontal Logo</p>
                  <p className="text-white/40 text-xs">
                    Primary logo for light/dark backgrounds
                  </p>
                  <a
                    href="/icons/steeze-logo-horizontal.png"
                    download
                    className="inline-block mt-4 px-4 py-2 text-xs border border-gold/30 text-gold rounded-full hover:bg-gold/10 transition-colors"
                  >
                    Download PNG
                  </a>
                </div>
                <div className="glass p-6 rounded-xl text-center">
                  <Image
                    src="/icons/steeze-icon-square.png"
                    alt="STEEZE Square Icon"
                    width={120}
                    height={120}
                    className="mx-auto mb-4 object-contain rounded-2xl"
                  />
                  <p className="text-white text-sm mb-2">Square Icon</p>
                  <p className="text-white/40 text-xs">
                    App icon, favicon, and social media avatar
                  </p>
                  <a
                    href="/icons/steeze-icon-square.png"
                    download
                    className="inline-block mt-4 px-4 py-2 text-xs border border-gold/30 text-gold rounded-full hover:bg-gold/10 transition-colors"
                  >
                    Download PNG
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="text-gold" size={28} />
                <h2 className="text-2xl font-bold text-gold">Color Palette</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-full h-24 rounded-xl mb-3" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }} />
                  <p className="text-white font-semibold">Gold</p>
                  <p className="text-white/50 text-sm">#FFD700</p>
                  <p className="text-white/50 text-sm">Primary accent</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-24 rounded-xl mb-3 bg-[#00A3FF]" />
                  <p className="text-white font-semibold">Neon Blue</p>
                  <p className="text-white/50 text-sm">#00A3FF</p>
                  <p className="text-white/50 text-sm">Secondary accent</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-24 rounded-xl mb-3 bg-[#0A0A0A] border border-white/20" />
                  <p className="text-white font-semibold">Dark</p>
                  <p className="text-white/50 text-sm">#0A0A0A</p>
                  <p className="text-white/50 text-sm">Background</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Type className="text-gold" size={28} />
                <h2 className="text-2xl font-bold text-gold">Typography</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-white/40 text-xs mb-1">Headings</p>
                  <p className="text-white text-3xl font-bold font-[family-name:var(--font-geist-sans)]">
                    Geist Sans Bold
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Body</p>
                  <p className="text-white text-lg font-[family-name:var(--font-geist-sans)]">
                    Geist Sans Regular
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Code / Monospace</p>
                  <p className="text-neon-blue text-lg font-[family-name:var(--font-geist-mono)]">
                    Geist Mono
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Usage Rules */}
        <section className="py-16 px-4 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gold mb-6">Brand Usage Rules</h2>
              <div className="space-y-4 text-white/70">
                <div className="flex items-start gap-3">
                  <span className="text-gold mt-1">✓</span>
                  <p>Use the STEEZE logo as provided—do not stretch, rotate, or alter proportions.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gold mt-1">✓</span>
                  <p>Maintain clear space around the logo equal to the height of the "S" in STEEZE.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gold mt-1">✓</span>
                  <p>Use gold (#FFD700) or white logo variants on dark backgrounds.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <p>Do not use the STEEZE logo to imply endorsement without written permission.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <p>Do not modify, recolor (other than gold/white), or overlay the logo on busy backgrounds.</p>
                </div>
              </div>
              <div className="mt-8 p-4 glass rounded-xl">
                <p className="text-white/50 text-sm">
                  For press inquiries, partnership branding, or commercial use of STEEZE brand assets,
                  contact{" "}
                  <a href="mailto:support@steeze.com" className="text-gold hover:underline">
                    support@steeze.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
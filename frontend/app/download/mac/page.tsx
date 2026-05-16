"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Monitor, Laptop } from "lucide-react";

export default function MacDownloadPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24">
        <section className="relative py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <Monitor className="mx-auto text-gold mb-4" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                STEEZE for Mac & PC
              </span>
            </h1>
            <p className="text-white/60 text-lg">Use STEEZE on your desktop or laptop computer.</p>
          </div>
        </section>

        <section className="py-16 px-4 pb-24">
          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-8 md:p-12 text-center">
              <Laptop className="mx-auto text-gold mb-6" size={64} />
              <h2 className="text-xl font-bold text-white mb-4">Desktop Access</h2>
              <div className="space-y-4 text-white/50 text-sm mb-8">
                <p>STEEZE is a web-first platform—no desktop app download needed.</p>
                <p>1. Open your browser (Chrome, Safari, Firefox, or Edge).</p>
                <p>2. Go to <span className="text-white">steeze.com</span>.</p>
                <p>3. Sign in or create an account to get started.</p>
              </div>
              <div className="p-4 glass rounded-xl mb-6">
                <p className="text-white/80 font-semibold text-sm mb-1">Install as PWA (Recommended)</p>
                <p className="text-white/40 text-xs">
                  In Chrome or Edge, click the install icon (⊕) in the address bar to add STEEZE as a standalone desktop app with its own window and dock/taskbar icon.
                </p>
              </div>
              <a
                href="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all"
              >
                Open STEEZE Web App
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Download, Smartphone } from "lucide-react";

export default function AndroidDownloadPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24">
        <section className="relative py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <Smartphone className="mx-auto text-gold mb-4" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                STEEZE for Android
              </span>
            </h1>
            <p className="text-white/60 text-lg">Get the STEEZE app on your Android device.</p>
          </div>
        </section>

        <section className="py-16 px-4 pb-24">
          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-8 md:p-12 text-center">
              <Download className="mx-auto text-gold mb-6" size={64} />
              <h2 className="text-xl font-bold text-white mb-4">Install on Android</h2>
              <div className="space-y-4 text-white/50 text-sm mb-8">
                <p>1. Open <span className="text-white">steeze.com</span> in Chrome on your Android device.</p>
                <p>2. Tap the menu icon (⋮) in the top-right corner.</p>
                <p>3. Select <span className="text-white">"Add to Home Screen"</span> or <span className="text-white">"Install App"</span>.</p>
                <p>4. The STEEZE PWA will install and appear on your home screen.</p>
              </div>
              <div className="p-4 glass rounded-xl">
                <p className="text-white/40 text-xs">
                  STEEZE is a Progressive Web App (PWA). No app store download needed—just install from your browser for the full native-like experience with offline access and push notifications.
                </p>
              </div>
              <a
                href="/"
                className="inline-block mt-6 px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all"
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
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Download, Smartphone, Apple, Globe, Share2, Home, QrCode, ExternalLink } from "lucide-react";

export default function InstallPage() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/Android/.test(userAgent));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((result: { outcome: string }) => {
        if (result.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      });
    }
  };

  const [appUrl, setAppUrl] = useState("https://steeze.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-full bg-gold/20 mb-4">
            <Download className="text-gold" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">Get STEEZE on Your Phone</h1>
          <p className="text-white/60">Install STEEZE as an app for the best experience</p>
        </div>

        {/* Direct Install Button (Android/Chrome) */}
        {showInstallBanner && (
          <div className="glass-card p-6 mb-8 text-center border border-gold">
            <h2 className="text-xl font-bold text-white mb-2">Install STEEZE App</h2>
            <p className="text-white/60 mb-4">Get faster loading, offline access, and push notifications</p>
            <button
              onClick={handleInstallClick}
              className="px-8 py-3 bg-gold text-black rounded-full font-bold inline-flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Download size={18} /> Install App
            </button>
          </div>
        )}

        {/* QR Code Section */}
        <div className="glass-card p-6 mb-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
            <QrCode className="text-gold" size={20} /> Scan to Open
          </h2>
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={appUrl} size={180} bgColor="#000000" fgColor="#FFD700" level="H" />
          </div>
          <p className="text-white/50 text-sm">
            Scan this QR code with your phone's camera to open STEEZE
          </p>
        </div>

        {/* iOS Instructions */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Apple className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">iPhone / iPad</h2>
          </div>
          <ol className="space-y-4 text-white/70">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold shrink-0">1</span>
              <span>Open STEEZE in <strong className="text-gold">Safari</strong> (Chrome won't work for installation)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold shrink-0">2</span>
              <span>Tap the <strong className="text-gold">Share</strong> button <Share2 size={14} className="inline mx-1" /> at the bottom of the screen</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold shrink-0">3</span>
              <span>Scroll down and tap <strong className="text-gold">"Add to Home Screen"</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold shrink-0">4</span>
              <span>Tap <strong className="text-gold">"Add"</strong> in the top right corner</span>
            </li>
          </ol>
        </div>

        {/* Android Instructions */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">Android / Chrome</h2>
          </div>
          <ol className="space-y-4 text-white/70">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold shrink-0">1</span>
              <span>Open STEEZE in <strong className="text-gold">Chrome</strong> browser</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold shrink-0">2</span>
              <span>Tap the <strong className="text-gold">menu button</strong> (three dots ⋮) at the top right</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold shrink-0">3</span>
              <span>Tap <strong className="text-gold">"Install App"</strong> or <strong className="text-gold">"Add to Home Screen"</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold shrink-0">4</span>
              <span>Tap <strong className="text-gold">"Install"</strong> to confirm</span>
            </li>
          </ol>
        </div>

        {/* Direct Links */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 text-center">Or Open in Browser</h2>
          <div className="flex flex-col gap-3">
            <a
              href={appUrl}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
            >
              <span className="text-white">Open STEEZE in Browser</span>
              <ExternalLink size={18} className="text-gold" />
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-gold hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
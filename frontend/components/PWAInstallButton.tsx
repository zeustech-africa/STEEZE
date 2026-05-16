"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
  };

  // Don't show if already installed or on admin route
  if (isStandalone) return null;
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin")
  )
    return null;

  // iOS instructions (since beforeinstallprompt doesn't work on iOS)
  if (isIOS && !isStandalone) {
    return (
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="text-gold" size={24} />
            <div>
              <p className="text-white font-semibold">Install STEEZE App</p>
              <p className="text-white/50 text-sm">Tap Share → Add to Home Screen</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome install banner
  if (!showInstallBanner) return null;

  return (
    <div className="glass-card p-4 mb-4 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/50 hover:text-white"
      >
        <X size={18} />
      </button>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Download className="text-gold" size={28} />
          <div>
            <p className="text-white font-semibold">Get the STEEZE App</p>
            <p className="text-white/50 text-sm">Faster browsing, offline access, push notifications</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="px-6 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all"
        >
          Install App
        </button>
      </div>
    </div>
  );
};

export default PWAInstallButton;
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Shield, Users, Sparkles, Download } from "lucide-react";

const Hero = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
    setIsMobile(mobile);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
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
          console.log("User accepted install");
        }
        setDeferredPrompt(null);
        setShowInstallButton(false);
      });
    } else {
      window.location.href = "/install";
    }
  };

  const scrollToNext = () => {
    document
      .getElementById("trending")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover animate-slow-zoom"
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-up">
          <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
            You want style, you want entertainment,
          </span>
          <br />
          <span className="text-white">
            you want music... you need STEEZE.
          </span>
        </h1>
        <p
          className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          No politics. No news. No violence. Just pure entertainment.
          <br />
          <span className="text-gold">Powered by ZeusLiveStudio.</span>
        </p>

        {/* Trust Badges */}
        <div
          className="flex flex-wrap justify-center gap-6 mb-10 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-center gap-2 text-white/80">
            <Shield size={18} className="text-gold" /> No fake accounts
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Users size={18} className="text-gold" /> Only verified users
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Sparkles size={18} className="text-gold" /> Entertainment only
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          <Link
            href="/signup/creator"
            className="px-8 py-4 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full text-lg hover:shadow-2xl hover:shadow-gold/30 transition-all duration-300 transform hover:scale-105"
          >
            Join as Creator
          </Link>
          <Link
            href="/signup/vibes"
            className="px-8 py-4 border-2 border-neon-blue text-neon-blue font-bold rounded-full text-lg hover:bg-neon-blue hover:text-black transition-all duration-300 transform hover:scale-105"
          >
            Join as VIBES
          </Link>

          {/* Install App Button - shown on mobile devices */}
          {isMobile && (
            <button
              onClick={handleInstallClick}
              className="px-8 py-4 bg-white/10 border border-gold text-gold font-semibold rounded-full text-lg hover:bg-gold hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Download size={18} /> Install App
            </button>
          )}
        </div>

        <div className="scroll-indicator" onClick={scrollToNext}>
          <ChevronDown
            size={32}
            className="text-gold animate-float cursor-pointer mt-10 mx-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
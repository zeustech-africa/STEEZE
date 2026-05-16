"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

interface BackToHomeButtonProps {
  showText?: boolean;
  variant?: "icon" | "full";
}

export default function BackToHomeButton({ showText = true, variant = "full" }: BackToHomeButtonProps) {
  if (variant === "icon") {
    return (
      <Link
        href="/"
        className="fixed bottom-6 left-6 z-50 p-3 bg-gold text-black rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Back to Home"
      >
        <Home size={20} />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 border border-gold/50 text-gold rounded-lg hover:bg-gold hover:text-black transition-all mb-4"
    >
      <ArrowLeft size={16} />
      {showText && "Back to Home"}
    </Link>
  );
}
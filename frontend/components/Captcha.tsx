"use client";

import { useEffect, useRef } from "react";

interface CaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  siteKey?: string;
}

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

export default function Captcha({ onVerify, onError, onExpire, siteKey }: CaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const SITE_KEY = siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  useEffect(() => {
    // Prevent duplicate script injection
    if (document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]')) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => renderWidget();
    document.head.appendChild(script);

    function renderWidget() {
      if (containerRef.current && window.turnstile && SITE_KEY) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => {
            onVerify(token);
          },
          "error-callback": () => {
            if (onError) onError();
          },
          "expired-callback": () => {
            if (onExpire) onExpire();
          },
          theme: "dark",
        });
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [SITE_KEY, onVerify, onError, onExpire]);

  if (!SITE_KEY) {
    console.warn("Turnstile site key not configured");
    return null;
  }

  return <div ref={containerRef} className="cf-turnstile" />;
}
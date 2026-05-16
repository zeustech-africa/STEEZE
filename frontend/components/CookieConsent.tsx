"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    } else {
      try {
        const parsed = JSON.parse(consent) as CookiePreferences;
        setPreferences(parsed);
      } catch {
        setVisible(true);
      }
    }
  }, []);

  const acceptAll = () => {
    const allPreferences: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem("cookie-consent", JSON.stringify(allPreferences));
    setPreferences(allPreferences);
    setVisible(false);
  };

  const rejectAll = () => {
    const minimalPreferences: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem("cookie-consent", JSON.stringify(minimalPreferences));
    setPreferences(minimalPreferences);
    setVisible(false);
  };

  const savePreferences = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-gold/30 p-4 md:p-6 animate-slide-up">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-gold font-semibold mb-1">Cookie Preferences</h3>
            <p className="text-white/60 text-sm">
              We use cookies to enhance your experience. Essential cookies are
              always active. You can choose to accept or reject other cookie
              categories. See our{" "}
              <Link href="/cookies" className="text-gold hover:underline">
                Cookie Policy
              </Link>{" "}
              for details.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.essential}
                  disabled
                  className="accent-gold w-4 h-4"
                />
                <span className="text-white/50 text-sm">
                  Essential (required)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      functional: e.target.checked,
                    })
                  }
                  className="accent-gold w-4 h-4"
                />
                <span className="text-white/50 text-sm">Functional</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      analytics: e.target.checked,
                    })
                  }
                  className="accent-gold w-4 h-4"
                />
                <span className="text-white/50 text-sm">Analytics</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      marketing: e.target.checked,
                    })
                  }
                  className="accent-gold w-4 h-4"
                />
                <span className="text-white/50 text-sm">Marketing</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={rejectAll}
              className="px-4 py-2 border border-white/30 text-white rounded-full text-sm hover:border-gold transition-all"
            >
              Reject All
            </button>
            <button
              onClick={savePreferences}
              className="px-4 py-2 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-all"
            >
              Save Preferences
            </button>
            <button
              onClick={acceptAll}
              className="px-6 py-2 bg-gold text-black rounded-full text-sm font-semibold hover:shadow-lg transition-all"
            >
              Accept All
            </button>
          </div>
        </div>
        <div className="text-center mt-3">
          <Link href="/cookies" className="text-gold text-xs hover:underline">
            Cookie Policy
          </Link>
          <span className="text-white/30 text-xs mx-2">|</span>
          <Link href="/privacy" className="text-gold text-xs hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
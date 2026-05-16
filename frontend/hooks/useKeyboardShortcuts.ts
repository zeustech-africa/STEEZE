"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K – Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(
          '#search-input, input[type="search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape – Close modal / cancel
      if (e.key === "Escape") {
        document.dispatchEvent(new CustomEvent("close-modals"));
      }
      // g + h – Go to Home
      if (e.key === "h" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        router.push("/");
      }
      // g + p – Go to Profile
      if (e.key === "p" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        router.push("/profile");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores";

export function StoreInitializer() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Load user from localStorage on mount
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUser(user);
      } catch (e) {
        // ignore
      }
    }
  }, [setUser]);

  return null;
}
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JustVibesSession {
  id: string;
  startTime: string;
  expiryTime: string;
  remainingMinutes: number;
}

interface JustVibesUser {
  id: string;
  email: string;
  status: string;
  type: string;
}

interface JustVibesState {
  token: string | null;
  user: JustVibesUser | null;
  session: JustVibesSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateSession: (session: JustVibesSession) => void;
  checkSession: () => Promise<{ valid: boolean; remainingMinutes: number; inCooldown: boolean; cooldownMinutes?: number }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useJustVibes = create<JustVibesState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      session: null,
      isAuthenticated: false,
      loading: false,

      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await fetch(`${API_URL}/api/just-vibes/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          const data = await response.json();

          if (response.ok) {
            set({
              token: data.data.token,
              user: data.data.user,
              session: data.data.session,
              isAuthenticated: true,
              loading: false
            });
          } else {
            set({ loading: false });
            throw new Error(data.error || 'Login failed');
          }
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('just_vibes_token');
        localStorage.removeItem('just_vibes_user');
        localStorage.removeItem('just_vibes_session');
        set({
          token: null,
          user: null,
          session: null,
          isAuthenticated: false,
          loading: false
        });
      },

      updateSession: (session: JustVibesSession) => {
        set({ session });
        localStorage.setItem('just_vibes_session', JSON.stringify(session));
      },

      checkSession: async () => {
        const { token } = get();
        if (!token) {
          return { valid: false, remainingMinutes: 0, inCooldown: false };
        }

        try {
          const response = await fetch(`${API_URL}/api/just-vibes/session/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            return {
              valid: data.valid,
              remainingMinutes: data.remainingMinutes,
              inCooldown: data.inCooldown,
              cooldownMinutes: data.cooldownMinutes
            };
          }
        } catch (error) {
          console.error('Session check error:', error);
        }

        return { valid: false, remainingMinutes: 0, inCooldown: false };
      }
    }),
    {
      name: 'just-vibes-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
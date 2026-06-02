import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  fullName: string;
  email: string;
  userType: string;
  role?: string;
  username?: string;
  artistName?: string;
  profilePicUrl?: string;
  subscriptionTier?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null 
      }),

      setToken: (token) => set({ token }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      logout: () => set({ 
        user: null,
        token: null,
        isAuthenticated: false,
        error: null 
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'steeze-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

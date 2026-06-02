import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  mobileMenuOpen: boolean;
  modalOpen: string | null;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      theme: 'dark',
      mobileMenuOpen: false,
      modalOpen: null,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
      
      setTheme: (theme) => set({ theme }),
      
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      
      openModal: (modalId) => set({ modalOpen: modalId }),
      
      closeModal: () => set({ modalOpen: null }),
    }),
    {
      name: 'steeze-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
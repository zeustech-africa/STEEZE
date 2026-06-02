import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Song {
  id: string;
  title: string;
  mediaUrl: string;
  coverArtUrl?: string;
  duration?: string;
  creator?: {
    id: string;
    fullName: string;
    artistName?: string;
  };
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  queue: Song[];
  currentIndex: number;
  repeatMode: 'off' | 'one' | 'all';
  shuffled: boolean;
  shuffledQueue: Song[];
  
  // Actions
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  addToQueue: (song: Song, playNext?: boolean) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  nextSong: () => void;
  previousSong: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  playPlaylist: (songs: Song[], startIndex?: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      volume: 70,
      queue: [],
      currentIndex: -1,
      repeatMode: 'off',
      shuffled: false,
      shuffledQueue: [],

      setCurrentSong: (song) => set({ 
        currentSong: song, 
        currentIndex: song ? get().queue.findIndex(s => s.id === song.id) : -1 
      }),
      
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      
      setVolume: (volume) => set({ volume }),
      
      addToQueue: (song, playNext = false) => set((state) => {
        const newQueue = [...state.queue];
        if (playNext && state.currentIndex >= 0) {
          newQueue.splice(state.currentIndex + 1, 0, song);
        } else {
          newQueue.push(song);
        }
        return { queue: newQueue };
      }),
      
      removeFromQueue: (index) => set((state) => ({
        queue: state.queue.filter((_, i) => i !== index)
      })),
      
      clearQueue: () => set({ queue: [], shuffledQueue: [] }),
      
      nextSong: () => set((state) => {
        let nextIndex = state.currentIndex + 1;
        
        if (state.repeatMode === 'one' && state.currentSong) {
          return { isPlaying: true };
        }
        
        if (nextIndex >= state.queue.length) {
          if (state.repeatMode === 'all') {
            nextIndex = 0;
          } else {
            return { isPlaying: false };
          }
        }
        
        const nextSong = state.queue[nextIndex];
        return {
          currentSong: nextSong,
          currentIndex: nextIndex,
          isPlaying: true
        };
      }),
      
      previousSong: () => set((state) => {
        const prevIndex = state.currentIndex - 1;
        if (prevIndex < 0) return {};
        const prevSong = state.queue[prevIndex];
        return {
          currentSong: prevSong,
          currentIndex: prevIndex,
          isPlaying: true
        };
      }),
      
      toggleRepeat: () => set((state) => {
        const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
        const currentIndex = modes.indexOf(state.repeatMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        return { repeatMode: nextMode };
      }),
      
      toggleShuffle: () => set((state) => {
        if (!state.shuffled) {
          // Create shuffled version of queue
          const shuffled = [...state.queue];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return { shuffled: true, shuffledQueue: shuffled };
        } else {
          return { shuffled: false, shuffledQueue: [] };
        }
      }),
      
      playPlaylist: (songs, startIndex = 0) => set({
        queue: songs,
        currentIndex: startIndex,
        currentSong: songs[startIndex],
        isPlaying: true,
        shuffled: false,
        shuffledQueue: []
      }),
    }),
    {
      name: 'steeze-player',
      partialize: (state) => ({ 
        volume: state.volume,
        repeatMode: state.repeatMode 
      }),
    }
  )
);
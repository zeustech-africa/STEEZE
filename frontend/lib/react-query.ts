import { QueryClient } from '@tanstack/react-query';

// Default query configuration
export const defaultQueryConfig = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
  mutations: {
    retry: 0,
  },
};

// Create query client
export const queryClient = new QueryClient({ defaultOptions: defaultQueryConfig });

// Query keys for cache management
export const queryKeys = {
  creator: (username: string) => ['creator', username] as const,
  creators: () => ['creators'] as const,
  posts: (userId?: string) => ['posts', userId] as const,
  post: (postId: string) => ['post', postId] as const,
  comments: (postId: string) => ['comments', postId] as const,
  playlists: (userId?: string) => ['playlists', userId] as const,
  playlist: (playlistId: string) => ['playlist', playlistId] as const,
  followers: (userId: string) => ['followers', userId] as const,
  following: (userId: string) => ['following', userId] as const,
  notifications: () => ['notifications'] as const,
  analytics: (creatorId: string) => ['analytics', creatorId] as const,
};
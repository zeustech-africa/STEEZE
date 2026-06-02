'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import {
  Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX,
  Trash2, Plus, Music, Play, Pause, MoreHorizontal,
  Loader2, User, Calendar, Eye
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SavedPost {
  id: string;
  createdAt: string;
  post: {
    id: string;
    title: string;
    caption: string;
    mediaUrl: string;
    mediaType: 'image' | 'video' | 'audio';
    contentType: string;
    creator: {
      id: string;
      artistName: string;
      fullName: string;
      profilePicUrl: string;
    };
    originalCreator?: {
      id: string;
      artistName: string;
      fullName: string;
    };
  };
}

export default function SavedContentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const profileId = params.id as string;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  
  const limit = 20;
  const isOwnProfile = isAuthenticated && user?.id === profileId;

  // Fetch profile user
  useEffect(() => {
    const fetchProfileUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/${profileId}`);
        if (response.ok) {
          const data = await response.json();
          setProfileUser(data.user);
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      }
    };
    fetchProfileUser();
  }, [profileId]);

  // Fetch saved posts
  const fetchSavedPosts = useCallback(async (resetOffset = true) => {
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!currentToken && !isOwnProfile) {
      setLoading(false);
      return;
    }
    
    const currentOffset = resetOffset ? 0 : offset;
    setLoading(resetOffset);
    
    try {
      const headers: HeadersInit = {};
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const response = await fetch(
        `${API_URL}/api/users/${profileId}/saved?limit=${limit}&offset=${currentOffset}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();

        if (resetOffset) {
          setSavedPosts(data.savedPosts);
          setOffset(data.savedPosts.length);
        } else {
          setSavedPosts(prev => [...prev, ...data.savedPosts]);
          setOffset(currentOffset + data.savedPosts.length);
        }

        setHasMore(data.hasMore);
        setTotal(data.total);
      } else if (response.status === 404) {
        setSavedPosts([]);
      } else {
        setError('Failed to load saved content');
      }
    } catch (err) {
      console.error('Fetch saved error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profileId, token, offset, limit, isOwnProfile]);

  // Remove saved post
  const handleRemoveSave = async (postId: string) => {
    if (!token) return;

    setRemovingId(postId);
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/save`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSavedPosts(prev => prev.filter(item => item.post.id !== postId));
        setTotal(prev => prev - 1);
      } else {
        alert('Failed to remove saved content');
      }
    } catch (err) {
      console.error('Remove save error:', err);
      alert('Network error. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  // Add to playlist
  const handleAddToPlaylist = async (postId: string) => {
    if (!token) return;

    const playlistName = prompt('Enter playlist name:');
    if (!playlistName) return;

    try {
      const response = await fetch(`${API_URL}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: playlistName, postId })
      });

      if (response.ok) {
        alert(`Added to playlist "${playlistName}"`);
      } else {
        alert('Failed to add to playlist');
      }
    } catch (err) {
      console.error('Add to playlist error:', err);
      alert('Network error. Please try again.');
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchSavedPosts(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts(true);
  }, [fetchSavedPosts]);

  if (loading && savedPosts.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <button onClick={() => fetchSavedPosts(true)} className="mt-4 text-purple-400 hover:text-purple-300">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">YOUR VIBES</h1>
        <p className="text-gray-400">
          {isOwnProfile ? 'Content you have saved and reposted' : `${profileUser?.artistName || profileUser?.fullName || 'User'}'s saved content`}
        </p>
        <p className="text-sm text-gray-500 mt-1">{total} saved items</p>
      </div>

      {/* Saved Content Grid */}
      {savedPosts.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-xl">
          <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">START YOUR VIBES</p>
          <p className="text-gray-500 text-sm mt-1">
            {isOwnProfile
              ? 'Save content from the feed to see it here'
              : 'This user has not saved any content yet'}
          </p>
          {isOwnProfile && (
            <Link href="/feed" className="inline-block mt-4 text-purple-400 hover:text-purple-300">
              Browse Feed →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPosts.map((item) => {
              const post = item.post;
              const originalCreator = post.originalCreator || post.creator;
              const isAudio = post.mediaType === 'audio';
              const isVideo = post.mediaType === 'video';
              const isImage = post.mediaType === 'image';

              return (
                <div key={item.id} className="bg-gray-900 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Media Preview */}
                  <Link href={`/post/${post.id}`}>
                    <div className="relative aspect-video bg-black">
                      {isVideo && (
                        <video
                          src={post.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      {isAudio && (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
                          <Music className="w-12 h-12 text-purple-500" />
                        </div>
                      )}
                      {isImage && (
                        <Image
                          src={post.mediaUrl}
                          alt={post.title || post.caption || 'Saved content'}
                          fill
                          className="object-cover"
                        />
                      )}

                      {/* Content Type Badge */}
                      {post.contentType !== 'free' && (
                        <div className="absolute top-2 left-2">
                          {post.contentType === 'subscriber' && (
                            <span className="text-xs px-2 py-1 bg-purple-500/80 text-white rounded-full">
                              Subscriber
                            </span>
                          )}
                          {post.contentType === 'direct_purchase' && (
                            <span className="text-xs px-2 py-1 bg-yellow-500/80 text-white rounded-full">
                              Direct Purchase
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content Info */}
                  <div className="p-3">
                    <Link href={`/post/${post.id}`}>
                      <h3 className="text-white font-semibold line-clamp-1 hover:text-purple-400">
                        {post.title || post.caption || 'Untitled'}
                      </h3>
                    </Link>

                    {/* Attribution - Original Creator */}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span>Originally by </span>
                      <Link href={`/profile/${originalCreator.id}`} className="text-purple-400 hover:underline">
                        {originalCreator.artistName || originalCreator.fullName}
                      </Link>
                    </div>

                    {/* Saved Date */}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>Saved on {new Date(item.createdAt).toLocaleDateString('en-ZA')}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      {isAudio && (
                        <button
                          onClick={() => handleAddToPlaylist(post.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition"
                        >
                          <Plus className="w-3 h-3" />
                          Add to Playlist
                        </button>
                      )}
                      {isOwnProfile && (
                        <button
                          onClick={() => handleRemoveSave(post.id)}
                          disabled={removingId === post.id}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-xs text-red-400 transition disabled:opacity-50"
                        >
                          {removingId === post.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Remove
                        </button>
                      )}
                      <Link
                        href={`/post/${post.id}`}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs text-white transition"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
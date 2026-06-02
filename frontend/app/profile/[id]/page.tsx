'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { ProfileHeaderSkeleton, FeedCardSkeleton } from '@/components/ui/Skeleton';
import {
  User, Music, Image as ImageIcon, Video, Bookmark, Grid,
  Loader2, MapPin, Calendar, Link as LinkIcon
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ProfileUser {
  id: string;
  artistName?: string;
  fullName: string;
  username?: string;
  bio?: string;
  profilePicUrl?: string;
  bannerUrl?: string;
  userType: string;
  location?: string;
  website?: string;
  joinedAt?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  subscriptionTier?: 'free' | 'basic' | 'premium' | 'gold';
}

export default function ViberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const profileId = params.id as string;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = isAuthenticated && user?.id === profileId;

  // Fetch profile user
  useEffect(() => {
    const fetchProfileUser = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/users/${profileId}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setProfileUser(data.user);
          setIsFollowing(data.isFollowing || false);
        } else if (response.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileUser();
  }, [profileId, token]);

  // Fetch saved count
  useEffect(() => {
    const fetchSavedCount = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_URL}/api/users/${profileId}/saved/count`, { headers });
        if (response.ok) {
          const data = await response.json();
          setSavedCount(data.count);
        }
      } catch (err) {
        console.error('Fetch saved count error:', err);
      }
    };
    fetchSavedCount();
  }, [profileId, token]);

  const handleFollow = async () => {
    if (!token || followLoading) return;

    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/api/users/${profileId}/follow`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <ProfileHeaderSkeleton />
        <div className="mt-6">
          {[1, 2].map((i) => (
            <FeedCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <User className="w-16 h-16 text-gray-600 mb-4" />
        <p className="text-gray-400">{error || 'User not found'}</p>
        <button onClick={() => router.back()} className="mt-4 text-purple-400 hover:text-purple-300">
          Go back
        </button>
      </div>
    );
  }

  const displayName = profileUser.artistName || profileUser.fullName || 'User';
  const username = profileUser.username || profileId;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-purple-900 to-black">
        {profileUser.bannerUrl && (
          <Image
            src={profileUser.bannerUrl}
            alt="Banner"
            fill
            className="object-cover opacity-50"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 pb-6">
        <div className="relative -mt-16 mb-4 flex items-end justify-between">
          <div className="relative w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-gray-800">
            {profileUser.profilePicUrl ? (
              <Image
                src={profileUser.profilePicUrl}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-600" />
              </div>
            )}
          </div>

          {!isOwnProfile && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                isFollowing
                  ? 'bg-gray-800 text-white hover:bg-red-600/20 hover:text-red-400'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              } disabled:opacity-50`}
            >
              {followLoading ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : isFollowing ? (
                'Following'
              ) : (
                'Follow'
              )}
            </button>
          )}
        </div>

        {/* Name & Bio */}
        <div className="mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <SubscriptionBadge tier={profileUser?.subscriptionTier || 'free'} showUpgradeLink={false} size="lg" />
          </div>
          <p className="text-gray-400">@{username}</p>
          {profileUser.bio && <p className="text-gray-300 mt-2">{profileUser.bio}</p>}

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
            {profileUser.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profileUser.location}
              </span>
            )}
            {profileUser.website && (
              <a
                href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
              >
                <LinkIcon className="w-4 h-4" />
                Website
              </a>
            )}
            {profileUser.joinedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profileUser.joinedAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-6 text-sm">
          <span className="text-gray-400">
            <span className="text-white font-semibold">{profileUser.postsCount || 0}</span> Posts
          </span>
          <Link href={`/profile/${profileId}/followers`} className="text-gray-400 hover:text-gray-300">
            <span className="text-white font-semibold">{profileUser.followersCount || 0}</span> Followers
          </Link>
          <Link href={`/profile/${profileId}/following`} className="text-gray-400 hover:text-gray-300">
            <span className="text-white font-semibold">{profileUser.followingCount || 0}</span> Following
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800">
          <div className="flex gap-6 -mb-px">
            <Link
              href={`/profile/${profileId}`}
              className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                pathname === `/profile/${profileId}`
                  ? 'text-purple-500 border-purple-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <Grid className="w-4 h-4 inline mr-1" />
              Posts
            </Link>
            <Link
              href={`/profile/${profileId}/saved`}
              className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                pathname === `/profile/${profileId}/saved`
                  ? 'text-purple-500 border-purple-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <Bookmark className="w-4 h-4 inline mr-1" />
              Saved ({savedCount})
            </Link>
          </div>
        </div>

        {/* Content area - shows a prompt to navigate to saved */}
        <div className="py-12 text-center">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Select a tab above to browse content</p>
          <Link
            href={`/profile/${profileId}/saved`}
            className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition"
          >
            View Saved Content
          </Link>
        </div>
      </div>
    </div>
  );
}
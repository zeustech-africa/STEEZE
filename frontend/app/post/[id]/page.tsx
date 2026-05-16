'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const data = await api.getPost(id);
        setPost(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-2xl font-bold text-white mb-2">Post Not Found</h1>
          <p className="text-gray-400">{error || "The post you're looking for doesn't exist or has been removed."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-card rounded-2xl overflow-hidden">
          {post.mediaUrl && post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full aspect-video object-cover"
              poster={post.thumbnailUrl}
            />
          ) : post.mediaUrl && post.mediaType === 'image' ? (
            <img
              src={post.mediaUrl}
              alt={post.title || 'Post image'}
              className="w-full aspect-video object-cover"
            />
          ) : null}

          <div className="p-6">
            {post.title && (
              <h1 className="text-2xl font-bold text-white mb-2">{post.title}</h1>
            )}
            {post.description && (
              <p className="text-gray-300 text-lg mb-4">{post.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-400">
              {post.user && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                    {post.user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-white font-medium">@{post.user.username}</span>
                </div>
              )}
              <span>·</span>
              <span>{post.likeCount || 0} likes</span>
              <span>·</span>
              <span>{post.commentCount || 0} comments</span>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
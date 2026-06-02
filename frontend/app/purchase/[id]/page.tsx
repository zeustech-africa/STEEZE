'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Lock, CreditCard, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function PurchasePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${API_URL}/api/posts/${postId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
        } else {
          setError('Content not found');
        }
      } catch (err) {
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/purchase/${postId}`);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/purchase/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ postId })
      });

      const data = await response.json();

      if (response.ok) {
        setPurchaseStatus('pending');
        // Redirect to PayFast
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.payfastUrl;
        
        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        if (data.alreadyPurchased) {
          setPurchaseStatus('already_purchased');
        } else {
          setError(data.error || 'Failed to initiate purchase');
        }
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Content Not Found</h2>
          <p className="text-gray-400">{error || 'The content you\'re looking for does not exist.'}</p>
          <Link href="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (purchaseStatus === 'already_purchased') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Already Purchased</h2>
          <p className="text-gray-400 mb-6">You already have access to this content.</p>
          <Link
            href={`/post/${postId}`}
            className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
          >
            View Content
          </Link>
        </div>
      </div>
    );
  }

  const priceRands = (post.price / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <Link href={`/post/${postId}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Content
        </Link>

        {/* Content Preview */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden mb-6">
          {post.mediaType === 'video' && (
            <video src={post.mediaUrl} className="w-full aspect-video object-cover" poster="/poster-placeholder.jpg" controls={false} />
          )}
          {post.mediaType === 'audio' && (
            <div className="bg-gradient-to-br from-purple-900 to-black p-8 text-center">
              <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          )}
          {post.mediaType === 'image' && (
            <img src={post.mediaUrl} alt={post.title} className="w-full aspect-video object-cover" />
          )}
          <div className="p-4">
            <h1 className="text-xl font-bold text-white">{post.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{post.description}</p>
            <p className="text-gray-500 text-xs mt-2">By {post.creator?.artistName || post.creator?.fullName}</p>
          </div>
        </div>

        {/* Purchase Card */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Unlock This Content</h2>
            <p className="text-gray-400 mt-1">
              One-time payment of <span className="text-yellow-500 font-bold">R{priceRands}</span>
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Lifetime access after purchase</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Support the creator directly</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Secure payment via PayFast</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handlePurchase}
            disabled={processing}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-black font-bold transition"
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              `Pay R${priceRands} to Unlock`
            )}
          </button>

          <p className="text-center text-gray-500 text-xs mt-4">
            You will be redirected to PayFast to complete your payment securely.
          </p>
        </div>
      </div>
    </div>
  );
}
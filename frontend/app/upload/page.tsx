'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authFetch } from '@/lib/auth-client';
import { 
  Upload, 
  Music, 
  Lock,
  Eye,
  Globe,
  DollarSign,
  Loader2,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

// Inline SVG icons for social platforms (not available in lucide-react v1.14)
const SocialIcons = {
  Youtube: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  Spotify: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  ),
  AppleMusic: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.53-.703 1.005-1.688.831-2.69-.872.052-1.883.597-2.48 1.364-.546.65-1.01 1.649-.84 2.61.923.117 1.896-.52 2.49-1.284z"/>
    </svg>
  ),
  TikTok: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Content type options
const CONTENT_TYPES = [
  { 
    id: 'free', 
    label: 'Free Content', 
    description: 'Everyone can access (Just VIBES get 30-sec preview)',
    icon: Globe,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  { 
    id: 'subscriber', 
    label: 'Subscriber Content', 
    description: 'Only Premium and Golden VIBES subscribers can access',
    icon: Lock,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  { 
    id: 'direct_purchase', 
    label: 'Direct Purchase', 
    description: 'Users pay one-time to access this content',
    icon: DollarSign,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
  { 
    id: 'creator_page_only', 
    label: 'Creator-Page-Only', 
    description: 'Only visible on your profile page (not global feed)',
    icon: Eye,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  }
];

// Distribution channels
const DISTRIBUTION_CHANNELS = [
  { id: 'steeze', label: 'STEEZE', icon: Music, required: true },
  { id: 'youtube', label: 'YouTube', icon: SocialIcons.Youtube },
  { id: 'spotify', label: 'Spotify', icon: SocialIcons.Spotify },
  { id: 'apple_music', label: 'Apple Music', icon: SocialIcons.AppleMusic },
  { id: 'tiktok', label: 'TikTok', icon: SocialIcons.TikTok },
  { id: 'instagram', label: 'Instagram', icon: SocialIcons.Instagram },
  { id: 'facebook', label: 'Facebook', icon: SocialIcons.Facebook },
  { id: 'twitter', label: 'Twitter', icon: SocialIcons.Twitter }
];

export default function UploadPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const isCreator = user?.userType === 'creator';
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'free',
    price: '',
    distributionChannels: ['steeze']
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);

  // Check if user is creator
  useEffect(() => {
    if (isAuthenticated && !isCreator) {
      router.push('/');
    }
  }, [isAuthenticated, isCreator, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    setError(null);
  };

  const handleContentTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, contentType: type }));
    if (type !== 'direct_purchase') {
      setFormData(prev => ({ ...prev, price: '' }));
    }
  };

  const handleDistributionChannelToggle = (channelId: string) => {
    if (channelId === 'steeze') return; // Cannot disable STEEZE
    
    setFormData(prev => {
      const current = [...prev.distributionChannels];
      if (current.includes(channelId)) {
        return { ...prev, distributionChannels: current.filter(c => c !== channelId) };
      } else {
        return { ...prev, distributionChannels: [...current, channelId] };
      }
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return false;
    }
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return false;
    }
    
    if (formData.contentType === 'direct_purchase') {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 5 || price > 500) {
        setError('Direct purchase price must be between R5 and R500');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!isAuthenticated) {
      setError('Please login to upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // First, upload the file
      const fileFormData = new FormData();
      fileFormData.append('file', selectedFile!);
      fileFormData.append('title', formData.title);
      fileFormData.append('description', formData.description);
      
      const uploadResponse = await authFetch(`${API_URL}/api/upload/file`, {
        method: 'POST',
        body: fileFormData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }
      
      const uploadData = await uploadResponse.json();
      setUploadProgress(50);
      
      // Then, create the post with metadata
      const postData = {
        title: formData.title,
        description: formData.description,
        contentType: formData.contentType,
        price: formData.contentType === 'direct_purchase' ? Math.round(parseFloat(formData.price) * 100) : null,
        distributionChannels: formData.distributionChannels,
        mediaUrl: uploadData.mediaUrl,
        mediaType: uploadData.mediaType,
        duration: uploadData.duration || null
      };
      
      const postResponse = await authFetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      setUploadProgress(100);
      
      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.error || 'Post creation failed');
      }
      
      const postResult = await postResponse.json();
      setPostId(postResult.post.id);
      setSuccess(true);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to upload</h2>
          <p className="text-gray-400">Please log in to your creator account to upload content.</p>
          <Link href="/login" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Creator Access Only</h2>
          <p className="text-gray-400">Only creators can upload content.</p>
          <Link href="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Upload Successful!</h1>
          <p className="text-gray-400 mb-4">
            Your content has been uploaded and sent for admin review.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You will be notified once it's approved. This typically takes 24-48 hours.
          </p>
          <div className="flex gap-3">
            <Link
              href="/upload"
              className="flex-1 text-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
            >
              Upload More
            </Link>
            <Link
              href="/profile"
              className="flex-1 text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">POST YOUR STEEZE</h1>
          <p className="text-gray-400">Share your STEEZE with the world</p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="Enter content title"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description / Story Behind the Content
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
              rows={4}
              placeholder="Share the story behind this content..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500</p>
          </div>

          {/* Content Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Content Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CONTENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.contentType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleContentTypeChange(type.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${type.bgColor}`}>
                        <Icon className={`w-5 h-5 ${type.color}`} />
                      </div>
                      <span className="font-semibold text-white">{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Field (for Direct Purchase) */}
          {formData.contentType === 'direct_purchase' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price (R) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="5 - 500"
                  min="5"
                  max="500"
                  step="1"
                  required={formData.contentType === 'direct_purchase'}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Set a price between R5 and R500</p>
            </div>
          )}

          {/* Distribution Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Distribution Channels
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select where you want STEEZE to distribute your content. STEEZE is always included.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {DISTRIBUTION_CHANNELS.map((channel) => {
                const Icon = channel.icon;
                const isSelected = formData.distributionChannels.includes(channel.id);
                const isRequired = channel.required;
                
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => handleDistributionChannelToggle(channel.id)}
                    disabled={isRequired}
                    className={`flex items-center gap-2 p-2 rounded-lg transition ${
                      isSelected
                        ? 'bg-purple-600/20 border border-purple-500'
                        : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                    } ${isRequired ? 'opacity-100 cursor-default' : ''}`}
                  >
                    <Icon className="w-4 h-4 text-gray-300" />
                    <span className="text-sm text-gray-300">{channel.label}</span>
                    {isRequired && <span className="text-xs text-purple-400 ml-auto">Required</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Media File *
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-purple-500 transition">
              {previewUrl ? (
                <div className="space-y-4">
                  {selectedFile?.type.startsWith('video/') && (
                    <video src={previewUrl} controls className="max-h-64 mx-auto rounded-lg" />
                  )}
                  {selectedFile?.type.startsWith('audio/') && (
                    <audio src={previewUrl} controls className="w-full" />
                  )}
                  {selectedFile?.type.startsWith('image/') && (
                    <img src={previewUrl} alt="Upload preview" className="max-h-64 mx-auto rounded-lg" />
                  )}
                  <p className="text-white">{selectedFile?.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-red-400 text-sm hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Click or drag to upload</p>
                  <p className="text-gray-500 text-sm mt-1">
                    MP4, MP3, WAV, JPG, PNG (Max 500MB)
                  </p>
                  <input
                    type="file"
                    accept="video/*,audio/*,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Uploading...</span>
                <span className="text-gray-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : (
              'POST YOUR STEEZE'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
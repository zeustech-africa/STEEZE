'use client';

import {
  Camera,
  Hash,
  Tv,
  Video,
  Users,
  Music,
  Play,
  Monitor,
  MessageCircle,
  Briefcase,
  Code,
  Globe,
  Link,
  Mail,
  Phone,
} from 'lucide-react';

interface SocialLinksProps {
  links: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    spotify?: string;
    appleMusic?: string;
    soundcloud?: string;
    twitch?: string;
    discord?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    email?: string;
    phone?: string;
  };
  variant?: 'icons' | 'buttons' | 'text';
  showLabels?: boolean;
  className?: string;
  iconSize?: number;
}

const platformConfig: Record<string, { icon: any; label: string; color: string }> = {
  instagram: { icon: Camera, label: 'Instagram', color: 'hover:text-pink-500' },
  twitter: { icon: Hash, label: 'Twitter / X', color: 'hover:text-blue-400' },
  youtube: { icon: Tv, label: 'YouTube', color: 'hover:text-red-600' },
  tiktok: { icon: Video, label: 'TikTok', color: 'hover:text-black' },
  facebook: { icon: Users, label: 'Facebook', color: 'hover:text-blue-600' },
  spotify: { icon: Music, label: 'Spotify', color: 'hover:text-green-500' },
  appleMusic: { icon: Play, label: 'Apple Music', color: 'hover:text-pink-500' },
  soundcloud: { icon: Music, label: 'SoundCloud', color: 'hover:text-orange-500' },
  twitch: { icon: Monitor, label: 'Twitch', color: 'hover:text-purple-500' },
  discord: { icon: MessageCircle, label: 'Discord', color: 'hover:text-indigo-500' },
  linkedin: { icon: Briefcase, label: 'LinkedIn', color: 'hover:text-blue-700' },
  github: { icon: Code, label: 'GitHub', color: 'hover:text-gray-600' },
  website: { icon: Globe, label: 'Website', color: 'hover:text-blue-500' },
  email: { icon: Mail, label: 'Email', color: 'hover:text-yellow-500' },
  phone: { icon: Phone, label: 'Phone', color: 'hover:text-green-500' },
};

export default function SocialLinks({
  links,
  variant = 'icons',
  showLabels = false,
  className = '',
  iconSize = 20,
}: SocialLinksProps) {
  // Filter out platforms that have valid URLs
  const activePlatforms = Object.entries(links)
    .filter(([_, url]) => url && url.trim() !== '')
    .map(([platform, url]) => ({ platform, url: url as string }));

  if (activePlatforms.length === 0) {
    return null;
  }

  if (variant === 'text') {
    return (
      <div className={`flex flex-wrap gap-4 ${className}`}>
        {activePlatforms.map(({ platform, url }) => {
          const config = platformConfig[platform];
          if (!config) return null;
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-gray-400 hover:text-white transition-colors ${config.color} focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2`}
            >
              {config.label}
            </a>
          );
        })}
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {activePlatforms.map(({ platform, url }) => {
          const config = platformConfig[platform];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={config.label}
              className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-colors ${config.color} focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2`}
            >
              <Icon size={iconSize} />
              {showLabels && <span>{config.label}</span>}
            </a>
          );
        })}
      </div>
    );
  }

  // Default: 'icons' variant
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {activePlatforms.map(({ platform, url }) => {
        const config = platformConfig[platform];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
              className={`text-gray-400 transition-colors duration-200 ${config.color} focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2`}
            aria-label={config.label}
          >
            <Icon size={iconSize} />
          </a>
        );
      })}
    </div>
  );
}
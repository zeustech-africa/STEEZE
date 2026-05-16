"use client";

import {
  FaInstagram,
  FaXTwitter,
  FaYoutube,
  FaFacebook,
  FaSpotify,
  FaApple,
  FaTiktok,
} from "react-icons/fa6";
import { Globe } from "lucide-react";

interface SocialLinksProps {
  links: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
    appleMusic?: string;
    facebook?: string;
    website?: string;
  };
}

const socialItems: {
  key: keyof SocialLinksProps["links"];
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  hoverClass: string;
  url: (value: string) => string;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    Icon: FaInstagram,
    hoverClass: "hover:text-pink-500",
    url: (v: string) =>
      `https://instagram.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "twitter",
    label: "X / Twitter",
    Icon: FaXTwitter,
    hoverClass: "hover:text-white",
    url: (v: string) =>
      `https://twitter.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: FaTiktok,
    hoverClass: "hover:text-white",
    url: (v: string) =>
      `https://tiktok.com/@${v.replace(/^@/, "")}`,
  },
  {
    key: "youtube",
    label: "YouTube",
    Icon: FaYoutube,
    hoverClass: "hover:text-red-600",
    url: (v: string) => v,
  },
  {
    key: "spotify",
    label: "Spotify",
    Icon: FaSpotify,
    hoverClass: "hover:text-green-500",
    url: (v: string) => v,
  },
  {
    key: "appleMusic",
    label: "Apple Music",
    Icon: FaApple,
    hoverClass: "hover:text-white",
    url: (v: string) => v,
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: FaFacebook,
    hoverClass: "hover:text-blue-600",
    url: (v: string) => v,
  },
  {
    key: "website",
    label: "Website",
    Icon: Globe,
    hoverClass: "hover:text-gold",
    url: (v: string) => v,
  },
];

export default function SocialLinks({ links }: SocialLinksProps) {
  const active = socialItems.filter(
    (item) =>
      links[item.key] &&
      typeof links[item.key] === "string" &&
      (links[item.key] as string).trim().length > 0
  );

  if (active.length === 0) return null;

  return (
    <section className="py-8 px-4 border-t border-white/5">
      <div className="container mx-auto max-w-6xl">
        <p className="text-center text-white/30 text-xs uppercase tracking-[0.15em] mb-4">
          Follow
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          {active.map((item) => (
            <a
              key={item.key}
              href={item.url((links[item.key] as string).trim())}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              title={item.label}
              className={`w-11 h-11 rounded-full bg-white/[0.04] border border-white/5 flex items-center justify-center text-white/40 ${item.hoverClass} hover:border-current transition-all`}
            >
              <item.Icon size={19} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
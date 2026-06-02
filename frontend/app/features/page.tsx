"use client";

import {
  Shield,
  Music,
  Video,
  Radio,
  Globe,
  Crown,
  Heart,
  Users,
  Zap,
  Lock,
  Camera,
  MessageCircle,
  CreditCard,
  BarChart3,
  Sparkles,
  Smartphone,
  Cloud,
  Gift,
  BadgeCheck,
  Headphones,
  Mic,
  Film,
  Trophy,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: BadgeCheck,
    title: "ID + Selfie Verification",
    description: "Every account is verified through government ID and live selfie authentication. Zero fake accounts guaranteed.",
    category: "Security",
  },
  {
    icon: Music,
    title: "Music Distribution",
    description: "Distribute your tracks to Spotify, Apple Music, YouTube Music, and all major streaming platforms worldwide.",
    category: "Creators",
  },
  {
    icon: Video,
    title: "Video Content",
    description: "Upload and share high-quality video content. Music videos, behind-the-scenes, vlogs, and more.",
    category: "Creators",
  },
  {
    icon: Radio,
    title: "Live Streaming",
    description: "Broadcast live to your fans in real-time. Host concerts, Q&A sessions, studio sessions, and exclusive events.",
    category: "Creators",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Connect with fans across 150+ countries. Your content reaches every corner of the globe.",
    category: "Distribution",
  },
  {
    icon: Crown,
    title: "Creator Subscriptions",
    description: "Fans subscribe to your profile for exclusive content, early access, and special perks. You set the price.",
    category: "Monetization",
  },
  {
    icon: Gift,
    title: "Tips & Donations",
    description: "Fans can send tips directly to creators. Real-time payouts. No middlemen taking excessive cuts.",
    category: "Monetization",
  },
  {
    icon: CreditCard,
    title: "Merchandise Sales",
    description: "Sell branded merchandise directly through your profile. Integrated storefront with fulfillment support.",
    category: "Monetization",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Deep insights into your audience. Track streams, engagement, revenue, and growth metrics in real-time.",
    category: "Creators",
  },
  {
    icon: TrendingUp,
    title: "70% Revenue Share",
    description: "Creators keep up to 70% of all earnings. We believe in fair compensation for your art.",
    category: "Monetization",
  },
  {
    icon: Heart,
    title: "Pure Entertainment Feed",
    description: "No politics. No news. No violence. Just music, videos, and content that brings joy.",
    category: "Experience",
  },
  {
    icon: Shield,
    title: "Zero Fake Accounts",
    description: "Our verified-only model means every interaction is with a real person. No bots, no trolls, no manipulation.",
    category: "Security",
  },
  {
    icon: Lock,
    title: "Content Protection",
    description: "Advanced DRM and watermarking protect your content from unauthorized distribution and piracy.",
    category: "Security",
  },
  {
    icon: Users,
    title: "Real Community",
    description: "Engage with verified fans who genuinely support your work. Build meaningful connections.",
    category: "Experience",
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    description: "Verified-to-verified messaging. No spam. No harassment. Real conversations between real people.",
    category: "Experience",
  },
  {
    icon: Cloud,
    title: "Cloud Storage",
    description: "Unlimited cloud storage for your content. Access your media library from anywhere, anytime.",
    category: "Creators",
  },
  {
    icon: Smartphone,
    title: "PWA Mobile App",
    description: "Full-featured progressive web app. Install on any device. Works offline. No app store required.",
    category: "Platform",
  },
  {
    icon: Camera,
    title: "Photo Galleries",
    description: "Create stunning photo galleries. Showcase your visual art, behind-the-scenes, and exclusive content.",
    category: "Creators",
  },
  {
    icon: Film,
    title: "Video Library",
    description: "Organize your video content into playlists and collections. Fans can binge-watch your entire catalog.",
    category: "Creators",
  },
  {
    icon: Mic,
    title: "Podcast Support",
    description: "Host and distribute your podcast. Reach listeners across all major podcast platforms.",
    category: "Creators",
  },
  {
    icon: Trophy,
    title: "Creator Badges",
    description: "Earn recognition badges for milestones, achievements, and community contributions. Stand out from the crowd.",
    category: "Gamification",
  },
  {
    icon: Headphones,
    title: "High-Fidelity Audio",
    description: "Stream in lossless quality. Your fans hear every detail of your music as it was meant to be heard.",
    category: "Platform",
  },
  {
    icon: Sparkles,
    title: "AI Content Discovery",
    description: "Smart recommendations based on your taste. Discover new creators and content you'll actually love.",
    category: "Experience",
  },
  {
    icon: Zap,
    title: "Instant Payouts",
    description: "Real-time earnings tracking and instant payouts. No waiting weeks for your money to arrive.",
    category: "Monetization",
  },
];

const categories = ["All", "Creators", "Monetization", "Security", "Experience", "Platform", "Distribution", "Gamification"];

import { useState } from "react";

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredFeatures =
    activeCategory === "All"
      ? features
      : features.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      {/* Hero Section */}
      <div className="relative h-[50vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/comparison-bg.jpg"
            alt="STEEZE Features"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black" />
        </div>
        <div className="relative z-10 container mx-auto max-w-4xl text-center pt-28 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 text-gold text-sm mb-6">
            <Sparkles size={16} /> Powered by ZeusLiveStudio
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gold mb-4">
            STEEZE Features
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Everything you need to create, share, and monetize — or discover, enjoy, and support. Built for the future of entertainment.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-gold text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-6 border border-white/10 hover:border-gold/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/30 transition-all">
                <feature.icon className="text-gold" size={24} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                  {feature.category}
                </span>
              </div>
              <p className="text-white/50 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40 text-lg">No features found in this category.</p>
          </div>
        )}
      </div>

      {/* Comparison Section */}
      <div className="py-16 bg-gold/5">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why <span className="text-gold">STEEZE</span>?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              We're different from every other platform. Here's why creators and fans choose STEEZE.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <BadgeCheck className="text-green-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">STEEZE</h3>
              <ul className="text-white/60 text-sm space-y-2">
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Verified profiles only
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Up to 70% revenue share
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  No fake accounts or bots
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Pure entertainment focus
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Global music distribution
                </li>
              </ul>
            </div>
            <div className="glass-card p-8 text-center opacity-60">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Users className="text-red-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Legacy Social Media</h3>
              <ul className="text-white/60 text-sm space-y-2">
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Massive bot & fake account problem
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Creators earn pennies
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Algorithm-driven outrage
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Mixed with news & politics
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  No distribution tools
                </li>
              </ul>
            </div>
            <div className="glass-card p-8 text-center opacity-60">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Music className="text-yellow-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Other Platforms</h3>
              <ul className="text-white/60 text-sm space-y-2">
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Limited creator tools
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Low revenue splits
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  No verification system
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Single content type focus
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Closed ecosystems
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 container mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Experience <span className="text-gold">STEEZE</span>?
        </h2>
        <p className="text-white/60 mb-8 max-w-xl mx-auto">
          Join the platform that puts creators first and gives fans pure, verified entertainment.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/signup/creator"
            className="px-8 py-3 bg-gold text-black rounded-full font-bold hover:bg-gold/90 transition-all"
          >
            Become a Creator
          </a>
          <a
            href="/signup/vibes"
            className="px-8 py-3 border border-gold text-gold rounded-full font-bold hover:bg-gold/10 transition-all"
          >
            Join as VIBE
          </a>
        </div>
      </div>
    </div>
  );
}
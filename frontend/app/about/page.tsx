'use client';

import { Zap, Music, Users, TrendingUp, Crown, Sparkles } from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: Zap,
      title: 'Your STEEZE, Your Energy',
      description: 'STEEZE is the energy creators bring. It\'s your unique style, vibe, and presence. We help you showcase it.'
    },
    {
      icon: Music,
      title: 'Premium Templates',
      description: 'Choose from 7 signature STEEZE templates designed by top creators. Each one is a complete website experience.'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'Join a community of creators who are redefining what it means to connect with fans.'
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Audience',
      description: 'Built-in tools to help you reach more fans, monetize your content, and build your brand.'
    },
    {
      icon: Crown,
      title: 'Creator Owned',
      description: 'You own your content, your audience, and your STEEZE. We\'re just here to power your vision.'
    },
    {
      icon: Sparkles,
      title: 'Your VIBES, Their Feeling',
      description: 'VIBES is what fans feel when they experience your STEEZE. Create moments that matter.'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-gold/20 to-black py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gold mb-4">About STEEZE</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Empowering creators to share their STEEZE and deliver unforgettable VIBES.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Mission</h2>
          <div className="w-20 h-1 bg-gold mx-auto mb-6"></div>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            To give every creator a platform that truly represents their STEEZE. 
            No compromises. No templates that look like everyone else. Just pure, authentic energy.
          </p>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gold mb-4">STEEZE & VIBES</h2>
              <div className="w-20 h-1 bg-gold mb-6"></div>
              <p className="text-gray-300 text-lg mb-4">
                <span className="text-gold font-bold">STEEZE</span> is the energy creators bring. 
                It's your unique style, your presence, your essence.
              </p>
              <p className="text-gray-300 text-lg">
                <span className="text-gold font-bold">VIBES</span> is what fans feel when they experience your STEEZE. 
                It's the connection, the emotion, the moment.
              </p>
              <div className="mt-8 p-4 bg-black/50 border border-gold/20 rounded-lg">
                <p className="text-white italic">
                  "No STEEZE = No VIBES. Your energy creates their feeling."
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gold/10 to-black p-8 rounded-xl border border-gold/20">
              <h3 className="text-2xl font-bold text-white mb-4">Why Creators Choose STEEZE</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">✦</span>
                  <span className="text-gray-300">Full website-style profiles, not social media grids</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">✦</span>
                  <span className="text-gray-300">7 premium templates designed by creators</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">✦</span>
                  <span className="text-gray-300">Monetize your content your way</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">✦</span>
                  <span className="text-gray-300">Own your audience, no algorithms</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">✦</span>
                  <span className="text-gray-300">Built in Cape Town, South Africa</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Makes STEEZE Different</h2>
          <div className="w-20 h-1 bg-gold mx-auto mb-6"></div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            We built STEEZE for creators who refuse to blend in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gold/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-gold/10 via-black to-gold/10 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find Your STEEZE?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join creators who are already sharing their energy and creating unforgettable VIBES.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="px-8 py-3 bg-gold hover:bg-gold-dark text-black font-semibold rounded-lg transition-all duration-300 hover:scale-105"
            >
              Become a Creator
            </a>
            <a
              href="/explore"
              className="px-8 py-3 border border-gold text-gold hover:bg-gold/10 rounded-lg transition-all duration-300"
            >
              Explore Creators
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
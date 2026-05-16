"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";
import { Shield, Music, Zap, MessageCircle, CreditCard, Users } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Creators",
    desc: "Every creator is identity-verified via government ID. The blue badge means they're real—no bots, no fakes."
  },
  {
    icon: Music,
    title: "Pure Entertainment",
    desc: "Music, Comedy, Dance, Drama, Entertainment. No politics, no news, no violence, no sadness."
  },
  {
    icon: Zap,
    title: "PWA Installed",
    desc: "Install STEEZE on any device as a Progressive Web App. Fast, offline-capable, with push notifications."
  },
  {
    icon: MessageCircle,
    title: "Creator-Fan Connection",
    desc: "Direct messaging between verified creators and fans. Premium subscribers get exclusive access."
  },
  {
    icon: CreditCard,
    title: "PayFast Payments",
    desc: "Secure payments via PayFast. Multiple payment methods for subscriptions, tips, and exclusive content."
  },
  {
    icon: Users,
    title: "Two-Role Platform",
    desc: "Be a Creator and monetize your content, or be a Fan and support your favorite entertainers."
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24">
        <div className="max-w-4xl mx-auto px-4">
          <BackToHomeButton />
        </div>
        <section className="relative py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                Features
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              Everything you need for pure entertainment, built into one platform.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 pb-24">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card p-6 md:p-8">
                <feature.icon className="text-gold mb-4" size={32} />
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto mt-12">
            <div className="glass-card p-8 text-center">
              <h2 className="text-xl font-bold text-gold mb-4">Coming Soon</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white/40 text-sm">
                <div className="glass p-4 rounded-xl">
                  <p className="text-white font-semibold">Zeusonic Audio</p>
                  <p>Spatial audio streaming</p>
                </div>
                <div className="glass p-4 rounded-xl">
                  <p className="text-white font-semibold">Live Streaming</p>
                  <p>ZeusLiveStudio integration</p>
                </div>
                <div className="glass p-4 rounded-xl">
                  <p className="text-white font-semibold">AI Discovery</p>
                  <p>Smart content recommendations</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
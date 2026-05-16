"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";
import { Briefcase, Heart, Globe } from "lucide-react";

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24">
        <div className="max-w-4xl mx-auto px-4">
          <BackToHomeButton />
        </div>
        {/* Hero */}
        <section className="relative py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/10 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                Join the STEEZE Team
              </span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Help us build Africa's premier verified entertainment platform. We're
              looking for passionate people who believe in pure entertainment.
            </p>
          </div>
        </section>

        {/* Culture */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gold mb-8">Our Culture</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <Globe className="mx-auto text-neon-blue mb-4" size={36} />
                  <h3 className="text-white font-semibold mb-2">Remote-First</h3>
                  <p className="text-white/50 text-sm">
                    Work from anywhere in Africa. We believe talent has no borders.
                  </p>
                </div>
                <div className="text-center">
                  <Heart className="mx-auto text-gold mb-4" size={36} />
                  <h3 className="text-white font-semibold mb-2">Entertainment-First</h3>
                  <p className="text-white/50 text-sm">
                    We love what we build. Music, comedy, dance—it's in our DNA.
                  </p>
                </div>
                <div className="text-center">
                  <Briefcase className="mx-auto text-neon-blue mb-4" size={36} />
                  <h3 className="text-white font-semibold mb-2">Growth-First</h3>
                  <p className="text-white/50 text-sm">
                    Fast-paced startup environment with room to grow and lead.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gold mb-6">Current Openings</h2>
              <div className="glass p-8 rounded-xl text-center mb-8">
                <Briefcase className="mx-auto text-white/20 mb-4" size={48} />
                <h3 className="text-white font-semibold text-lg mb-2">No Open Positions Yet</h3>
                <p className="text-white/50">
                  Check back soon for opportunities. We're growing fast and will be
                  hiring across engineering, design, and operations.
                </p>
              </div>
              <div className="text-center">
                <p className="text-white/50 text-sm">
                  Want to be considered early? Send your CV and portfolio to{" "}
                  <a href="mailto:careers@steeze.com" className="text-gold hover:underline font-semibold">
                    careers@steeze.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gold mb-8">Why Work at STEEZE?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  "Competitive salary packages",
                  "Flexible remote work",
                  "Equity opportunities",
                  "Health & wellness benefits",
                  "Professional development budget",
                  "Annual team retreats in Cape Town",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-gold text-xl">✦</span>
                    <span className="text-white/70">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="py-16 px-4 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card p-8">
              <h3 className="text-white font-semibold mb-2">Headquarters</h3>
              <p className="text-white/50">
                ZeusTech · Cape Town, South Africa<br />
                <span className="text-gold text-sm">Building for Africa, from Africa.</span>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
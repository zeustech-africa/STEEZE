"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";
import { Newspaper } from "lucide-react";

export default function BlogPage() {
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
            <Newspaper className="mx-auto text-gold mb-4" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                STEEZE Blog
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              Updates, stories, and announcements from the STEEZE team.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 pb-24">
          <div className="max-w-3xl mx-auto">
            <div className="glass-card p-12 text-center">
              <p className="text-white/50 text-lg mb-2">📝 Coming Soon</p>
              <p className="text-white/30 text-sm">
                Our blog is being set up. Check back soon for updates from the STEEZE team, creator spotlights, platform news, and more.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
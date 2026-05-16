"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function GuidelinesPage() {
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
                Content Guidelines
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              What's allowed on STEEZE — and what's not. Pure entertainment only.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Approved Content */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="text-green-400" size={28} />
                <h2 className="text-2xl font-bold text-green-400">Approved Content</h2>
              </div>
              <p className="text-white/70 mb-4">STEEZE is built for pure entertainment. The following categories are welcome:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { emoji: "🎵", label: "Music", desc: "Original songs, covers, instrumentals, music videos" },
                  { emoji: "😂", label: "Comedy", desc: "Stand-up, skits, sketches, funny moments" },
                  { emoji: "💃", label: "Dance", desc: "Choreography, dance challenges, performances" },
                  { emoji: "🎭", label: "Drama", desc: "Short films, series, theatrical performances" },
                  { emoji: "🎉", label: "Entertainment", desc: "Talent shows, variety content, lifestyle" },
                ].map((item) => (
                  <div key={item.label} className="glass p-4 rounded-xl flex items-start gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{item.label}</p>
                      <p className="text-white/40 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prohibited Content */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <XCircle className="text-red-400" size={28} />
                <h2 className="text-2xl font-bold text-red-400">Prohibited Content</h2>
              </div>
              <p className="text-white/70 mb-4">The following content is strictly prohibited. Posting prohibited content may result in removal, account suspension, or permanent ban.</p>
              <div className="space-y-3">
                {[
                  { label: "Politics", desc: "No political commentary, campaigning, or political news of any kind." },
                  { label: "News", desc: "No current affairs, journalism, or news reporting." },
                  { label: "Violence", desc: "No violent, graphic, or gory content. No fighting or weapons displays." },
                  { label: "Sad Stories", desc: "No trauma-based content, distressing stories, or emotional manipulation." },
                  { label: "Hate Speech", desc: "No racism, sexism, homophobia, xenophobia, or discrimination." },
                  { label: "Nudity", desc: "No nudity, sexual content, or sexually suggestive material." },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-red-400/5 border border-red-400/10">
                    <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-red-300 font-semibold text-sm">{item.label}</p>
                      <p className="text-white/40 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consequences */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="text-gold" size={28} />
                <h2 className="text-2xl font-bold text-gold">Consequences of Violation</h2>
              </div>
              <div className="space-y-4 text-white/70">
                <div className="glass p-4 rounded-xl">
                  <p className="text-white font-semibold">First Offense</p>
                  <p className="text-sm">Content removed + warning notification</p>
                </div>
                <div className="glass p-4 rounded-xl">
                  <p className="text-white font-semibold">Second Offense</p>
                  <p className="text-sm">Content removed + 7-day posting suspension</p>
                </div>
                <div className="glass p-4 rounded-xl">
                  <p className="text-white font-semibold">Third Offense</p>
                  <p className="text-sm">Account permanently suspended</p>
                </div>
              </div>
              <p className="text-white/40 text-xs mt-4">
                Severe violations (hate speech, illegal content) may result in immediate permanent suspension without warning.
              </p>
            </div>

            {/* Appeal Process */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="text-neon-blue" size={28} />
                <h2 className="text-2xl font-bold text-gold">Appeal Process</h2>
              </div>
              <p className="text-white/70 mb-4">
                If you believe your content was removed in error, you may appeal the decision:
              </p>
              <div className="space-y-3 text-white/70 text-sm">
                <p>1. You'll receive a notification when content is removed, with appeal instructions.</p>
                <p>2. Submit your appeal within 14 days through the link in the notification.</p>
                <p>3. Our review team will evaluate your appeal within 5 business days.</p>
                <p>4. You'll be notified of the outcome. Appeal decisions are final.</p>
              </div>
              <p className="text-white/40 text-xs mt-4">
                For urgent matters, contact{" "}
                <a href="mailto:content@steeze.com" className="text-gold hover:underline">content@steeze.com</a>.
              </p>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
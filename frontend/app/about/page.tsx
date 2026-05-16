"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24">
        <div className="max-w-4xl mx-auto px-4">
          <BackToHomeButton />
        </div>
        {/* Hero Banner */}
        <section className="relative py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                About STEEZE
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              The verified entertainment platform, powered by ZeusLiveStudio.
            </p>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gold mb-6">Our Mission</h2>
              <p className="text-white/80 text-lg leading-relaxed mb-4">
                STEEZE exists to create a pure entertainment ecosystem where only verified creators
                can post content. We are committed to building Africa's premier entertainment
                platform—free from politics, violence, sadness, and fake content.
              </p>
              <p className="text-white/80 text-lg leading-relaxed">
                Our mission is simple: <span className="text-gold font-semibold">You want style, you want entertainment,
                you want music... you need STEEZE.</span> We provide a safe, verified space where
                creators and fans connect through authentic entertainment.
              </p>
            </div>
          </div>
        </section>

        {/* Company History */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gold mb-6">Our Story</h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  <span className="text-neon-blue font-semibold">ZeusTech</span> was founded in
                  Cape Town, South Africa, with a vision to revolutionize digital entertainment
                  across the African continent and beyond.
                </p>
                <p>
                  Recognizing the challenges creators face—from content piracy to platform
                  saturation with negative content—ZeusTech developed{" "}
                  <span className="text-gold font-semibold">STEEZE</span> as the solution:
                  a verified-only entertainment platform that prioritizes quality, authenticity,
                  and pure entertainment.
                </p>
                <p>
                  In 2026, ZeusTech launched{" "}
                  <span className="text-neon-blue font-semibold">ZeusLiveStudio</span>, the
                  powerhouse technology behind STEEZE, enabling seamless creator tools, fan
                  engagement features, and the revolutionary Zeusonic audio engine.
                </p>
                <p>
                  Today, STEEZE is poised to become Africa's leading entertainment platform,
                  built on three core pillars: <span className="text-gold">Verification</span>,
                  <span className="text-gold"> Quality</span>, and{" "}
                  <span className="text-gold">Community</span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Vision */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gold mb-6">The Vision for African Entertainment</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🌍</div>
                  <h3 className="text-white font-semibold mb-2">African First</h3>
                  <p className="text-white/50 text-sm">
                    Built in Africa, for Africa—showcasing the continent's incredible
                    creative talent to the world.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">✅</div>
                  <h3 className="text-white font-semibold mb-2">Verified Only</h3>
                  <p className="text-white/50 text-sm">
                    Every creator is verified. Every piece of content is approved. No fakes,
                    no bots, no drama.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🎵</div>
                  <h3 className="text-white font-semibold mb-2">Pure Entertainment</h3>
                  <p className="text-white/50 text-sm">
                    Music, comedy, dance, drama—only the content that makes life better.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gold mb-6">Our Team</h2>
              <p className="text-white/70 mb-8">
                STEEZE is built by a passionate team at ZeusTech in Cape Town, South Africa.
                We are engineers, designers, and entertainment enthusiasts united by a single goal:
                building the best entertainment platform in the world.
              </p>
              <div className="glass p-6 rounded-xl text-center">
                <p className="text-white/50 text-sm">
                  Full team bios coming soon. We're growing fast—check our{" "}
                  <a href="/careers" className="text-gold hover:underline">Careers page</a>{" "}
                  for opportunities to join us.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gold text-lg font-semibold mb-4">Powered by ZeusLiveStudio</p>
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} ZeusTech. Cape Town, South Africa.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
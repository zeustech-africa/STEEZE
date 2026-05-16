"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const vibeImages = [
  "/images/fan-tier-free.jpg",
  "/images/fan-tier-basic.jpg",
  "/images/fan-tier-premium.jp.jpg",
  "/images/fan-tier-gold.jpg",
];

const ForVibesSection = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-40"
      >
        <source src="/videos/fans-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/70 -z-10" />

      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Your <span className="text-gold">Escape</span> from Doomscrolling
            </h2>
            <p className="text-white/80 text-lg mb-6">
              Leave the news behind. No politics. No wars. No accidents. No deaths.
            </p>
            <p className="text-white/60 mb-6">
              Just pure entertainment – music, comedy, dance, drama, fashion, lifestyle.
            </p>
            <ul className="space-y-3">
              {[
                "Follow your favorite creators",
                "Like, comment, save, repost",
                "Subscribe to unlock downloads, DMs, and video calls",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-white/70">
                  <CheckCircle size={18} className="text-gold" /> {f}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3"
          >
            {vibeImages.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                <Image src={img} alt={`VIBE ${idx + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ForVibesSection;
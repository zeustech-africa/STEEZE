"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { DollarSign, ShieldCheck, Sparkles } from "lucide-react";

const cards = [
  {
    title: "Monetize Your STEEZE",
    description:
      "Set your own prices. Keep 70% (independent) or 50/50 (signed to ZeusLiveStudio). Your content, your rules.",
    icon: DollarSign,
    image: "/images/creator-card-1.jpg",
    gradient: "from-gold/20 to-transparent",
  },
  {
    title: "Verified Badge",
    description:
      "ID + facial verification. No fake accounts. Your fans know you're real. Get the gold checkmark.",
    icon: ShieldCheck,
    image: "/images/creator-card-2.jpg",
    gradient: "from-neon-blue/20 to-transparent",
  },
  {
    title: "Zeusonic Coming Soon",
    description:
      "AI music production studio. Generate beats, melodies, and full songs. Launching soon.",
    icon: Sparkles,
    image: "/images/creator-card-3.jpg",
    gradient: "from-purple-500/20 to-transparent",
  },
];

const ForCreators = () => {
  return (
    <section id="creators" className="py-24 px-4 relative overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source src="/videos/creators-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/80 -z-10" />

      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Built For <span className="text-gold">Creators</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Everything you need to share your art, grow your audience, and earn
            a living.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden group cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${card.gradient}`}
                />
              </div>
              <div className="p-6">
                <card.icon className="text-gold mb-3" size={32} />
                <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                <p className="text-white/60 text-sm">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ForCreators;
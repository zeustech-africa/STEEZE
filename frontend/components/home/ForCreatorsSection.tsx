"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Globe, DollarSign, TrendingUp } from "lucide-react";

const creatorCards = [
  {
    title: "Your Own Website",
    description:
      "Your profile is a fully designed website – like Burna Boy, Drake, The Weeknd. Show your world to the world.",
    icon: Globe,
    image: "/images/creator-card-1.jpg",
  },
  {
    title: "Two Ways to Earn",
    description:
      "Signed to ZeusLiveStudio: FREE platform, 50% of all revenues. Independent: Monthly subscription, 70% creator / 30% platform.",
    icon: DollarSign,
    image: "/images/creator-card-2.jpg",
  },
  {
    title: "Global Distribution",
    description:
      "Distribute to DistroKid, YouTube, Spotify, Apple Music, Tidal. No algorithm hiding your content – your followers see your posts.",
    icon: TrendingUp,
    image: "/images/creator-card-3.jpg",
  },
];

const ForCreatorsSection = () => {
  return (
    <section className="py-20 px-4 bg-black/90">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            For <span className="text-gold">Creators</span>
          </h2>
          <p className="text-white/60 text-lg max-w-3xl mx-auto">
            You have STEEZE as an artist or content creator, you already have a website – like Burna
            Boy, Drake, The Weeknd. Show your world to the world.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {creatorCards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden group"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              </div>
              <div className="p-6">
                <div className="p-3 rounded-full bg-gold/20 w-fit mb-4">
                  <card.icon className="text-gold" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                <p className="text-white/60 text-sm">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gold/10 border border-gold/20 rounded-lg text-center">
          <p className="text-white/70">
            &ldquo;No algorithm hiding your content – your followers see your posts.
            Always.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
};

export default ForCreatorsSection;
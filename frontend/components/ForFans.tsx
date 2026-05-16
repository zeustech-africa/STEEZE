"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "R0",
    description: "Listen, like, comment, save posts",
    features: [
      "Listen to free content",
      "Like and comment",
      "Save posts to profile",
      "See ads",
    ],
    image: "/images/fan-tier-free.jpg",
    buttonClass: "border-white/30 text-white hover:border-gold",
    popular: false,
  },
  {
    name: "Basic",
    price: "R50",
    period: "/month",
    description: "Download free posts, no ads",
    features: [
      "Everything in Free",
      "Download free posts",
      "No ads",
      "Early access to some content",
    ],
    image: "/images/fan-tier-basic.jpg",
    buttonClass: "border-gold text-gold hover:bg-gold hover:text-black",
    popular: false,
  },
  {
    name: "Premium",
    price: "R99",
    period: "/month",
    description: "Download paid posts, exclusive content",
    features: [
      "Everything in Basic",
      "Download paid posts",
      "Exclusive creator content",
      "Priority support",
    ],
    image: "/images/fan-tier-premium.jp.jpg",
    buttonClass:
      "bg-gradient-to-r from-gold to-gold-dark text-black hover:shadow-lg",
    popular: true,
  },
  {
    name: "Gold",
    price: "R199",
    period: "/month",
    description: "DM creators, request video calls",
    features: [
      "Everything in Premium",
      "Direct message creators",
      "Request video calls",
      "Gold badge on profile",
    ],
    image: "/images/fan-tier-gold.jpg",
    buttonClass:
      "bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:shadow-2xl",
    popular: false,
  },
];

const ForFans = () => {
  return (
    <section id="fans" className="py-24 px-4 relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source src="/videos/fans-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/85 -z-10" />

      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-gold">STEEZE</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Subscribe to your favorite creators and unlock exclusive content,
            downloads, and direct access.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`glass-card relative overflow-hidden ${
                tier.popular
                  ? "border-gold shadow-xl shadow-gold/10"
                  : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-gold text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={tier.image}
                  alt={tier.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <div className="mb-3">
                  <span className="text-3xl font-bold text-gold">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-white/50">{tier.period}</span>
                  )}
                </div>
                <p className="text-white/60 text-sm mb-4">
                  {tier.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-white/70"
                    >
                      <CheckCircle size={14} className="text-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2 rounded-full border transition-all duration-300 ${tier.buttonClass}`}
                >
                  Subscribe
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ForFans;
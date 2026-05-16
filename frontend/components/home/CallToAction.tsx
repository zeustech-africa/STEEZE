"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const CallToAction = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-40"
      >
        <source src="/videos/zeusonic-teaser.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-black to-gold/20 -z-10" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="container mx-auto max-w-3xl text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Start your <span className="text-gold">STEEZE</span> journey today
        </h2>
        <p className="text-white/60 mb-8">
          Join thousands of creators and millions of VIBES already on STEEZE
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup/creator"
            className="px-8 py-4 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full text-lg hover:shadow-2xl transition-all"
          >
            Join as Creator
          </Link>
          <Link
            href="/signup/vibes"
            className="px-8 py-4 border-2 border-neon-blue text-neon-blue font-bold rounded-full text-lg hover:bg-neon-blue hover:text-black transition-all"
          >
            Join as VIBES
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default CallToAction;
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Shield, Star, Zap } from "lucide-react";

const ZeusLiveStudioSection = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/auth-bg.jpg')] bg-cover bg-center opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black to-gold/20" />

      <div className="relative z-10 container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex p-3 rounded-full bg-gold/20 mb-4">
                <Crown className="text-gold" size={32} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Join <span className="text-gold">ZeusLiveStudio</span>
              </h2>
              <p className="text-white/70 mb-6">
                STEEZE's official record label. Get signed and use the platform for FREE.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="p-3 bg-white/5 rounded-lg">
                  <Shield className="text-gold mx-auto mb-2" size={24} />
                  <p className="text-white font-semibold">FREE Platform</p>
                  <p className="text-white/50 text-sm">No monthly fees</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <Star className="text-gold mx-auto mb-2" size={24} />
                  <p className="text-white font-semibold">50/50 Split</p>
                  <p className="text-white/50 text-sm">All revenues</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <Zap className="text-gold mx-auto mb-2" size={24} />
                  <p className="text-white font-semibold">Priority Support</p>
                  <p className="text-white/50 text-sm">24/7 assistance</p>
                </div>
              </div>
              <Link
                href="/signup/creator"
                className="inline-block px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all"
              >
                Apply to Join ZeusLiveStudio →
              </Link>
            </div>
            <div className="relative rounded-xl overflow-hidden h-80 md:h-96">
              <Image
                src="/images/zeustechlivestudio.jpg"
                alt="ZeusLiveStudio"
                fill
                className="rounded-xl object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ZeusLiveStudioSection;

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Heart, MessageCircle, Bookmark } from "lucide-react";

const RepostSystemSection = () => {
  return (
    <section className="py-20 px-4 bg-black">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            VIBES can't post – but they can{" "}
            <span className="text-gold">REPOST</span>
          </h2>
          <p className="text-white/60 text-lg">
            Help your favorite creators go viral. One click. Big impact.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 text-center mb-12">
          <div className="p-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold/20 flex items-center justify-center mb-3">
              <Bookmark className="text-gold" size={28} />
            </div>
            <p className="text-white font-semibold">1. Save</p>
            <p className="text-white/50 text-sm">Save any post you love</p>
          </div>
          <div className="p-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold/20 flex items-center justify-center mb-3">
              <ArrowRight className="text-gold" size={28} />
            </div>
            <p className="text-white font-semibold">2. Repost</p>
            <p className="text-white/50 text-sm">Appears on your profile like you posted it</p>
          </div>
          <div className="p-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold/20 flex items-center justify-center mb-3">
              <Heart className="text-gold" size={28} />
            </div>
            <p className="text-white font-semibold">3. Engage</p>
            <p className="text-white/50 text-sm">Get likes and comments on your reposts</p>
          </div>
          <div className="p-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold/20 flex items-center justify-center mb-3">
              <MessageCircle className="text-gold" size={28} />
            </div>
            <p className="text-white font-semibold">4. Notify</p>
            <p className="text-white/50 text-sm">Creator gets notified and can thank you</p>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-white font-bold text-lg">Ready to start reposting?</p>
            <p className="text-white/50">Join STEEZE today and help creators go viral</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/signup/vibes"
              className="px-6 py-2 bg-gold text-black rounded-full font-semibold"
            >
              Join as VIBES
            </a>
            <a
              href="/signup/creator"
              className="px-6 py-2 border border-white/30 text-white rounded-full hover:border-gold"
            >
              Join as Creator
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RepostSystemSection;
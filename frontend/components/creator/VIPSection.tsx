"use client";

import { Crown, Lock, Music, Video, ImageIcon, Star, Zap, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface VIPContent {
  id: string;
  title: string;
  description?: string;
  type: "audio" | "video" | "image";
  mediaUrl?: string;
}

interface VIPSectionProps {
  vipContent: VIPContent[];
  isSubscribed: boolean;
  subscriptionTier: string | null;
}

const typeIcons = {
  audio: Music,
  video: Video,
  image: ImageIcon,
};

export default function VIPSection({
  vipContent,
  isSubscribed,
  subscriptionTier,
}: VIPSectionProps) {
  if (!vipContent || vipContent.length === 0) return null;

  const isGold = subscriptionTier === "gold";

  return (
    <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-black via-gold/5 to-black">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown size={22} className="text-gold" />
            <h2 className="text-2xl md:text-3xl font-bold text-gold">
              VIP Exclusive
            </h2>
            <Crown size={22} className="text-gold" />
          </div>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Premium content available only to Gold subscribers
          </p>
        </div>

        {/* Locked state — non-gold */}
        {!isGold ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-8 text-center max-w-lg mx-auto border border-gold/10"
          >
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-gold" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">
              Gold Members Only
            </h3>
            <p className="text-white/55 mb-6 text-sm leading-relaxed">
              Upgrade to Gold to access exclusive content, DM creators directly,
              and request private video calls.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              {[
                { icon: Star, label: "Exclusive Content" },
                { icon: MessageSquare, label: "Direct Messages" },
                { icon: Video, label: "Video Calls" },
              ].map((perk) => (
                <div key={perk.label} className="flex flex-col items-center gap-1">
                  <perk.icon size={18} className="text-gold/70" />
                  <span className="text-white/40 text-[10px] leading-tight">
                    {perk.label}
                  </span>
                </div>
              ))}
            </div>

            <button className="px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg hover:shadow-gold/20 transition-all text-sm">
              Upgrade to Gold
            </button>
          </motion.div>
        ) : (
          /* Unlocked state — gold subscriber */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vipContent.map((item, idx) => {
              const Icon = typeIcons[item.type] || Star;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -2 }}
                  className="glass-card rounded-xl p-5 border border-gold/10 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Icon size={18} className="text-gold" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm line-clamp-1">
                        {item.title}
                      </h3>
                      <span className="text-gold/60 text-[11px] uppercase tracking-wider">
                        {item.type}
                      </span>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
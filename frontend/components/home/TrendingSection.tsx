"use client";

import Image from "next/image";
import { Play, Headphones, Video, Laugh, Sparkles, Heart } from "lucide-react";
import { motion } from "framer-motion";

const trendingItems = [
  { id: 1, title: "Latest Trending Song", image: "/images/how-it-works-1.jpg", type: "song", icon: Headphones, plays: "1.2M" },
  { id: 2, title: "Trending Music Video", image: "/images/how-it-works-2.jpg", type: "video", icon: Video, plays: "890K" },
  { id: 3, title: "Funny Comedy Skit", image: "/images/how-it-works-3.jpg", type: "comedy", icon: Laugh, plays: "2.1M" },
  { id: 4, title: "Dance Challenge", image: "/images/creator-card-1.jpg", type: "dance", icon: Sparkles, plays: "567K" },
  { id: 5, title: "Fashion Lookbook", image: "/images/creator-card-2.jpg", type: "fashion", icon: Heart, plays: "345K" },
  { id: 6, title: "Behind the Scenes", image: "/images/creator-card-3.jpg", type: "bts", icon: Video, plays: "432K" },
];

const TrendingSection = () => {
  return (
    <section id="trending" className="py-20 px-4 bg-black">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            What's <span className="text-gold">Trending</span> on STEEZE
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            The hottest content right now. Music, comedy, dance, fashion.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {trendingItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2 text-white/80 text-xs">
                  <item.icon size={14} className="text-gold" /> {item.plays}
                </div>
                <p className="text-white text-sm font-semibold truncate">{item.title}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all">
                <button className="w-12 h-12 rounded-full bg-gold flex items-center justify-center text-black">
                  <Play size={24} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
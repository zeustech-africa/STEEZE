"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const galleryItems = [
  { image: "/images/how-it-works-1.jpg", title: "Latest Music Release", category: "Music" },
  { image: "/images/how-it-works-2.jpg", title: "Trending Dance Challenge", category: "Dance" },
  { image: "/images/how-it-works-3.jpg", title: "Comedy Clip", category: "Comedy" },
  { image: "/images/creator-card-1.jpg", title: "Fashion Trends", category: "Fashion" },
  { image: "/images/creator-card-2.jpg", title: "Behind the Scenes", category: "BTS" },
  { image: "/images/creator-card-3.jpg", title: "Music Video", category: "Video" },
  { image: "/images/fan-tier-basic.jpg", title: "Live Performance", category: "Live" },
  { image: "/images/fan-tier-premium.jp.jpg", title: "Studio Session", category: "Studio" },
];

const LiveGallerySection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    const scrollInterval = setInterval(() => {
      if (
        scrollContainer.scrollLeft + scrollContainer.clientWidth >=
        scrollContainer.scrollWidth
      ) {
        scrollContainer.scrollLeft = 0;
      } else {
        scrollContainer.scrollLeft += 1;
      }
    }, 30);
    return () => clearInterval(scrollInterval);
  }, []);

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
            What You'll See on <span className="text-gold">STEEZE</span>
          </h2>
          <p className="text-white/60 text-lg">
            Music, comedy, dance, fashion, behind-the-scenes – all in one place
          </p>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-80 md:w-96 group cursor-pointer"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs text-gold font-semibold">{item.category}</span>
                  <p className="text-white font-semibold">{item.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </section>
  );
};

export default LiveGallerySection;
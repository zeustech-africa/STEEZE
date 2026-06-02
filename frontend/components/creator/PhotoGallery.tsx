"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReportButton from "../ReportButton";

interface GalleryPhoto {
  id: string;
  url: string;
  story?: string;
  userType?: string;
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!photos || photos.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setTimeout(() => setSelectedIndex(null), 200);
  };

  const goNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const goPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "Escape") closeLightbox();
  };

  const hasManyPhotos = photos.length >= 6;

  return (
    <section className="py-12 md:py-16 px-4 bg-black/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gold mb-8 text-center flex items-center justify-center gap-2">
          <ImageIcon size={24} className="text-gold" /> Gallery
        </h2>

        <div
          className={`grid gap-3 md:gap-4 ${
            hasManyPhotos
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-2 md:grid-cols-3"
          }`}
        >
          {photos.slice(0, hasManyPhotos ? 8 : photos.length).map((photo, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ scale: 1.02 }}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-white/5"
              onClick={() => openLightbox(idx)}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openLightbox(idx)}
            >
              <Image
                src={photo.url}
                alt={photo.story || `Gallery photo ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* ZLS badge overlay */}
              {photo.userType === 'zls_artist' && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="px-1.5 py-0.5 bg-gold/80 text-black text-xs font-bold rounded">
                    ZLS
                  </div>
                </div>
              )}

              {/* Hover overlay with story */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center p-4">
                {photo.story && (
                  <p className="text-white text-xs md:text-sm text-center line-clamp-2">
                    {photo.story}
                  </p>
                )}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                  <ReportButton
                    targetType="post"
                    targetId={photo.id}
                    targetTitle={photo.story || "Photo"}
                    variant="icon"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 md:top-6 md:right-6 text-white/50 hover:text-white z-10 transition-colors"
              aria-label="Close gallery"
            >
              <X size={28} />
            </button>

            {/* Previous */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 md:left-6 text-white/60 hover:text-white z-10 transition-all hover:scale-110"
                aria-label="Previous photo"
              >
                <ChevronLeft size={40} />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="relative w-[90vw] h-[80vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[selectedIndex].url}
                alt={photos[selectedIndex].story || "Gallery photo"}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
              {photos[selectedIndex].story && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="inline-block px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white/80 text-sm">
                    {photos[selectedIndex].story}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Next */}
            {selectedIndex < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 md:right-6 text-white/60 hover:text-white z-10 transition-all hover:scale-110"
                aria-label="Next photo"
              >
                <ChevronRight size={40} />
              </button>
            )}

            {/* Counter */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 text-white/40 text-sm">
              {selectedIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
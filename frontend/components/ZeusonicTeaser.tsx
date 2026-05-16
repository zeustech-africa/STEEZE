"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send } from "lucide-react";

const ZeusonicTeaser = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      console.log("Early access email:", email);
      setSubmitted(true);
      // TODO: Connect to backend API
    }
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source src="/videos/zeusonic-teaser.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-gold/20 -z-10" />

      <div className="relative z-10 container mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-gold/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-gold/30">
            <Sparkles className="text-gold animate-pulse-slow" size={18} />
            <span className="text-gold text-sm font-semibold">
              Coming Soon
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Zeusonic – <span className="text-gold">AI Music Studio</span>
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Generate beats, melodies, and full songs with AI. Coming soon to
            STEEZE creators. Sign up for early access.
          </p>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-5 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/50 focus:outline-none focus:border-gold transition-all"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-full flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                <Send size={18} />
                Notify Me
              </button>
            </form>
          ) : (
            <div className="bg-gold/20 border border-gold rounded-lg p-4 max-w-md mx-auto">
              <p className="text-gold">
                Thank you! We'll notify you when Zeusonic launches.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ZeusonicTeaser;
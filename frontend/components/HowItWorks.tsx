"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { UserPlus, CreditCard, Headphones } from "lucide-react";

const steps = [
  {
    title: "Sign Up & Verify",
    description:
      "Create your account. ID verification ensures everyone is real.",
    icon: UserPlus,
    image: "/images/how-it-works-1.jpg",
  },
  {
    title: "Subscribe or Create",
    description:
      "Fans subscribe to tiers. Creators upload and monetize content.",
    icon: CreditCard,
    image: "/images/how-it-works-2.jpg",
  },
  {
    title: "Enjoy or Earn",
    description:
      "Fans enjoy pure entertainment. Creators earn from their STEEZE.",
    icon: Headphones,
    image: "/images/how-it-works-3.jpg",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-24 px-4 bg-gradient-to-b from-black to-[#0A0A0A]"
    >
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            How <span className="text-gold">STEEZE</span> Works
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Three simple steps to start your entertainment journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-2 border-gold">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gold/20" />
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-gold to-gold-dark text-black font-bold text-xl mb-4 -mt-16 relative z-10 mx-auto">
                {index + 1}
              </div>
              <step.icon className="text-gold mx-auto mb-3" size={28} />
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-white/60">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
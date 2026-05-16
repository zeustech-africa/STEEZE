"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

const comparisons = [
  { feature: "Politics, news, violence", steeze: false, others: true },
  { feature: "Fake accounts", steeze: false, others: true },
  { feature: "Algorithm hides your content", steeze: false, others: true },
  { feature: "Creator website-style profile", steeze: true, others: false },
  { feature: "Repost to promote creators", steeze: true, others: false },
  { feature: "Download music", steeze: true, others: false },
  { feature: "DM and video calls with creators", steeze: true, others: false },
  { feature: "Verified only (no fake accounts)", steeze: true, others: false },
];

const ComparisonTable = () => {
  return (
    <section id="comparison" className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/comparison-bg.jpg')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-black/90" />

      <div className="relative z-10 container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Why <span className="text-gold">STEEZE</span> is Different
          </h2>
        </motion.div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-white font-bold">Feature</th>
                <th className="p-4 text-center text-white/50">Other Platforms</th>
                <th className="p-4 text-center text-gold">STEEZE</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, idx) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-white/80">{row.feature}</td>
                  <td className="p-4 text-center">
                    {row.others ? (
                      <CheckCircle className="inline text-green-500" size={20} />
                    ) : (
                      <XCircle className="inline text-red-500" size={20} />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.steeze ? (
                      <CheckCircle className="inline text-green-500" size={20} />
                    ) : (
                      <XCircle className="inline text-red-500" size={20} />
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
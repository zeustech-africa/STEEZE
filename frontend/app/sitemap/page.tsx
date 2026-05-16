"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";
import Link from "next/link";
import { FolderTree } from "lucide-react";

const siteLinks = [
  {
    section: "Main Pages",
    links: [
      { href: "/", label: "Home" },
      { href: "/features", label: "Features" },
      { href: "/blog", label: "Blog" },
      { href: "/sitemap", label: "Sitemap" },
    ],
  },
  {
    section: "About",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/careers", label: "Careers" },
      { href: "/brand", label: "Brand Center" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    section: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/guidelines", label: "Content Guidelines" },
      { href: "/dmca", label: "DMCA / Copyright" },
      { href: "/security", label: "Security Advisories" },
    ],
  },
  {
    section: "Support",
    links: [
      { href: "/help", label: "Help Center" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    section: "Download",
    links: [
      { href: "/download/android", label: "Android" },
      { href: "/download/ios", label: "iPhone" },
      { href: "/download/mac", label: "Mac / PC" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24">
        <div className="max-w-4xl mx-auto px-4">
          <BackToHomeButton />
        </div>
        <section className="relative py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <FolderTree className="mx-auto text-gold mb-4" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                Sitemap
              </span>
            </h1>
            <p className="text-white/60 text-lg">Complete directory of all STEEZE pages.</p>
          </div>
        </section>

        <section className="py-16 px-4 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {siteLinks.map((group) => (
                  <div key={group.section}>
                    <h2 className="text-gold text-sm font-semibold uppercase tracking-wider mb-3">
                      {group.section}
                    </h2>
                    <ul className="space-y-2">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="text-white/50 hover:text-gold text-sm transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-white/20 text-xs mt-8 pt-6 border-t border-white/10 text-center">
                © 2026 STEEZE – Powered by ZeusLiveStudio. All pages & links.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
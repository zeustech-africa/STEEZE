"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, MessageCircle, Heart, Share2, Music, Play, MapPin, Phone, Mail, Building, Shield, Crown } 
from "lucide-react";
import PWAInstallButton from "./PWAInstallButton";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black/95 border-t border-white/10 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* PWA Install Button */}
        <div className="mb-8">
          <PWAInstallButton />
        </div>

        {/* Main Footer Grid */}
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          {/* Company Info Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="text-gold" size={20} />
              <span className="text-gold font-bold text-lg">ZeusTech</span>
            </div>
            <p className="text-white/50 text-sm mb-3">
              STEEZE is a verified entertainment platform where only creators post and fans enjoy pure 
entertainment.
            </p>
            <div className="flex gap-3 mt-4">
              <Camera size={18} className="text-white/40 hover:text-gold cursor-pointer transition-colors" />
              <MessageCircle size={18} className="text-white/40 hover:text-gold cursor-pointer 
transition-colors" />
              <Heart size={18} className="text-white/40 hover:text-gold cursor-pointer transition-colors" />
              <Play size={18} className="text-white/40 hover:text-gold cursor-pointer transition-colors" />
              <Share2 size={18} className="text-white/40 hover:text-gold cursor-pointer transition-colors" />
              <Music size={18} className="text-white/40 hover:text-gold cursor-pointer transition-colors" />
            </div>
          </div>

          {/* What We Do */}
          <div>
            <h4 className="text-gold text-sm font-semibold mb-4 tracking-wider">WHAT WE DO</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-white/50 hover:text-gold text-sm 
transition-colors">Features</Link></li>
              <li><Link href="/blog" className="text-white/50 hover:text-gold text-sm 
transition-colors">Blog</Link></li>
              <li><Link href="/security" className="text-white/50 hover:text-gold text-sm 
transition-colors">Security</Link></li>
              <li><Link href="/signup/creator" className="text-white/50 hover:text-gold text-sm 
transition-colors">For Creators</Link></li>
              <li><Link href="/signup/vibes" className="text-white/50 hover:text-gold text-sm 
transition-colors">For VIBES</Link></li>
              <li><Link href="/advertise" className="text-white/50 hover:text-gold text-sm 
transition-colors">Advertise</Link></li>
            </ul>
          </div>

          {/* Who We Are */}
          <div>
            <h4 className="text-gold text-sm font-semibold mb-4 tracking-wider">WHO WE ARE</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-white/50 hover:text-gold text-sm 
transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="text-white/50 hover:text-gold text-sm 
transition-colors">Careers</Link></li>
              <li><Link href="/brand" className="text-white/50 hover:text-gold text-sm 
transition-colors">Brand Center</Link></li>
              <li><Link href="/privacy" className="text-white/50 hover:text-gold text-sm 
transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-white/50 hover:text-gold text-sm 
transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-white/50 hover:text-gold text-sm 
transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Get App */}
          <div>
            <h4 className="text-gold text-sm font-semibold mb-4 tracking-wider">GET APP</h4>
            <ul className="space-y-2">
              <li><Link href="/install" className="text-white/50 hover:text-gold text-sm transition-colors">Install App</Link></li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="text-gold text-sm font-semibold mb-4 tracking-wider">LEGAL & CONTACT</h4>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-white/50 hover:text-gold text-sm 
transition-colors">Contact Us</Link></li>
              <li><Link href="/help" className="text-white/50 hover:text-gold text-sm transition-colors">Help 
Center</Link></li>
              <li><Link href="/dpa" className="text-white/50 hover:text-gold text-sm transition-colors">Data 
Processing Agreement</Link></li>
              <li><Link href="/dmca" className="text-white/50 hover:text-gold text-sm 
transition-colors">DMCA</Link></li>
              <li><Link href="/guidelines" className="text-white/50 hover:text-gold text-sm 
transition-colors">Content Guidelines</Link></li>
              <li><Link href="/paia" className="text-white/50 hover:text-gold text-sm transition-colors">PAIA 
Manual</Link></li>
              <li><Link href="/fpb" className="text-white/50 hover:text-gold text-sm transition-colors">FPB 
Registration</Link></li>
              <li><Link href="/incident-response" className="text-white/50 hover:text-gold text-sm 
transition-colors">Incident Response</Link></li>
            </ul>
          </div>
        </div>

        {/* Company Information Section (ECTA Compliance) */}
        <div className="border-t border-white/10 pt-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 text-white/40 text-xs">
            <div className="space-y-1">
              <p className="flex items-center gap-2"><Building size={14} className="text-gold" /> <strong 
className="text-white/60">ZeusTech (Pty) Ltd</strong></p>
              <p className="flex items-center gap-2"><Shield size={14} className="text-gold" /> Reg No: 
2025/79478/07</p>
              <p className="flex items-center gap-2"><MapPin size={14} className="text-gold" /> 25 Quantum St, 
Techno Park, Stellenbosch, 7600</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-2"><Phone size={14} className="text-gold" /> <a 
href="tel:+27796288382" className="hover:text-gold transition-colors">+27 79 628 8382</a></p>
              <p className="flex items-center gap-2"><Mail size={14} className="text-gold" /> <a 
href="mailto:support@steeze.com" className="hover:text-gold transition-colors">support@steeze.com</a></p>
            </div>
          </div>
        </div>

        {/* Copyright and Bottom Links */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center 
gap-3">
          <div className="flex items-center gap-4">
            <Image src="/icons/steeze-logo-horizontal.png" alt="STEEZE" width={80} height={25} />
            <p className="text-white/30 text-xs">
              © {currentYear} STEEZE – Powered by ZeusLiveStudio. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4 text-xs">
            <Link href="/terms" className="text-white/30 hover:text-gold">Terms</Link>
            <Link href="/privacy" className="text-white/30 hover:text-gold">Privacy</Link>
            <Link href="/cookies" className="text-white/30 hover:text-gold">Cookies</Link>
            <Link href="/guidelines" className="text-white/30 hover:text-gold">Guidelines</Link>
            <Link href="/sitemap" className="text-white/30 hover:text-gold">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

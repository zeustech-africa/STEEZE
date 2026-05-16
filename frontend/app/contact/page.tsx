"use client";

import { MapPin, Phone, Mail, Clock, Building, Shield, Crown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <BackToHomeButton />
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">Contact Us</h1>
            <p className="text-white/60">Get in touch with the STEEZE team</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building className="text-gold mt-1" size={20} />
                  <div>
                    <p className="text-white font-semibold">ZeusTech (Pty) Ltd</p>
                    <p className="text-white/50 text-sm">Reg No: 2025/79478/07</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="text-gold mt-1" size={20} />
                  <div>
                    <p className="text-white font-semibold">Address</p>
                    <p className="text-white/50 text-sm">25 Quantum St, Techno Park, Stellenbosch, 7600, South Africa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="text-gold mt-1" size={20} />
                  <div>
                    <p className="text-white font-semibold">Phone</p>
                    <p className="text-white/50 text-sm">
                      <a href="tel:+27796288382" className="hover:text-gold">+27 79 628 8382</a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="text-gold mt-1" size={20} />
                  <div>
                    <p className="text-white font-semibold">Email</p>
                    <p className="text-white/50 text-sm">
                      <a href="mailto:support@steeze.com" className="hover:text-gold">support@steeze.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Send us a message</h2>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
                <textarea
                  placeholder="Message"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
                <button className="w-full py-3 bg-gold text-black rounded-full font-semibold hover:shadow-lg transition-all">
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Business Hours */}
          <div className="glass-card p-6 mt-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-gold" /> Business Hours
            </h2>
            <p className="text-white/60">Monday - Friday: 9:00 AM - 6:00 PM (SAST)</p>
            <p className="text-white/60">Saturday: 10:00 AM - 2:00 PM (SAST)</p>
            <p className="text-white/60">Sunday: Closed</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
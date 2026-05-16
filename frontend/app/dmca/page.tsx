"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";
import { FileWarning, Shield, RefreshCw } from "lucide-react";

export default function DMCAPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                DMCA / Copyright
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              Copyright complaint procedures and intellectual property protection.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Filing a Complaint */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <FileWarning className="text-gold" size={28} />
                <h2 className="text-2xl font-bold text-gold">How to File a Copyright Complaint</h2>
              </div>
              <p className="text-white/70 mb-4">
                If you believe your copyrighted work has been posted on STEEZE without authorization,
                you may submit a DMCA takedown notice. Your notice must include:
              </p>
              <div className="space-y-3 text-white/70 text-sm">
                <p>1. A physical or electronic signature of the copyright owner or authorized agent.</p>
                <p>2. Identification of the copyrighted work claimed to have been infringed.</p>
                <p>3. Identification of the material on STEEZE that is claimed to be infringing, with sufficient detail to locate it (URLs).</p>
                <p>4. Your contact information: name, address, phone number, and email.</p>
                <p>5. A statement that you have a good faith belief the use is not authorized by the copyright owner, its agent, or the law.</p>
                <p>6. A statement under penalty of perjury that the information in your notice is accurate and you are the copyright owner or authorized to act on their behalf.</p>
              </div>
              <div className="mt-4 p-4 glass rounded-xl">
                <p className="text-white text-sm">📧 Submit DMCA notices to: <a href="mailto:dmca@steeze.com" className="text-gold hover:underline">dmca@steeze.com</a></p>
              </div>
            </div>

            {/* Counter-Notification */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <RefreshCw className="text-neon-blue" size={28} />
                <h2 className="text-2xl font-bold text-gold">Counter-Notification Process</h2>
              </div>
              <p className="text-white/70 mb-4">
                If you believe your content was removed in error or misidentification, you may file a counter-notification:
              </p>
              <div className="space-y-3 text-white/70 text-sm">
                <p>1. Your physical or electronic signature.</p>
                <p>2. Identification of the material removed and its location before removal.</p>
                <p>3. A statement under penalty of perjury that you have a good faith belief the material was removed by mistake or misidentification.</p>
                <p>4. Your name, address, phone number, and consent to jurisdiction of the courts in Cape Town, South Africa.</p>
              </div>
              <div className="mt-4 p-4 glass rounded-xl">
                <p className="text-white text-sm">📧 Submit counter-notifications to: <a href="mailto:dmca@steeze.com" className="text-gold hover:underline">dmca@steeze.com</a></p>
              </div>
            </div>

            {/* Designated Agent */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="text-gold" size={28} />
                <h2 className="text-2xl font-bold text-gold">Designated Agent</h2>
              </div>
              <div className="glass p-6 rounded-xl space-y-2 text-white/70">
                <p>Legal Department</p>
                <p>ZeusTech (Pty) Ltd</p>
                <p>Cape Town, South Africa</p>
                <p>Email: <a href="mailto:dmca@steeze.com" className="text-gold hover:underline">dmca@steeze.com</a></p>
              </div>
            </div>

            {/* Repeat Infringer Policy */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <FileWarning className="text-red-400" size={28} />
                <h2 className="text-2xl font-bold text-gold">Repeat Infringer Policy</h2>
              </div>
              <p className="text-white/70 leading-relaxed">
                STEEZE takes copyright infringement seriously. In accordance with the DMCA and applicable laws,
                we maintain a repeat infringer policy. Accounts that receive multiple valid DMCA takedown notices
                will be terminated. We may also terminate accounts that have been the subject of fewer than three
                notices if circumstances suggest a pattern of infringement.
              </p>
            </div>

            {/* Platform Protection */}
            <div className="glass-card p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gold mb-4">Platform Protection</h2>
              <p className="text-white/70 leading-relaxed">
                STEEZE complies with the Digital Millennium Copyright Act (DMCA) and the Electronic
                Communications and Transactions Act (ECTA) of South Africa. We respond promptly to valid
                takedown notices and work to maintain a platform that respects intellectual property rights.
                Creators are responsible for ensuring their content does not infringe on others' rights.
              </p>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
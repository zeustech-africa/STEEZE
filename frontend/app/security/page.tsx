"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";
import { Shield, AlertTriangle, Lock, FileText } from "lucide-react";

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24">
        <div className="max-w-4xl mx-auto px-4">
          <BackToHomeButton />
        </div>
        <section className="relative py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/10 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <Shield className="mx-auto text-neon-blue mb-4" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                Security Advisories
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              Platform security measures, reporting, and best practices.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Platform Security */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="text-gold" size={28} />
                <h2 className="text-2xl font-bold text-gold">Platform Security Measures</h2>
              </div>
              <div className="space-y-4 text-white/70">
                <div className="flex items-start gap-3">
                  <span className="text-neon-blue mt-1">🔒</span>
                  <div>
                    <p className="text-white font-semibold">Encryption</p>
                    <p className="text-sm">All data is encrypted in transit using TLS 1.3 and at rest using AES-256.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-blue mt-1">🛡️</span>
                  <div>
                    <p className="text-white font-semibold">Identity Verification</p>
                    <p className="text-sm">Every creator is verified via government ID. No anonymous content posting.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-blue mt-1">✅</span>
                  <div>
                    <p className="text-white font-semibold">Content Moderation</p>
                    <p className="text-sm">AI-assisted + human review of all content before publication.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-blue mt-1">🔄</span>
                  <div>
                    <p className="text-white font-semibold">Regular Audits</p>
                    <p className="text-sm">Quarterly security audits and penetration testing by independent firms.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Security Issues */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="text-neon-blue" size={28} />
                <h2 className="text-2xl font-bold text-gold">Report a Security Issue</h2>
              </div>
              <p className="text-white/70 mb-4">
                If you discover a security vulnerability, please report it responsibly. We take all
                reports seriously and will respond promptly.
              </p>
              <div className="glass p-6 rounded-xl space-y-3">
                <p className="text-white text-sm">📧 Email: <a href="mailto:security@steeze.com" className="text-gold hover:underline">security@steeze.com</a></p>
                <p className="text-white/50 text-sm">Please include detailed steps to reproduce the issue. Do not publicly disclose vulnerabilities before we have addressed them.</p>
                <p className="text-white/50 text-sm">We aim to acknowledge reports within 24 hours and resolve critical issues within 7 days.</p>
              </div>
            </div>

            {/* Past Advisories */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="text-gold" size={28} />
                <h2 className="text-2xl font-bold text-gold">Past Advisories</h2>
              </div>
              <div className="glass p-6 rounded-xl text-center">
                <p className="text-white/50">No security advisories have been issued yet. This section will be updated if any vulnerabilities are discovered and resolved.</p>
              </div>
            </div>

            {/* Best Practices */}
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="text-gold" size={28} />
                <h2 className="text-2xl font-bold text-gold">Best Practices for Users</h2>
              </div>
              <div className="space-y-3 text-white/70 text-sm">
                <p>• Use a strong, unique password for your STEEZE account.</p>
                <p>• Enable two-factor authentication in your account settings.</p>
                <p>• Never share your login credentials or verification codes with anyone.</p>
                <p>• Be cautious of phishing attempts—STEEZE will never ask for your password via email.</p>
                <p>• Keep your email account secure; it's the key to account recovery.</p>
                <p>• Report suspicious activity immediately to security@steeze.com.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
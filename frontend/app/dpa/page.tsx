"use client";

import { useEffect } from "react";
import { Shield, Database, Lock, Users, Bell, Clock, Globe, FileText, Mail, Server, Cloud, CreditCard, Music, Video } from "lucide-react";
import BackToHomeButton from "@/components/BackToHomeButton";

export default function DPAPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const subProcessors = [
    { name: "Cloudflare", purpose: "CDN, DDoS protection, R2 object storage", location: "USA / Global", icon: Cloud },
    { name: "PayFast", purpose: "Payment processing, subscription billing", location: "South Africa", icon: CreditCard },
    { name: "DistroKid", purpose: "Music distribution to streaming platforms", location: "USA", icon: Music },
    { name: "YouTube (Google)", purpose: "Video distribution", location: "USA", icon: Video },
    { name: "Spotify", purpose: "Audio distribution and playlist management", location: "Sweden / Global", icon: Music },
    { name: "Apple Music", purpose: "Music distribution", location: "USA", icon: Music },
    { name: "SMTP Service", purpose: "Email delivery (transactional and marketing)", location: "Various", icon: Mail },
    { name: "ZeusTech Infrastructure", purpose: "Primary hosting and database", location: "South Africa", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <BackToHomeButton />
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-full bg-gold/20 mb-4">
            <Shield className="text-gold" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">Data Processing Agreement</h1>
          <p className="text-white/50">Effective Date: 15 May 2026 | Last Updated: 15 May 2026</p>
          <p className="text-white/60 mt-2 max-w-2xl mx-auto">This Data Processing Agreement ("DPA") governs how STEEZE processes personal data on behalf of its users (Controllers).</p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Definitions */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><FileText size={20} /> 1. Definitions</h2>
            <div className="space-y-2 text-white/70 text-sm">
              <p><strong className="text-gold">"Controller"</strong> – The user (creator or VIBE) who determines the purposes and means of processing personal data.</p>
              <p><strong className="text-gold">"Processor"</strong> – STEEZE (ZeusTech), which processes personal data on behalf of the Controller.</p>
              <p><strong className="text-gold">"Personal Data"</strong> – Any information relating to an identified or identifiable natural person.</p>
              <p><strong className="text-gold">"Sub-processor"</strong> – A third-party engaged by STEEZE to process personal data.</p>
              <p><strong className="text-gold">"Data Subject"</strong> – The individual to whom the personal data relates.</p>
              <p><strong className="text-gold">"POPIA"</strong> – South Africa's Protection of Personal Information Act, 2013.</p>
              <p><strong className="text-gold">"GDPR"</strong> – EU General Data Protection Regulation (where applicable).</p>
            </div>
          </div>

          {/* Section 2: Scope of Processing */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Database size={20} /> 2. Scope of Processing</h2>
            <p className="text-white/70 mb-2">STEEZE processes personal data on behalf of Controllers for the following purposes:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Providing the STEEZE platform (account management, content hosting, feed delivery)</li>
              <li>Processing payments and subscriptions (via PayFast)</li>
              <li>Distributing content to third-party platforms (if requested by Controller)</li>
              <li>Sending notifications and marketing communications (with consent)</li>
              <li>Platform security and fraud prevention</li>
              <li>Analytics and platform improvement</li>
            </ul>
            <p className="text-white/60 text-sm mt-2">Processing Duration: Until account deletion + 30-day grace period (or as required by law).</p>
          </div>

          {/* Section 3: Categories of Data Subjects */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Users size={20} /> 3. Categories of Data Subjects</h2>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li><strong className="text-gold">Creators:</strong> Users who upload content (ZLS artists and independent creators)</li>
              <li><strong className="text-gold">VIBES:</strong> Users who consume content (fans)</li>
              <li><strong className="text-gold">Prospective Users:</strong> Individuals who sign up but haven't completed verification</li>
            </ul>
          </div>

          {/* Section 4: Types of Personal Data Processed */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Database size={20} /> 4. Types of Personal Data Processed</h2>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Account information (name, email, username, password hash)</li>
              <li>Verification data (ID documents, selfie photos)</li>
              <li>Content data (audio, video, images, text posts)</li>
              <li>Transaction data (payment records, subscription history)</li>
              <li>Technical data (IP address, device info, browser type)</li>
              <li>Communication data (messages, support inquiries)</li>
            </ul>
          </div>

          {/* Section 5: Security Measures */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Lock size={20} /> 5. Security Measures</h2>
            <p className="text-white/70 mb-2">STEEZE implements the following technical and organizational security measures:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and 2FA for admin accounts</li>
              <li>Bot detection and rate limiting</li>
              <li>Automated content scanning</li>
              <li>Regular backups and disaster recovery</li>
            </ul>
          </div>

          {/* Section 6: Sub-processors */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Globe size={20} /> 6. Sub-processors</h2>
            <p className="text-white/70 mb-4">STEEZE engages the following sub-processors to provide our services:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-white/70">Sub-processor</th>
                    <th className="text-left p-2 text-white/70">Purpose</th>
                    <th className="text-left p-2 text-white/70">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {subProcessors.map((sp, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td className="p-2 text-white/80">{sp.name}</td>
                      <td className="p-2 text-white/60 text-xs">{sp.purpose}</td>
                      <td className="p-2 text-white/60 text-xs">{sp.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-white/50 text-xs mt-3">STEEZE maintains data processing agreements with all sub-processors. Sub-processors are added or changed with notice to Controllers.</p>
          </div>

          {/* Section 7: Data Subject Rights */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Users size={20} /> 7. Data Subject Rights</h2>
            <p className="text-white/70 mb-2">STEEZE assists Controllers in responding to data subject requests, including:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Right to access personal data (via Settings → Data Export)</li>
              <li>Right to rectification (edit profile information)</li>
              <li>Right to erasure (account deletion with 30-day grace period)</li>
              <li>Right to restrict processing (withdraw consent)</li>
              <li>Right to data portability (export in JSON/HTML format)</li>
              <li>Right to object (unsubscribe from marketing)</li>
            </ul>
          </div>

          {/* Section 8: Data Breach Notification */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Bell size={20} /> 8. Data Breach Notification</h2>
            <p className="text-white/70 mb-2">In the event of a personal data breach, STEEZE shall:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Notify affected Controllers within 48 hours of detection</li>
              <li>Provide details of the breach, affected data, and mitigation measures</li>
              <li>Notify the Information Regulator (South Africa) within 72 hours if required</li>
              <li>Notify affected data subjects where required by law</li>
            </ul>
          </div>

          {/* Section 9: Data Retention */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Clock size={20} /> 9. Data Retention</h2>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Account data: Until account deletion + 30-day grace period</li>
              <li>Content data: As long as account is active</li>
              <li>Transaction records: 7 years (legal/tax requirements)</li>
              <li>Verification documents: 90 days after verification (or longer if required)</li>
              <li>Logs and analytics: 12 months</li>
            </ul>
          </div>

          {/* Section 10: Termination */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Clock size={20} /> 10. Termination</h2>
            <p className="text-white/70">Upon termination of the agreement, STEEZE shall return or delete all personal data processed on behalf of the Controller, except where retention is required by law. Data may be retained in backups for up to 30 days after deletion.</p>
          </div>

          {/* Section 11: Governing Law */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Shield size={20} /> 11. Governing Law</h2>
            <p className="text-white/70">This DPA is governed by the laws of South Africa, including POPIA. For data subjects in the EU, GDPR may also apply where relevant.</p>
          </div>

          {/* Section 12: Contact */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Mail size={20} /> 12. Contact</h2>
            <p className="text-white/70 mb-2">For DPA-related inquiries, please contact:</p>
            <div className="space-y-1">
              <p className="text-white/70">📧 <strong className="text-gold">Data Protection Officer:</strong> <a href="mailto:dpo@steeze.com" className="hover:underline">dpo@steeze.com</a></p>
              <p className="text-white/70">📧 <strong className="text-gold">Legal:</strong> <a href="mailto:legal@steeze.com" className="hover:underline">legal@steeze.com</a></p>
              <p className="text-white/70">📍 <strong className="text-gold">Address:</strong> ZeusTech, 25 Quantum St, Techno Park, Stellenbosch, 7600</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-6">
          <p className="text-white/40 text-sm">For more information, see our <a href="/privacy" className="text-gold hover:underline">Privacy Policy</a> and <a href="/terms" className="text-gold hover:underline">Terms of Service</a>.</p>
          <p className="text-white/40 text-xs mt-2">© {new Date().getFullYear()} STEEZE – Powered by ZeusLiveStudio. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
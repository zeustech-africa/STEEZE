"use client";

import { useEffect } from "react";
import { Shield, Eye, Database, Lock, Mail, FileText, Cookie, Users, Globe, Clock, CheckCircle, AlertCircle } from "lucide-react";
import BackToHomeButton from "@/components/BackToHomeButton";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <BackToHomeButton />
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-full bg-gold/20 mb-4">
            <Shield className="text-gold" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">Privacy Policy</h1>
          <p className="text-white/50">Effective Date: January 15, 2026 | Last Updated: May 14, 2026</p>
          <p className="text-white/60 mt-2 max-w-2xl mx-auto">At STEEZE, your privacy is our priority. This policy explains how we collect, use, and protect your personal information in compliance with South Africa's POPIA (Protection of Personal Information Act).</p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Introduction */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><FileText size={20} /> 1. Introduction</h2>
            <p className="text-white/70 mb-2">STEEZE (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a verified entertainment platform powered by ZeusTech, based in Cape Town, South Africa. This Privacy Policy describes how we collect, use, store, and protect your personal information when you use our platform, website, and services.</p>
            <p className="text-white/70">By using STEEZE, you acknowledge that you have read and understood this Privacy Policy. If you do not agree, please do not use our services.</p>
          </div>

          {/* Section 2: Information Officer */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Shield size={20} /> 2. Information Officer</h2>
            <p className="text-white/70 mb-3">In compliance with POPIA, we have appointed an Information Officer responsible for overseeing data protection and privacy matters.</p>
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <p className="text-white"><strong className="text-gold">Information Officer:</strong> Oghenetega Blondy Obebeduo</p>
              <p className="text-white"><strong className="text-gold">Email:</strong> <a href="mailto:dpo@steeze.com" className="text-gold hover:underline">dpo@steeze.com</a></p>
              <p className="text-white"><strong className="text-gold">Phone:</strong> <a href="tel:+27796288382" className="text-gold hover:underline">+27 79 628 8382</a></p>
              <p className="text-white"><strong className="text-gold">Address:</strong> 25 Quantum St, Techno Park, Stellenbosch, 7600</p>
            </div>
            <p className="text-white/60 text-sm mt-3">You may contact our Information Officer with any questions regarding the processing of your personal information.</p>
          </div>

          {/* Section 3: What Personal Information We Collect */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Database size={20} /> 3. What Personal Information We Collect</h2>
            <div className="space-y-3">
              <div><p className="text-white font-semibold mb-1">Account Information:</p><p className="text-white/60">Name, email address, username, password (hashed), profile picture, bio, birth date (for age verification)</p></div>
              <div><p className="text-white font-semibold mb-1">Verification Information:</p><p className="text-white/60">Government ID documents, selfie photos (stored securely, used for identity verification)</p></div>
              <div><p className="text-white font-semibold mb-1">Content Information:</p><p className="text-white/60">Audio files, video files, images, text posts, comments, likes, reposts, saves</p></div>
              <div><p className="text-white font-semibold mb-1">Transaction Information:</p><p className="text-white/60">Payment details (processed by PayFast, not stored by us), subscription history, payout records</p></div>
              <div><p className="text-white font-semibold mb-1">Technical Information:</p><p className="text-white/60">IP address, device information, browser type, operating system, access times</p></div>
              <div><p className="text-white font-semibold mb-1">Communication Information:</p><p className="text-white/60">Messages sent to creators (Gold tier), support inquiries, survey responses</p></div>
            </div>
          </div>

          {/* Section 4: How We Collect Information */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Eye size={20} /> 4. How We Collect Information</h2>
            <div className="space-y-2">
              <p className="text-white/70">&bull; <strong className="text-gold">Directly from you:</strong> When you create an account, upload content, make payments, or contact support</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Automatically:</strong> When you use our platform (cookies, log files, analytics)</p>
              <p className="text-white/70">&bull; <strong className="text-gold">From third parties:</strong> Payment processors (PayFast), verification services, analytics providers</p>
            </div>
          </div>

          {/* Section 5: Why We Collect Information (Lawful Purposes) */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><CheckCircle size={20} /> 5. Why We Collect Information (Lawful Purposes)</h2>
            <p className="text-white/70 mb-3">Under POPIA, we must have a lawful basis for processing your personal information. We rely on the following:</p>
            <div className="space-y-2">
              <p className="text-white/70">&bull; <strong className="text-gold">Consent:</strong> For marketing communications and certain data processing</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Contract:</strong> To provide the services you requested (account creation, content hosting, payments)</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Legal obligation:</strong> For identity verification, age verification, and compliance with South African law</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Legitimate interest:</strong> To improve our services, prevent fraud, and ensure platform security</p>
            </div>
          </div>

          {/* Section 6: How We Use Your Information */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Users size={20} /> 6. How We Use Your Information</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <p className="text-white/70">&bull; Provide, maintain, and improve STEEZE</p>
              <p className="text-white/70">&bull; Verify your identity (no fake accounts)</p>
              <p className="text-white/70">&bull; Process payments and payouts</p>
              <p className="text-white/70">&bull; Distribute content to streaming platforms</p>
              <p className="text-white/70">&bull; Communicate with you about your account</p>
              <p className="text-white/70">&bull; Personalize your experience (feeds, recommendations)</p>
              <p className="text-white/70">&bull; Protect against fraud and abuse</p>
              <p className="text-white/70">&bull; Comply with legal obligations</p>
            </div>
          </div>

          {/* Section 7: Sharing of Information */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Globe size={20} /> 7. Sharing of Information</h2>
            <p className="text-white/70 mb-3">We share your personal information only in the following circumstances:</p>
            <div className="space-y-2">
              <p className="text-white/70">&bull; <strong className="text-gold">Service providers:</strong> Cloudflare (R2 storage), PayFast (payments), email service providers</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Distribution partners:</strong> DistroKid, YouTube, Spotify, Apple Music, Tidal (when you choose to distribute)</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Legal requirements:</strong> When required by law or to protect our rights</p>
              <p className="text-white/70">&bull; <strong className="text-gold">With your consent:</strong> Any other sharing with your explicit permission</p>
            </div>
            <p className="text-white/60 text-sm mt-3">We do NOT sell your personal information to third parties.</p>
          </div>

          {/* Section 8: International Transfers */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Globe size={20} /> 8. International Transfers</h2>
            <p className="text-white/70">Your information may be transferred to and processed in countries outside South Africa, including the United States (Cloudflare, DistroKid) and other jurisdictions. We ensure appropriate safeguards are in place, including standard contractual clauses where required.</p>
          </div>

          {/* Section 9: Data Retention */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Clock size={20} /> 9. Data Retention</h2>
            <div className="space-y-2">
              <p className="text-white/70">&bull; <strong className="text-gold">Account information:</strong> Until you delete your account (plus 30-day grace period)</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Content:</strong> As long as you keep your account active</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Transaction records:</strong> 7 years (tax/legal requirements)</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Verification documents:</strong> 90 days after verification (or longer if required by law)</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Logs and analytics:</strong> 12 months</p>
            </div>
          </div>

          {/* Section 10: Your Rights (POPIA/GDPR) */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><CheckCircle size={20} /> 10. Your Rights (POPIA/GDPR)</h2>
            <p className="text-white/70 mb-3">Under POPIA and GDPR, you have the following rights:</p>
            <div className="space-y-2">
              <p className="text-white/70">&bull; <strong className="text-gold">Right to access:</strong> Request a copy of your personal information (available in Settings &rarr; Data Export)</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Right to correction:</strong> Update inaccurate information</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Right to deletion:</strong> Request account deletion (Settings &rarr; Data Export)</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Right to object:</strong> Object to processing for direct marketing</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Right to withdraw consent:</strong> Unsubscribe from marketing communications</p>
              <p className="text-white/70">&bull; <strong className="text-gold">Right to lodge a complaint:</strong> Contact the Information Regulator of South Africa</p>
            </div>
          </div>

          {/* Section 11: Security Measures */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Lock size={20} /> 11. Security Measures</h2>
            <p className="text-white/70 mb-3">We implement industry-standard security measures to protect your information:</p>
            <div className="space-y-2">
              <p className="text-white/70">&bull; Encryption of data in transit (TLS 1.3) and at rest (AES-256)</p>
              <p className="text-white/70">&bull; Regular security audits and penetration testing</p>
              <p className="text-white/70">&bull; Access controls and authentication (2FA available for admin accounts)</p>
              <p className="text-white/70">&bull; Monitoring for suspicious activity and bot detection</p>
              <p className="text-white/70">&bull; Secure deletion of data upon account termination</p>
            </div>
          </div>

          {/* Section 12: Direct Marketing */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Mail size={20} /> 12. Direct Marketing</h2>
            <p className="text-white/70 mb-3">We will only send you marketing communications if you have given us explicit consent (opt-in). You can withdraw your consent at any time:</p>
            <div className="space-y-2">
              <p className="text-white/70">&bull; Click the &ldquo;unsubscribe&rdquo; link in any marketing email</p>
              <p className="text-white/70">&bull; Update your notification preferences in Settings</p>
              <p className="text-white/70">&bull; Contact our Information Officer</p>
            </div>
          </div>

          {/* Section 13: Children's Privacy */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Users size={20} /> 13. Children&rsquo;s Privacy</h2>
            <p className="text-white/70">STEEZE is not intended for users under 13. We require age verification during signup. Users aged 13-17 require parental consent. We do not knowingly collect information from children under 13.</p>
          </div>

          {/* Section 14: Cookies */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Cookie size={20} /> 14. Cookies</h2>
            <p className="text-white/70">We use cookies and similar technologies to improve your experience. For detailed information, please see our <a href="/cookies" className="text-gold hover:underline">Cookie Policy</a>.</p>
          </div>

          {/* Section 15: Changes to This Policy */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><AlertCircle size={20} /> 15. Changes to This Policy</h2>
            <p className="text-white/70">We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice on our platform. The &ldquo;Effective Date&rdquo; at the top indicates when this policy was last updated.</p>
          </div>

          {/* Section 16: Contact Us */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Mail size={20} /> 16. Contact Us</h2>
            <p className="text-white/70 mb-3">If you have questions about this Privacy Policy or how we handle your personal information, please contact us:</p>
            <div className="space-y-1">
              <p className="text-white/70">&#9993; <strong className="text-gold">Email:</strong> <a href="mailto:privacy@steeze.com" className="hover:underline">privacy@steeze.com</a></p>
              <p className="text-white/70">&#9993; <strong className="text-gold">Data Protection Officer:</strong> <a href="mailto:dpo@steeze.com" className="hover:underline">dpo@steeze.com</a></p>
              <p className="text-white/70">&#9742; <strong className="text-gold">Phone:</strong> <a href="tel:+27796288382" className="hover:underline">+27 79 628 8382</a></p>
              <p className="text-white/70">&#128205; <strong className="text-gold">Address:</strong> ZeusTech, 25 Quantum St, Techno Park, Stellenbosch, 7600, South Africa</p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-6">
            <p className="text-white/40 text-sm">Information Regulator of South Africa: <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">www.justice.gov.za/inforeg/</a></p>
            <p className="text-white/40 text-xs mt-2">&copy; 2026 STEEZE &ndash; Powered by ZeusLiveStudio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
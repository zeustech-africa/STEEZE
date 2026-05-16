"use client";

import { useEffect } from "react";
import { FileText, Shield, Users, DollarSign, Clock, AlertCircle, Mail, Scale, Calendar, Ban, LogOut, ShoppingBag, RefreshCw } from "lucide-react";
import BackToHomeButton from "@/components/BackToHomeButton";

export default function TermsOfServicePage() {
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
            <FileText className="text-gold" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">Terms of Service</h1>
          <p className="text-white/50">Effective Date: January 15, 2026 | Last Updated: May 15, 2026</p>
          <p className="text-white/60 mt-2 max-w-2xl mx-auto">Welcome to STEEZE. By using our platform, you agree to these Terms of Service.</p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Introduction */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><FileText size={20} /> 1. Introduction</h2>
            <p className="text-white/70 mb-2">These Terms of Service (&ldquo;Terms&rdquo;) govern your use of STEEZE, a verified entertainment platform powered by ZeusTech, based in Cape Town, South Africa.</p>
            <p className="text-white/70">By accessing or using STEEZE, you agree to be bound by these Terms. If you do not agree, please do not use our services.</p>
          </div>

          {/* Section 2: Eligibility */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Users size={20} /> 2. Eligibility</h2>
            <p className="text-white/70 mb-2">To use STEEZE, you must:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Be at least 13 years old (users under 18 require parental consent)</li>
              <li>Complete identity verification (ID + selfie) &ndash; no fake accounts allowed</li>
              <li>Provide accurate and complete information during registration</li>
              <li>Not have been previously suspended or removed from STEEZE</li>
            </ul>
          </div>

          {/* Section 3: Account Registration */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Shield size={20} /> 3. Account Registration</h2>
            <p className="text-white/70 mb-2">You are responsible for maintaining the security of your account. You agree to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Keep your password confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Complete identity verification (mandatory for all users)</li>
            </ul>
          </div>

          {/* Section 4: User Conduct (Content Rules) */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Ban size={20} /> 4. User Conduct & Content Rules</h2>
            <p className="text-white/70 mb-3">STEEZE is a PURE ENTERTAINMENT platform. The following content is PROHIBITED:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <p className="text-white/70">❌ Politics or political commentary</p>
              <p className="text-white/70">❌ News or current events</p>
              <p className="text-white/70">❌ Violence, gore, or death</p>
              <p className="text-white/70">❌ Hate speech or discrimination</p>
              <p className="text-white/70">❌ Sad stories or depressing content</p>
              <p className="text-white/70">❌ Nudity or sexual content</p>
              <p className="text-white/70">❌ Harassment or bullying</p>
              <p className="text-white/70">❌ Spam or misleading content</p>
              <p className="text-white/70">❌ Impersonation of others</p>
              <p className="text-white/70">❌ Illegal activities</p>
            </div>
            <p className="text-white/60 text-sm mt-3">Violations may result in content removal, account suspension, or permanent ban.</p>
          </div>

          {/* Section 5: Intellectual Property */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Scale size={20} /> 5. Intellectual Property</h2>
            <p className="text-white/70 mb-2">You retain ownership of content you upload to STEEZE. By uploading content, you grant STEEZE a license to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Host, store, and display your content on our platform</li>
              <li>Distribute your content to third-party platforms (if you select distribution)</li>
              <li>Promote your content within STEEZE</li>
              <li>Use your content for platform improvement and analytics</li>
            </ul>
            <p className="text-white/60 text-sm mt-2">You represent that you own or have permission to use all content you upload.</p>
          </div>

          {/* Section 6: Paid Services & Subscriptions */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><DollarSign size={20} /> 6. Paid Services & Subscriptions</h2>
            <p className="text-white/70 mb-2">STEEZE offers the following paid services:</p>
            <div className="space-y-2 mb-3">
              <p className="text-white/70">• <strong className="text-gold">Creator Subscriptions:</strong> VIBES can subscribe to creators (Basic R50, Premium R99, Gold R199)</p>
              <p className="text-white/70">• <strong className="text-gold">Independent Creator Fees:</strong> Monthly subscription for independent creators (to use the platform)</p>
              <p className="text-white/70">• <strong className="text-gold">Paid Content:</strong> Creators may set prices for individual posts</p>
            </div>
            <p className="text-white/70">All payments are processed securely through PayFast. We do not store your payment information.</p>
          </div>

          {/* Section 7: Cooling-off Period (CPA) */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Clock size={20} /> 7. Cooling-off Period (South African CPA)</h2>
            <p className="text-white/70 mb-2">Under the South African Consumer Protection Act (CPA), you have the right to cancel any transaction within 7 days of receiving the service (cooling-off period).</p>
            <div className="bg-white/5 rounded-lg p-4 mb-3">
              <p className="text-white/80"><strong className="text-gold">Your rights under the cooling-off period:</strong></p>
              <p className="text-white/70">• Cancel without reason or penalty within 7 days of subscription or purchase</p>
              <p className="text-white/70">• Receive a full refund (excluding any service already consumed)</p>
              <p className="text-white/70">• No cancellation fees apply</p>
            </div>
            <p className="text-white/60 text-sm">To exercise your cooling-off rights, contact us at <a href="mailto:support@steeze.com" className="text-gold hover:underline">support@steeze.com</a> within 7 days of purchase.</p>
          </div>

          {/* Section 8: Refund Policy */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><RefreshCw size={20} /> 8. Refund Policy</h2>
            <div className="space-y-3">
              <div><p className="text-white font-semibold mb-1">Subscription Refunds:</p><p className="text-white/70">You may cancel your subscription at any time. Refunds for unused periods are available within the 7-day cooling-off period. After 7 days, subscriptions are non-refundable but will not renew.</p></div>
              <div><p className="text-white font-semibold mb-1">Paid Content Refunds:</p><p className="text-white/70">If a post is defective (e.g., cannot play, corrupted), you may request a refund within 7 days. Refunds for content you simply did not enjoy are not provided.</p></div>
              <div><p className="text-white font-semibold mb-1">How to Request a Refund:</p><p className="text-white/70">Contact <a href="mailto:support@steeze.com" className="text-gold hover:underline">support@steeze.com</a> with your transaction ID and reason for refund.</p></div>
            </div>
          </div>

          {/* Section 9: Termination & Suspension */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><LogOut size={20} /> 9. Termination & Suspension</h2>
            <p className="text-white/70 mb-2">We reserve the right to suspend or terminate your account for:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Violation of these Terms (especially content rules)</li>
              <li>Creation of fake accounts or identity fraud</li>
              <li>Harassment or abuse of other users</li>
              <li>Copyright infringement</li>
              <li>Any illegal activity</li>
            </ul>
            <p className="text-white/60 text-sm mt-2">You may delete your account at any time via Settings → Data Export → Delete Account.</p>
          </div>

          {/* Section 10: Disclaimers & Limitation of Liability */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><AlertCircle size={20} /> 10. Disclaimers & Limitation of Liability</h2>
            <p className="text-white/70 mb-2">STEEZE is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Uninterrupted or error-free service</li>
              <li>That content will be suitable for all audiences</li>
              <li>Any specific financial outcomes for creators</li>
            </ul>
            <p className="text-white/70 mt-2">To the maximum extent permitted by law, STEEZE and ZeusTech shall not be liable for any indirect, incidental, or consequential damages.</p>
          </div>

          {/* Section 11: Dispute Resolution */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Scale size={20} /> 11. Dispute Resolution</h2>
            <p className="text-white/70 mb-2">These Terms are governed by the laws of South Africa. Any disputes shall be resolved in the courts of Cape Town, South Africa.</p>
            <p className="text-white/70">If you have a complaint, please contact us first at <a href="mailto:legal@steeze.com" className="text-gold hover:underline">legal@steeze.com</a> before pursuing legal action.</p>
          </div>

          {/* Section 12: Changes to Terms */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Calendar size={20} /> 12. Changes to Terms</h2>
            <p className="text-white/70">We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice on our platform. Your continued use of STEEZE after changes constitutes acceptance of the updated Terms.</p>
          </div>

          {/* Section 13: Contact Us */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Mail size={20} /> 13. Contact Us</h2>
            <p className="text-white/70 mb-3">If you have questions about these Terms, please contact us:</p>
            <div className="space-y-1">
              <p className="text-white/70">📧 <strong className="text-gold">Email:</strong> <a href="mailto:legal@steeze.com" className="hover:underline">legal@steeze.com</a></p>
              <p className="text-white/70">📧 <strong className="text-gold">Support:</strong> <a href="mailto:support@steeze.com" className="hover:underline">support@steeze.com</a></p>
              <p className="text-white/70">📍 <strong className="text-gold">Address:</strong> ZeusTech, 25 Quantum St, Techno Park, Stellenbosch, 7600, South Africa</p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-6">
            <p className="text-white/40 text-sm">© 2026 STEEZE &ndash; Powered by ZeusLiveStudio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
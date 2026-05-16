"use client";

import { useEffect } from "react";
import { Shield, AlertCircle, Flag, Eye, Users, Mail, Phone, MapPin, FileText, Clock, CheckCircle, ExternalLink } from "lucide-react";
import BackToHomeButton from "@/components/BackToHomeButton";

export default function FPBPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">FPB Registration Notice</h1>
          <p className="text-white/50">Film and Publication Board (South Africa)</p>
          <p className="text-white/60 mt-2 max-w-2xl mx-auto">STEEZE is registered as an online content distributor in compliance with the Films and Publications Act, 1996 (Act No. 65 of 1996).</p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Registration Status */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><CheckCircle size={20} /> 1. Registration Status</h2>
            <div className="space-y-2">
              <p className="text-white/70"><strong className="text-gold">Registration Type:</strong> Online Content Distributor</p>
              <p className="text-white/70"><strong className="text-gold">Registration Number:</strong> [FPB Registration Number - To be added]</p>
              <p className="text-white/70"><strong className="text-gold">Registration Date:</strong> [Registration Date]</p>
              <p className="text-white/70"><strong className="text-gold">Status:</strong> Active and Compliant</p>
            </div>
            <p className="text-white/60 text-sm mt-3">STEEZE has registered with the Film and Publication Board (FPB) as required by South African law for online content distribution platforms.</p>
          </div>

          {/* Section 2: Content Classification System */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Eye size={20} /> 2. Content Classification System</h2>
            <p className="text-white/70 mb-3">STEEZE classifies content using the following age-rating system:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2"><span className="text-green-500 text-sm font-bold">FREE / ALL AGES</span></div>
                <p className="text-white/60 text-xs">Content suitable for all ages. No restrictions.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2"><span className="text-gold text-sm font-bold">13+</span></div>
                <p className="text-white/60 text-xs">May contain mild language or suggestive themes. Parental guidance recommended.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2"><span className="text-orange-500 text-sm font-bold">16+</span></div>
                <p className="text-white/60 text-xs">May contain moderate language, violence, or mature themes.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2"><span className="text-red-500 text-sm font-bold">18+ (Age-restricted)</span></div>
                <p className="text-white/60 text-xs">Adult content. Only accessible to verified users aged 18 and older.</p>
              </div>
            </div>
            <p className="text-white/60 text-sm mt-3">Creators can mark their content as age-restricted (18+) during upload. Age-restricted content is hidden from users under 18.</p>
          </div>

          {/* Section 3: Prohibited Content */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><AlertCircle size={20} /> 3. Prohibited Content</h2>
            <p className="text-white/70 mb-2">The following content is strictly prohibited on STEEZE:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Child sexual abuse material (CSAM) – Zero tolerance</li>
              <li>Hate speech or incitement to violence</li>
              <li>Non-consensual intimate images (revenge porn)</li>
              <li>Deepfakes without consent</li>
              <li>Extreme violence or gore</li>
              <li>Bestiality or animal cruelty</li>
              <li>Content promoting self-harm or suicide</li>
              <li>Illegal activities or drug use</li>
            </ul>
            <p className="text-white/60 text-sm mt-2">Any prohibited content will be removed immediately, and the user may be banned permanently.</p>
          </div>

          {/* Section 4: Age Verification */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Users size={20} /> 4. Age Verification</h2>
            <p className="text-white/70 mb-2">STEEZE implements robust age verification to prevent minors from accessing age-restricted content:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li><strong className="text-gold">Age Gate:</strong> All users must enter their date of birth during signup</li>
              <li><strong className="text-gold">ID Verification:</strong> Users upload government ID for age confirmation</li>
              <li><strong className="text-gold">Selfie Verification:</strong> Live camera capture for identity matching</li>
              <li><strong className="text-gold">Parental Consent:</strong> Users aged 13-17 require parental consent</li>
              <li><strong className="text-gold">Content Filtering:</strong> Age-restricted content is blocked for users under 18</li>
            </ul>
          </div>

          {/* Section 5: Complaint Procedure */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Flag size={20} /> 5. Complaint Procedure</h2>
            <p className="text-white/70 mb-3">To report prohibited content or file a complaint:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">1</div><p className="text-white/70">Use the <strong className="text-gold">"Report"</strong> button on any post, comment, or user profile</p></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">2</div><p className="text-white/70">Select the reason for reporting (spam, harassment, prohibited content, etc.)</p></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">3</div><p className="text-white/70">Submit – our moderation team will review within 24 hours</p></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">4</div><p className="text-white/70">For urgent matters, email <a href="mailto:compliance@steeze.com" className="text-gold hover:underline">compliance@steeze.com</a></p></div>
            </div>
            <p className="text-white/60 text-sm mt-3">You may also submit a complaint directly to the FPB (contact details below).</p>
          </div>

          {/* Section 6: Takedown Procedure */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><FileText size={20} /> 6. Takedown Procedure</h2>
            <p className="text-white/70 mb-2">Content may be removed for violating our content policies:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Automated content scanning detects prohibited words and spam</li>
              <li>Admin review queue for flagged content</li>
              <li>Users can appeal takedown decisions via <a href="/contact" className="text-gold hover:underline">contact page</a></li>
              <li>Repeat violations result in account suspension or permanent ban</li>
            </ul>
            <p className="text-white/60 text-sm mt-2">For copyright takedown requests, see our <a href="/dmca" className="text-gold hover:underline">DMCA/Copyright Policy</a>.</p>
          </div>

          {/* Section 7: FPB Contact Information */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Mail size={20} /> 7. FPB Contact Information</h2>
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <p className="text-white/80"><strong className="text-gold">Film and Publication Board (FPB)</strong></p>
              <p className="text-white/70 flex items-center gap-2"><MapPin size={14} className="text-gold" /> 87 Proteus Street, Senderwood, Bedfordview, 2007</p>
              <p className="text-white/70 flex items-center gap-2"><Phone size={14} className="text-gold" /> <a href="tel:+27115711900" className="hover:text-gold">+27 11 571 1900</a></p>
              <p className="text-white/70 flex items-center gap-2"><Mail size={14} className="text-gold" /> <a href="mailto:enquiries@fpb.org.za" className="hover:text-gold">enquiries@fpb.org.za</a></p>
              <p className="text-white/70 flex items-center gap-2"><ExternalLink size={14} className="text-gold" /> <a href="https://www.fpb.org.za" target="_blank" rel="noopener noreferrer" className="hover:text-gold">www.fpb.org.za</a></p>
            </div>
          </div>

          {/* Section 8: Compliance Officer */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Shield size={20} /> 8. Compliance Officer</h2>
            <p className="text-white/70 mb-2">For FPB-related inquiries, please contact our Compliance Officer:</p>
            <div className="space-y-1">
              <p className="text-white/70"><strong className="text-gold">Name:</strong> Oghenetega Blondy Obebeduo</p>
              <p className="text-white/70"><strong className="text-gold">Email:</strong> <a href="mailto:compliance@steeze.com" className="hover:text-gold">compliance@steeze.com</a></p>
              <p className="text-white/70"><strong className="text-gold">Phone:</strong> <a href="tel:+27796288382" className="hover:text-gold">+27 79 628 8382</a></p>
            </div>
          </div>

          {/* Section 9: Reporting Obligations */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Clock size={20} /> 9. Reporting Obligations</h2>
            <p className="text-white/70">STEEZE submits quarterly reports to the FPB as required by law, including statistics on content removed, complaints received, and age verification compliance.</p>
            <p className="text-white/60 text-sm mt-2">Annual FPB registration fee: R867.47 (paid and up to date).</p>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-6">
            <p className="text-white/40 text-sm">For more information, see our <a href="/privacy" className="text-gold hover:underline">Privacy Policy</a>, <a href="/terms" className="text-gold hover:underline">Terms of Service</a>, and <a href="/guidelines" className="text-gold hover:underline">Content Guidelines</a>.</p>
            <p className="text-white/40 text-xs mt-2">© {new Date().getFullYear()} STEEZE – Powered by ZeusLiveStudio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
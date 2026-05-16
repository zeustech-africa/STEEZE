"use client";

import { useEffect } from "react";
import { Cookie, Shield, Eye, BarChart3, Target, Settings, AlertCircle, Mail } from "lucide-react";
import BackToHomeButton from "@/components/BackToHomeButton";

export default function CookiePolicyPage() {
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
            <Cookie className="text-gold" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">Cookie Policy</h1>
          <p className="text-white/50">Effective Date: 14 May 2026 | Last Updated: 15 May 2026</p>
          <p className="text-white/60 mt-2 max-w-2xl mx-auto">This policy explains how STEEZE uses cookies and similar technologies on our platform.</p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Introduction */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Cookie size={20} /> 1. Introduction</h2>
            <p className="text-white/70">Cookies are small text files placed on your device when you visit our platform. They help us provide, improve, and personalize your experience. This policy explains what cookies we use, why we use them, and how you can control them.</p>
            <p className="text-white/70 mt-2">By continuing to use STEEZE, you agree to our use of cookies in accordance with this policy. For information about how we process your personal data, please see our <a href="/privacy" className="text-gold hover:underline">Privacy Policy</a>.</p>
          </div>

          {/* Section 2: Types of Cookies We Use */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Settings size={20} /> 2. Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold flex items-center gap-2"><Shield size={16} className="text-gold" /> Essential Cookies</p>
                <p className="text-white/60 text-sm mt-1">Required for the platform to function. These cookies cannot be disabled. They enable core functionality such as authentication, session management, security measures, and load balancing. Without these cookies, STEEZE would not operate correctly.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold flex items-center gap-2"><Settings size={16} className="text-gold" /> Functional Cookies</p>
                <p className="text-white/60 text-sm mt-1">Enable enhanced functionality and personalization. These cookies remember your preferences such as language selection, theme settings, feed layout, and content filters. They improve your experience by tailoring the platform to your choices.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold flex items-center gap-2"><BarChart3 size={16} className="text-gold" /> Analytics Cookies</p>
                <p className="text-white/60 text-sm mt-1">Help us understand how users interact with our platform. These cookies collect information about page views, time spent on site, feature usage, error rates, and navigation patterns. We use this data to improve performance, fix bugs, and enhance user experience. All analytics data is anonymized and aggregated.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold flex items-center gap-2"><Target size={16} className="text-gold" /> Marketing Cookies</p>
                <p className="text-white/60 text-sm mt-1">Used to deliver relevant advertisements and measure campaign effectiveness. These cookies track your browsing habits across sites to build a profile of your interests. They require your explicit consent before being placed on your device.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Specific Cookies We Use */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Eye size={20} /> 3. Specific Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-white/70">Cookie Name</th>
                    <th className="text-left p-2 text-white/70">Provider</th>
                    <th className="text-left p-2 text-white/70">Purpose</th>
                    <th className="text-left p-2 text-white/70">Duration</th>
                    <th className="text-left p-2 text-white/70">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60 font-mono text-xs">steeze_token</td>
                    <td className="p-2 text-white/60">STEEZE</td>
                    <td className="p-2 text-white/60">Authentication token for logged-in sessions</td>
                    <td className="p-2 text-white/60">7 days</td>
                    <td className="p-2 text-white/60"><span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">Essential</span></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60 font-mono text-xs">steeze_session</td>
                    <td className="p-2 text-white/60">STEEZE</td>
                    <td className="p-2 text-white/60">Session management and CSRF protection</td>
                    <td className="p-2 text-white/60">Session</td>
                    <td className="p-2 text-white/60"><span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">Essential</span></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60 font-mono text-xs">steeze_csrf</td>
                    <td className="p-2 text-white/60">STEEZE</td>
                    <td className="p-2 text-white/60">Cross-site request forgery protection</td>
                    <td className="p-2 text-white/60">Session</td>
                    <td className="p-2 text-white/60"><span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">Essential</span></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60 font-mono text-xs">steeze_prefs</td>
                    <td className="p-2 text-white/60">STEEZE</td>
                    <td className="p-2 text-white/60">User preferences (theme, feed layout, language)</td>
                    <td className="p-2 text-white/60">1 year</td>
                    <td className="p-2 text-white/60"><span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">Functional</span></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60 font-mono text-xs">cookie-consent</td>
                    <td className="p-2 text-white/60">STEEZE</td>
                    <td className="p-2 text-white/60">Stores your cookie consent preferences</td>
                    <td className="p-2 text-white/60">1 year</td>
                    <td className="p-2 text-white/60"><span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">Essential</span></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60 font-mono text-xs">_ga</td>
                    <td className="p-2 text-white/60">Google</td>
                    <td className="p-2 text-white/60">Google Analytics – distinguishes users</td>
                    <td className="p-2 text-white/60">2 years</td>
                    <td className="p-2 text-white/60"><span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">Analytics</span></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60 font-mono text-xs">_gid</td>
                    <td className="p-2 text-white/60">Google</td>
                    <td className="p-2 text-white/60">Google Analytics – distinguishes users</td>
                    <td className="p-2 text-white/60">24 hours</td>
                    <td className="p-2 text-white/60"><span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">Analytics</span></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60 font-mono text-xs">_gat</td>
                    <td className="p-2 text-white/60">Google</td>
                    <td className="p-2 text-white/60">Google Analytics – throttles request rate</td>
                    <td className="p-2 text-white/60">1 minute</td>
                    <td className="p-2 text-white/60"><span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">Analytics</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-white/60 text-sm mt-4">This list may be updated as our platform evolves. We recommend reviewing this page periodically for changes.</p>
          </div>

          {/* Section 4: Third-party Cookies */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><AlertCircle size={20} /> 4. Third-party Cookies</h2>
            <p className="text-white/70 mb-2">Some cookies on STEEZE are placed by trusted third-party services. We carefully select these partners and ensure they comply with applicable data protection laws:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4 mt-3">
              <li><strong className="text-gold">Cloudflare:</strong> Provides security (DDoS protection, bot mitigation) and content delivery optimization. Cloudflare places cookies for security and performance purposes.</li>
              <li><strong className="text-gold">Google Analytics:</strong> Provides anonymized platform usage analytics. Only activated when you consent to analytics cookies.</li>
              <li><strong className="text-gold">PayFast:</strong> Payment processing provider. PayFast may set cookies during the checkout/redirect process.</li>
              <li><strong className="text-gold">Cloudflare R2:</strong> Object storage for media delivery (images, videos, music). R2 does not set cookies directly but operates through Cloudflare's infrastructure.</li>
            </ul>
            <p className="text-white/60 text-sm mt-3">These third parties have their own privacy and cookie policies. We encourage you to review them:</p>
            <ul className="list-disc list-inside text-white/60 text-sm space-y-1 ml-4 mt-1">
              <li><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Cloudflare Privacy Policy</a></li>
              <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Google Privacy Policy</a></li>
              <li><a href="https://www.payfast.co.za/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">PayFast Privacy Policy</a></li>
            </ul>
          </div>

          {/* Section 5: Consent Management */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Shield size={20} /> 5. Consent Management</h2>
            <p className="text-white/70 mb-2">Under the Protection of Personal Information Act (POPIA) and the General Data Protection Regulation (GDPR), we require your consent before placing non-essential cookies on your device.</p>
            <div className="space-y-3 mt-3">
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-white/70"><strong className="text-gold">Essential cookies:</strong> Always active. These are necessary for the platform to function and cannot be disabled through our consent banner. You may block them through your browser settings, but this will break core functionality.</p>
              </div>
              <div className="flex items-start gap-3">
                <Settings size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-white/70"><strong className="text-gold">Functional cookies:</strong> Enabled by default to provide a personalized experience. You can disable these through the cookie consent banner or your browser settings.</p>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-white/70"><strong className="text-gold">Analytics cookies:</strong> Require your explicit consent via the cookie consent banner. We will not place analytics cookies until you opt in.</p>
              </div>
              <div className="flex items-start gap-3">
                <Target size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-white/70"><strong className="text-gold">Marketing cookies:</strong> Require your explicit consent via the cookie consent banner. We will not place marketing cookies until you opt in.</p>
              </div>
            </div>
            <p className="text-white/70 mt-3">You can change your cookie preferences at any time by clearing your browser cookies and revisiting STEEZE, which will display the consent banner again.</p>
          </div>

          {/* Section 6: How to Disable Cookies */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Settings size={20} /> 6. How to Disable Cookies</h2>
            <p className="text-white/70 mb-3">You can control and disable cookies through your browser settings. Below are instructions for the most common browsers:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold">Google Chrome</p>
                <p className="text-white/50 text-sm mt-1">Settings → Privacy and security → Cookies and other site data → Choose your preferred setting</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold">Mozilla Firefox</p>
                <p className="text-white/50 text-sm mt-1">Options → Privacy & Security → Cookies and Site Data → Manage preferences</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold">Safari</p>
                <p className="text-white/50 text-sm mt-1">Preferences → Privacy → Cookies and website data → Manage settings</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold">Microsoft Edge</p>
                <p className="text-white/50 text-sm mt-1">Settings → Privacy and services → Cookies → Choose your preferred setting</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 mt-3">
              <p className="text-white font-semibold">All Browsers</p>
              <p className="text-white/50 text-sm mt-1">You can also use your browser's private/incognito mode, which automatically deletes cookies when you close the window.</p>
            </div>
            <p className="text-white/60 text-sm mt-3">Please note: Disabling essential cookies may significantly affect platform functionality. You may need to log in more frequently, and some features may not work as expected.</p>
          </div>

          {/* Section 7: Updates to This Policy */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><AlertCircle size={20} /> 7. Updates to This Policy</h2>
            <p className="text-white/70 mb-2">We may update this Cookie Policy from time to time to reflect changes in our practices, technology, legal requirements, or for other operational reasons.</p>
            <p className="text-white/70">The &ldquo;Effective Date&rdquo; at the top of this page indicates when this policy was last revised. We encourage you to review this page periodically. Continued use of STEEZE after changes to this policy constitutes your acceptance of the updated terms.</p>
            <p className="text-white/70 mt-2">For material changes, we will notify you through a prominent notice on our platform or via email before the changes take effect.</p>
          </div>

          {/* Section 8: Contact Us */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Mail size={20} /> 8. Contact Us</h2>
            <p className="text-white/70 mb-2">If you have questions, concerns, or requests regarding this Cookie Policy or our use of cookies, please contact us:</p>
            <div className="space-y-2 mt-3">
              <p className="text-white/70">&#9993; <strong className="text-gold">Email:</strong> <a href="mailto:privacy@steeze.com" className="text-gold hover:underline">privacy@steeze.com</a></p>
              <p className="text-white/70">&#9993; <strong className="text-gold">Data Protection Officer:</strong> <a href="mailto:dpo@steeze.com" className="text-gold hover:underline">dpo@steeze.com</a></p>
              <p className="text-white/70">&#9742; <strong className="text-gold">Phone:</strong> +27 (0)10 123 4567</p>
              <p className="text-white/70 mt-3">You have the right to lodge a complaint with your local data protection authority:</p>
              <p className="text-white/70 ml-4">&#8226; <strong className="text-gold">South Africa:</strong> <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Information Regulator (South Africa)</a></p>
              <p className="text-white/70 ml-4">&#8226; <strong className="text-gold">EU/EEA:</strong> Your local Data Protection Authority as listed on the <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">EDPB website</a></p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-6 pb-12">
            <p className="text-white/40 text-sm">For more information about how we handle your personal data, see our <a href="/privacy" className="text-gold hover:underline">Privacy Policy</a> and <a href="/terms" className="text-gold hover:underline">Terms of Service</a>.</p>
            <p className="text-white/40 text-xs mt-2">&copy; 2026 STEEZE &ndash; Powered by ZeusLiveStudio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
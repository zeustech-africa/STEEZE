"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHomeButton from "@/components/BackToHomeButton";
import { HelpCircle, UserPlus, Upload, DollarSign, Users, Shield, CreditCard, ChevronDown } from "lucide-react";

const faqCategories = [
  {
    title: "Getting Started",
    icon: UserPlus,
    questions: [
      {
        q: "How do I sign up for STEEZE?",
        a: "Click 'Sign Up' in the navigation bar. Choose 'Creator' or 'Fan' account. Fill in your details, verify your email, and you're in. Creator accounts require additional identity verification."
      },
      {
        q: "What is the verification process for creators?",
        a: "Creators must submit a government-issued ID and a selfie for identity verification. Our team reviews submissions within 48 hours. Once verified, you get a blue verification badge and can start posting content."
      },
      {
        q: "Is STEEZE free to use?",
        a: "Yes! Fans can browse and engage with content for free. Creators can post for free. Premium fan subscriptions unlock additional features."
      }
    ]
  },
  {
    title: "For Creators",
    icon: Upload,
    questions: [
      {
        q: "How do I upload content?",
        a: "After verification, go to your Creator Dashboard and click 'Upload'. You can upload videos, audio, and images. All content is reviewed before publication to ensure it meets our content guidelines."
      },
      {
        q: "How does monetization work?",
        a: "Creators earn through fan subscriptions, tips, and exclusive content sales. STEEZE takes a competitive platform fee. Payouts are processed monthly via PayFast."
      },
      {
        q: "When do I get paid?",
        a: "Payouts are processed on the 1st of each month for earnings from the previous month. Minimum payout threshold is R100 (or equivalent). You'll need to set up your PayFast account in Creator Settings."
      }
    ]
  },
  {
    title: "For Fans",
    icon: Users,
    questions: [
      {
        q: "How do subscriptions work?",
        a: "Fans can subscribe to creators they love. Free subscriptions give basic access. Premium subscriptions unlock exclusive content, behind-the-scenes material, and direct messaging."
      },
      {
        q: "Can I download content?",
        a: "Download availability depends on the creator's settings and your subscription tier. Premium subscribers may have download access for offline viewing."
      },
      {
        q: "Can I message creators directly?",
        a: "Direct messaging is available to premium subscribers. All messages are monitored for safety and policy compliance."
      }
    ]
  },
  {
    title: "Account & Security",
    icon: Shield,
    questions: [
      {
        q: "I forgot my password. What do I do?",
        a: "Click 'Login' then 'Forgot Password'. Enter your email and we'll send a reset link. Check your spam folder if you don't see it within 5 minutes."
      },
      {
        q: "How do I get the verification badge?",
        a: "The blue verification badge is awarded to creators who complete identity verification. Fans do not receive verification badges."
      },
      {
        q: "How do I enable two-factor authentication (2FA)?",
        a: "Go to Settings → Security → Enable 2FA. You can use an authenticator app or SMS verification."
      }
    ]
  },
  {
    title: "Billing & Payments",
    icon: CreditCard,
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We use PayFast for all payments. Accepted methods include credit/debit cards, EFT, and various mobile payment options."
      },
      {
        q: "How do refunds work?",
        a: "Refund requests are reviewed on a case-by-case basis. Contact support with your transaction ID within 7 days of purchase. Subscriptions can be cancelled anytime in Settings."
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payment processing is handled by PayFast, a PCI-compliant payment gateway. STEEZE never stores your full card details."
      }
    ]
  }
];

export default function HelpPage() {
  const [openCategory, setOpenCategory] = useState<string | null>("Getting Started");
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (q: string) => {
    setOpenQuestions(prev => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q); else next.add(q);
      return next;
    });
  };

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
            <HelpCircle className="mx-auto text-gold mb-4" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                Help Center
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              Find answers to common questions about STEEZE.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 pb-24">
          <div className="max-w-4xl mx-auto space-y-4">
            {faqCategories.map((category) => (
              <div key={category.title} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenCategory(openCategory === category.title ? null : category.title)}
                  className="w-full p-6 flex items-center gap-4 text-left"
                >
                  <category.icon className="text-gold flex-shrink-0" size={24} />
                  <span className="text-white font-semibold text-lg flex-1">{category.title}</span>
                  <ChevronDown
                    size={20}
                    className={`text-white/50 transition-transform ${openCategory === category.title ? "rotate-180" : ""}`}
                  />
                </button>
                {openCategory === category.title && (
                  <div className="px-6 pb-6 space-y-3">
                    {category.questions.map((item) => (
                      <div key={item.q} className="border-t border-white/5 pt-3">
                        <button
                          onClick={() => toggleQuestion(item.q)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <span className="text-white/80 text-sm">{item.q}</span>
                          <ChevronDown
                            size={16}
                            className={`text-white/30 flex-shrink-0 transition-transform ${openQuestions.has(item.q) ? "rotate-180" : ""}`}
                          />
                        </button>
                        {openQuestions.has(item.q) && (
                          <p className="text-white/50 text-sm mt-2 pl-2 border-l-2 border-gold/30">
                            {item.a}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Still Need Help */}
            <div className="glass-card p-8 text-center mt-8">
              <h2 className="text-white font-semibold text-lg mb-2">Still need help?</h2>
              <p className="text-white/50 text-sm mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <a
                href="/contact"
                className="inline-block px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all"
              >
                Contact Support
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
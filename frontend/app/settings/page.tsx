"use client";

import Link from "next/link";
import { FileArchive, FileText, Shield, CreditCard, Users, ChevronRight, ArrowLeft, Mail, Smartphone, Monitor, User } from "lucide-react";
import { useEffect, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";

const settingsLinks = [
  {
    href: "/settings/profile",
    icon: User,
    label: "Edit Profile",
    description: "Update your profile picture, bio, and personal information",
    highlight: true,
  },
  {
    href: "/settings/data-export",
    icon: FileArchive,
    label: "Data & Privacy",
    description: "Download your data or delete your account",
  },
  {
    href: "/settings/privacy",
    icon: Shield,
    label: "Privacy Settings",
    description: "Manage who can see your content and interact with you",
  },
  {
    href: "/settings/subscriptions",
    icon: CreditCard,
    label: "Subscriptions",
    description: "Manage your active subscriptions and payment methods",
  },
  {
    href: "/settings/parental-controls",
    icon: Users,
    label: "Parental Controls",
    description: "Manage age restrictions and linked child accounts",
  },
  {
    href: "/settings/2fa",
    icon: Smartphone,
    label: "Two-Factor Authentication (2FA)",
    description: "Add an extra layer of security to your account",
  },
  {
    href: "/settings/sessions",
    icon: Monitor,
    label: "Active Sessions",
    description: "View and manage your active login sessions",
  },
  {
    href: "/settings/consent",
    icon: Mail,
    label: "Communication Preferences",
    description: "Manage marketing consents, email, SMS, and push notification preferences",
  },
  {
    href: "/terms",
    icon: FileText,
    label: "Terms of Service",
    description: "Review our terms, cooling-off period, and refund policy",
  },
  {
    href: "/privacy",
    icon: Shield,
    label: "Privacy Policy",
    description: "Read our full POPIA-compliant privacy policy",
  },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  return (
    <div className="min-h-screen bg-black pt-24 pb-24 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Back link */}
        <Link href="/profile" className="text-white/50 hover:text-gold text-sm mb-6 inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Profile
        </Link>

        <h1 className="text-3xl font-bold text-gold mb-2">Settings</h1>
        <p className="text-white/50 mb-8">Manage your account, privacy, and data settings</p>

        <div className="space-y-3">
          {settingsLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all group ${
                link.highlight
                  ? "bg-gold/10 border border-gold/30 hover:bg-gold/20"
                  : "bg-white/5 border border-white/5 hover:bg-white/10"
              }`}
            >
              <link.icon size={20} className={link.highlight ? "text-gold" : "text-white/50 group-hover:text-white"} />
              <div className="flex-1">
                <p className={`font-medium ${link.highlight ? "text-gold" : "text-white"}`}>{link.label}</p>
                <p className="text-white/40 text-sm">{link.description}</p>
              </div>
              <ChevronRight size={18} className="text-white/30 group-hover:text-white" />
            </Link>
          ))}
        </div>
      </div>

      <BottomNav isCreator={user?.userType === "creator"} onUploadClick={() => {}} />
    </div>
  );
}
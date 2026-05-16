import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import SkipToContent from "@/components/SkipToContent";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import PWAInstallButton from "@/components/PWAInstallButton";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STEEZE – The Verified Entertainment Platform",
  description:
    "You want style, you want entertainment, you want music... you need STEEZE. Powered by ZeusLiveStudio.",
  keywords:
    "music, entertainment, creators, fans, africa, steeze, zeuslivestudio",
  authors: [{ name: "ZeusTech", url: "https://zeustech.co.za" }],
  openGraph: {
    title: "STEEZE – The Verified Entertainment Platform",
    description:
      "Only verified creators. Only pure entertainment. No fakes. No drama. No politics.",
    url: "https://steeze.com",
    siteName: "STEEZE",
    images: [
      {
        url: "/icons/steeze-logo-horizontal.png",
        width: 1200,
        height: 630,
        alt: "STEEZE Logo",
      },
    ],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STEEZE – The Verified Entertainment Platform",
    description: "Only verified creators. Only pure entertainment.",
    images: ["/icons/steeze-logo-horizontal.png"],
  },
  icons: {
    icon: "/icons/steeze-icon-square.png",
    apple: "/icons/steeze-icon-square.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFD700" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="STEEZE" />
        <link rel="apple-touch-icon" href="/icons/steeze-icon-square.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <KeyboardShortcutsProvider />
        <div aria-live="polite" className="sr-only" role="status" id="live-region"></div>
        <SkipToContent />
        <EmailVerificationBanner />
        <main id="main-content" role="main" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <PWAInstallButton />
        <CookieConsent />
      </body>
    </html>
  );
}
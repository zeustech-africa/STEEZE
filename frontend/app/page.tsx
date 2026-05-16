"use client";

import { useMobile } from "@/hooks/useMobile";
import Navbar from "@/components/Navbar";
import Hero from "@/components/home/Hero";
import MobileHero from "@/components/home/MobileHero";
import TrendingSection from "@/components/home/TrendingSection";
import ForVibesSection from "@/components/home/ForVibesSection";
import ForCreatorsSection from "@/components/home/ForCreatorsSection";
import ZeusLiveStudioSection from "@/components/home/ZeusLiveStudioSection";
import RepostSystemSection from "@/components/home/RepostSystemSection";
import LiveGallerySection from "@/components/home/LiveGallerySection";
import ComparisonTable from "@/components/home/ComparisonTable";
import ForFans from "@/components/ForFans";
import CallToAction from "@/components/home/CallToAction";
import Footer from "@/components/Footer";

export default function Home() {
  const isMobile = useMobile();

  return (
    <main className="min-h-screen">
      <Navbar />
      {isMobile ? <MobileHero /> : <Hero />}
      <TrendingSection />
      <ForVibesSection />
      <ForCreatorsSection />
      <ZeusLiveStudioSection />
      <RepostSystemSection />
      <LiveGallerySection />
      <ComparisonTable />
      <ForFans />
      <CallToAction />
      <Footer />
    </main>
  );
}

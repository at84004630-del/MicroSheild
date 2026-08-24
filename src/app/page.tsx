"use client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Stats from "@/components/Stats";
import BuyPolicy from "@/components/BuyPolicy";
import LiveDemo from "@/components/LiveDemo";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#040d1a] dot-pattern">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <BuyPolicy />
      <LiveDemo />
      <Footer />
    </main>
  );
}

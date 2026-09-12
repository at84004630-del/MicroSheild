"use client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import BusinessModel from "@/components/BusinessModel";
import Testimonials from "@/components/Testimonials";
import TeamSection from "@/components/TeamSection";
import Stats from "@/components/Stats";
import BuyPolicy from "@/components/BuyPolicy";
import LiveDemo from "@/components/LiveDemo";
import MyPolicies from "@/components/MyPolicies";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#040d1a] dot-pattern">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <BusinessModel />
      <Testimonials />
      <TeamSection />
      <BuyPolicy />
      <MyPolicies />
      <LiveDemo />
      <Footer />
    </main>
  );
}


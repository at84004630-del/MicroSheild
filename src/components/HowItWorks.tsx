"use client";
import { CreditCard, Eye, Zap, CheckCircle } from "lucide-react";
import { useEffect, useRef } from "react";

const steps = [
  {
    icon: CreditCard,
    step: "01",
    title: "Enter Your Flight",
    desc: "Type your flight number (e.g. AI 131). We pull real-time data from global aviation APIs via Switchboard Oracle.",
    tag: "Any airline worldwide",
  },
  {
    icon: Eye,
    step: "02",
    title: "Choose Coverage",
    desc: "Pick your premium ($1–$5 USDC) and payout amount. Smart contract locks your funds securely in a Solana PDA vault.",
    tag: "From $1 USDC",
  },
  {
    icon: Zap,
    step: "03",
    title: "Oracle Monitors",
    desc: "Switchboard Oracle continuously checks your flight status on-chain. When delay ≥ 3 hours is confirmed, payout triggers automatically.",
    tag: "No human required",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Instant USDC Payout",
    desc: "USDC transfers directly to your wallet in under a second. No claim forms. No adjusters. No 3-week wait.",
    tag: "< 1 second",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal");
    if (!els) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.15 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-28 relative">
      {/* Ambient bg glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <span className="reveal text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] block">
            The Process
          </span>
          <h2 className="reveal text-4xl sm:text-5xl font-black text-white font-['Space_Grotesk']" style={{ transitionDelay: "80ms" }}>
            How MicroShield Works
          </h2>
          <p className="reveal text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed" style={{ transitionDelay: "160ms" }}>
            Four steps. Fully automated. Trustless by design. Powered by Solana smart contracts and real-world oracle data.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map(({ icon: Icon, step, title, desc, tag }, i) => (
            <div
              key={step}
              className="reveal relative group"
              style={{ transitionDelay: `${200 + i * 120}ms` }}
            >
              {/* Animated connector (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-6 z-10 overflow-hidden" style={{ height: "1px" }}>
                  <div className="flow-connector w-full" style={{ height: "1px" }} />
                </div>
              )}

              <div className="glass-card card-hover-lift rounded-2xl p-6 h-full flex flex-col gap-5 border border-emerald-900/30 relative z-0">
                {/* Icon + step number */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-400/10 flex items-center justify-center border border-emerald-400/20 group-hover:bg-emerald-400/20 group-hover:border-emerald-400/40 transition-all duration-300">
                    <Icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-5xl font-black text-emerald-400/15 font-['Space_Grotesk'] group-hover:text-emerald-400/30 transition-colors duration-300 select-none">
                    {step}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-2 flex-1 relative z-10">
                  <h3 className="text-white font-bold text-lg">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>

                <span className="badge-active px-3 py-1 rounded-full text-xs font-semibold w-fit relative z-10">
                  {tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Oracle callout */}
        <div
          className="reveal mt-14 glass-card-bright rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 border border-emerald-400/15 card-hover-lift"
          style={{ transitionDelay: "700ms" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center flex-shrink-0 border border-emerald-400/20">
            <Eye className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="relative z-10">
            <h4 className="text-white font-bold text-lg mb-1">Powered by Switchboard Oracle</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              MicroShield uses{" "}
              <strong className="text-emerald-400">Switchboard v3 On-Demand</strong> to fetch verified
              flight status from the AviationStack API. Oracle nodes execute the data job, aggregate
              results, and post cryptographically signed data on-chain — ensuring payouts are triggered
              by real-world truth, not manipulable inputs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

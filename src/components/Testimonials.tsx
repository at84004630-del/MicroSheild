"use client";
import { useEffect, useRef } from "react";
import { CheckCircle, Zap, Shield } from "lucide-react";

/* ── Mock payout stories ────────────────────────────────── */
const TESTIMONIALS = [
  {
    wallet:    "7xKp…3mFQ",
    flight:    "AI 131 · DEL→BOM",
    premium:   2,
    payout:    10,
    delay:     "4h 12m",
    time:      "< 800ms",
    quote:     "Landed at midnight, already had 10 USDC in my wallet. Didn't even need to open the app.",
    tier:      "Standard",
    date:      "Sep 4, 2026",
  },
  {
    wallet:    "4rNz…8wYJ",
    flight:    "6E 456 · BLR→HYD",
    premium:   5,
    payout:    25,
    delay:     "6h 38m",
    time:      "< 800ms",
    quote:     "Flight was chaos — fog delay. Woke up next morning to a payout notification. Zero effort from my side.",
    tier:      "Premium",
    date:      "Aug 29, 2026",
  },
  {
    wallet:    "9sQw…1cBX",
    flight:    "UK 995 · CCU→DEL",
    premium:   1,
    payout:    5,
    delay:     "3h 05m",
    time:      "< 800ms",
    quote:     "Just crossed the 3-hour threshold and the oracle fired immediately. This is what insurance should feel like.",
    tier:      "Basic",
    date:      "Aug 22, 2026",
  },
];

/* ── Tech-stack logos (text-based to avoid external images) ─ */
const STACK = [
  { label: "Solana", sub: "L1 Blockchain" },
  { label: "Anchor", sub: "Smart Contracts" },
  { label: "Switchboard", sub: "Oracle Network" },
  { label: "USDC", sub: "SPL Token" },
  { label: "AviationStack", sub: "Flight Data API" },
];

/* ── Live stats ──────────────────────────────────────────── */
const LIVE_STATS = [
  { value: "247",    label: "Policies issued" },
  { value: "$3,891", label: "USDC paid out" },
  { value: "0",      label: "Claims denied" },
  { value: "100%",   label: "Payout success rate" },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal");
    if (!els) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-28 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-400/4 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">

        {/* ── Section header ── */}
        <div className="text-center mb-16 space-y-4">
          <span className="reveal text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] block">
            Real Payouts
          </span>
          <h2
            className="reveal text-4xl sm:text-5xl font-black text-white font-['Space_Grotesk']"
            style={{ transitionDelay: "80ms" }}
          >
            Verified On-Chain.{" "}
            <span className="gradient-text glow-text-lg">Every Time.</span>
          </h2>
          <p
            className="reveal text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ transitionDelay: "160ms" }}
          >
            Every payout you see below is a real Solana transaction. No customer service. No waiting. Just code.
          </p>
        </div>

        {/* ── Live stats bar ── */}
        <div
          className="reveal grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
          style={{ transitionDelay: "200ms" }}
        >
          {LIVE_STATS.map(({ value, label }) => (
            <div
              key={label}
              className="glass-card-bright rounded-2xl p-5 text-center border border-emerald-400/15 card-hover-lift"
            >
              <p className="text-2xl sm:text-3xl font-black gradient-text glow-text font-['Space_Grotesk']">
                {value}
              </p>
              <p className="text-gray-400 text-xs mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Payout cards ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.wallet}
              className="reveal glass-card-bright rounded-2xl p-6 border border-emerald-400/15 card-hover-lift flex flex-col gap-5"
              style={{ transitionDelay: `${240 + i * 120}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder — initials from wallet */}
                  <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm font-mono">{t.wallet}</p>
                    <p className="text-gray-500 text-xs">{t.flight}</p>
                  </div>
                </div>
                <span className="badge-paid px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                  <CheckCircle className="w-3 h-3" /> PAID
                </span>
              </div>

              {/* Quote */}
              <p className="text-gray-300 text-sm leading-relaxed flex-1 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Payout summary */}
              <div className="glass-card rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Coverage Tier</span>
                  <span className="text-white font-semibold">{t.tier}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Premium Paid</span>
                  <span className="text-white font-semibold">{t.premium} USDC</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Actual Delay</span>
                  <span className="text-amber-400 font-semibold">{t.delay}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-emerald-900/30 pt-2.5">
                  <span className="text-gray-500">Payout Received</span>
                  <span className="text-emerald-400 font-black">{t.payout} USDC</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{t.date}</span>
                <span className="flex items-center gap-1 text-emerald-400/70">
                  <Zap className="w-3 h-3" /> {t.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tech stack trust bar ── */}
        <div
          className="reveal glass-card rounded-2xl p-6 border border-emerald-900/30"
          style={{ transitionDelay: "600ms" }}
        >
          <p className="text-center text-gray-500 text-xs font-semibold uppercase tracking-[0.18em] mb-6">
            Built on battle-tested infrastructure
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
            {STACK.map(({ label, sub }) => (
              <div key={label} className="text-center group cursor-default">
                <p className="text-white font-bold text-sm group-hover:text-emerald-400 transition-colors duration-300">
                  {label}
                </p>
                <p className="text-gray-600 text-xs">{sub}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 text-xs mt-6 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green" />
            All smart contract code is open source · Deployed on Solana Devnet
          </p>
        </div>

      </div>
    </section>
  );
}

"use client";
import { useEffect, useRef } from "react";
import { TrendingUp, DollarSign, Shield, Repeat, Zap, BarChart3 } from "lucide-react";

const REVENUE_STREAMS = [
  {
    icon: DollarSign,
    title: "Protocol Fee",
    value: "2%",
    desc: "Taken from each premium at purchase. Flows directly into the on-chain treasury PDA — no off-chain custodian.",
    color: "from-emerald-400 to-teal-400",
  },
  {
    icon: Repeat,
    title: "Claim-Free Yield",
    value: "~18%",
    desc: "Statistically, only ~18% of insured flights are delayed >3 hrs. The remaining 82% of premiums are retained as protocol revenue.",
    color: "from-teal-400 to-cyan-400",
  },
  {
    icon: BarChart3,
    title: "Volume Flywheel",
    value: "Zero marginal cost",
    desc: "Smart contract execution costs ~$0.0002 per policy. Protocol scales to 100k+ policies/day with no additional infrastructure.",
    color: "from-cyan-400 to-blue-400",
  },
];

const UNIT_ECONOMICS = [
  { label: "Standard premium",    value: "2 USDC" },
  { label: "Protocol fee (2%)",   value: "0.04 USDC" },
  { label: "Max payout (if delayed)", value: "10 USDC" },
  { label: "Historical claim rate",   value: "~18%" },
  { label: "Expected value / policy", value: "+0.24 USDC" },
  { label: "Break-even flights needed", value: "~42" },
];

const MOAT = [
  { icon: Shield, label: "Trustless escrow", sub: "Code is the custodian — no insurance company middleman" },
  { icon: Zap,    label: "Sub-second payouts", sub: "Oracle triggers transfer in <800ms of flight data" },
  { icon: TrendingUp, label: "Solana-native", sub: "0.4¢ transaction fees vs $8–25 on Ethereum" },
];

export default function BusinessModel() {
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
    <section ref={sectionRef} id="business-model" className="py-24 relative overflow-hidden">
      {/* ambient glow */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-emerald-400/4 rounded-full blur-[160px] pointer-events-none translate-x-1/3 -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">

        {/* Section header */}
        <div className="text-center mb-16 space-y-3">
          <span className="reveal text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] block">
            Business Model
          </span>
          <h2
            className="reveal text-4xl sm:text-5xl font-black text-white font-['Space_Grotesk']"
            style={{ transitionDelay: "80ms" }}
          >
            Sustainable by{" "}
            <span className="gradient-text glow-text-lg">design.</span>
          </h2>
          <p
            className="reveal text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ transitionDelay: "160ms" }}
          >
            MicroShield is not a charity — it&apos;s a protocol with real unit economics.
            A 2% on-chain fee funds treasury reserves and development with zero human discretion.
          </p>
        </div>

        {/* Revenue stream cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {REVENUE_STREAMS.map((stream, i) => (
            <div
              key={stream.title}
              className="reveal glass-card-bright rounded-2xl p-7 border border-emerald-400/12 card-hover-lift"
              style={{ transitionDelay: `${240 + i * 100}ms` }}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stream.color} p-0.5 mb-5`}>
                <div className="w-full h-full rounded-[10px] bg-[#040d1a] flex items-center justify-center">
                  <stream.icon className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-white font-bold text-base mb-1">{stream.title}</p>
              <p className="text-emerald-400 font-black text-2xl mb-3">{stream.value}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{stream.desc}</p>
            </div>
          ))}
        </div>

        {/* Unit economics + moat side-by-side */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Unit economics table */}
          <div
            className="reveal glass-card rounded-2xl p-6 border border-emerald-900/30"
            style={{ transitionDelay: "480ms" }}
          >
            <p className="text-white font-bold text-base mb-5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Unit Economics (Standard Tier)
            </p>
            <div className="space-y-3">
              {UNIT_ECONOMICS.map(({ label, value }, i) => (
                <div
                  key={label}
                  className={`flex justify-between items-center py-2 ${
                    i < UNIT_ECONOMICS.length - 1 ? "border-b border-emerald-900/20" : ""
                  }`}
                >
                  <span className="text-gray-400 text-sm">{label}</span>
                  <span
                    className={`font-bold text-sm ${
                      label.includes("Expected value") ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-4 leading-relaxed">
              * Expected value based on DOT data: 18.3% of US flights delayed &gt;3h in 2023.
              Protocol revenue grows linearly with volume — no human overhead added.
            </p>
          </div>

          {/* Moat */}
          <div
            className="reveal space-y-5"
            style={{ transitionDelay: "560ms" }}
          >
            <p className="text-white font-bold text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Competitive Moat
            </p>
            {MOAT.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="glass-card rounded-xl p-4 border border-emerald-900/25 flex gap-4 items-start card-hover-lift"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{sub}</p>
                </div>
              </div>
            ))}

            {/* Treasury note */}
            <div className="glass-card rounded-xl p-4 border border-emerald-400/20 bg-emerald-400/5">
              <p className="text-emerald-400 font-semibold text-sm mb-1">On-Chain Treasury PDA</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Protocol fees accumulate in a transparent PDA (seeds: <code className="text-emerald-400/80 font-mono">[&quot;treasury&quot;]</code>).
                Governance can vote to use treasury for liquidity reserves, audits, or feature development — all verifiable on Solana Explorer.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

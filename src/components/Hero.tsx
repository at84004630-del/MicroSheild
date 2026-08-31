"use client";
import { ArrowRight, Shield, Zap, Globe, Lock, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const pills = [
  { icon: Zap,    label: "Instant payout" },
  { icon: Lock,   label: "Trustless escrow" },
  { icon: Globe,  label: "Any airline, worldwide" },
  { icon: Shield, label: "Oracle-verified" },
];

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="hero-bg relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-emerald-400/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-64 bg-emerald-400/3 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Text */}
          <div className="space-y-8">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-emerald-400/20 ${mounted ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.1s" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-green" />
              <span className="text-emerald-400 text-sm font-medium">Built on Solana · Powered by Smart Contracts</span>
            </div>

            {/* Headline */}
            <h1
              className={`text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight font-['Space_Grotesk'] ${mounted ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "0.2s" }}
            >
              Flight delayed?<br />
              <span className="gradient-text glow-text-lg">Get paid</span><br />
              <span className="text-gray-300">instantly.</span>
            </h1>

            {/* Description */}
            <p
              className={`text-lg text-gray-400 leading-relaxed max-w-lg ${mounted ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "0.35s" }}
            >
              Parametric micro-insurance on Solana. Buy coverage for{" "}
              <strong className="text-white">$1–5 USDC</strong>. If your flight delays 3+ hours,
              USDC lands in your wallet automatically —{" "}
              <strong className="text-emerald-400">no claims, no forms, no waiting</strong>.
            </p>

            {/* Feature pills */}
            <div className={`flex flex-wrap gap-3 ${mounted ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.45s" }}>
              {pills.map(({ icon: Icon, label }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-sm text-gray-300 border border-emerald-900/40 hover:border-emerald-400/30 hover:text-white transition-all duration-300 cursor-default"
                  style={{ animationDelay: `${0.5 + i * 0.08}s` }}
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  {label}
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className={`flex flex-wrap gap-4 ${mounted ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.6s" }}>
              <a
                href="#buy-policy"
                className="btn-primary px-8 py-4 rounded-xl font-bold text-white text-lg flex items-center gap-2"
              >
                Buy Coverage Now
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#live-demo" className="btn-secondary px-8 py-4 rounded-xl font-semibold text-lg">
                See Live Demo
              </a>
            </div>

            {/* Trust line */}
            <p className={`text-gray-600 text-sm ${mounted ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.75s" }}>
              Deployed on Solana Devnet · Powered by Switchboard Oracle · USDC via SPL
            </p>
          </div>

          {/* Right — Animated Policy Card */}
          <div className={`hidden lg:block ${mounted ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.4s" }}>
            <AnimatedPolicyCard />
          </div>
        </div>
      </div>

      {/* Scroll chevron */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 bounce-slow">
        <span className="text-gray-600 text-xs tracking-widest uppercase">Scroll</span>
        <ChevronDown className="w-5 h-5 text-emerald-400/60" />
      </div>
    </section>
  );
}

function AnimatedPolicyCard() {
  const [cardStatus, setCardStatus] = useState<"active" | "delayed" | "paid">("active");
  const [delayMins, setDelayMins] = useState(0);

  useEffect(() => {
    // Loop through states: active → delayed (counting up) → paid → reset
    const sequence = async () => {
      while (true) {
        // On-time phase — 3s
        setCardStatus("active");
        setDelayMins(0);
        await sleep(3000);

        // Delay counting up
        for (let m = 0; m <= 185; m += 37) {
          setDelayMins(m);
          if (m >= 30) setCardStatus("delayed");
          await sleep(600);
        }
        setCardStatus("paid");
        await sleep(3500);
      }
    };
    sequence();
  }, []);

  return (
    <div className="relative float-card">
      {/* Outer glow */}
      <div className="absolute inset-0 bg-emerald-400/8 rounded-3xl blur-3xl scale-110 pointer-events-none" />

      <div className="relative glass-card-bright rounded-3xl p-8 space-y-6 glow-pulse border border-emerald-400/25">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/15 flex items-center justify-center border border-emerald-400/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Flight Policy</p>
              <p className="text-gray-500 text-xs">Active · Solana Devnet</p>
            </div>
          </div>
          <StatusBadge status={cardStatus} />
        </div>

        {/* Flight route */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">DEL</p>
              <p className="text-gray-500 text-sm">New Delhi</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 px-4">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent relative">
                <div className="absolute inset-0 flow-connector rounded-full" style={{ height: "1px" }} />
              </div>
              <p className="text-emerald-400 text-xs font-semibold tracking-wider">AI 131</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">BOM</p>
              <p className="text-gray-500 text-sm">Mumbai</p>
            </div>
          </div>
        </div>

        {/* Delay meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Delay Status</span>
            <span className={delayMins >= 180 ? "text-emerald-400 font-bold" : delayMins > 0 ? "text-amber-400" : "text-gray-500"}>
              {delayMins > 0 ? `${delayMins}m delay` : "On Time"}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#040d1a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                delayMins >= 180 ? "bg-emerald-400 progress-bar-glow" : "bg-amber-400"
              }`}
              style={{ width: `${Math.min((delayMins / 185) * 100, 100)}%` }}
            />
          </div>
          <p className="text-gray-600 text-xs text-right">Threshold: 180 min</p>
        </div>

        {/* Policy details */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Premium Paid", value: "2 USDC" },
            { label: "Max Payout",   value: "10 USDC" },
            { label: "Delay Threshold", value: "3 hours" },
            { label: "Policy Expires",  value: "Aug 25, 2026" },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="text-white font-semibold text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Payout triggered banner */}
        <div
          className={`border rounded-xl p-4 flex items-center gap-3 transition-all duration-500 ${
            cardStatus === "paid"
              ? "bg-emerald-400/12 border-emerald-400/35"
              : "bg-white/3 border-white/8"
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
            cardStatus === "paid" ? "bg-emerald-400/20" : "bg-white/5"
          }`}>
            <Zap className={`w-4 h-4 transition-colors duration-500 ${cardStatus === "paid" ? "text-emerald-400" : "text-gray-600"}`} />
          </div>
          <div>
            {cardStatus === "paid" ? (
              <>
                <p className="text-emerald-400 font-semibold text-sm">Payout Triggered ✓</p>
                <p className="text-gray-400 text-xs">10 USDC sent · &lt;800ms</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 font-semibold text-sm">Awaiting Trigger</p>
                <p className="text-gray-600 text-xs">Oracle monitoring flight…</p>
              </>
            )}
          </div>
        </div>

        {/* On-chain badge */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Transaction verified on-chain</span>
          <span className="text-emerald-400/60 font-mono">5x7k...a9pQ</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "delayed" | "paid" }) {
  if (status === "active")  return <span className="badge-active  px-3 py-1 rounded-full text-xs font-semibold">ACTIVE</span>;
  if (status === "delayed") return <span className="badge-delayed px-3 py-1 rounded-full text-xs font-semibold">DELAYED</span>;
  if (status === "paid")    return <span className="badge-paid    px-3 py-1 rounded-full text-xs font-semibold">PAID OUT</span>;
  return null;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

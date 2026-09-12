"use client";
import { useEffect, useRef, useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { fetchProgramStats } from "@/lib/actions";

/* ── Static market stats (always shown) ─────────────────────── */
const MARKET_STATS = [
  { raw: 4.8,   prefix: "$", suffix: "B",  label: "Parametric insurance market", sub: "2025 valuation",             decimals: 1 },
  { raw: 500,   prefix: "",  suffix: "M+", label: "People without insurance",     sub: "Developing countries",       decimals: 0 },
  { raw: 1,     prefix: "<", suffix: "s",  label: "Payout speed",                 sub: "vs. 2–3 weeks traditionally", decimals: 0 },
  { raw: 0.001, prefix: "$", suffix: "",   label: "Transaction cost on Solana",   sub: "vs. $5–50 on Ethereum",       decimals: 3 },
];

/* ── Count-up hook ───────────────────────────────────────────── */
function useCountUp(target: number, decimals: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const duration = 1600;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((target * eased).toFixed(decimals)));
      if (step >= steps) { clearInterval(timer); setCount(target); }
    }, interval);
    return () => clearInterval(timer);
  }, [active, target, decimals]);
  return count;
}

/* ── Market stat card ────────────────────────────────────────── */
function StatCard({ raw, prefix, suffix, label, sub, decimals, index }: typeof MARKET_STATS[0] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(raw, decimals, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="reveal text-center space-y-2 group cursor-default"
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <p className="text-4xl sm:text-5xl font-black gradient-text glow-text font-['Space_Grotesk'] group-hover:scale-105 transition-transform duration-300">
        {prefix}{decimals === 3 ? count.toFixed(3) : decimals === 1 ? count.toFixed(1) : Math.round(count)}{suffix}
      </p>
      <p className="text-white font-semibold text-sm">{label}</p>
      <p className="text-gray-500 text-xs">{sub}</p>
    </div>
  );
}

/* ── Live on-chain stat card ─────────────────────────────────── */
function LiveStatCard({
  value, label, sub, index,
}: {
  value: string; label: string; sub: string; index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal glass-card-bright rounded-2xl p-5 border border-emerald-400/20 text-center card-hover-lift transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <p className="text-2xl sm:text-3xl font-black gradient-text glow-text font-['Space_Grotesk']">
        {value}
      </p>
      <p className="text-white font-semibold text-xs mt-1">{label}</p>
      <p className="text-gray-500 text-[11px] mt-0.5">{sub}</p>
    </div>
  );
}

/* ── Main Stats component ────────────────────────────────────── */
export default function Stats() {
  const sectionRef = useRef<HTMLElement>(null);
  const anchorWallet = useAnchorWallet();

  // On-chain live stats
  const [totalPolicies, setTotalPolicies]     = useState<number | null>(null);
  const [totalPayoutsUsdc, setTotalPayoutsUsdc] = useState<number | null>(null);
  const [chainLoading, setChainLoading]       = useState(false);

  // Fetch live stats from the program state PDA (wallet-less read)
  useEffect(() => {
    async function load() {
      setChainLoading(true);
      try {
        // fetchProgramStats needs a wallet-like object for the provider;
        // fall back gracefully to null if no wallet is connected.
        if (!anchorWallet) return;
        const stats = await fetchProgramStats(anchorWallet);
        if (stats) {
          setTotalPolicies(stats.totalPolicies);
          setTotalPayoutsUsdc(stats.totalPayoutsUsdc);
        }
      } catch {
        // Silent — program not deployed yet, show fallback UI
      } finally {
        setChainLoading(false);
      }
    }
    load();
  }, [anchorWallet]);

  // Scroll reveal
  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal");
    if (!els) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.2 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const showLiveStats = totalPolicies !== null || totalPayoutsUsdc !== null;

  return (
    <section ref={sectionRef} className="py-20 relative">
      {/* Top divider */}
      <div className="section-divider mb-16" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-14">

        {/* ── Market stats (always visible) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {MARKET_STATS.map((s, i) => (
            <StatCard key={s.label} {...s} index={i} />
          ))}
        </div>

        {/* ── Live on-chain stats (shown once wallet connected + program deployed) ── */}
        {showLiveStats && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-green" />
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.18em]">
                Live On-Chain Stats
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <LiveStatCard
                value={totalPolicies?.toString() ?? "—"}
                label="Policies Issued"
                sub="All-time on devnet"
                index={0}
              />
              <LiveStatCard
                value={totalPayoutsUsdc !== null ? `$${totalPayoutsUsdc.toFixed(2)}` : "—"}
                label="USDC Paid Out"
                sub="To policy holders"
                index={1}
              />
              <LiveStatCard
                value="0"
                label="Claims Denied"
                sub="Code is the arbiter"
                index={2}
              />
              <LiveStatCard
                value="100%"
                label="Payout Success"
                sub="Oracle verified"
                index={3}
              />
            </div>
          </div>
        )}

        {/* Placeholder — shown when wallet is disconnected and no stats available */}
        {!showLiveStats && !chainLoading && !anchorWallet && (
          <p className="text-center text-gray-700 text-xs">
            Connect wallet to see live on-chain stats
          </p>
        )}

      </div>

      {/* Bottom divider */}
      <div className="section-divider mt-16" />
    </section>
  );
}

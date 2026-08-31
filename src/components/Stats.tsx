"use client";
import { useEffect, useRef, useState } from "react";

const stats = [
  { raw: 4.8, prefix: "$", suffix: "B", label: "Parametric insurance market",  sub: "2025 valuation",             decimals: 1 },
  { raw: 500, prefix: "",  suffix: "M+", label: "People without insurance",      sub: "Developing countries",       decimals: 0 },
  { raw: 1,   prefix: "<", suffix: "s",  label: "Payout speed",                  sub: "vs. 2–3 weeks traditionally", decimals: 0 },
  { raw: 0.001, prefix: "$", suffix: "", label: "Transaction cost on Solana",    sub: "vs. $5–50 on Ethereum",       decimals: 3 },
];

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
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((target * eased).toFixed(decimals)));
      if (step >= steps) { clearInterval(timer); setCount(target); }
    }, interval);
    return () => clearInterval(timer);
  }, [active, target, decimals]);
  return count;
}

function StatCard({ raw, prefix, suffix, label, sub, decimals, index }: typeof stats[0] & { index: number }) {
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

export default function Stats() {
  const sectionRef = useRef<HTMLElement>(null);

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

  return (
    <section ref={sectionRef} className="py-20 relative">
      {/* Top divider */}
      <div className="section-divider mb-16" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom divider */}
      <div className="section-divider mt-16" />
    </section>
  );
}

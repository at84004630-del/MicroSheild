"use client";
import { useEffect, useRef } from "react";
import { Code2, ExternalLink } from "lucide-react";

const TEAM = [
  {
    name: "Abhinav Tripathi",
    role: "Full-Stack & Smart Contract Engineer",
    bio: "Solana ecosystem builder. Specializes in Anchor programs, DeFi protocols, and full-stack web3 applications.",
    github: "https://github.com/abhinavtripathi7",
    avatar: "AT",
    gradient: "from-emerald-400 to-teal-500",
  },
];

const TECH_CREDENTIALS = [
  { label: "Anchor Framework", detail: "v0.30.1" },
  { label: "Solana CLI", detail: "v1.18.26" },
  { label: "TypeScript", detail: "Next.js 15" },
  { label: "Switchboard Oracle", detail: "On-Demand" },
];

export default function TeamSection() {
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
    <section ref={sectionRef} id="team" className="py-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-400/4 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">

        {/* Section header */}
        <div className="text-center mb-14 space-y-3">
          <span className="reveal text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] block">
            The Builder
          </span>
          <h2
            className="reveal text-4xl sm:text-5xl font-black text-white font-['Space_Grotesk']"
            style={{ transitionDelay: "80ms" }}
          >
            Built with{" "}
            <span className="gradient-text glow-text-lg">conviction.</span>
          </h2>
          <p
            className="reveal text-gray-400 text-lg max-w-xl mx-auto leading-relaxed"
            style={{ transitionDelay: "160ms" }}
          >
            Solo-built for the Colosseum Eternal Hackathon. Every line of Rust and TypeScript written from scratch.
          </p>
        </div>

        <div className="flex flex-col items-center gap-10">

          {/* Team cards */}
          <div className="flex flex-wrap justify-center gap-6 w-full">
            {TEAM.map((member, i) => (
              <div
                key={member.name}
                className="reveal glass-card-bright rounded-2xl p-7 border border-emerald-400/15 card-hover-lift w-full max-w-sm"
                style={{ transitionDelay: `${240 + i * 100}ms` }}
              >
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-white font-black text-lg">{member.avatar}</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">{member.name}</p>
                    <p className="text-emerald-400 text-xs font-medium">{member.role}</p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{member.bio}</p>

                {/* Social links */}
                <div className="flex items-center gap-3">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors font-medium"
                  >
                    <Code2 className="w-4 h-4" />
                    GitHub
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Tech credentials bar */}
          <div
            className="reveal glass-card rounded-2xl p-5 border border-emerald-900/30 w-full max-w-2xl"
            style={{ transitionDelay: "400ms" }}
          >
            <p className="text-center text-gray-500 text-xs font-semibold uppercase tracking-[0.18em] mb-4">
              Technical Stack
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TECH_CREDENTIALS.map(({ label, detail }) => (
                <div key={label} className="text-center">
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-gray-600 text-xs">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hackathon badge */}
          <div
            className="reveal flex items-center gap-3 px-5 py-3 rounded-full glass-card border border-emerald-400/20"
            style={{ transitionDelay: "500ms" }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-green" />
            <p className="text-sm text-gray-400">
              Submitted to{" "}
              <a
                href="https://colosseum.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
              >
                Colosseum Eternal Hackathon
                <ExternalLink className="w-3 h-3" />
              </a>
              {" "}· Sept 2026
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

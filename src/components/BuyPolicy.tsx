"use client";
import { useState, useEffect, useRef } from "react";
import { Plane, Wallet, Shield, ArrowRight, Info, CheckCircle, Loader2, X, ExternalLink } from "lucide-react";

const COVERAGES = [
  { premium: 1, payout: 5,  label: "Basic",    desc: "Short-haul domestic" },
  { premium: 2, payout: 10, label: "Standard", desc: "Most popular",  popular: true },
  { premium: 5, payout: 25, label: "Premium",  desc: "Long-haul / international" },
];

const THRESHOLDS = [
  { hours: 2, label: "2+ hours delay" },
  { hours: 3, label: "3+ hours delay" },
  { hours: 5, label: "5+ hours delay" },
];

type Step = "form" | "confirm" | "success";

export default function BuyPolicy() {
  const sectionRef = useRef<HTMLElement>(null);
  const [flight, setFlight]       = useState("");
  const [coverage, setCoverage]   = useState(1);
  const [threshold, setThreshold] = useState(3);
  const [step, setStep]           = useState<Step>("form");
  const [loading, setLoading]     = useState(false);
  const [txHash]                  = useState("5x7kLmP...a9pQ");
  const [walletConnected, setWalletConnected] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAddress, setWalletAddress]     = useState("");
  const [confetti, setConfetti]               = useState(false);

  const selected = COVERAGES[coverage];

  // Scroll reveal
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

  function handleBuy() {
    if (!walletConnected) { setShowWalletModal(true); return; }
    if (!flight.trim()) return;
    setStep("confirm");
  }

  function handleConfirm() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2000);
    }, 2200);
  }

  function handleConnectWallet() {
    // Simulate wallet connection
    setTimeout(() => {
      setWalletConnected(true);
      setWalletAddress("7xKp...3mRq");
      setShowWalletModal(false);
    }, 1200);
  }

  return (
    <section id="buy-policy" ref={sectionRef} className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left — explainer */}
          <div className="space-y-8 lg:pt-4">
            <div className="reveal">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em]">Get Protected</span>
              <h2 className="text-4xl sm:text-5xl font-black text-white font-['Space_Grotesk'] mt-3">
                Buy Coverage<br />in 60 seconds
              </h2>
              <p className="text-gray-400 text-lg mt-4 leading-relaxed">
                Connect your Phantom wallet, enter your flight number, choose your coverage tier,
                and pay with USDC. Your policy is on-chain in under a second.
              </p>
            </div>

            {/* Guarantee boxes */}
            <div className="space-y-3">
              {[
                { title: "No wallet? No problem", desc: "We'll prompt you to install Phantom — takes 60 seconds." },
                { title: "Funds held in smart contract", desc: "USDC locks in a PDA vault, not with us. Code is the custodian." },
                { title: "Automatic payout, always", desc: "Oracle triggers payout. No human decision. No possibility of denial." },
              ].map(({ title, desc }, i) => (
                <div
                  key={title}
                  className="reveal flex gap-4 items-start glass-card card-hover-lift rounded-xl p-4 border border-emerald-900/30"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0 relative z-10" />
                  <div className="relative z-10">
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-gray-400 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form card */}
          <div className="reveal glass-card-bright rounded-3xl p-8 border border-emerald-400/15 glow-pulse relative overflow-hidden">
            {/* Confetti */}
            {confetti && <ConfettiEffect />}

            {step === "form" && (
              <FormStep
                flight={flight} setFlight={setFlight}
                coverage={coverage} setCoverage={setCoverage}
                threshold={threshold} setThreshold={setThreshold}
                selected={selected}
                walletConnected={walletConnected}
                walletAddress={walletAddress}
                onBuy={handleBuy}
                onConnectWallet={() => setShowWalletModal(true)}
              />
            )}
            {step === "confirm" && (
              <ConfirmStep
                flight={flight} selected={selected} threshold={threshold}
                loading={loading}
                onConfirm={handleConfirm}
                onBack={() => setStep("form")}
              />
            )}
            {step === "success" && (
              <SuccessStep
                flight={flight} selected={selected} txHash={txHash}
                onReset={() => { setStep("form"); setFlight(""); }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Wallet Connect Modal */}
      {showWalletModal && (
        <WalletModal
          onConnect={handleConnectWallet}
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </section>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function FormStep({ flight, setFlight, coverage, setCoverage, threshold, setThreshold, selected, walletConnected, walletAddress, onBuy, onConnectWallet }: any) {
  return (
    <div className="space-y-5">
      {/* Wallet status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-xl">New Policy</h3>
          {walletConnected ? (
            <p className="text-gray-500 text-sm mt-0.5">
              Wallet: <span className="text-emerald-400 font-mono">{walletAddress}</span>
              <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green align-middle" />
            </p>
          ) : (
            <p className="text-gray-500 text-sm mt-0.5">
              Wallet: Not connected ·{" "}
              <button className="text-emerald-400 hover:underline cursor-pointer" onClick={onConnectWallet}>
                Connect Phantom
              </button>
            </p>
          )}
        </div>
        {walletConnected && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green" />
            <span className="text-emerald-400 text-xs font-medium">Connected</span>
          </div>
        )}
      </div>

      {/* Flight number */}
      <div className="space-y-2">
        <label className="text-gray-300 text-sm font-medium flex items-center gap-1.5">
          <Plane className="w-4 h-4 text-emerald-400" /> Flight Number
        </label>
        <input
          type="text" value={flight} onChange={e => setFlight(e.target.value.toUpperCase())}
          placeholder="e.g. AI 131, 6E 456, UK 995"
          className="w-full bg-[#040d1a] border border-emerald-900/40 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/20 transition-all"
        />
      </div>

      {/* Coverage tier */}
      <div className="space-y-2">
        <label className="text-gray-300 text-sm font-medium flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" /> Coverage Tier
        </label>
        <div className="grid grid-cols-3 gap-3">
          {COVERAGES.map((c, i) => (
            <button key={i} onClick={() => setCoverage(i)}
              className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${
                coverage === i
                  ? "border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "border-emerald-900/30 bg-[#040d1a] hover:border-emerald-900/60 hover:bg-emerald-900/10"
              }`}>
              {c.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] bg-emerald-400 text-black font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Popular
                </span>
              )}
              <p className="text-white font-bold text-sm">{c.label}</p>
              <p className="text-emerald-400 font-black text-base">${c.premium}</p>
              <p className="text-gray-500 text-xs">→ ${c.payout} payout</p>
            </button>
          ))}
        </div>
      </div>

      {/* Threshold */}
      <div className="space-y-2">
        <label className="text-gray-300 text-sm font-medium">Payout Trigger</label>
        <div className="grid grid-cols-3 gap-2">
          {THRESHOLDS.map(t => (
            <button key={t.hours} onClick={() => setThreshold(t.hours)}
              className={`p-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                threshold === t.hours
                  ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-400"
                  : "border-emerald-900/30 text-gray-400 hover:text-gray-200 hover:border-emerald-900/50"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs">You Pay</p>
          <p className="text-white font-black text-2xl">{selected.premium} <span className="text-emerald-400 text-base">USDC</span></p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-600" />
        <div className="text-right">
          <p className="text-gray-500 text-xs">Max Payout</p>
          <p className="text-white font-black text-2xl">{selected.payout} <span className="text-emerald-400 text-base">USDC</span></p>
        </div>
      </div>

      <button
        onClick={onBuy}
        disabled={!flight.trim() && walletConnected}
        className="btn-primary w-full py-4 rounded-xl font-bold text-white text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Wallet className="w-5 h-5" />
        {!walletConnected ? "Connect Wallet to Continue" : !flight.trim() ? "Enter Flight Number" : "Review & Buy Policy"}
      </button>

      <p className="text-gray-600 text-xs text-center flex items-center justify-center gap-1">
        <Info className="w-3 h-3" /> USDC held in smart contract. Returned if no delay.
      </p>
    </div>
  );
}

function ConfirmStep({ flight, selected, threshold, loading, onConfirm, onBack }: any) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <h3 className="text-white font-bold text-xl">Confirm Policy</h3>
      <div className="space-y-3 glass-card rounded-xl p-5">
        {[
          ["Flight",          flight],
          ["Coverage Tier",   selected.label],
          ["Premium",         `${selected.premium} USDC`],
          ["Max Payout",      `${selected.payout} USDC`],
          ["Trigger Delay",   `${threshold}+ hours`],
          ["Expires",         "In 48 hours"],
          ["Stored On-Chain", "Solana Devnet"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-gray-500">{k}</span>
            <span className="text-white font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 py-3 rounded-xl font-semibold">Back</button>
        <button onClick={onConfirm} disabled={loading}
          className="btn-primary flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing tx…</>
            : <><Wallet className="w-4 h-4" /> Confirm & Pay</>
          }
        </button>
      </div>
    </div>
  );
}

function SuccessStep({ flight, selected, txHash, onReset }: any) {
  return (
    <div className="space-y-6 text-center animate-fade-in-up">
      <div className="w-20 h-20 rounded-full bg-emerald-400/15 border-2 border-emerald-400/40 flex items-center justify-center mx-auto glow-emerald">
        <CheckCircle className="w-10 h-10 text-emerald-400" />
      </div>
      <div>
        <h3 className="text-white font-bold text-2xl">Policy Active! 🎉</h3>
        <p className="text-gray-400 text-sm mt-2">
          Your coverage for <strong className="text-white">{flight}</strong> is now live on-chain.
        </p>
      </div>
      <div className="glass-card rounded-xl p-4 space-y-3 text-left">
        <div className="flex justify-between text-sm"><span className="text-gray-500">Premium paid</span><span className="text-white">{selected.premium} USDC</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">Max payout</span><span className="text-emerald-400 font-bold">{selected.payout} USDC</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">Tx hash</span><span className="text-emerald-400 font-mono text-xs">{txHash}</span></div>
      </div>
      <button onClick={onReset} className="btn-secondary w-full py-3 rounded-xl font-semibold">
        Buy Another Policy
      </button>
    </div>
  );
}

/* ── Wallet Modal ────────────────────────────────────────── */
function WalletModal({ onConnect, onClose }: { onConnect: () => void; onClose: () => void }) {
  const [connecting, setConnecting] = useState(false);

  function connect() {
    setConnecting(true);
    onConnect();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-xl">Connect Wallet</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-emerald-900/30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phantom option */}
        <button
          onClick={connect}
          disabled={connecting}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 hover:border-emerald-400/40 transition-all duration-200 group mb-3"
        >
          {/* Phantom icon */}
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-black text-lg">
            👻
          </div>
          <div className="text-left flex-1">
            <p className="text-white font-semibold">Phantom</p>
            <p className="text-gray-500 text-sm">Solana's leading wallet</p>
          </div>
          {connecting
            ? <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            : <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          }
        </button>

        {/* Install hint */}
        <div className="glass-card rounded-xl p-3 flex items-center gap-3">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <p className="text-gray-500 text-xs">
            Don&apos;t have Phantom?{" "}
            <a href="https://phantom.app" target="_blank" rel="noopener noreferrer"
               className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">
              Install in 60s <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <p className="text-gray-600 text-xs text-center mt-4">
          This is a Devnet demo. No real funds involved.
        </p>
      </div>
    </div>
  );
}

/* ── Confetti ────────────────────────────────────────────── */
const CONFETTI_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#f59e0b", "#818cf8", "#fb7185"];

function ConfettiEffect() {
  const dots = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    size: `${4 + Math.random() * 5}px`,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {dots.map(d => (
        <div
          key={d.id}
          className="confetti-dot"
          style={{
            backgroundColor: d.color,
            left: d.left,
            top: "10%",
            width: d.size,
            height: d.size,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  );
}

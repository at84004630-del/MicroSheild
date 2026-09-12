"use client";
import { useState, useEffect, useRef } from "react";
import { Plane, Wallet, Shield, ArrowRight, Info, CheckCircle, Loader2, X, ExternalLink, AlertCircle, Droplets } from "lucide-react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { buyPolicyAction } from "@/lib/actions";
import { TIERS } from "@/lib/idl";

const COVERAGES = [
  { premium: 1, payout: 5,  label: "Basic",    desc: "Short-haul domestic" },
  { premium: 2, payout: 10, label: "Standard", desc: "Most popular",  popular: true },
  { premium: 5, payout: 25, label: "Premium",  desc: "Long-haul / international" },
];

const THRESHOLDS = [
  { hours: 1, mins: 60,  label: "1+ hour delay" },
  { hours: 2, mins: 120, label: "2+ hours delay" },
  { hours: 3, mins: 180, label: "3+ hours delay" },
  { hours: 5, mins: 300, label: "5+ hours delay" },
];

type Step = "form" | "confirm" | "success";

export default function BuyPolicy() {
  const sectionRef = useRef<HTMLElement>(null);

  // Form state
  const [flight, setFlight]       = useState("");
  const [coverage, setCoverage]   = useState(1);
  const [threshold, setThreshold] = useState(3);
  const [step, setStep]           = useState<Step>("form");
  const [loading, setLoading]     = useState(false);
  const [txHash, setTxHash]       = useState("");
  const [error, setError]         = useState("");
  const [confetti, setConfetti]   = useState(false);

  // Real wallet hooks
  const { connected, publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { setVisible } = useWalletModal();

  const selected = COVERAGES[coverage];
  const thresholdMins = THRESHOLDS.find(t => t.hours === threshold)?.mins ?? 180;
  const walletAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

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
    if (!connected) { setVisible(true); return; }
    if (!flight.trim()) return;
    setError("");
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!anchorWallet) { setVisible(true); return; }
    setLoading(true);
    setError("");

    try {
      const sig = await buyPolicyAction({
        wallet: anchorWallet,
        flightNumber: flight.trim(),
        premiumTier: coverage as 0 | 1 | 2,
        delayThresholdMins: thresholdMins as 60 | 120 | 180 | 300,
      });
      setTxHash(sig);
      setStep("success");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // Surface a user-friendly message
      if (msg.includes("not yet initialized")) {
        setError("Program not deployed on devnet yet. This is a demo — real deployment coming soon!");
      } else if (msg.includes("insufficient funds") || msg.includes("0x1")) {
        setError("Insufficient USDC balance. Get devnet USDC from a faucet first.");
      } else if (msg.includes("User rejected")) {
        setError("Transaction rejected in wallet.");
      } else {
        setError(msg.slice(0, 200));
      }
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="buy-policy" ref={sectionRef} className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">

        {/* ── Devnet USDC faucet banner ── always visible for new testers ── */}
        <div className="reveal mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-amber-400/25 bg-amber-400/5">
          <div className="flex items-center gap-3">
            <Droplets className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-amber-300 font-semibold text-sm">Testing on Devnet?</p>
              <p className="text-gray-400 text-xs mt-0.5">
                You need devnet SOL + devnet USDC before buying a policy.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <a
              href="https://faucet.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-semibold hover:bg-amber-400/20 transition-colors"
            >
              Get Devnet SOL <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://spl-token-faucet.com/?token-name=USDC-Dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-semibold hover:bg-amber-400/20 transition-colors"
            >
              Get Devnet USDC <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

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

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-2 animate-fade-in-up">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Faucet banner — shown when insufficient funds error */}
            {error && (error.includes("USDC") || error.includes("0x1") || error.includes("insufficient")) && (
              <div className="mb-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/8 flex items-center justify-between gap-3 animate-fade-in-up">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-amber-400 text-xs font-medium">Need devnet USDC?</p>
                </div>
                <a
                  href="https://spl-token-faucet.com/?token-name=USDC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 font-semibold whitespace-nowrap transition-colors"
                >
                  Get Test USDC <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {step === "form" && (
              <FormStep
                flight={flight} setFlight={setFlight}
                coverage={coverage} setCoverage={setCoverage}
                threshold={threshold} setThreshold={setThreshold}
                selected={selected}
                connected={connected}
                walletAddress={walletAddress}
                onBuy={handleBuy}
                onConnectWallet={() => setVisible(true)}
              />
            )}
            {step === "confirm" && (
              <ConfirmStep
                flight={flight} selected={selected}
                threshold={threshold} thresholdMins={thresholdMins}
                loading={loading}
                onConfirm={handleConfirm}
                onBack={() => setStep("form")}
              />
            )}
            {step === "success" && (
              <SuccessStep
                flight={flight} selected={selected} txHash={txHash}
                onReset={() => { setStep("form"); setFlight(""); setTxHash(""); }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function FormStep({
  flight, setFlight,
  coverage, setCoverage,
  threshold, setThreshold,
  selected, connected, walletAddress,
  onBuy, onConnectWallet,
}: {
  flight: string; setFlight: (v: string) => void;
  coverage: number; setCoverage: (v: number) => void;
  threshold: number; setThreshold: (v: number) => void;
  selected: typeof COVERAGES[0];
  connected: boolean; walletAddress: string;
  onBuy: () => void; onConnectWallet: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Wallet status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-xl">New Policy</h3>
          {connected ? (
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
        {connected && (
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
          maxLength={16}
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
        <div className="grid grid-cols-2 gap-2">
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
        disabled={connected && !flight.trim()}
        className="btn-primary w-full py-4 rounded-xl font-bold text-white text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Wallet className="w-5 h-5" />
        {!connected
          ? "Connect Wallet to Continue"
          : !flight.trim()
          ? "Enter Flight Number"
          : "Review & Buy Policy"}
      </button>

      <p className="text-gray-600 text-xs text-center flex items-center justify-center gap-1">
        <Info className="w-3 h-3" /> USDC held in smart contract. Returned if no delay.
      </p>
    </div>
  );
}

function ConfirmStep({
  flight, selected, threshold, thresholdMins, loading, onConfirm, onBack,
}: {
  flight: string; selected: typeof COVERAGES[0];
  threshold: number; thresholdMins: number;
  loading: boolean; onConfirm: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <h3 className="text-white font-bold text-xl">Confirm Policy</h3>
      <div className="space-y-3 glass-card rounded-xl p-5">
        {[
          ["Flight",          flight],
          ["Coverage Tier",   selected.label],
          ["Premium",         `${selected.premium} USDC`],
          ["Max Payout",      `${selected.payout} USDC`],
          ["Trigger Delay",   `${threshold}+ hours (${thresholdMins}min)`],
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

function SuccessStep({
  flight, selected, txHash, onReset,
}: {
  flight: string; selected: typeof COVERAGES[0]; txHash: string; onReset: () => void;
}) {
  const explorerUrl = txHash
    ? `https://explorer.solana.com/tx/${txHash}?cluster=devnet`
    : null;

  const shortHash = txHash
    ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}`
    : "Demo tx";

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
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tx hash</span>
          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-mono text-xs flex items-center gap-1 hover:underline"
            >
              {shortHash} <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-emerald-400 font-mono text-xs">{shortHash}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href="#my-policies"
          className="btn-secondary w-full py-3 rounded-xl font-semibold text-center"
        >
          View My Policies ↓
        </a>
        <button onClick={onReset} className="text-gray-500 text-sm hover:text-gray-300 transition-colors py-2">
          Buy Another Policy
        </button>
      </div>
    </div>
  );
}

/* ── Confetti ────────────────────────────────────────────── */
const CONFETTI_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#f59e0b", "#818cf8", "#fb7185"];

function ConfettiEffect() {
  const dots = Array.from({ length: 24 }, (_, i) => ({
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

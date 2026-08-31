"use client";
import { useState, useEffect, useRef } from "react";
import { Plane, Clock, Zap, CheckCircle, RefreshCw } from "lucide-react";

type FlightStatus = "on-time" | "delayed" | "payout-triggered";

const DEMO_FLIGHTS = [
  { code: "AI 131", from: "DEL", to: "BOM", scheduled: "08:45", airline: "Air India" },
  { code: "6E 456", from: "BLR", to: "HYD", scheduled: "14:20", airline: "IndiGo" },
  { code: "UK 995", from: "CCU", to: "DEL", scheduled: "22:10", airline: "Vistara" },
];

type OracleLine = { id: number; text: string; type: "normal" | "highlight" | "success" };

export default function LiveDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [selected, setSelected]         = useState(0);
  const [status, setStatus]             = useState<FlightStatus>("on-time");
  const [delayMins, setDelayMins]       = useState(0);
  const [payoutDone, setPayoutDone]     = useState(false);
  const [simRunning, setSimRunning]     = useState(false);
  const [oracleLines, setOracleLines]   = useState<OracleLine[]>([]);
  const lineIdRef = useRef(0);

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

  // Simulation engine
  useEffect(() => {
    if (!simRunning) return;
    let delayAccum = 0;
    let done = false;

    function addLine(text: string, type: OracleLine["type"] = "normal") {
      const id = lineIdRef.current++;
      setOracleLines(prev => [...prev.slice(-12), { id, text, type }]);
    }

    const tick = setInterval(() => {
      if (done) return;
      const time = new Date().toLocaleTimeString();
      delayAccum += 35;

      addLine(`[${time}] Querying AviationStack API…`);

      setTimeout(() => {
        addLine(`→ flight_status: ${delayAccum >= 180 ? "DELAYED" : delayAccum >= 30 ? "DELAYED" : "ON_TIME"}`, "highlight");
        addLine(`→ delay_minutes: ${delayAccum}`);

        setDelayMins(delayAccum);
        if (delayAccum >= 30) setStatus("delayed");

        if (delayAccum >= 180) {
          done = true;
          clearInterval(tick);
          setTimeout(() => {
            addLine("→ THRESHOLD MET: delay ≥ 180 minutes", "highlight");
            setTimeout(() => {
              addLine("→ Calling payout_trigger() on-chain…", "success");
              setTimeout(() => {
                addLine("✓ TX confirmed: 10 USDC → policy holder", "success");
                setStatus("payout-triggered");
                setPayoutDone(true);
                setSimRunning(false);
              }, 600);
            }, 400);
          }, 200);
        } else {
          addLine(`→ Oracle update #${Math.floor(delayAccum / 35)} posted on-chain`);
        }
      }, 300);
    }, 1400);

    return () => clearInterval(tick);
  }, [simRunning]);

  function reset() {
    setStatus("on-time");
    setDelayMins(0);
    setPayoutDone(false);
    setSimRunning(false);
    setOracleLines([]);
  }

  const flight = DEMO_FLIGHTS[selected];

  return (
    <section id="live-demo" ref={sectionRef} className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/8 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="reveal text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] block">Interactive Demo</span>
          <h2 className="reveal text-4xl sm:text-5xl font-black text-white font-['Space_Grotesk']" style={{ transitionDelay: "80ms" }}>
            Watch It Happen Live
          </h2>
          <p className="reveal text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed" style={{ transitionDelay: "160ms" }}>
            Simulate a flight delay and watch the oracle trigger an instant USDC payout — no human involved.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left — controls */}
          <div className="lg:col-span-2 space-y-5">
            {/* Flight selector */}
            <div className="reveal glass-card rounded-2xl p-5 space-y-3 border border-emerald-900/30">
              <h4 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <Plane className="w-4 h-4 text-emerald-400" /> Select Demo Flight
              </h4>
              <div className="space-y-2">
                {DEMO_FLIGHTS.map((f, i) => (
                  <button key={f.code} onClick={() => { setSelected(i); reset(); }}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-200 ${
                      selected === i
                        ? "border-emerald-400/50 bg-emerald-400/8 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                        : "border-emerald-900/30 hover:border-emerald-900/60 hover:bg-emerald-900/5"
                    }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-semibold text-sm">{f.code} · {f.airline}</p>
                        <p className="text-gray-500 text-xs">{f.from} → {f.to}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm font-mono">{f.scheduled}</p>
                        {selected === i && simRunning && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block pulse-green" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulate button */}
            <button
              onClick={() => { reset(); setTimeout(() => setSimRunning(true), 150); }}
              disabled={simRunning}
              className="reveal btn-primary w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ transitionDelay: "100ms" }}
            >
              <Zap className="w-5 h-5" />
              {simRunning ? "Simulation Running…" : "Simulate Flight Delay"}
            </button>

            <button
              onClick={reset}
              className="reveal btn-secondary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ transitionDelay: "150ms" }}
            >
              <RefreshCw className={`w-4 h-4 ${simRunning ? "animate-spin" : ""}`} />
              Reset Demo
            </button>

            {/* Stats mini */}
            {payoutDone && (
              <div className="reveal glass-card rounded-xl p-4 space-y-2 border border-emerald-900/30 animate-fade-in-up">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Simulation Results</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Oracle checks</span><span className="text-white font-medium">{Math.floor(delayMins / 35)} updates</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Payout speed</span><span className="text-emerald-400 font-medium">&lt; 800ms</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Human involved</span><span className="text-emerald-400 font-medium">Zero</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Right — live view */}
          <div className="lg:col-span-3 space-y-4">
            {/* Status board */}
            <div className={`reveal glass-card-bright rounded-2xl p-6 border transition-all duration-700 ${
              status === "payout-triggered" ? "border-emerald-400/50 glow-emerald-lg"
              : status === "delayed"        ? "border-amber-400/30"
              :                              "border-emerald-900/30"
            }`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-white font-bold text-lg">{flight.code}</p>
                  <p className="text-gray-500 text-sm">{flight.from} → {flight.to} · Dept: {flight.scheduled}</p>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* Delay meter */}
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Current Delay</span>
                  <span className={
                    delayMins >= 180 ? "text-emerald-400 font-bold"
                    : delayMins > 0  ? "text-amber-400 font-medium"
                    :                  "text-gray-500"
                  }>{delayMins}m</span>
                </div>
                <div className="w-full h-2 bg-[#040d1a] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      delayMins >= 180
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400 progress-bar-glow"
                        : delayMins >= 60
                        ? "bg-gradient-to-r from-amber-500 to-orange-400"
                        : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min((delayMins / 180) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-gray-600 text-xs text-right">Threshold: 180 min (3 hrs)</p>
              </div>

              {/* Oracle terminal */}
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${simRunning ? "bg-emerald-400 pulse-green" : "bg-gray-600"}`} />
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    Switchboard Oracle Feed
                  </p>
                  {simRunning && (
                    <span className="ml-auto text-xs text-gray-600 font-mono">LIVE</span>
                  )}
                </div>

                <div className="font-mono text-xs space-y-1 min-h-[80px] max-h-[160px] overflow-y-auto">
                  {oracleLines.length === 0 ? (
                    <p className="text-gray-600">
                      {simRunning
                        ? <span className="terminal-cursor">Initializing oracle feed</span>
                        : 'Click "Simulate Flight Delay" to start oracle feed →'
                      }
                    </p>
                  ) : (
                    oracleLines.map((line, i) => (
                      <p
                        key={line.id}
                        className={`animate-fade-in-up ${
                          line.type === "success"   ? "text-emerald-400 font-bold"
                          : line.type === "highlight" ? "text-amber-300"
                          :                            "text-gray-400"
                        } ${i === oracleLines.length - 1 && simRunning ? "terminal-cursor" : ""}`}
                        style={{ animationDelay: "0ms" }}
                      >
                        {line.text}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Payout confirmation */}
            {payoutDone && (
              <div className="glass-card-bright rounded-2xl p-6 border border-emerald-400/40 glow-emerald animate-fade-in-up">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">Payout Triggered! 🎉</p>
                    <p className="text-gray-400 text-sm">10 USDC sent to policy holder&apos;s wallet in &lt;800ms</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-emerald-400 font-black text-3xl glow-text">10</p>
                    <p className="text-emerald-400 text-sm font-semibold">USDC</p>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-emerald-900/30 grid grid-cols-3 gap-4 text-center text-xs">
                  <div><p className="text-gray-500">Payout Time</p><p className="text-white font-bold">&lt; 800ms</p></div>
                  <div><p className="text-gray-500">Human Involved</p><p className="text-emerald-400 font-bold">Zero</p></div>
                  <div><p className="text-gray-500">Tx Hash</p><p className="text-emerald-400 font-mono">5x7k…a9pQ</p></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: FlightStatus }) {
  if (status === "on-time")
    return <span className="badge-active  px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> On Time</span>;
  if (status === "delayed")
    return <span className="badge-pending px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Delayed</span>;
  if (status === "payout-triggered")
    return <span className="badge-paid    px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Payout Sent</span>;
  return null;
}

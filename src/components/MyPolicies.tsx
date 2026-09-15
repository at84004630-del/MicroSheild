"use client";
import { useState, useEffect, useCallback } from "react";
import { Shield, Clock, CheckCircle, XCircle, RefreshCw, ExternalLink, Plane, AlertCircle, Lock, Loader2, Trash2 } from "lucide-react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { fetchUserPolicies, PolicyOnChain, expireRefundAction, closePolicyAction } from "@/lib/actions";

// 1 USDC = 1_000_000 micro-USDC (6 decimal places)
// NOTE: was incorrectly set to 6 — that made premiums display 166,667x too high
const USDC_DECIMALS = 1_000_000;

function formatDate(unixTs: number): string {
  return new Date(unixTs * 1000).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function StatusBadge({ status, delayMins, threshold }: {
  status: PolicyOnChain["status"];
  delayMins: number;
  threshold: number;
}) {
  if (status === "payoutSent") {
    return (
      <span className="badge-paid px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5" /> Paid Out
      </span>
    );
  }
  if (status === "refunded") {
    return (
      <span className="badge-pending px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
        <XCircle className="w-3.5 h-3.5" /> Refunded
      </span>
    );
  }
  // Active
  const now = Math.floor(Date.now() / 1000);
  if (delayMins >= threshold) {
    return (
      <span className="badge-paid px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5" /> Threshold Met
      </span>
    );
  }
  return (
    <span className="badge-active px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green" />
      Active
    </span>
  );
}

function PolicyCard({ policy, onRefreshed }: { policy: PolicyOnChain; onRefreshed: () => void }) {
  const anchorWallet = useAnchorWallet();
  const explorerUrl = `https://explorer.solana.com/address/${policy.publicKey}?cluster=devnet`;
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > policy.expiresAt && policy.status === "active";
  const progressPct = Math.min(
    (policy.delayMinutesReported / policy.delayThresholdMins) * 100,
    100
  );
  const thresholdHrs = Math.round(policy.delayThresholdMins / 60);

  // Refund state
  const [refunding, setRefunding] = useState(false);
  const [refundTx, setRefundTx]   = useState("");
  const [refundErr, setRefundErr] = useState("");

  async function handleClaimRefund() {
    if (!anchorWallet) return;
    setRefunding(true);
    setRefundErr("");
    try {
      const sig = await expireRefundAction({
        wallet: anchorWallet,
        policyPublicKey: policy.publicKey,
        policyId: policy.policyId,
        holder: policy.holder,
      });
      setRefundTx(sig);
      // Refresh parent list after 1.5s so the policy status updates
      setTimeout(() => onRefreshed(), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("PolicyNotExpired")) {
        setRefundErr("Policy hasn't expired yet.");
      } else if (msg.includes("PolicyNotActive")) {
        setRefundErr("Policy already settled.");
      } else {
        setRefundErr(msg.slice(0, 160));
      }
    } finally {
      setRefunding(false);
    }
  }

  // Close policy (reclaim rent) — only available after payout or refund
  const [closing, setClosing]   = useState(false);
  const [closeTx, setCloseTx]   = useState("");
  const [closeErr, setCloseErr] = useState("");

  async function handleClosePolicy() {
    if (!anchorWallet) return;
    setClosing(true);
    setCloseErr("");
    try {
      const sig = await closePolicyAction({
        wallet: anchorWallet,
        policyPublicKey: policy.publicKey,
        policyId: policy.policyId,
      });
      setCloseTx(sig);
      // Refresh after 1.5s — account will be gone
      setTimeout(() => onRefreshed(), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("PolicyCannotBeClosed")) {
        setCloseErr("Policy must be settled before closing.");
      } else {
        setCloseErr(msg.slice(0, 160));
      }
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="glass-card-bright rounded-2xl p-6 border border-emerald-400/15 card-hover-lift space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
            <Plane className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold truncate">{policy.flightNumber}</p>
            <p className="text-gray-500 text-xs">Policy #{policy.policyId}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <StatusBadge
            status={policy.status}
            delayMins={policy.delayMinutesReported}
            threshold={policy.delayThresholdMins}
          />
        </div>
      </div>

      {/* Delay meter (only for active) */}
      {policy.status === "active" && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Delay Reported</span>
            <span className={
              policy.delayMinutesReported >= policy.delayThresholdMins
                ? "text-emerald-400 font-bold"
                : policy.delayMinutesReported > 0
                ? "text-amber-400"
                : "text-gray-500"
            }>
              {policy.delayMinutesReported}m / {policy.delayThresholdMins}m
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#040d1a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                progressPct >= 100
                  ? "bg-emerald-400 progress-bar-glow"
                  : progressPct > 50
                  ? "bg-amber-400"
                  : "bg-emerald-900"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-gray-600 text-xs text-right">Trigger: {thresholdHrs}h delay</p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-gray-500">Premium</p>
          <p className="text-white font-semibold">{policy.premium} USDC</p>
        </div>
        <div>
          <p className="text-gray-500">Max Payout</p>
          <p className="text-emerald-400 font-bold">{policy.maxPayout} USDC</p>
        </div>
        <div>
          <p className="text-gray-500">Created</p>
          <p className="text-white">{formatDate(policy.createdAt)}</p>
        </div>
        <div>
          <p className="text-gray-500">Expires</p>
          <p className={`font-medium ${isExpired ? "text-red-400" : "text-white"}`}>
            {isExpired ? "Expired" : formatDate(policy.expiresAt)}
          </p>
        </div>
      </div>

      {/* ── Claim Refund button (expired + active) ── */}
      {isExpired && !refundTx && (
        <div className="space-y-2">
          <button
            onClick={handleClaimRefund}
            disabled={refunding || !anchorWallet}
            className="w-full btn-secondary py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refunding
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming refund…</>
              : <><CheckCircle className="w-4 h-4" /> Claim {policy.premium} USDC Refund</>
            }
          </button>
          {refundErr && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {refundErr}
            </p>
          )}
        </div>
      )}

      {/* ── Refund success ── */}
      {refundTx && (
        <div className="p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center gap-2 animate-fade-in-up">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-400 text-xs font-semibold">Refund sent! {policy.premium} USDC returned.</p>
            <a
              href={`https://explorer.solana.com/tx/${refundTx}?cluster=devnet`}
              target="_blank" rel="noopener noreferrer"
              className="text-emerald-400/60 text-[10px] font-mono hover:underline"
            >
              {refundTx.slice(0, 10)}… ↗
            </a>
          </div>
        </div>
      )}

      {/* ── Close Policy button (settled + not yet closed) ── */}
      {(policy.status === "payoutSent" || policy.status === "refunded") && !closeTx && (
        <div className="space-y-2">
          <button
            onClick={handleClosePolicy}
            disabled={closing || !anchorWallet}
            title="Close the policy account and reclaim SOL rent from the blockchain"
            className="w-full py-2 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 border border-emerald-900/30 text-gray-500 hover:text-emerald-400 hover:border-emerald-900/60 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {closing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Closing account…</>
              : <><Trash2 className="w-3.5 h-3.5" /> Close &amp; Reclaim Rent</>}
          </button>
          {closeErr && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {closeErr}
            </p>
          )}
        </div>
      )}

      {closeTx && (
        <div className="p-2.5 rounded-xl bg-emerald-400/8 border border-emerald-900/40 flex items-center gap-2 animate-fade-in-up">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-400 text-xs">Account closed · Rent reclaimed ✓</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-emerald-900/30">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400/60 text-xs font-mono hover:text-emerald-400 transition-colors flex items-center gap-1"
        >
          {shortAddress(policy.publicKey)}
          <ExternalLink className="w-3 h-3" />
        </a>
        {policy.status === "payoutSent" && (
          <span className="text-emerald-400 text-xs font-semibold">
            +{policy.maxPayout} USDC received 🎉
          </span>
        )}
        {isExpired && !refundTx && (
          <span className="text-amber-400 text-xs">Eligible for refund</span>
        )}
      </div>
    </div>
  );
}

export default function MyPolicies() {
  const { connected, publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { setVisible } = useWalletModal();
  const [policies, setPolicies] = useState<PolicyOnChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const loadPolicies = useCallback(async () => {
    if (!anchorWallet || !publicKey) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchUserPolicies(anchorWallet, publicKey);
      // Sort: active first, then by policy_id desc
      result.sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (b.status === "active" && a.status !== "active") return 1;
        return b.policyId - a.policyId;
      });
      setPolicies(result);
      setLastFetched(new Date());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("not yet initialized") || msg.includes("Account does not exist")) {
        // Program not deployed yet — this is expected in demo mode
        setPolicies([]);
        setError("");
      } else {
        setError("Failed to load policies: " + msg.slice(0, 120));
      }
    } finally {
      setLoading(false);
    }
  }, [anchorWallet, publicKey]);

  useEffect(() => {
    if (connected && anchorWallet) {
      loadPolicies();
    } else {
      setPolicies([]);
    }
  }, [connected, anchorWallet, loadPolicies]);

  const activePolicies  = policies.filter(p => p.status === "active");
  const settledPolicies = policies.filter(p => p.status !== "active");

  return (
    <section id="my-policies" className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none" />
      <div className="section-divider mb-16" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] block mb-2">
              Your Policies
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-['Space_Grotesk']">
              My Policies
            </h2>
            {lastFetched && (
              <p className="text-gray-600 text-xs mt-1">
                Last updated: {lastFetched.toLocaleTimeString()}
              </p>
            )}
          </div>
          {connected && (
            <button
              onClick={loadPolicies}
              disabled={loading}
              className="btn-secondary px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
        </div>

        {/* Not connected state */}
        {!connected && (
          <div className="text-center py-20 glass-card rounded-2xl border border-emerald-900/30">
            <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-emerald-400/60" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              Connect your Solana wallet to view your active and historical policies on-chain.
            </p>
            <button
              onClick={() => setVisible(true)}
              className="btn-primary px-6 py-3 rounded-xl font-bold text-white"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Loading */}
        {connected && loading && (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Fetching your policies from Solana…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {connected && !loading && policies.length === 0 && !error && (
          <div className="text-center py-20 glass-card rounded-2xl border border-emerald-900/30">
            <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-400/60" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">No Policies Yet</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              You haven&apos;t purchased any flight insurance policies yet. Buy your first one above!
            </p>
            <a href="#buy-policy" className="btn-primary px-6 py-3 rounded-xl font-bold text-white inline-block">
              Buy Coverage Now
            </a>
          </div>
        )}

        {/* Active policies */}
        {activePolicies.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-green" />
              <h3 className="text-white font-bold">Active Policies ({activePolicies.length})</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePolicies.map(p => (
                <PolicyCard key={p.publicKey} policy={p} onRefreshed={loadPolicies} />
              ))}
            </div>
          </div>
        )}

        {/* Settled policies */}
        {settledPolicies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="text-gray-400 font-bold">History ({settledPolicies.length})</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
              {settledPolicies.map(p => (
                <PolicyCard key={p.publicKey} policy={p} onRefreshed={loadPolicies} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

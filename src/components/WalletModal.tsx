"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState, WalletName } from "@solana/wallet-adapter-base";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { X, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CustomWalletModal() {
  const { visible, setVisible } = useWalletModal();
  const { wallets, select } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!visible) return null;

  async function handleSelect(name: WalletName) {
    setErrorMsg(null);
    setConnectingWallet(name);

    try {
      select(name);

      const targetWallet = wallets.find((w) => w.adapter.name === name);
      if (!targetWallet) {
        throw new Error(`Wallet ${name} not found.`);
      }

      // If it's the 1-click Devnet Demo Wallet, connect directly without external extension checks
      if (name.includes("Demo")) {
        await targetWallet.adapter.connect();
        setVisible(false);
        return;
      }

      const isInstalled =
        targetWallet.readyState === WalletReadyState.Installed ||
        (typeof window !== "undefined" && (
          (name.toLowerCase().includes("phantom") &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Boolean((window as any).phantom?.solana || (window as any).solana?.isPhantom)) ||
          (name.toLowerCase().includes("solflare") &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Boolean((window as any).solflare?.isSolflare))
        ));

      if (isInstalled) {
        await targetWallet.adapter.connect();
        setVisible(false);
      } else {
        const downloadUrl = name.toLowerCase().includes("solflare")
          ? "https://solflare.com"
          : "https://phantom.app";
        window.open(downloadUrl, "_blank");
        setErrorMsg(
          `${name} extension not detected. Opening download page... After installing, refresh this page.`
        );
      }
    } catch (err: unknown) {
      console.warn("Wallet connection attempt:", err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("User rejected") || message.includes("rejected")) {
        setErrorMsg("Connection request was cancelled in your wallet.");
      } else if (message.includes("not ready") || message.includes("NotInstalled")) {
        const downloadUrl = name.toLowerCase().includes("solflare")
          ? "https://solflare.com"
          : "https://phantom.app";
        window.open(downloadUrl, "_blank");
        setErrorMsg(`${name} is not installed. Opening download page...`);
      } else {
        setErrorMsg(message || "Failed to connect to wallet. Please try again.");
      }
    } finally {
      setConnectingWallet(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0d1615] border border-emerald-500/20 rounded-2xl p-6 shadow-2xl shadow-emerald-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-900/30">
          <div>
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
              Connect a Solana Wallet
            </h3>
            <p className="text-xs text-emerald-400/80 mt-0.5">
              Connect to Solana Devnet to get instant delay coverage
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-emerald-950/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification if any */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Wallet List */}
        <div className="mt-4 space-y-2.5">
          {wallets.map((wallet) => {
            const isInstalled =
              wallet.readyState === WalletReadyState.Installed ||
              (typeof window !== "undefined" && (
                (wallet.adapter.name.toLowerCase().includes("phantom") &&
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Boolean((window as any).phantom?.solana || (window as any).solana?.isPhantom)) ||
                (wallet.adapter.name.toLowerCase().includes("solflare") &&
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Boolean((window as any).solflare?.isSolflare))
              ));

            const isConnecting = connectingWallet === wallet.adapter.name;

            return (
              <button
                key={wallet.adapter.name}
                onClick={() => handleSelect(wallet.adapter.name)}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-emerald-900/40 bg-emerald-950/20 hover:bg-emerald-950/50 hover:border-emerald-500/40 transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  {wallet.adapter.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      className="w-9 h-9 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                      {wallet.adapter.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      {wallet.adapter.name}
                      {wallet.adapter.name.includes("Demo") && (
                        <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono border border-emerald-400/30">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {wallet.adapter.name.includes("Demo")
                        ? "Instant 1-click connect • 3.8+ SOL pre-funded"
                        : isInstalled
                        ? "Browser extension detected"
                        : "Click to install extension"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnecting ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting…</span>
                    </div>
                  ) : isInstalled ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-[11px] font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-[11px] group-hover:text-emerald-300 transition-colors">
                      Install
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-emerald-900/30 text-center">
          <p className="text-xs text-gray-500">
            Make sure your wallet network is set to{" "}
            <span className="text-emerald-400 font-medium">Solana Devnet</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

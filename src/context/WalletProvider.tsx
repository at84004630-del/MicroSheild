"use client";
/**
 * MicroShield Wallet Provider
 *
 * Wraps the app with @solana/wallet-adapter-react providers.
 * Must be a Client Component. Layout wraps this around {children}.
 */

import { ReactNode, useMemo, useState, useCallback, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalContext } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";
import { DevnetDemoWalletAdapter } from "@/lib/demoWalletAdapter";
import CustomWalletModal from "@/components/WalletModal";

// Import default wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet");

export default function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const [modalVisible, setModalVisible] = useState(false);

  // Clear any legacy Solflare selection from localStorage if the extension is not installed
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("walletName");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasSolflare = Boolean((window as any).solflare?.isSolflare);
        if (stored && stored.toLowerCase().includes("solflare") && !hasSolflare) {
          localStorage.removeItem("walletName");
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const wallets = useMemo(
    () => [
      new DevnetDemoWalletAdapter(),
      new PhantomWalletAdapter(),
    ],
    []
  );

  const onError = useCallback((error: unknown) => {
    console.warn("[Solana Wallet Error]", error);
  }, []);

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={true} onError={onError}>
        <WalletModalContext.Provider
          value={{
            visible: modalVisible,
            setVisible: setModalVisible,
          }}
        >
          {children}
          <CustomWalletModal />
        </WalletModalContext.Provider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

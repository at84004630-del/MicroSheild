"use client";
/**
 * ClientProviders — thin client-only shell that dynamically imports
 * the Solana wallet adapter (which uses browser APIs like window.solana).
 *
 * This MUST be a Client Component so that `dynamic()` with `ssr:false`
 * is allowed. The parent layout.tsx (Server Component) simply renders this.
 */
import dynamic from "next/dynamic";
import { ReactNode } from "react";

const SolanaWalletProvider = dynamic(
  () => import("@/context/WalletProvider"),
  { ssr: false, loading: () => null }
);

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}

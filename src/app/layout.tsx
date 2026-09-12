import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "MicroShield — Instant Flight Insurance on Solana",
  description:
    "Buy parametric flight delay insurance for $1–5. If your flight is delayed 3+ hours, USDC lands in your wallet instantly. No claim forms. No waiting. Powered by Solana.",
  keywords: ["flight insurance", "parametric insurance", "Solana", "DeFi", "blockchain", "USDC"],
  openGraph: {
    title: "MicroShield — Instant Flight Insurance on Solana",
    description: "Get paid instantly when your flight is delayed. No claims. No waiting. $1 coverage.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/*
          ClientProviders is a "use client" component that dynamically loads
          the Solana wallet adapter (ssr:false) without breaking the Server Component layout.
        */}
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

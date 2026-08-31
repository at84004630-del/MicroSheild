"use client";
import { Shield, ExternalLink, Code2, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="pt-px py-12 relative">
      {/* Gradient top border */}
      <div className="section-divider" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
              <span className="text-white font-bold text-lg font-['Space_Grotesk']">
                Micro<span className="text-emerald-400">Shield</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Parametric micro-insurance on Solana. Instant, trustless, zero-claim payouts powered by Switchboard Oracle.
            </p>
            <div className="flex items-center gap-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass-card flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-emerald-900/30">
                <Code2 className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass-card flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-emerald-900/30">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">Product</h4>
              {["How It Works", "Buy Coverage", "Live Demo", "My Policies"].map(l => (
                <a key={l} href="#" className="block text-gray-500 text-sm hover:text-emerald-400 transition-colors">{l}</a>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">Built On</h4>
              {[
                { label: "Solana", href: "https://solana.com" },
                { label: "Anchor Framework", href: "https://anchor-lang.com" },
                { label: "Switchboard Oracle", href: "https://switchboard.xyz" },
                { label: "AviationStack API", href: "https://aviationstack.com" },
              ].map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-gray-500 text-sm hover:text-emerald-400 transition-colors">
                  {label} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-emerald-900/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © 2026 MicroShield. Built for Colosseum Eternal Hackathon. Deployed on Solana Devnet.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green" />
            Solana Devnet · All contracts open source
          </div>
        </div>
      </div>
    </footer>
  );
}

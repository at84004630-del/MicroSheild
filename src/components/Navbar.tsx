"use client";
import { useState } from "react";
import { Shield, Menu, X, Zap } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Shield className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full pulse-green" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight font-['Space_Grotesk']">
              Micro<span className="text-emerald-400">Shield</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#buy-policy"   className="hover:text-emerald-400 transition-colors">Get Coverage</a>
            <a href="#live-demo"    className="hover:text-emerald-400 transition-colors">Live Demo</a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green" />
              <span className="text-emerald-400 text-xs font-medium">Solana Devnet</span>
            </div>
            <a
              href="#buy-policy"
              className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              Buy Coverage
            </a>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-gray-400" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-card border-t border-emerald-900/30 px-4 py-4 flex flex-col gap-4 text-sm font-medium">
          <a href="#how-it-works" className="text-gray-400 hover:text-emerald-400 transition-colors" onClick={() => setOpen(false)}>How It Works</a>
          <a href="#buy-policy"   className="text-gray-400 hover:text-emerald-400 transition-colors" onClick={() => setOpen(false)}>Get Coverage</a>
          <a href="#live-demo"    className="text-gray-400 hover:text-emerald-400 transition-colors" onClick={() => setOpen(false)}>Live Demo</a>
          <a href="#buy-policy"   className="btn-primary px-4 py-2 rounded-lg text-center text-white font-semibold" onClick={() => setOpen(false)}>Buy Coverage</a>
        </div>
      )}
    </nav>
  );
}

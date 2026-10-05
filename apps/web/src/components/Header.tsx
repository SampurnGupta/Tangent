"use client";

import React from "react";
import { ShieldCheck, UserCheck, Sparkles } from "lucide-react";

interface HeaderProps {
  userId?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ userId, activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-zinc-950 font-black text-xl tracking-tighter">T</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white">Tangent</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0 Core
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Portfolio decisions you can trace.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
          {[
            { id: "wizard", label: "1. Risk Profile" },
            { id: "assets", label: "2. Universe" },
            { id: "optimizer", label: "3. Optimize" },
            { id: "projections", label: "4. Projections" },
            { id: "studio", label: "5. Decision Studio" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User Session & Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium">Deterministic Math</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="truncate max-w-[100px]">{userId ? userId.substring(0, 10) : "Guest"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

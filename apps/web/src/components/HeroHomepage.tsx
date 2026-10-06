"use client";

import React from "react";
import {
  Swords,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  Activity,
  Layers,
  ChevronRight,
  Zap,
} from "lucide-react";

interface HeroHomepageProps {
  onNavigate: (tabId: string) => void;
  onOpenChat: () => void;
  investorProfileName?: string;
}

export function HeroHomepage({
  onNavigate,
  onOpenChat,
  investorProfileName = "Moderate",
}: HeroHomepageProps) {
  const coreFeatures = [
    {
      id: "arena",
      tag: "Feature 8 — Cross-Fire Debate",
      title: "The Expert Arena",
      badge: "Multi-Agent Deliberation",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      description:
        "Pitch any asset allocation hypothesis or market question. 5 domain ideologies (Macro, Valuation, Growth, Quant Risk, and Chief Arbiter) debate the trade-offs sequentially with real-world facts until consensus is reached.",
      icon: Swords,
      cta: "Enter The Arena",
      action: () => onNavigate("arena"),
      highlight: "Strict Ideology Boundations",
    },
    {
      id: "consultation",
      tag: "Direct 1-on-1 Consultation",
      title: "Talk to Expert Personas",
      badge: "Real-World Groq Engine",
      badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
      description:
        "Speak directly with any institutional ideology—Macro Sovereign Rates, Valuation Cycles, Growth Moats, or Quantitative Covariance. Challenge their assumptions with live market queries.",
      icon: MessageSquare,
      cta: "Consult An Expert",
      action: () => onNavigate("arena"),
      highlight: "In-Character Memory",
    },
    {
      id: "backtest",
      tag: "Stress Testing & Scenarios",
      title: "Crisis Stress Testing",
      badge: "Historical Shock Simulations",
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      description:
        "Subject candidate portfolios to the 2008 Global Financial Crisis (-42.4%), 2020 COVID Shock (-38.2%), and 2022 Fed Rate Spikes to inspect maximum historical drawdowns and recovery speeds.",
      icon: ShieldAlert,
      cta: "Run Stress Tests",
      action: () => onNavigate("backtest"),
      highlight: "Real Historical Data",
    },
    {
      id: "frontier",
      tag: "SciPy Numerical Engine",
      title: "Markowitz SLSQP Solver",
      badge: "Quadratic Optimization",
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      description:
        "Compute mathematically optimal weights across 74 institutional securities using Ledoit-Wolf covariance shrinkage. Generates Max Sharpe, Minimum Volatility, and Target-Risk frontiers.",
      icon: TrendingUp,
      cta: "Launch SLSQP Solver",
      action: () => onNavigate("frontier"),
      highlight: "Zero Directive Advice",
    },
    {
      id: "projections",
      tag: "5,000 Path Simulations",
      title: "Monte Carlo Wealth Engine",
      badge: "Geometric Brownian Motion",
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      description:
        "Explore 5,000 stochastic future market paths across 10–30 year horizons. Visualize 5th percentile adverse drawdowns, 50th percentile median wealth, and 95th percentile upside compounding.",
      icon: Activity,
      cta: "View 10Y Projections",
      action: () => onNavigate("projections"),
      highlight: "Risk Distribution",
    },
    {
      id: "decision",
      tag: "Full Synthesis Studio",
      title: "Decision Studio & Export",
      badge: "Executive Briefing",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      description:
        "Generate grounded multi-agent briefs with full traceability to deterministic math. Export polished institutional summary sheets with weights, tax drag, and backtest proofs.",
      icon: PieChart,
      cta: "Open Decision Studio",
      action: () => onNavigate("decision"),
      highlight: "Traceable Evidence Pack",
    },
  ];

  return (
    <div className="space-y-16 py-6 animate-fade-in max-w-7xl mx-auto">
      {/* ── HERO BANNER ───────────────────────────────────────────────────────── */}
      <section className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden text-center sm:text-left">
        {/* Ambient Glowing Blobs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-20 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Institutional Asset Allocation & Multi-Agent Deliberation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Portfolio decisions <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              you can trace.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
            Tangent marries <strong>deterministic Python mathematics</strong> (SciPy SLSQP, Ledoit-Wolf shrinkage, Monte Carlo projections) with an <strong>autonomous multi-agent cross-fire arena</strong>. Every metric is computed by code; every thesis is stress-tested by strictly bound expert ideologies.
          </p>

          {/* Core Action Redirects */}
          <div className="flex flex-wrap items-center gap-3 pt-2 justify-center sm:justify-start">
            <button
              onClick={() => onNavigate("profile")}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-zinc-950 font-bold text-xs sm:text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <span>Discover Your Ideal Portfolio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate("arena")}
              className="px-5 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 text-white font-semibold text-xs sm:text-sm border border-zinc-700/80 hover:border-zinc-600 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Enter The Expert Arena</span>
            </button>

            <button
              onClick={onOpenChat}
              className="px-5 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 text-white font-semibold text-xs sm:text-sm border border-zinc-700/80 hover:border-zinc-600 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <BrainCircuit className="w-4 h-4 text-teal-400" />
              <span>Chat with Draww AI</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-zinc-800/80 text-left">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Asset Universe</span>
              <span className="text-base font-bold text-white">74 Securities</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Mathematical Engine</span>
              <span className="text-base font-bold text-white">SciPy SLSQP</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Stochastic Paths</span>
              <span className="text-base font-bold text-white">5,000 Monte Carlo</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Agent Deliberation</span>
              <span className="text-base font-bold text-white">5 Strict Ideologies</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE NOVEL FEATURES GRID ─────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Feature Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              State-of-the-Art Decision Tools
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Explore the novel capabilities built into Tangent to engineer, stress-test, and trace your multi-asset investments.
            </p>
          </div>

          <span className="text-xs font-mono text-zinc-500">
            Current Profile: <strong className="text-emerald-400">{investorProfileName}</strong>
          </span>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="group p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-900/90 transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden backdrop-blur-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors">
                      <Icon className="w-5 h-5 text-teal-400" />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border ${feat.badgeColor}`}
                    >
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                      {feat.tag}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors mt-0.5">
                      {feat.title}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400">
                    {feat.highlight}
                  </span>
                  <button
                    onClick={feat.action}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 cursor-pointer"
                  >
                    <span>{feat.cta}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── GUIDED THREE-WAY DISCOVERY ROUTE ───────────────────────────────────── */}
      <section className="p-8 sm:p-10 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Choose Your Decision Pathway
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Whether you want a tailored portfolio engineered from scratch, an open debate with institutional minds, or continuous copilot chat:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Pathway 1 */}
          <div
            onClick={() => onNavigate("profile")}
            className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/50 transition-all cursor-pointer group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
              Discover Ideal Portfolio
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Step through our 7-stage pipeline: Risk profiler, candidate universe, SLSQP frontier solver, stress backtesting, and final committee sign-off.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 pt-1">
              Start Profiling <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Pathway 2 */}
          <div
            onClick={() => onNavigate("arena")}
            className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-teal-500/50 transition-all cursor-pointer group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
              Pitch to The Arena
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Have an asset allocation dilemma or stock question? Watch 5 expert personas debate with hard empirical data and reach consensus.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 pt-1">
              Launch Arena Debate <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Pathway 3 */}
          <div
            onClick={onOpenChat}
            className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-cyan-500/50 transition-all cursor-pointer group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
              Chat with Draww Copilot
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Open the interactive drawer co-pilot. Grounded in your exact portfolio numbers, Monte Carlo paths, and tax drag with verifiable evidence links.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 pt-1">
              Open Draww Copilot <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

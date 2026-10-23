"use client";

import React from "react";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Activity,
  MessageSquare,
  TrendingUp,
  Scale,
  Lock,
  Compass,
  Layers,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface HeroHomepageProps {
  onNavigate: (tabId: string) => void;
  onOpenChat: () => void;
  investorProfileName?: string;
  capital?: number;
  nominalReturn?: number;
  realReturn?: number;
  sharpeRatio?: number;
  weights?: Record<string, number>;
}

export function HeroHomepage({
  onNavigate,
  onOpenChat,
  investorProfileName = "Moderate",
  capital = 1000000,
  nominalReturn = 0.12,
  realReturn = 0.041,
  sharpeRatio = 0.57,
}: HeroHomepageProps) {
  const formattedCapital = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(capital);

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8 animate-fade-in font-sans">
      {/* ── 1. PRODUCT HERO HEADER ── */}
      <section className="text-center space-y-6 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Verifiable Fintech Decision Engine</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white">
            Tangent
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-zinc-300 tracking-tight">
            Portfolio decisions you can trace.
          </p>
        </div>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          The institutional suite that eliminates black-box financial advice. We combine deterministic
          mathematics, Ledoit-Wolf covariance shrinkage, and multi-LLM debate to give you portfolio allocations with verifiable audit trails.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={() => onNavigate("portfolio")}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-zinc-950 font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>Build Your Portfolio</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate("arena")}
            className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-sm border border-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Enter The Arena</span>
          </button>

          <button
            onClick={() => onNavigate("observatory")}
            className="px-5 py-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 font-medium text-sm border border-zinc-800/80 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>LLM Observatory</span>
          </button>
        </div>
      </section>

      {/* ── 2. WHAT WE DO ── */}
      <section className="bg-zinc-900/40 rounded-3xl p-8 sm:p-10 border border-zinc-800/80 backdrop-blur-sm space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-mono font-semibold block">
            Core Philosophy
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            What We Do
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
            Most investment tools operate as black boxes: an AI tells you what to buy with zero accountability.
            Tangent reverses this paradigm through three non-negotiable principles:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Numbers From Math Only</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Expected returns, covariance, Sharpe ratios, and drawdowns are calculated deterministically via SciPy SLSQP and Ledoit-Wolf shrinkage. LLMs explain and cite — they never invent metrics.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Cryptographic Traceability</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every narrative generated references traceable evidence IDs (e.g. <span className="font-mono text-zinc-300">[EVD-METRIC-SHARPE]</span>). An automated Critic agent validates claims against numerical facts.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Model Cross-Fire</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instead of trusting a single biased AI, three independent persona microservices (Gemini, Groq Llama, and Cloudflare Workers AI) stress-test every decision before execution.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. SERVICES WITH CUTE EXAMPLE IMPACT & USE CASES ── */}
      <section className="space-y-6">
        <div className="text-center sm:text-left">
          <span className="text-xs uppercase tracking-wider text-teal-400 font-mono font-semibold block">
            Modular Platform
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Our Services & Real-World Impact
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Explore our core fintech modules with real-world examples and verifiable outputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service 1: Your Portfolio Engine */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Portfolio Engine
                </span>
                <span className="text-xs text-zinc-500 font-mono">7 Integrated Steps</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Your Portfolio Construction
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  A unified sequential workflow: Profile &rarr; 74-Asset Universe &rarr; SLSQP Solver &rarr; Suitability Matching &rarr; Monte Carlo Simulation &rarr; Crisis Stress Testing &rarr; Decision Studio.
                </p>
              </div>

              {/* Cute Example Impact */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-World Impact Example:</span>
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong>Use Case:</strong> Investing {formattedCapital} with a 10-year horizon.
                  <br />
                  <strong>Impact:</strong> The SLSQP solver mathematically calibrates equity compounders with non-correlated gold and debt anchors, lifting the Sharpe ratio to <strong>{sharpeRatio.toFixed(2)}</strong> and cutting potential 2008-scale crash drawdowns from <strong>-52.0% down to -18.5%</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("portfolio")}
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Build Your Portfolio Now</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Service 2: The Arena */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                  Multi-Agent Deliberation
                </span>
                <span className="text-xs text-zinc-500 font-mono">3 Live Personas</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  The Investment Arena
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Three independent persona microservices debate your allocation theses in real-time: MacroBot (Gemini 2.0 Flash), GrowthBot (Groq Llama 3.3 70B), and RiskBot (Cloudflare Llama 3.2 3B).
                </p>
              </div>

              {/* Cute Example Impact */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-World Impact Example:</span>
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong>Use Case:</strong> <em>"Should I dump tech stocks and put 100% into Gold?"</em>
                  <br />
                  <strong>Impact:</strong> The committee rules out 100% allocation — Macro proves zero-yield cash drag, Growth proves lost corporate ROCE compounding, and Risk proves that capping gold at <strong>12%–15%</strong> captures 90% of crash protection without destroying upside.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("arena")}
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Consult Investment Committee</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Service 3: LLM Observatory */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                  DevOps Intelligence
                </span>
                <span className="text-xs text-zinc-500 font-mono">Dynamic Model Router</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  LLM Observatory & MetaBot
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Real-time telemetry leaderboard monitoring inference latency (p50/p95), token velocity, and cost economics across 4 microservices with MetaBot dynamically routing queries.
                </p>
              </div>

              {/* Cute Example Impact */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
                <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-World Impact Example:</span>
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong>Use Case:</strong> Balancing rapid risk calculation with deep multi-page corporate analysis.
                  <br />
                  <strong>Impact:</strong> Low-latency risk screening runs on Cloudflare Workers AI edge (<strong className="text-cyan-400">&lt;300ms</strong>, $0.00 cost) while deep moat reasoning routes to Groq Llama 3.3 70B (380ms), cutting cloud inference bills by over <strong>82%</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("observatory")}
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Inspect Live Telemetry</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

          {/* Service 4: Draww AI Co-Pilot */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 font-semibold">
                  Always-On Concierge
                </span>
                <span className="text-xs text-zinc-500 font-mono">Grounded Financial Copilot</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                  Draww AI Quantitative Assistant
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  A context-aware slide-out copilot accessible everywhere on Tangent. Explains tax drag under Finance Act 2024, Ledoit-Wolf shrinkage, and portfolio suitability scores.
                </p>
              </div>

              {/* Cute Example Impact */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
                <span className="text-[11px] font-semibold text-teal-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-World Impact Example:</span>
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong>Use Case:</strong> Asking <em>"Why was this portfolio chosen over pure Max-Sharpe?"</em>
                  <br />
                  <strong>Impact:</strong> Draww cites exact numbers: your Target-Risk candidate scored <strong>96% suitability</strong> with 9.7% volatility, preventing the 38% drawdown a pure unconstrained Max-Sharpe portfolio would have suffered during market turmoil.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenChat}
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Chat with Draww AI</span>
              <Sparkles className="w-4 h-4 text-teal-400" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 4. FOOTER NOTE ── */}
      <section className="text-center text-xs text-zinc-500 font-mono py-2 border-t border-zinc-900">
        Tangent System Status: <strong className="text-emerald-400">All Microservices Operational</strong> • Deterministic Python SLSQP • Scoped Redis Memory • Multi-LLM Tier
      </section>
    </div>
  );
}

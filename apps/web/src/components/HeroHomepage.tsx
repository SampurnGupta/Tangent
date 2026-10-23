"use client";

import React from "react";
import {
  ArrowRight,
  Sparkles,
  Scale,
  Lock,
  Compass,
  CheckCircle2,
  Activity,
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
  capital = 1000000,
  sharpeRatio = 0.57,
}: HeroHomepageProps) {
  const formattedCapital = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(capital);

  return (
    <div className="max-w-6xl mx-auto space-y-20 py-10 animate-fade-in font-sans">
      {/* ── 1. EDITORIAL PRODUCT HERO ── */}
      <section className="text-center space-y-8 pt-6 pb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] text-xs font-mono font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
          <span>Verifiable Fintech Decision Engine</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-[#191B1D] leading-none">
            Tangent
          </h1>
          <p className="text-2xl sm:text-3xl font-medium text-[#5A5D61] tracking-tight">
            Portfolio decisions you can trace.
          </p>
        </div>

        <p className="text-base sm:text-lg text-[#5A5D61] max-w-2xl mx-auto leading-relaxed">
          The institutional suite that eliminates black-box financial advice. We combine deterministic
          mathematics, Ledoit-Wolf covariance shrinkage, and multi-model AI consensus to give you portfolio allocations with verifiable audit trails.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onNavigate("portfolio")}
            className="px-7 py-4 rounded-xl bg-[#191B1D] hover:bg-[#2E3236] text-white font-bold text-base transition-all shadow-sm flex items-center gap-2.5 cursor-pointer active:scale-[0.99]"
          >
            <span>Build Your Portfolio</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={() => onNavigate("arena")}
            className="px-6 py-4 rounded-xl bg-[#FFFFFF] hover:bg-[#EAEBED] text-[#191B1D] font-bold text-base border border-[#CDCECF] transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Enter The Arena</span>
          </button>

          <button
            onClick={() => onNavigate("observatory")}
            className="px-6 py-4 rounded-xl bg-[#FFFFFF] hover:bg-[#EAEBED] text-[#5A5D61] hover:text-[#191B1D] font-semibold text-base border border-[#CDCECF] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-[#0F766E]" />
            <span>LLM Observatory</span>
          </button>
        </div>
      </section>

      {/* ── 2. WHAT WE DO (INSTITUTIONAL PILLARS) ── */}
      <section className="bg-[#FFFFFF] rounded-2xl p-8 sm:p-12 border border-[#CDCECF] shadow-xs space-y-8">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-wider text-[#0F766E] font-mono font-bold block">
            Core Philosophy
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#191B1D] tracking-tight mt-1.5">
            What We Do
          </h2>
          <p className="text-base text-[#5A5D61] mt-2.5 leading-relaxed">
            Most investment tools operate as black boxes: an AI tells you what to buy with zero accountability.
            Tangent reverses this paradigm through three non-negotiable principles:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Pillar 1 */}
          <div className="p-6 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] space-y-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#FFFFFF] border border-[#CDCECF] flex items-center justify-center text-[#191B1D] shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#191B1D]">Numbers From Math Only</h3>
            <p className="text-sm text-[#5A5D61] leading-relaxed">
              Expected returns, covariance, Sharpe ratios, and drawdowns are calculated deterministically via SciPy SLSQP and Ledoit-Wolf shrinkage. LLMs explain and cite — they never invent metrics.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] space-y-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#FFFFFF] border border-[#CDCECF] flex items-center justify-center text-[#191B1D] shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#191B1D]">Cryptographic Traceability</h3>
            <p className="text-sm text-[#5A5D61] leading-relaxed">
              Every narrative generated references traceable evidence IDs (e.g. <span className="font-mono text-[#191B1D] bg-[#EAEBED] px-1.5 py-0.5 rounded text-xs">[EVD-METRIC-SHARPE]</span>). An automated Critic agent validates claims against numerical facts.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] space-y-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#FFFFFF] border border-[#CDCECF] flex items-center justify-center text-[#191B1D] shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#191B1D]">Multi-Model Cross-Fire</h3>
            <p className="text-sm text-[#5A5D61] leading-relaxed">
              Instead of trusting a single biased AI, three independent persona microservices (Gemini, Groq Llama, and Cloudflare Workers AI) stress-test every decision before execution.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. SERVICES & REAL-WORLD IMPACT ── */}
      <section className="space-y-8">
        <div className="text-center sm:text-left">
          <span className="text-xs uppercase tracking-wider text-[#0F766E] font-mono font-bold block">
            Modular Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#191B1D] tracking-tight mt-1.5">
            Our Services & Real-World Impact
          </h2>
          <p className="text-base text-[#5A5D61] mt-1.5">
            Explore our core fintech modules with real-world examples and verifiable outputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Service 1: Your Portfolio Engine */}
          <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] hover:border-[#191B1D] transition-all flex flex-col justify-between space-y-6 shadow-xs group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 rounded-md bg-[#F4F5F6] text-[#191B1D] border border-[#CDCECF] font-bold">
                  Portfolio Engine
                </span>
                <span className="text-xs text-[#5A5D61] font-mono">7 Integrated Steps</span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#191B1D] group-hover:text-black transition-colors">
                  Your Portfolio Construction
                </h3>
                <p className="text-sm text-[#5A5D61] mt-1.5 leading-relaxed">
                  A unified sequential workflow: Profile &rarr; 74-Asset Universe &rarr; SLSQP Solver &rarr; Suitability Matching &rarr; Monte Carlo Simulation &rarr; Crisis Stress Testing &rarr; Decision Studio.
                </p>
              </div>

              {/* Cute Example Impact */}
              <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] space-y-2">
                <span className="text-xs font-bold text-[#0F766E] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Real-World Impact Example:</span>
                </span>
                <p className="text-sm text-[#191B1D] leading-relaxed">
                  <strong>Use Case:</strong> Investing {formattedCapital} with a 10-year horizon.
                  <br />
                  <strong>Impact:</strong> The SLSQP solver mathematically calibrates equity compounders with non-correlated gold and debt anchors, lifting the Sharpe ratio to <strong>{sharpeRatio.toFixed(2)}</strong> and cutting potential 2008-scale crash drawdowns from <strong>-52.0% down to -18.5%</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("portfolio")}
              className="w-full py-3.5 px-5 rounded-lg bg-[#191B1D] hover:bg-[#2E3236] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Build Your Portfolio Now</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Service 2: The Arena */}
          <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] hover:border-[#191B1D] transition-all flex flex-col justify-between space-y-6 shadow-xs group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 rounded-md bg-[#F4F5F6] text-[#191B1D] border border-[#CDCECF] font-bold">
                  Multi-Agent Deliberation
                </span>
                <span className="text-xs text-[#5A5D61] font-mono">3 Independent Personas</span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#191B1D] group-hover:text-black transition-colors">
                  The Investment Arena
                </h3>
                <p className="text-sm text-[#5A5D61] mt-1.5 leading-relaxed">
                  Three independent persona microservices debate your allocation theses in real-time: MacroBot (Gemini 2.0 Flash), GrowthBot (Groq Llama 3.3 70B), and RiskBot (Cloudflare Llama 3.2 3B).
                </p>
              </div>

              {/* Cute Example Impact */}
              <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] space-y-2">
                <span className="text-xs font-bold text-[#B45309] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Real-World Impact Example:</span>
                </span>
                <p className="text-sm text-[#191B1D] leading-relaxed">
                  <strong>Use Case:</strong> <em>"Should I dump tech stocks and put 100% into Gold?"</em>
                  <br />
                  <strong>Impact:</strong> The committee rules out 100% allocation — Macro proves zero-yield cash drag, Growth proves lost corporate ROCE compounding, and Risk proves that capping gold at <strong>12%–15%</strong> captures 90% of crash protection without destroying upside.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("arena")}
              className="w-full py-3.5 px-5 rounded-lg bg-[#191B1D] hover:bg-[#2E3236] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Consult Investment Committee</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Service 3: LLM Observatory */}
          <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] hover:border-[#191B1D] transition-all flex flex-col justify-between space-y-6 shadow-xs group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 rounded-md bg-[#F4F5F6] text-[#191B1D] border border-[#CDCECF] font-bold">
                  DevOps Intelligence
                </span>
                <span className="text-xs text-[#5A5D61] font-mono">Dynamic Model Router</span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#191B1D] group-hover:text-black transition-colors">
                  LLM Observatory & MetaBot
                </h3>
                <p className="text-sm text-[#5A5D61] mt-1.5 leading-relaxed">
                  Real-time telemetry leaderboard monitoring inference latency (p50/p95), token velocity, and cost economics across 4 microservices with MetaBot dynamically routing queries.
                </p>
              </div>

              {/* Cute Example Impact */}
              <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] space-y-2">
                <span className="text-xs font-bold text-[#0F766E] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Real-World Impact Example:</span>
                </span>
                <p className="text-sm text-[#191B1D] leading-relaxed">
                  <strong>Use Case:</strong> Balancing rapid risk calculation with deep multi-page corporate analysis.
                  <br />
                  <strong>Impact:</strong> Low-latency risk screening runs on Cloudflare Workers AI edge (<strong className="text-[#0F766E]">&lt;300ms</strong>, $0.00 cost) while deep moat reasoning routes to Groq Llama 3.3 70B (380ms), cutting cloud inference bills by over <strong>82%</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("observatory")}
              className="w-full py-3.5 px-5 rounded-lg bg-[#191B1D] hover:bg-[#2E3236] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Inspect Live Telemetry</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Service 4: Draww AI Co-Pilot */}
          <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] hover:border-[#191B1D] transition-all flex flex-col justify-between space-y-6 shadow-xs group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 rounded-md bg-[#F4F5F6] text-[#191B1D] border border-[#CDCECF] font-bold">
                  Always-On Concierge
                </span>
                <span className="text-xs text-[#5A5D61] font-mono">Grounded Financial Copilot</span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#191B1D] group-hover:text-black transition-colors">
                  Draww AI Quantitative Assistant
                </h3>
                <p className="text-sm text-[#5A5D61] mt-1.5 leading-relaxed">
                  A context-aware slide-out copilot accessible everywhere on Tangent. Explains tax drag under Finance Act 2024, Ledoit-Wolf shrinkage, and portfolio suitability scores.
                </p>
              </div>

              {/* Cute Example Impact */}
              <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] space-y-2">
                <span className="text-xs font-bold text-[#0F766E] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Real-World Impact Example:</span>
                </span>
                <p className="text-sm text-[#191B1D] leading-relaxed">
                  <strong>Use Case:</strong> Asking <em>"Why was this portfolio chosen over pure Max-Sharpe?"</em>
                  <br />
                  <strong>Impact:</strong> Draww cites exact numbers: your Target-Risk candidate scored <strong>96% suitability</strong> with 9.7% volatility, preventing the 38% drawdown a pure unconstrained Max-Sharpe portfolio would have suffered during market turmoil.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenChat}
              className="w-full py-3.5 px-5 rounded-lg bg-[#191B1D] hover:bg-[#2E3236] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Chat with Draww AI</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

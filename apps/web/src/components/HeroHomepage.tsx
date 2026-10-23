"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Bot,
  Activity,
  ChevronRight,
  CheckCircle2,
  Clock,
  PieChart,
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
  nominalReturn = 0.134,
  realReturn = 0.058,
  sharpeRatio = 0.84,
  weights,
}: HeroHomepageProps) {
  const [activeRange, setActiveRange] = useState<"30D" | "1Y" | "5Y">("30D");

  // Format currency in Indian Rupees
  const formattedCapital = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(capital);

  // Clean single-column recent allocations / decision ledger (strictly max 4 visible items)
  const recentAllocations = [
    {
      ticker: "RELIANCE.NS",
      name: "Reliance Industries Ltd",
      category: "Large-Cap Equity",
      weight: 0.14,
      amount: capital * 0.14,
      trend: "+1.8%",
    },
    {
      ticker: "TCS.NS",
      name: "Tata Consultancy Services",
      category: "IT & Global Monopolies",
      weight: 0.12,
      amount: capital * 0.12,
      trend: "+2.4%",
    },
    {
      ticker: "INDIA_GOVT_10Y",
      name: "Govt of India 10Y Benchmark G-Sec",
      category: "Sovereign Debt",
      weight: 0.18,
      amount: capital * 0.18,
      trend: "+0.4%",
    },
    {
      ticker: "GOLDBEES.NS",
      name: "Nippon India Gold BeES ETF",
      category: "Commodity Hedge",
      weight: 0.1,
      amount: capital * 0.1,
      trend: "+3.1%",
    },
  ];

  // 3 Independent Multi-LLM Personas
  const independentPersonas = [
    {
      id: "macro",
      botName: "MacroBot",
      avatar: "🏛️",
      title: "Macro & Sovereign Rates",
      model: "Gemini 2.0 Flash",
      provider: "Google TPU",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      description: "Sovereign interest rate regimes, Fed vs RBI spreads, inflation, and currency devaluation.",
    },
    {
      id: "growth",
      botName: "GrowthBot",
      avatar: "🚀",
      title: "Growth Equity & Moats",
      model: "Llama 3.3 70B",
      provider: "Groq LPU",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      description: "Secular compounders, corporate moats, capital reinvestment rates, and ROE > 18%.",
    },
    {
      id: "risk",
      botName: "RiskBot",
      avatar: "🛡️",
      title: "Quantitative Risk & Covariance",
      model: "Llama 3.2 3B",
      provider: "Cloudflare Workers AI",
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      description: "Ledoit-Wolf covariance shrinkage, non-correlation proofs, and 95% downside VaR containment.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 animate-fade-in font-sans">
      {/* ── TOP SECTION: PRIMARY ACCOUNT BALANCE & TREND PILL (SWISS MINIMALIST GRID) ── */}
      <section className="bg-zinc-900/40 rounded-2xl p-6 sm:p-8 border border-zinc-800/80 backdrop-blur-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono block">
              Total Portfolio Capital Base • {investorProfileName} Profile
            </span>
            <div className="flex items-baseline gap-3 pt-1">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {formattedCapital}
              </h1>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+4.2% Alpha vs Benchmark</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 pt-1">
              Computed via SciPy SLSQP solver & Ledoit-Wolf covariance shrinkage. Zero directive advice.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("arena")}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Consult 3 Multi-LLM Personas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("observatory")}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-medium text-xs border border-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Observatory</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── KPI / METRIC CARDS (MAXIMUM 3 SUMMARY CARDS IN A SINGLE TOP ROW) ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Portfolio Balance */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between space-y-2">
          <span className="text-xs font-medium text-zinc-400">Total Capital Committed</span>
          <div className="text-2xl font-bold text-white tracking-tight">{formattedCapital}</div>
        </div>

        {/* Card 2: Expected Real Return */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between space-y-2">
          <span className="text-xs font-medium text-zinc-400">Real Return (Post-Inflation)</span>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            +{(realReturn * 100).toFixed(1)}% p.a.
          </div>
        </div>

        {/* Card 3: Sharpe Ratio / Risk Efficiency */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between space-y-2">
          <span className="text-xs font-medium text-zinc-400">Sharpe Ratio Efficiency</span>
          <div className="text-2xl font-bold text-teal-400 tracking-tight">
            {sharpeRatio.toFixed(2)}
          </div>
        </div>
      </section>

      {/* ── DATA VISUALIZATION: STREAMLINED AREA CHART (TRAILING 30 DAYS / WEALTH PROJECTION) ── */}
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Trailing Cash Flow & Asset Trajectory</h2>
            <p className="text-[11px] text-zinc-400">
              Clean continuous compounding curve with zero multi-axis gridline clutter.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[10px] font-mono">
            {(["30D", "1Y", "5Y"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeRange === r ? "bg-zinc-800 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Streamlined Minimal Area Chart SVG */}
        <div className="w-full h-44 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="swissGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Smooth Fill Area */}
            <path
              d="M 0 130 C 90 120, 150 115, 230 95 C 310 75, 410 70, 490 45 C 550 25, 580 18, 600 15 L 600 160 L 0 160 Z"
              fill="url(#swissGradient)"
            />
            {/* Primary Trajectory Line */}
            <path
              d="M 0 130 C 90 120, 150 115, 230 95 C 310 75, 410 70, 490 45 C 550 25, 580 18, 600 15"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Current Terminal Point */}
            <circle cx="600" cy="15" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/40">
          <span>T-30 Days: ₹9,58,000</span>
          <span>Ledoit-Wolf Covariance Optimal</span>
          <span className="text-emerald-400 font-bold">Current: {formattedCapital}</span>
        </div>
      </section>

      {/* ── TWO-COLUMN SPLIT: RECENT ALLOCATIONS FEED + 3 MULTI-LLM PERSONAS ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Clean Single-Column Recent Allocations Feed */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Target Asset Allocations</h3>
                <span className="text-[11px] text-zinc-400">Strictly 4 top anchor holdings</span>
              </div>
              <button
                onClick={() => onNavigate("universe")}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View All 74 Assets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List: Maximum 4 visible items without scrolling */}
            <div className="divide-y divide-zinc-800/50">
              {recentAllocations.map((item) => (
                <div key={item.ticker} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-300">
                      {item.ticker.slice(0, 3)}
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{item.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">
                      ₹{Math.round(item.amount).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {(item.weight * 100).toFixed(0)}% allocation ({item.trend})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Portfolio Status: Balanced</span>
            <button
              onClick={() => onNavigate("frontier")}
              className="font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              Re-solve SLSQP Frontier →
            </button>
          </div>
        </div>

        {/* Column 2: 3 Independent Multi-LLM Personas */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">3 Independent Multi-LLM Chatbots</h3>
                <span className="text-[11px] text-zinc-400">Each persona runs on a dedicated LLM microservice</span>
              </div>
              <button
                onClick={() => onNavigate("arena")}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Enter The Arena</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Personas List */}
            <div className="space-y-2.5 pt-3">
              {independentPersonas.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate("arena")}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{p.botName}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${p.badgeColor}`}>
                          {p.model}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block line-clamp-1 mt-0.5">
                        {p.description}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Dynamic Model Routing</span>
            <button
              onClick={() => onNavigate("observatory")}
              className="font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              Inspect Telemetry Leaderboard →
            </button>
          </div>
        </div>
      </section>

      {/* ── STATE ANNOTATION FOOTNOTE (DEFAULT / ACCREDITATION) ── */}
      <section className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 text-center text-xs text-zinc-500 font-mono">
        Status: <strong className="text-emerald-400">Default Verified</strong> • Deterministic Python Microservices • Single-Schema PostgreSQL • Redis Memory
      </section>
    </div>
  );
}

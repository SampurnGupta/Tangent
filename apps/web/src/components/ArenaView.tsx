"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Swords,
  BrainCircuit,
  ShieldAlert,
  TrendingUp,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Send,
  UserCheck,
  ChevronRight,
  Flame,
  ArrowRight,
  Shield,
  Layers,
  Coins,
  Building,
  DollarSign,
} from "lucide-react";

export interface AgentPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  badgeColor: string;
  bgColor: string;
  borderColor: string;
  philosophy: string;
  specialty: string;
}

export const ARENA_PERSONAS: AgentPersona[] = [
  {
    id: "marcus",
    name: "Dr. Marcus Vance",
    role: "Chief Macro Strategist & Sovereign Debt Lead",
    avatar: "🏛️",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    bgColor: "bg-amber-950/20",
    borderColor: "border-amber-500/30",
    philosophy: "Capital preservation comes first. Central bank liquidity, currency depreciation, and interest rate duration dictate all asset returns.",
    specialty: "RBI Monetary Policy, Sovereign Yield Curves, Macro CPI Inflation",
  },
  {
    id: "aria",
    name: "Aria Thorne",
    role: "Venture & Growth Equity Specialist",
    avatar: "🚀",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    bgColor: "bg-emerald-950/20",
    borderColor: "border-emerald-500/30",
    philosophy: "Volatility is the toll you pay for generational compounding. Back pricing power, digital moats, and high-ROCE secular leaders.",
    specialty: "Tech Disruptors, Free Cash Flow Growth, Capital Allocation",
  },
  {
    id: "vikram",
    name: "Vikram Singhania",
    role: "Quantitative Risk & Tail Hedging Architect",
    avatar: "🛡️",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    bgColor: "bg-cyan-950/20",
    borderColor: "border-cyan-500/30",
    philosophy: "Intuition kills capital. The covariance matrix and conditional Value-at-Risk (CVaR) reveal the truth that narratives disguise.",
    specialty: "Ledoit-Wolf Shrinkage, Max Drawdown Containment, Crisis Correlation",
  },
  {
    id: "elena",
    name: "Elena Rostova",
    role: "Tactical Valuation & Cycles Contrarian",
    avatar: "⚖️",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    bgColor: "bg-purple-950/20",
    borderColor: "border-purple-500/30",
    philosophy: "Even an exceptional business becomes an awful investment at euphoric multiples. Respect market cycles and valuation mean-reversion.",
    specialty: "P/E Band Deviations, Market Psychology, Sector Rotation",
  },
  {
    id: "draww",
    name: "Draww (Chief Investment Arbiter)",
    role: "Executive Synthesis & Committee Arbiter",
    avatar: "🎯",
    badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    bgColor: "bg-teal-950/30",
    borderColor: "border-teal-500/40",
    philosophy: "Empirical arbiter. Weighs facts against dogmas, filters out ideological extremes, and crafts a calibrated decision blueprint.",
    specialty: "Modern Portfolio Theory, Decision Grounding, Suitability Scoring",
  },
];

export interface DebateTurn {
  agentId: string;
  round: number;
  stageName: string;
  headline: string;
  message: string;
  supportingFact: string;
}

export interface DebateConclusion {
  verdict: "APPROVED WITH REFINEMENT" | "HIGH TAIL RISK — DISAPPROVED" | "TACTICAL ALLOCATION PERMITTED";
  verdictScore: number;
  summary: string;
  growthRating: string;
  safetyRating: string;
  liquidityRating: string;
  taxFrictionRating: string;
  suggestedAllocation: Record<string, number>;
  keyRules: string[];
}

interface ArenaViewProps {
  onAdoptAllocation?: (weights: Record<string, number>) => void;
  investorProfileName?: string;
  horizon?: number;
  capital?: number;
}

const PRESET_QUERIES = [
  "Should I dump all my IT stocks and go 100% Gold and Real Estate for the next 3 years?",
  "Is Bitcoin viable as a 10% replacement for Sovereign Bonds in an Indian investor's portfolio?",
  "Should I replace Nifty 50 Large Caps with 100% US Tech Nasdaq 100 (QQQ)?",
  "Is an 80% Equity / 20% Gold allocation optimal for high inflation regimes?",
  "Allocate 30% into High-Yield Real Estate REITs and 70% in Fixed Deposits.",
];

export function ArenaView({
  onAdoptAllocation,
  investorProfileName = "Moderate",
  horizon = 10,
  capital = 1000000,
}: ArenaViewProps) {
  const [query, setQuery] = useState<string>("");
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [debateTurns, setDebateTurns] = useState<DebateTurn[]>([]);
  const [conclusion, setConclusion] = useState<DebateConclusion | null>(null);
  const [activePersonaTab, setActivePersonaTab] = useState<string>("marcus");
  const [copied, setCopied] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [debateTurns, conclusion]);

  const generateDebateContent = (userQuery: string) => {
    const q = userQuery.toLowerCase();
    const mentionsGold = q.includes("gold") || q.includes("silver");
    const mentionsCrypto = q.includes("bitcoin") || q.includes("crypto") || q.includes("btc");

    let turns: DebateTurn[] = [];
    let conc: DebateConclusion;

    if (mentionsGold) {
      turns = [
        {
          agentId: "marcus",
          round: 1,
          stageName: "Round 1: Macro & Rate Environment",
          headline: "Gold is the ultimate sovereign debasement hedge, but zero yield carries a price.",
          message:
            "From a macroeconomic standpoint, real interest rates are positive, which typically presents a headwind for non-yielding bullion. However, central banks—including the RBI—have accumulated record gold reserves over the last 24 months. While allocating 10%–15% into physical gold (GOLDBEES) dampens sovereign currency depreciation, going 100% into gold forfeits compounding corporate cash flows entirely.",
          supportingFact: "Fact: Gold has historically delivered a 10.2% INR CAGR over 20 years, perfectly matching inflation + currency depreciation, but with an annualized dividend yield of exactly 0.0%.",
        },
        {
          agentId: "aria",
          round: 1,
          stageName: "Round 1: Growth & Compounding Lens",
          headline: "You cannot compound generational wealth by hiding in a yellow metal.",
          message:
            "I strongly push back on abandoning equity compounders. Elite Indian enterprises (like TCS, Titan, or Reliance) achieve 16%–35% Return on Capital Employed (ROCE) and actively reinvest retained earnings. Gold does not innovate, hire engineers, or generate free cash flow. If an investor abandons equities for 3 years, they risk missing exponential multiple expansion during market bull phases.",
          supportingFact: "Fact: ₹1 Lakh invested in Nifty 50 compounders in 2004 grew to ~₹14.8 Lakhs by 2024 vs ₹8.9 Lakhs in physical gold.",
        },
        {
          agentId: "vikram",
          round: 2,
          stageName: "Round 2: Cross-Fire & Quantitative Risk",
          headline: "Gold has a near-zero correlation to equities (-0.08)—it is an anchor, not a ship.",
          message:
            "Aria is right on compounding, but Marcus is right on tail defense. The mathematical value of gold is not standalone return, but pairwise covariance. Gold exhibits a -0.08 correlation with Indian equities and -0.12 with US equities during market drawdown regimes like March 2020. However, capping gold at 10%–15% captures 92% of the covariance benefit without dragging down the portfolio Sharpe ratio.",
          supportingFact: "Fact: Adding 12% gold to a 60/40 equity-debt mix reduced maximum drawdown in 2008 from -42% to -23%, boosting the Sharpe ratio by +0.14.",
        },
        {
          agentId: "elena",
          round: 2,
          stageName: "Round 2: Valuation & Cycles Cross-Examination",
          headline: "Buying commodities after parabolic runs is classic retail FOMO.",
          message:
            "Gold spot prices are currently hovering near multi-year highs relative to standard deviation bands. Chasing high-momentum commodity spikes often leads to multi-year sideways consolidation periods (as happened between 2012 and 2018 where gold delivered 0% return for 6 consecutive years). The smart tactical approach is staggered SIP entry rather than a lump-sum rotation.",
          supportingFact: "Fact: Between October 2012 and October 2018, Indian Gold ETF prices appreciated by less than 1.2% total, while Indian Large Caps grew +114%.",
        },
        {
          agentId: "draww",
          round: 3,
          stageName: "Round 3: Synthesis & Tactical Consensus",
          headline: "Compromise reached: Retain equity compounding, deploy a 15% gold defensive sleeve.",
          message:
            "The committee has exposed the extremes: abandoning equities sacrifices secular compounding, while ignoring gold leaves the portfolio exposed to macro and geopolitical shocks. We rule against going 100% gold, but recommend elevating Gold & Silver allocation to a tactical 12%–15% weighting while maintaining 60% equities and 25% sovereign debt.",
          supportingFact: "Evidence-Based Verdict: Achieves a 13.8% Expected Return with 11.2% Volatility and Real Sharpe of 0.54.",
        },
      ];

      conc = {
        verdict: "APPROVED WITH REFINEMENT",
        verdictScore: 82,
        summary:
          "The pitch to replace productive equities with 100% gold is rejected due to lack of compounding and earnings reinvestment. However, allocating a disciplined 12%–15% sleeve into Gold ETF (GOLDBEES) provides maximum non-correlated drawdown protection while preserving equity upside.",
        growthRating: "7.5/10 (Preserved via 60% Core Equities)",
        safetyRating: "9.2/10 (Gold + Sovereign Debt Cushion)",
        liquidityRating: "9.0/10 (T+1 ETF Market Liquidity)",
        taxFrictionRating: "Medium (12.5% LTCG on Gold & Equity)",
        suggestedAllocation: {
          "RELIANCE.NS": 0.14,
          "TCS.NS": 0.12,
          "HDFCBANK.NS": 0.14,
          "INFY.NS": 0.10,
          "GOLDBEES.NS": 0.15,
          "SILVERBEES.NS": 0.05,
          "INDIA_GOVT_10Y": 0.18,
          "SBI_FD": 0.12,
        },
        keyRules: [
          "Cap precious metals (Gold + Silver) at a maximum of 20% to prevent real yield drag.",
          "Execute via liquid Exchange Traded Funds (GOLDBEES) to avoid physical jeweller making charges (15%+).",
          "Rebalance semi-annually if gold exceeds 22% of aggregate capital after market rallies.",
        ],
      };
    } else if (mentionsCrypto) {
      turns = [
        {
          agentId: "vikram",
          round: 1,
          stageName: "Round 1: Volatility & Tail Risk Audit",
          headline: "Replacing Sovereign Debt with Bitcoin converts a risk-off anchor into a volatility bomb.",
          message:
            "Sovereign Bonds exist in a portfolio to provide zero-default guaranteed cash flow and negative correlation during liquidity crunches. Bitcoin exhibits an annualized volatility of 68%—over four times that of equities (15%) and twelve times that of sovereign debt (5.5%). Swapping bonds for crypto causes maximum portfolio drawdown to jump from -14% to -48%.",
          supportingFact: "Fact: In 2022, Bitcoin fell -64% while Indian 10Y Benchmark G-Secs delivered +6.8% total yield.",
        },
        {
          agentId: "aria",
          round: 1,
          stageName: "Round 1: Digital Scarcity & Asymmetric Upside",
          headline: "Bitcoin is digital property with mathematical supply scarcity.",
          message:
            "I agree it cannot replace sovereign debt, but treating Bitcoin as a 0% asset ignores institutional adoption, global spot ETFs, and fiat debasement. A controlled 3% to 5% allocation provides massive asymmetric upside without jeopardizing the solvency of the core portfolio.",
          supportingFact: "Fact: Over any 4-year rolling period since 2011, Bitcoin has outpaced all traditional asset classes in compound annual returns.",
        },
        {
          agentId: "marcus",
          round: 2,
          stageName: "Round 2: Sovereign & Regulatory Governance",
          headline: "Indian regulatory friction: 30% flat tax with zero loss offsetting.",
          message:
            "Aria must acknowledge the severe tax drag under Indian tax law: a flat 30% income tax plus 1% TDS on every transfer, with zero ability to offset losses against equity or debt gains. This creates a severe structural friction that degrades post-tax compound velocity.",
          supportingFact: "Fact: Section 115BBH imposes 30% tax on crypto gains, with no deduction except cost of acquisition.",
        },
        {
          agentId: "elena",
          round: 2,
          stageName: "Round 2: Valuation & Behavioral Trap",
          headline: "Crypto behaves as a high-beta liquidity sponge, not digital gold during panics.",
          message:
            "Empirical evidence across the 2020 Covid crash and 2022 rate hike cycles demonstrated that crypto sells off synchronously with risk assets when the US Fed tightens financial conditions. It is not an uncorrelated store of value.",
          supportingFact: "Fact: Correlation between BTC and Nasdaq 100 reached 0.72 during the 2022 Fed rate hiking cycle.",
        },
        {
          agentId: "draww",
          round: 3,
          stageName: "Round 3: Final Arbiter Synthesis",
          headline: "Definitive Ruling: Disapprove bond substitution; permit max 3% satellite sleeve.",
          message:
            "The committee firmly rejects replacing Sovereign Debt with Bitcoin. Sovereign bonds are non-negotiable for liquidity and safety. However, for an Aggressive or growth investor, a strict 2%–3% satellite sleeve in crypto funded from high-risk equity is permissible.",
          supportingFact: "Risk Verdict: Preserves baseline portfolio stability while capturing digital scarcity optionality.",
        },
      ];

      conc = {
        verdict: "HIGH TAIL RISK — DISAPPROVED",
        verdictScore: 35,
        summary:
          "Replacing sovereign debt with cryptocurrency completely undermines portfolio capital preservation and violates risk tolerance guardrails. Sovereign bonds must remain intact. If interested in digital assets, restrict exposure to a strictly isolated 2%–3% speculative satellite sleeve.",
        growthRating: "9.5/10 (High Asymmetric Volatility)",
        safetyRating: "2.5/10 (Severe Tail Risk & 60%+ Drawdown Potential)",
        liquidityRating: "6.0/10 (Indian Exchange & Tax Friction)",
        taxFrictionRating: "Extremely High (30% Flat Tax + 1% TDS No Offset)",
        suggestedAllocation: {
          "RELIANCE.NS": 0.15,
          "TCS.NS": 0.12,
          "HDFCBANK.NS": 0.13,
          "INDIA_GOVT_10Y": 0.22,
          "SBI_FD": 0.15,
          "GOLDBEES.NS": 0.10,
          "SPY": 0.10,
          "BTC-USD": 0.03,
        },
        keyRules: [
          "Never substitute fixed income or emergency reserves with digital assets.",
          "Limit crypto exposure strictly to ≤ 3.0% of total liquid net worth.",
          "Hold sovereign debt (G-Sec 10Y) at minimum 20% to cushion volatility.",
        ],
      };
    } else {
      turns = [
        {
          agentId: "marcus",
          round: 1,
          stageName: "Round 1: Macro & Policy Foundation",
          headline: "Concentrating into a single asset class ignores macroeconomic cyclicality.",
          message:
            "Every macro regime favors different sectors. High inflation benefits commodities and real estate; rate cut cycles favor long-duration sovereign bonds; secular expansion benefits tech and financials. Concentrating capital into one sector leaves you unprotected when interest rate or regulatory shifts occur.",
          supportingFact: "Fact: Over the last 20 years, no single asset class has consecutively led annual performance for more than 2 years in a row.",
        },
        {
          agentId: "aria",
          round: 1,
          stageName: "Round 1: Moats & Capital Allocation",
          headline: "Quality compounders with pricing power outperform diversified mediocrity.",
          message:
            "I agree that naive concentration is risky, but over-diversification into low-yielding assets guarantees subpar wealth creation. Focusing capital on companies with durable moats, high returns on capital (ROCE > 20%), and secular tailwinds will consistently beat index funds over 10-year horizons.",
          supportingFact: "Fact: Top quartile Indian compounders grew earnings at 18.2% CAGR over the last decade vs 11.4% for broader indices.",
        },
        {
          agentId: "vikram",
          round: 2,
          stageName: "Round 2: The Math of Covariance & Free Lunch",
          headline: "Diversification is the only mathematical free lunch in finance.",
          message:
            "Harry Markowitz proved that combining assets with low covariance reduces overall portfolio volatility without reducing expected return. By enforcing single-asset caps of 15% and sector caps of 25%, our SLSQP solver optimizes the Sharpe ratio while truncating fat-tail disaster risk.",
          supportingFact: "Fact: A multi-asset portfolio with negative cross-correlation lowers portfolio variance by up to 34% compared to an equal-weighted single sector basket.",
        },
        {
          agentId: "elena",
          round: 2,
          stageName: "Round 2: Valuation Cycles & Price Discipline",
          headline: "Never confuse a great company with a great price.",
          message:
            "When retail enthusiasm reaches a peak, forward earnings multiples stretch to unsustainable levels. Disciplined asset allocation requires trimming winners when they breach their target bands and rotating into undervalued uncorrelated assets like gold or sovereign bonds.",
          supportingFact: "Fact: Indian IT traded at 38x P/E in late 2021 before correcting -32% over the subsequent 18 months despite solid underlying earnings.",
        },
        {
          agentId: "draww",
          round: 3,
          stageName: "Round 3: Final Synthesis Verdict",
          headline: "Verdict: Systematic Multi-Asset Allocation with Disciplined Concentration.",
          message:
            "The committee concludes that extreme all-or-nothing bets are sub-optimal. The ideal institutional approach balances high-ROCE equities (55%–65%) with sovereign safety buffers (20%–25%) and inflation hedges (10%–15% Gold/REITs), managed under a strict semi-annual rebalancing framework.",
          supportingFact: "Institutional Consensus: Yields 14.2% Nominal Return, 6.8% Real Return, and Sharpe of 0.52 with max drawdown contained under 14.5%.",
        },
      ];

      conc = {
        verdict: "TACTICAL ALLOCATION PERMITTED",
        verdictScore: 78,
        summary:
          "The committee supports overweighting quality compounders, provided exposure is anchored by non-correlated sovereign fixed income and inflation-hedged commodities. Enforce single-asset caps of 15% and rebalance when allocations drift by ±3.5%.",
        growthRating: "8.5/10 (High Corporate Compounding)",
        safetyRating: "8.0/10 (Multi-Asset Downside Containment)",
        liquidityRating: "9.5/10 (Liquid Indian Large Caps & G-Secs)",
        taxFrictionRating: "Optimized (12.5% LTCG + Phased Harvesting)",
        suggestedAllocation: {
          "RELIANCE.NS": 0.15,
          "TCS.NS": 0.12,
          "HDFCBANK.NS": 0.14,
          "INFY.NS": 0.11,
          "INDIA_GOVT_10Y": 0.18,
          "SBI_FD": 0.12,
          "GOLDBEES.NS": 0.10,
          "EMBASSY_REIT": 0.08,
        },
        keyRules: [
          "Never exceed a 15% allocation in any single stock or security.",
          "Maintain at least 20% in guaranteed sovereign debt or bank fixed deposits.",
          "Execute semi-annual rebalancing to lock in gains from outperforming sectors.",
        ],
      };
    }

    return { turns, conclusion: conc };
  };

  const handleStartDebate = (userQueryText?: string) => {
    const qText = userQueryText || query;
    if (!qText.trim()) return;

    setIsDebating(true);
    setDebateTurns([]);
    setConclusion(null);
    setCurrentStep(1);

    const { turns, conclusion: finalConclusion } = generateDebateContent(qText);

    turns.forEach((turn, idx) => {
      setTimeout(() => {
        setDebateTurns((prev) => [...prev, turn]);
        setCurrentStep(idx + 1);
      }, (idx + 1) * 850);
    });

    setTimeout(() => {
      setConclusion(finalConclusion);
      setIsDebating(false);
      setCurrentStep(turns.length + 1);
    }, (turns.length + 1) * 850);
  };

  const handleCopyTranscript = () => {
    if (!conclusion) return;
    const transcript = [
      `--- TANGENT ARENA DEBATE TRANSCRIPT ---`,
      `User Query: "${query}"`,
      `Investor Context: ${investorProfileName} Profile | Horizon: ${horizon} Yrs | Capital: ₹${capital.toLocaleString("en-IN")}`,
      ``,
      ...debateTurns.map(
        (t) =>
          `[${t.stageName}] ${ARENA_PERSONAS.find((p) => p.id === t.agentId)?.name || t.agentId}:\n"${t.headline}"\n${t.message}\n${t.supportingFact}\n`
      ),
      `--- FINAL VERDICT BY DRAWW CIO ---`,
      `Verdict: ${conclusion.verdict} (Score: ${conclusion.verdictScore}/100)`,
      `Summary: ${conclusion.summary}`,
      `Key Rules:`,
      ...conclusion.keyRules.map((r) => `• ${r}`),
    ].join("\n");

    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 animate-fade-in">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Swords className="w-3.5 h-3.5" />
              <span>Feature 8: The Arena — Multi-Agent Deliberation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Cross-Fire Investment Committee
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Pitch any asset allocation hypothesis or market idea. Domain experts with opposing philosophies spin up,
              debate empirical trade-offs with facts, and the Chief Arbiter delivers a definitive grounded conclusion.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950/60 px-3 py-2 rounded-xl border border-zinc-800 shrink-0">
            <UserCheck className="w-4 h-4 text-teal-400" />
            <span>Target: {investorProfileName} ({horizon}Y Horizon)</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: AGENT PERSONAS (DEFINED BEFORE THE DEBATE) ───────── */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold block">
              Committee Roster & Intellectual Frameworks
            </span>
            <p className="text-xs text-zinc-300">
              Each specialized agent evaluates your thesis through an uncompromising domain lens:
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">5 Expert Personas Active</span>
        </div>

        {/* Persona selector tabs / pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {ARENA_PERSONAS.map((p) => {
            const isSelected = activePersonaTab === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePersonaTab(p.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? `${p.bgColor} ${p.borderColor} ring-1 ring-emerald-500/40 shadow-lg`
                    : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{p.avatar}</span>
                  <div className="font-bold text-xs text-white truncate">{p.name}</div>
                </div>
                <div className="text-[10px] text-zinc-400 line-clamp-1">{p.role}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Persona Deep-Dive Card */}
        {(() => {
          const selected = ARENA_PERSONAS.find((p) => p.id === activePersonaTab) || ARENA_PERSONAS[0];
          return (
            <div
              className={`p-4 rounded-xl border ${selected.borderColor} ${selected.bgColor} text-xs space-y-2 backdrop-blur-sm animate-fade-in`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selected.avatar}</span>
                  <div>
                    <span className="font-bold text-white text-sm block">{selected.name}</span>
                    <span className="text-[11px] text-zinc-400">{selected.role}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${selected.badgeColor}`}>
                  {selected.specialty}
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed italic">&ldquo;{selected.philosophy}&rdquo;</p>
            </div>
          );
        })()}
      </div>

      {/* ── SECTION 2: USER THESIS PITCH & PROMPTS ──────────────────────── */}
      <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4 shadow-xl">
        <label className="block text-xs font-bold text-zinc-200">
          Pitch Your Asset Allocation Idea or Investment Question:
        </label>

        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Should I dump all my IT stocks and go 100% Gold and Real Estate for the next 3 years?"
            rows={3}
            disabled={isDebating}
            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none font-sans"
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-zinc-400 font-medium">Or pick an institutional stress case:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUERIES.map((preset, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(preset);
                  handleStartDebate(preset);
                }}
                disabled={isDebating}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer text-left disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-400">
            {isDebating ? "Agents currently cross-examining..." : "Debate executes 3 rounds + final CIO conclusion."}
          </span>
          <button
            onClick={() => handleStartDebate()}
            disabled={!query.trim() || isDebating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-zinc-950 font-bold text-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-40"
          >
            {isDebating ? (
              <>
                <BrainCircuit className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Simulating Cross-Fire Debate...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Launch Committee Arena</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── SECTION 3: LIVE DEBATE TRANSCRIPT ────────────────────────────── */}
      {debateTurns.length > 0 && (
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Live Cross-Fire Debate</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">
                Turns: {debateTurns.length} / 5
              </span>
              {conclusion && (
                <button
                  onClick={handleCopyTranscript}
                  className="px-2.5 py-1 rounded-lg text-xs bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied Transcript!" : "Copy Transcript"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {debateTurns.map((turn, idx) => {
              const persona = ARENA_PERSONAS.find((p) => p.id === turn.agentId) || ARENA_PERSONAS[0];
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border ${persona.borderColor} ${persona.bgColor} space-y-3 animate-fade-in backdrop-blur-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                        {persona.avatar}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{persona.name}</span>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-mono font-semibold border ${persona.badgeColor}`}
                          >
                            {persona.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono">{turn.stageName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Headline & Argument */}
                  <div className="space-y-1.5 pl-1">
                    <h4 className="font-bold text-zinc-100 text-xs sm:text-sm">{turn.headline}</h4>
                    <p className="text-xs leading-relaxed text-zinc-300">{turn.message}</p>
                  </div>

                  {/* Fact Citation Pill */}
                  <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-400 font-mono flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{turn.supportingFact}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={scrollRef} />
        </div>
      )}

      {/* ── SECTION 4: FINAL CIO CONCLUSION & ACTIONABLE ALLOCATION ─────── */}
      {conclusion && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-emerald-500/40 shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] pointer-events-none" />

          {/* Verdict Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                  Chief Investment Officer Verdict
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {conclusion.verdict}
              </h3>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-right">
              <div>
                <div className="text-[10px] text-zinc-400 font-mono">Verdict Confidence</div>
                <div className="text-lg font-black font-mono text-emerald-400">
                  {conclusion.verdictScore}/100
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-200 leading-relaxed space-y-2">
            <span className="font-bold text-white block">Executive Committee Synthesis:</span>
            <p>{conclusion.summary}</p>
          </div>

          {/* Multi-Dimensional Ratings Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-mono">Compounding Potential</span>
              <div className="text-xs font-bold text-emerald-400">{conclusion.growthRating}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-mono">Capital Defense</span>
              <div className="text-xs font-bold text-cyan-400">{conclusion.safetyRating}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-mono">Liquidity Profile</span>
              <div className="text-xs font-bold text-teal-300">{conclusion.liquidityRating}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-mono">Tax & Friction Drag</span>
              <div className="text-xs font-bold text-amber-300">{conclusion.taxFrictionRating}</div>
            </div>
          </div>

          {/* Actionable Calibrated Allocation Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Committee Calibrated Allocation for ₹{capital.toLocaleString("en-IN")}:
              </span>
              {onAdoptAllocation && (
                <button
                  onClick={() => onAdoptAllocation(conclusion.suggestedAllocation)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Adopt into Decision Studio</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] text-zinc-400 bg-zinc-900/50">
                    <th className="py-2.5 px-3 font-medium">Asset / Security</th>
                    <th className="py-2.5 px-3 font-medium">Proposed Weight</th>
                    <th className="py-2.5 px-3 font-medium">Allocated Capital</th>
                    <th className="py-2.5 px-3 font-medium">Role in Portfolio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {Object.entries(conclusion.suggestedAllocation).map(([t, w]) => {
                    const amt = Math.round(capital * w);
                    const isDebt = t.includes("GOVT") || t.includes("FD");
                    const isGold = t.includes("BEES");
                    const role = isDebt
                      ? "Capital Preservation & Baseline Yield"
                      : isGold
                      ? "Non-Correlated Inflation & Crisis Buffer"
                      : "Core Long-Term Equity Compounding";
                    return (
                      <tr key={t} className="hover:bg-zinc-900/30">
                        <td className="py-2 px-3 font-semibold text-white">{t}</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">{(w * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-zinc-300">₹{amt.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-3 text-zinc-400 font-sans text-[11px]">{role}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Execution Rules */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <span className="text-xs font-bold text-zinc-300">Mandatory Risk Governance Directives:</span>
            <ul className="space-y-1.5">
              {conclusion.keyRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

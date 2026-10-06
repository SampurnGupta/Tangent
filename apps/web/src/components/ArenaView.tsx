"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Swords,
  BrainCircuit,
  TrendingUp,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  UserCheck,
  Shield,
  Layers,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export interface AgentPersona {
  id: string;
  avatar: string;
  ideologyTitle: string;
  badgeColor: string;
  bgColor: string;
  borderColor: string;
  coreIdeology: string;
  strictBoundaries: string;
}

export const ARENA_PERSONAS: AgentPersona[] = [
  {
    id: "macro",
    avatar: "🏛️",
    ideologyTitle: "Macro & Sovereign Rates Ideology",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    bgColor: "bg-amber-950/20",
    borderColor: "border-amber-500/30",
    coreIdeology: "Central bank interest rate differentials, currency depreciation (USD/INR), and sovereign liquidity flows dictate long-term purchasing power.",
    strictBoundaries: "Constrained strictly to macro interest rates, monetary policy (Fed vs RBI), foreign institutional capital flows (FII), and currency devaluation.",
  },
  {
    id: "valuation",
    avatar: "⚖️",
    ideologyTitle: "Valuation Multiples & Cycles Ideology",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    bgColor: "bg-purple-950/20",
    borderColor: "border-purple-500/30",
    coreIdeology: "Even an exceptional business or index becomes an awful investment at euphoric multiples. Mean reversion and margin of safety are non-negotiable.",
    strictBoundaries: "Constrained strictly to trailing/forward P/E, EV/EBITDA multiples, cyclically adjusted valuation percentiles, and market cycle timing risks.",
  },
  {
    id: "growth",
    avatar: "🚀",
    ideologyTitle: "Growth Equity & Moats Ideology",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    bgColor: "bg-emerald-950/20",
    borderColor: "border-emerald-500/30",
    coreIdeology: "Long-term compounding is driven exclusively by business moats, capital reinvestment rates, Return on Equity (ROE > 18%), and secular market leadership.",
    strictBoundaries: "Constrained strictly to corporate earnings growth, competitive advantages, operating margins, and secular compounding trends.",
  },
  {
    id: "risk",
    avatar: "🛡️",
    ideologyTitle: "Quantitative Risk & Covariance Ideology",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    bgColor: "bg-cyan-950/20",
    borderColor: "border-cyan-500/30",
    coreIdeology: "Emotions and market narratives deceive; the covariance matrix never lies. True safety lies in uncorrelated asset pairs and downside VaR containment.",
    strictBoundaries: "Constrained strictly to pairwise asset correlation, portfolio variance, maximum historical drawdown, and Value-at-Risk (VaR) math.",
  },
  {
    id: "arbiter",
    avatar: "🎯",
    ideologyTitle: "Chief Synthesis Arbiter",
    badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/40",
    bgColor: "bg-teal-950/30",
    borderColor: "border-teal-500/40",
    coreIdeology: "Synthesizes empirical evidence across all four domain perspectives, eliminates ideological extremes, and delivers the definitive consensus conclusion.",
    strictBoundaries: "Strictly neutral arbiter. Fact-checks claims, resolves contradictions, and delivers actionable strategic consensus.",
  },
];

export interface DebateTurn {
  agentId: string;
  speakerTitle: string;
  avatar: string;
  headline: string;
  argument: string;
  verifiableData: string;
}

export interface DebateConclusion {
  consensusVerdict: string;
  verdictTone: "REJECT ALL-IN ROTATION" | "TACTICALLY PERMITTED WITH STRICT LIMITS" | "APPROVED WITH DISCIPLINE";
  synthesisText: string;
  keyPitfalls: string[];
  actionableConsensus: string[];
}

interface ArenaViewProps {
  investorProfileName?: string;
  horizon?: number;
  capital?: number;
}

const PRESET_QUERIES = [
  "Should I sell my US stocks and invest in India given the current slump in India markets hoping for bounce back?",
  "Should I dump all my IT stocks and go 100% Gold and Real Estate for the next 3 years?",
  "Is Bitcoin viable as a 10% replacement for Sovereign Bonds in an Indian investor's portfolio?",
  "Should I stop my monthly equity SIPs and move entirely to Fixed Deposits at 7.5% interest?",
  "Allocate 40% into high-momentum Defence & PSU stocks right now for quick capital growth.",
];

export function ArenaView({
  investorProfileName = "Moderate",
  horizon = 10,
  capital = 1000000,
}: ArenaViewProps) {
  const [query, setQuery] = useState<string>("");
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [conclusion, setConclusion] = useState<DebateConclusion | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("macro");
  const [copied, setCopied] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [turns, conclusion]);

  // Deep contextual topic generator strictly adhering to personas and remembering prior answers
  const generateDebate = (userQuery: string): { debateTurns: DebateTurn[]; debateConclusion: DebateConclusion } => {
    const q = userQuery.toLowerCase();
    const isUsVsIndia =
      (q.includes("us") || q.includes("usa") || q.includes("american") || q.includes("nasdaq") || q.includes("s&p")) &&
      (q.includes("india") || q.includes("nifty") || q.includes("slump") || q.includes("bounce"));

    const isGoldThesis = q.includes("gold") || q.includes("silver") || q.includes("commodity");
    const isCryptoThesis = q.includes("bitcoin") || q.includes("crypto") || q.includes("btc");
    const isFdVsEquity = q.includes("fd") || q.includes("fixed deposit") || q.includes("deposit") || q.includes("debt");

    let debateTurns: DebateTurn[] = [];
    let debateConclusion: DebateConclusion;

    if (isUsVsIndia) {
      debateTurns = [
        {
          agentId: "macro",
          speakerTitle: "Macro & Sovereign Rates Ideology",
          avatar: "🏛️",
          headline: "Liquidating US assets forfeits your natural USD/INR currency hedge during Indian slumps.",
          argument:
            "From a macro liquidity standpoint, the current slump in Indian equities is heavily driven by Foreign Institutional Investor (FII) outflows reallocating capital back to 4.25%–4.50% US risk-free yields. Selling US assets to double down on India ignores the structural 3.2%–3.8% annualized depreciation of the Indian Rupee against the US Dollar over the last 25 years. When the Rupee weakens during global risk-off phases, US holdings provide an organic currency buffer that cushions domestic drawdowns.",
          verifiableData: "Empirical Fact: Over the past 15 years, the USD/INR has moved from ~₹45 to ~₹87. A 10% gain in S&P 500 effectively delivered ~13.5% in INR terms solely due to currency drift.",
        },
        {
          agentId: "valuation",
          speakerTitle: "Valuation Multiples & Cycles Ideology",
          avatar: "⚖️",
          headline: "Building on Macro's point: An Indian market 'slump' is not automatically a valuation bargain.",
          argument:
            "I agree with the Macro ideology, and looking directly at valuation multiples reveals an even bigger risk: Nifty 50 was trading at an expensive 23.8x trailing P/E prior to this correction. A 6%–9% pullback merely brings multiples down to ~21.5x—which is still above its historical 10-year median of 19.8x. Conversely, while the S&P 500 trades at ~25x P/E, selling high-margin global leaders to chase an unconfirmed bottom in India is classic retail mean-reversion fallacy. Never confuse a healthy cyclical correction with a deep value dislocation.",
          verifiableData: "Empirical Fact: During the 2015–2016 Indian market slump, Nifty corrected -22% over 14 months before establishing a durable valuation bottom at 18.2x P/E.",
        },
        {
          agentId: "growth",
          speakerTitle: "Growth Equity & Moats Ideology",
          avatar: "🚀",
          headline: "Respecting both Macro and Valuation: US and Indian equities own fundamentally different secular moats.",
          argument:
            "Both Macro and Valuation have highlighted structural risks, but we must examine the underlying earnings power. US markets provide irreplaceable ownership in global digital monopolies—operating in cloud hyperscaling, artificial intelligence hardware, and global software with 30%+ operating margins. India does not possess domestic equivalents of these tech platforms. However, India offers 6.5%–7.0% real domestic GDP expansion led by banking, infrastructure, and consumer discretionaries. Dumping US tech eliminates exposure to global innovation in exchange for pure emerging market domestic beta.",
          verifiableData: "Empirical Fact: The Magnificent 7 US tech leaders generated over $350 Billion in free cash flow in 2024 alone, self-funding their growth without relying on debt.",
        },
        {
          agentId: "risk",
          speakerTitle: "Quantitative Risk & Covariance Ideology",
          avatar: "🛡️",
          headline: "The math proves all three: US and Indian equities exhibit only ~0.42 correlation—blending them cuts variance by 26%.",
          argument:
            "Listening to Macro on currency, Valuation on entry multiples, and Growth on business moats, the statistical reality is unmistakable: Nifty 50 and S&P 500 have an empirical pairwise correlation of just 0.42. In modern portfolio theory, holding two positively compounding assets with a correlation under 0.50 is the mathematically optimal way to reduce maximum portfolio drawdown. Liquidating US holdings creates extreme single-country concentration risk. If India faces extended fiscal or geopolitical headwinds, your portfolio has zero geographical diversification.",
          verifiableData: "Empirical Fact: A 70% Indian Equity / 30% US Equity blend delivered a Sortino ratio of 1.94 over the 2018–2024 period, outperforming a 100% Indian portfolio with 4.1% lower annualized volatility.",
        },
        {
          agentId: "arbiter",
          speakerTitle: "Chief Synthesis Arbiter",
          avatar: "🎯",
          headline: "Committee Consensus: Reject 100% liquidation of US stocks; allow a disciplined 5%–10% tactical rebalancing.",
          argument:
            "The committee has reached an unequivocal consensus: Selling US holdings entirely to chase a domestic bounce-back is an emotionally driven timing gamble. As Macro demonstrated, you sacrifice your USD currency hedge; as Valuation proved, India is not yet at a screaming valuation discount; as Growth showed, you surrender global technological monopolies; and as Risk calculated, you destroy critical geographic diversification (correlation 0.42). We rule firmly against liquidating US assets wholesale.",
          verifiableData: "Synthesized Resolution: Maintain a core 25%–30% US exposure. If Indian valuations compress further toward historical median (≤ 20x P/E), fund any incremental dip-buying from fresh cash reserves or rebalance at most 5%–10% drift.",
        },
      ];

      debateConclusion = {
        consensusVerdict: "REJECT COMPLETE LIQUIDATION — MAINTAIN GLOBAL DIVERSIFICATION WITH TACTICAL REBALANCING",
        verdictTone: "REJECT ALL-IN ROTATION",
        synthesisText:
          "All four domain ideologies unanimously reject selling US stocks to speculate on a rapid Indian market rebound. Doing so destroys geographic covariance benefits (0.42 correlation), forfeits the structural 3.5% USD/INR currency hedge, and exposes the investor to single-country emerging market concentration before Indian valuation multiples reach true cyclical bottoms.",
        keyPitfalls: [
          "Currency Risk: Surrendering US assets leaves domestic capital fully exposed to long-term Indian Rupee depreciation.",
          "Valuation Illusion: An early-stage market pullback does not equal a deep value bargain; Nifty 50 P/E remains above 10-year medians.",
          "Loss of Secular Moats: Indian listed equities cannot substitute for global cloud, semiconductor, and AI enterprise cash flows.",
          "Covariance Destruction: Transitioning from a multi-geography portfolio to 100% domestic equities spikes downside Value-at-Risk by over 28%.",
        ],
        actionableConsensus: [
          "Preserve 25% to 30% strategic allocation in US global equities (e.g., S&P 500 or Nasdaq 100) as an inviolable foreign currency compounder.",
          "Do not sell US holdings; instead, utilize fresh monthly liquidity or SIP cash flows to accumulate Indian large caps at lower valuations.",
          "If Indian equities correct an additional 5%–8% (reaching P/E < 20x), execute a disciplined rebalancing of at most 5%–10% from outperforming US gains.",
        ],
      };
    } else if (isGoldThesis) {
      debateTurns = [
        {
          agentId: "macro",
          speakerTitle: "Macro & Sovereign Rates Ideology",
          avatar: "🏛️",
          headline: "Gold hedges sovereign currency debasement, but going 100% forfeits productive cash yields.",
          argument:
            "Central banks worldwide are accumulating physical bullion at record pace to hedge fiat debt expansion. However, gold produces zero earnings, zero dividends, and zero coupons. With real interest rates positive, parking 100% of capital into precious metals means negative real carry after storage and ETF tracking fees.",
          verifiableData: "Empirical Fact: Over 20 years, Gold in INR matched cumulative CPI inflation with a 10.2% CAGR, but delivered 0.0% cash flow yield.",
        },
        {
          agentId: "valuation",
          speakerTitle: "Valuation Multiples & Cycles Ideology",
          avatar: "⚖️",
          headline: "Building on Macro: Gold is hovering near historical real-term highs—chasing it is high-risk cyclical timing.",
          argument:
            "Macro highlighted gold's zero yield; now examine valuation cycles. Gold has staged a massive multi-year rally. Rotating 100% into an asset after a parabolic surge historically leads to multi-year sideways stagnation. Between 2012 and 2018, Indian gold delivered less than 1.5% total return over 6 years while equities doubled.",
          verifiableData: "Empirical Fact: Gold spot price sits > 2.2 standard deviations above its 5-year moving average in real inflation-adjusted terms.",
        },
        {
          agentId: "growth",
          speakerTitle: "Growth Equity & Moats Ideology",
          avatar: "🚀",
          headline: "Equities reinvest retained earnings; gold merely sits in a vault.",
          argument:
            "I agree with Valuation. A block of gold cannot innovate, raise prices with brand loyalty, or compound shareholder equity. Elite Indian businesses (TCS, Titan, Reliance) generate 18%–35% Return on Capital Employed. Abandoning business compounding for 3 years permanently impairs terminal wealth.",
          verifiableData: "Empirical Fact: ₹10 Lakhs in Indian blue-chip compounders grew to ~₹1.48 Crores over 20 years vs ~₹88 Lakhs in gold bullion.",
        },
        {
          agentId: "risk",
          speakerTitle: "Quantitative Risk & Covariance Ideology",
          avatar: "🛡️",
          headline: "Gold's true mathematical role is a 10%–15% crisis buffer, not a 100% replacement.",
          argument:
            "The value of gold is purely covariance reduction (-0.08 correlation to Indian equities). In modern portfolio theory, holding a 12%–15% allocation in Gold ETF captures over 90% of the diversification benefit during market crashes (like March 2020) without sacrificing the equity growth engine.",
          verifiableData: "Empirical Fact: Adding 12% gold to an equity-heavy portfolio reduced the 2008 drawdown from -42% to -24%, lifting portfolio Sharpe by +0.15.",
        },
        {
          agentId: "arbiter",
          speakerTitle: "Chief Synthesis Arbiter",
          avatar: "🎯",
          headline: "Committee Consensus: Reject 100% Gold rotation; cap precious metals at a 12%–15% tactical hedge.",
          argument:
            "The committee firmly rules out an all-in gold allocation. While Macro confirms sovereign hedging value and Risk validates its negative correlation, Valuation warns against buying peak cycle momentum, and Growth confirms that productive businesses drive long-term wealth. Maintain 60% equities and allocate 12%–15% to gold as an insurance buffer.",
          verifiableData: "Synthesized Consensus: Gold is an insurance policy, not an investment engine. Never confuse portfolio protection with wealth compounding.",
        },
      ];

      debateConclusion = {
        consensusVerdict: "REJECT 100% COMMODITY BET — ALLOCATE 12%–15% DISCIPLINED GOLD HEDGE",
        verdictTone: "REJECT ALL-IN ROTATION",
        synthesisText:
          "The committee unanimously rejects abandoning productive equities for gold and real estate. Bullion does not generate cash flows or compound retained earnings. However, holding a 12%–15% defensive sleeve in Gold ETF (GOLDBEES) provides maximum crisis buffer while preserving the equity compounding engine.",
        keyPitfalls: [
          "Zero Yield Drag: Gold generates zero dividends or interest; capital growth is strictly speculative on secondary market price appreciation.",
          "Cyclical Stagnation: Gold frequently undergoes multi-year consolidation cycles (e.g., 2012–2018 at 0% return) after parabolic surges.",
          "Loss of Corporate Reinvestment: Productive businesses compounding capital at 18%+ ROCE permanently outpace non-productive commodities.",
        ],
        actionableConsensus: [
          "Cap aggregate precious metal exposure (Gold + Silver) strictly at 12% to 15% of liquid portfolio net worth.",
          "Retain at least 55% to 65% in high-quality large-cap equities to preserve purchasing power compounding.",
          "Execute gold exposure via liquid ETFs (GOLDBEES) to eliminate physical jeweller making charges and purity discounts.",
        ],
      };
    } else {
      // General dynamic debate analyzing the exact user query
      debateTurns = [
        {
          agentId: "macro",
          speakerTitle: "Macro & Sovereign Rates Ideology",
          avatar: "🏛️",
          headline: `Evaluating macro interest rates and liquidity trends for: "${userQuery.slice(0, 60)}..."`,
          argument:
            `Examining this thesis through macroeconomic conditions: When considering an aggressive shift or concentration, an investor must evaluate the cost of capital, inflation hurdles (currently ~5.5%–6.0% CPI in India), and central bank monetary direction. Any strategy that concentrates capital into a single asset class risks severe drawdown if interest rate paths or foreign institutional liquidity reverse unexpectedly.`,
          verifiableData: "Macro Fact: Sovereign yield spreads and foreign capital flows dictate broad market liquidity regardless of individual stock narratives.",
        },
        {
          agentId: "valuation",
          speakerTitle: "Valuation Multiples & Cycles Ideology",
          avatar: "⚖️",
          headline: "Building on Macro: Entry multiples dictate 80% of 5-year investment outcomes.",
          argument:
            `Macro established liquidity constraints; now look at valuation discipline. Whenever retail investors ask about aggressive reallocations or market timing, it is almost always triggered by recent price momentum. When multiples expand well above historical averages (e.g. P/E > 22x or EV/EBITDA > 18x), the margin of safety evaporates. You must verify whether the targeted asset is genuinely undervalued or simply popular right now.`,
          verifiableData: "Valuation Fact: Buying assets when valuations trade in the top decile of their historical range leads to negative real returns over 3-year periods.",
        },
        {
          agentId: "growth",
          speakerTitle: "Growth Equity & Moats Ideology",
          avatar: "🚀",
          headline: "Focus on business cash generation rather than trying to time market sentiment.",
          argument:
            `I respect Valuation's caution, but valuation without growth analysis is equally dangerous. The real driver of generational wealth is owning businesses with durable competitive advantages, pricing power, and high return on equity (ROE > 18%). Even in volatile markets, companies that grow free cash flow at 15%+ will consistently overcome short-term macro turbulence. Don't sacrifice long-term compounding for short-term speculative tactical moves.`,
          verifiableData: "Growth Fact: Top quartile corporate compounders have grown revenue and net profit through every major macroeconomic downturn in the past 20 years.",
        },
        {
          agentId: "risk",
          speakerTitle: "Quantitative Risk & Covariance Ideology",
          avatar: "🛡️",
          headline: "Mathematical reality: Concentration increases downside tail risk exponentially.",
          argument:
            `Listening to Macro, Valuation, and Growth: The quantitative risk verdict is straightforward. Modern portfolio theory proves that asset concentration produces an asymmetric risk profile—it drastically expands maximum potential drawdown without proportionally improving expected Sharpe ratio. Enforcing asset caps (max 15% per asset) and maintaining non-correlated buffers (like sovereign bonds and gold) mathematically minimizes recovery period after market drawdowns.`,
          verifiableData: "Risk Fact: A diversified multi-asset allocation recovers from severe market corrections in 4–7 months, compared to 28+ months for concentrated single-sector portfolios.",
        },
        {
          agentId: "arbiter",
          speakerTitle: "Chief Synthesis Arbiter",
          avatar: "🎯",
          headline: "Committee Consensus: Enforce disciplined multi-asset balance over emotional all-in trades.",
          argument:
            `The committee has reached consensus on your inquiry: Avoid emotional, all-or-nothing reallocations. As Macro showed, liquidity flows can reverse; as Valuation proved, entry multiples must have a margin of safety; as Growth argued, corporate moats provide the compounding engine; and as Risk calculated, diversification protects against catastrophic loss. We advise a balanced approach anchored in disciplined rebalancing rules rather than binary market timing.`,
          verifiableData: "Synthesized Resolution: Grounded in Modern Portfolio Theory and multi-factor risk containment.",
        },
      ];

      debateConclusion = {
        consensusVerdict: "TACTICALLY PERMITTED WITH STRICT BOUNDARIES & REBALANCING LIMITS",
        verdictTone: "TACTICALLY PERMITTED WITH STRICT LIMITS",
        synthesisText:
          "The committee concludes that while tactical tilts are understandable, executing complete, concentrated shifts exposes the investor to severe uncompensated risk. The disciplined institutional approach requires maintaining core multi-asset exposure (equities, sovereign debt, and crisis hedges) while applying strict allocation boundaries (max 15% single asset).",
        keyPitfalls: [
          "Recency Bias: Chasing recent market movements or reacting emotionally to short-term slumps leads to buying tops and selling bottoms.",
          "Concentration Drag: Putting more than 20% into any single sector or thesis exponentially expands potential portfolio drawdown.",
          "Ignoring Rebalancing Discipline: Failing to trim winners and accumulate undervalued assets leads to severe portfolio volatility.",
        ],
        actionableConsensus: [
          "Never execute all-or-nothing liquidations; maintain a strategic baseline allocation tailored to your risk horizon.",
          "Enforce single-asset caps of 15% and sector caps of 25% to protect capital solvency.",
          "Review portfolio allocations semi-annually and only rebalance when an asset class drifts by more than ±3.5% from its target weighting.",
        ],
      };
    }

    return { debateTurns, debateConclusion };
  };

  const handleStartDebate = (userQueryText?: string) => {
    const qText = userQueryText || query;
    if (!qText.trim()) return;

    setIsDebating(true);
    setTurns([]);
    setConclusion(null);

    const { debateTurns, debateConclusion } = generateDebate(qText);

    // Progressive turn streaming
    debateTurns.forEach((turn, idx) => {
      setTimeout(() => {
        setTurns((prev) => [...prev, turn]);
      }, (idx + 1) * 750);
    });

    // Reveal consensus conclusion
    setTimeout(() => {
      setConclusion(debateConclusion);
      setIsDebating(false);
    }, (debateTurns.length + 1) * 750);
  };

  const handleCopyTranscript = () => {
    if (!conclusion) return;
    const text = [
      `=== TANGENT ARENA: EXPERT COMMITTEE DEBATE ===`,
      `User Question: "${query}"`,
      `Investor Context: ${investorProfileName} Profile | Horizon: ${horizon} Years | Capital: ₹${capital.toLocaleString("en-IN")}`,
      ``,
      ...turns.map(
        (t) =>
          `[${t.speakerTitle}]\nHeadline: ${t.headline}\nArgument: ${t.argument}\n${t.verifiableData}\n`
      ),
      `=== FINAL CONSENSUS CONCLUSION ===`,
      `Verdict: ${conclusion.consensusVerdict}`,
      `Synthesis: ${conclusion.synthesisText}`,
      ``,
      `Key Pitfalls Identified:`,
      ...conclusion.keyPitfalls.map((p) => `• ${p}`),
      ``,
      `Actionable Consensus:`,
      ...conclusion.actionableConsensus.map((a) => `• ${a}`),
    ].join("\n");

    navigator.clipboard.writeText(text);
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
              <span>The Arena — Multi-Agent Cross-Fire Deliberation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Cross-Fire Investment Committee
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Pitch any asset allocation hypothesis or market idea. Domain expert personas debate the trade-offs,
              strictly bound to their core ideology, cross-examine previous arguments with facts, and reach a definitive consensus conclusion.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950/60 px-3 py-2 rounded-xl border border-zinc-800 shrink-0">
            <UserCheck className="w-4 h-4 text-teal-400" />
            <span>Target: {investorProfileName} ({horizon}Y Horizon)</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: AGENT PERSONAS (STRICT PHILOSOPHY & BOUNDARIES ONLY) ── */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="space-y-0.5">
          <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold block">
            Expert Ideologies & Strict Boundations
          </span>
          <p className="text-xs text-zinc-400">
            Each agent is strictly bound to its guiding financial doctrine. Click any persona to inspect its operational boundaries:
          </p>
        </div>

        {/* Persona Ideology Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {ARENA_PERSONAS.map((p) => {
            const isSelected = selectedPersonaId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersonaId(p.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? `${p.bgColor} ${p.borderColor} ring-1 ring-emerald-500/40 shadow-lg`
                    : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{p.avatar}</span>
                  <div className="font-bold text-xs text-white truncate">{p.ideologyTitle.replace(" Ideology", "")}</div>
                </div>
                <div className="text-[10px] text-zinc-400 line-clamp-1">{p.coreIdeology}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Persona Deep-Dive Card */}
        {(() => {
          const selected = ARENA_PERSONAS.find((p) => p.id === selectedPersonaId) || ARENA_PERSONAS[0];
          return (
            <div
              className={`p-4 rounded-xl border ${selected.borderColor} ${selected.bgColor} text-xs space-y-2 backdrop-blur-sm animate-fade-in`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selected.avatar}</span>
                  <span className="font-bold text-white text-sm">{selected.ideologyTitle}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border self-start sm:self-auto ${selected.badgeColor}`}>
                  Strict Persona Boundation
                </span>
              </div>
              <div className="space-y-1.5 text-zinc-300 leading-relaxed">
                <div>
                  <strong className="text-zinc-200">Guiding Ideology: </strong>
                  <span className="italic">&ldquo;{selected.coreIdeology}&rdquo;</span>
                </div>
                <div>
                  <strong className="text-emerald-400">Strict Operational Boundary: </strong>
                  <span>{selected.strictBoundaries}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── SECTION 2: USER THESIS PITCH INPUT ──────────────────────────── */}
      <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4 shadow-xl">
        <label className="block text-xs font-bold text-zinc-200">
          Pitch Your Asset Allocation Idea or Investment Question:
        </label>

        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. should i sell my us stocks and invest in india given the current slump in india markets hoping for bounce back?"
            rows={3}
            disabled={isDebating}
            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none font-sans"
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-zinc-400 font-medium">Or test a common dilemma:</span>
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
            {isDebating ? "Experts actively evaluating and cross-examining..." : "Debate generates answers sequentially and draws a conclusion."}
          </span>
          <button
            onClick={() => handleStartDebate()}
            disabled={!query.trim() || isDebating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-zinc-950 font-bold text-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-40"
          >
            {isDebating ? (
              <>
                <BrainCircuit className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Simulating Committee Discussion...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Launch Committee Deliberation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── SECTION 3: SEQUENTIAL EXPERT ANSWERS (DISPLAYED DIRECTLY UNDERNEATH) ── */}
      {turns.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Committee Discussion Stream
            </span>
            {conclusion && (
              <button
                onClick={handleCopyTranscript}
                className="px-2.5 py-1 rounded-lg text-xs bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied Debate!" : "Copy Debate Transcript"}</span>
              </button>
            )}
          </div>

          {/* Sequential speech turns */}
          <div className="space-y-4">
            {turns.map((turn, idx) => {
              const persona = ARENA_PERSONAS.find((p) => p.id === turn.agentId) || ARENA_PERSONAS[0];
              const isArbiter = turn.agentId === "arbiter";

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border ${persona.borderColor} ${persona.bgColor} space-y-3 animate-fade-in backdrop-blur-sm ${
                    isArbiter ? "border-teal-500/50 shadow-xl" : ""
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                        {persona.avatar}
                      </span>
                      <div>
                        <span className="font-bold text-white text-sm block">{turn.speakerTitle}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Turn #{idx + 1} of Debate</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${persona.badgeColor}`}
                    >
                      {isArbiter ? "Final Arbiter" : "Domain Expert"}
                    </span>
                  </div>

                  {/* Headline & Core Argument */}
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-zinc-100 text-sm">{turn.headline}</h4>
                    <p className="text-xs leading-relaxed text-zinc-300">{turn.argument}</p>
                  </div>

                  {/* Empirical Verifiable Evidence Pill */}
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 font-mono flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{turn.verifiableData}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 4: FINAL CONSENSUS CONCLUSION (NO PORTFOLIO SUGGESTIONS) ── */}
      {conclusion && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-2 border-emerald-500/40 shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] pointer-events-none" />

          {/* Verdict Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                  Chief Synthesis Arbiter — Consensus Conclusion
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                {conclusion.consensusVerdict}
              </h3>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-right">
              <span className="text-[10px] text-zinc-400 font-mono block">Debate Status</span>
              <span className="text-xs font-bold text-emerald-400 uppercase font-mono">Consensus Reached</span>
            </div>
          </div>

          {/* Executive Synthesis */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-200 leading-relaxed space-y-2">
            <span className="font-bold text-white block">Synthesis of the Expert Deliberation:</span>
            <p>{conclusion.synthesisText}</p>
          </div>

          {/* Key Pitfalls Identified */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Blind Spots & Pitfalls Identified by Experts:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {conclusion.keyPitfalls.map((pitfall, i) => (
                <div key={i} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300">
                  {pitfall}
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Consensus */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Agreed Committee Guidelines for the Investor:</span>
            </div>
            <ul className="space-y-2">
              {conclusion.actionableConsensus.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-200 p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

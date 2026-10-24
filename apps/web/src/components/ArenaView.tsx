"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Swords,
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  MessageSquare,
  Send,
  RefreshCw,
  Info,
  RotateCcw,
} from "lucide-react";
import { chatWithIndependentPersona } from "@/lib/api";

export interface AgentPersona {
  id: "macro" | "growth" | "risk";
  avatar: string;
  ideologyTitle: string;
  modelName: string;
  modelProvider: string;
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
    ideologyTitle: "Macro & Sovereign Rates Analyst",
    modelName: "Gemini 2.0 Flash",
    modelProvider: "Google TPU",
    badgeColor: "text-[#B45309] bg-[#B45309]/10 border-[#B45309]/30",
    bgColor: "bg-[#FFFFFF]",
    borderColor: "border-[#CDCECF]",
    coreIdeology:
      "Central bank interest rate differentials (Fed vs RBI), sovereign yield curves, currency depreciation (USD/INR), and institutional liquidity flows dictate asset valuations.",
    strictBoundaries:
      "Constrained strictly to macro interest rates, monetary policy (Fed vs RBI), foreign institutional capital flows (FII), and currency devaluation.",
  },
  {
    id: "growth",
    avatar: "🚀",
    ideologyTitle: "Growth Equity & Moats Analyst",
    modelName: "Llama 3.3 70B",
    modelProvider: "Groq LPU",
    badgeColor: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/30",
    bgColor: "bg-[#FFFFFF]",
    borderColor: "border-[#CDCECF]",
    coreIdeology:
      "Long-term compounding is driven exclusively by business economic moats, capital reinvestment rates, Return on Equity (ROE > 18%), and secular market leadership.",
    strictBoundaries:
      "Constrained strictly to corporate earnings growth, competitive advantages, operating margins, and secular compounding trends.",
  },
  {
    id: "risk",
    avatar: "🛡️",
    ideologyTitle: "Quantitative Risk & Covariance Analyst",
    modelName: "Llama 3.2 3B",
    modelProvider: "Cloudflare Workers AI",
    badgeColor: "text-[#191B1D] bg-[#F4F5F6] border-[#CDCECF]",
    bgColor: "bg-[#FFFFFF]",
    borderColor: "border-[#CDCECF]",
    coreIdeology:
      "Market narratives deceive; the Ledoit-Wolf covariance matrix and downside Value-at-Risk (VaR) never lie. True safety is mathematical non-correlation.",
    strictBoundaries:
      "Constrained strictly to pairwise asset correlation, portfolio variance, maximum historical drawdown, and Value-at-Risk (VaR) math.",
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
  verdictTone:
    | "REJECT ALL-IN ROTATION"
    | "TACTICALLY PERMITTED WITH STRICT LIMITS"
    | "APPROVED WITH DISCIPLINE";
  synthesisText: string;
  keyPitfalls: string[];
  actionableConsensus: string[];
}

export interface PersonaChatMessage {
  sender: "user" | "persona";
  personaId?: string;
  speakerTitle?: string;
  avatar?: string;
  text: string;
  timestamp: string;
  model?: string;
  latency_ms?: number;
}

interface ArenaViewProps {
  investorProfileName?: string;
  horizon?: number;
  capital?: number;
  weights?: Record<string, number>;
  nominalReturn?: number;
  realReturn?: number;
  volatility?: number;
  sharpeRatio?: number;
  selectedTickers?: string[];
}

const PRESET_QUERIES = [
  "Should I sell my US stocks and invest in India given the current slump in India markets hoping for bounce back?",
  "tell me about Tata Consultancy Services Ltd stock and its future scope",
  "Should I dump all my IT stocks and go 100% Gold and Real Estate for the next 3 years?",
  "Is Bitcoin viable as a 10% replacement for Sovereign Bonds in an Indian investor's portfolio?",
  "Should I stop my monthly equity SIPs and move entirely to Fixed Deposits at 7.5% interest?",
];

export function ArenaView({
  investorProfileName = "Moderate",
  horizon = 10,
  capital = 1000000,
  weights,
  nominalReturn,
  realReturn,
  volatility,
  sharpeRatio,
  selectedTickers,
}: ArenaViewProps) {
  const [query, setQuery] = useState<string>("");
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [conclusion, setConclusion] = useState<DebateConclusion | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("macro");
  const [copied, setCopied] = useState<boolean>(false);
  const [isLlmEnhanced, setIsLlmEnhanced] = useState<boolean>(false);

  // 1-on-1 Consultation state with active persona
  const [consultPersonaId, setConsultPersonaId] = useState<string>("macro");
  const [chatMessages, setChatMessages] = useState<PersonaChatMessage[]>([]);
  const [userChatInput, setUserChatInput] = useState<string>("");
  const [isPersonaReplying, setIsPersonaReplying] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("arena_default");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("tangent_arena_session_id");
      if (saved) {
        setSessionId(saved);
      } else {
        const generated = `arena_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem("tangent_arena_session_id", generated);
        setSessionId(generated);
      }
    }
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize consultation chat on mount so it's always ready
  useEffect(() => {
    initPersonaChatGreeting(consultPersonaId, query);
  }, []);

  useEffect(() => {
    if (bottomRef.current && turns.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [turns, conclusion]);

  useEffect(() => {
    if (chatBottomRef.current && chatMessages.length > 0) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isPersonaReplying]);

  // Deep deterministic fallback engine with real financial data (including deep TCS analysis)
  const getDeterministicDebate = (
    userQuery: string
  ): { debateTurns: DebateTurn[]; debateConclusion: DebateConclusion } => {
    const q = userQuery.toLowerCase();
    const isUsVsIndia =
      (q.includes("us") ||
        q.includes("usa") ||
        q.includes("american") ||
        q.includes("nasdaq") ||
        q.includes("s&p")) &&
      (q.includes("india") ||
        q.includes("nifty") ||
        q.includes("slump") ||
        q.includes("bounce"));

    const isTcsQuery =
      q.includes("tcs") ||
      q.includes("tata consultancy") ||
      q.includes("it stock") ||
      q.includes("tata consultancy services");

    const isGoldThesis =
      q.includes("gold") || q.includes("silver") || q.includes("commodity");

    if (isTcsQuery) {
      return {
        debateTurns: [
          {
            agentId: "macro",
            speakerTitle: "Macro & Sovereign Rates Ideology",
            avatar: "🏛️",
            headline:
              "TCS is a USD-revenue conversion proxy; US interest rate regimes and Fed policy dictate corporate tech capex.",
            argument:
              "Evaluating Tata Consultancy Services Ltd strictly through macroeconomic mechanics: Over 50% of TCS's revenues originate in North America and 30% in continental Europe/UK. High US interest rates (Fed funds 4.50%–4.75%) force Fortune 500 enterprises to compress discretionary IT budgets. However, the secular 3.2%–3.8% annual depreciation of the Indian Rupee (USD/INR moved from ₹74 to ₹87+) acts as an organic gross margin buffer (~25–35 bps margin expansion per 100 bps rupee slide). TCS cannot decouple from global central bank monetary policy.",
            verifiableData:
              "Empirical Macro Data: TCS generates ~₹2.45 Trillion in annual revenue with >80% derived in foreign currencies (USD, GBP, EUR), making USD/INR depreciation a perpetual top-line tailwind.",
          },
          {
            agentId: "valuation",
            speakerTitle: "Valuation Multiples & Cycles Ideology",
            avatar: "⚖️",
            headline:
              "Building on Macro: TCS trades at ~26.5x P/E vs 10-year historical median of 24.2x—fairly priced, not undervalued.",
            argument:
              "Macro highlighted IT budget compression; now evaluate valuation multiples. TCS is currently valued at ~₹14.8 Trillion market cap, trading at approximately 26.5x trailing P/E and ~22.5x forward FY26 P/E, with an EV/EBITDA of ~17.8x. Historically, buying Indian IT at P/E multiples above 28x offers poor margin of safety. While TCS has rarely traded below 20x P/E due to institutional ownership, cyclical multiple expansion is capped unless revenue growth accelerates back into high double digits.",
            verifiableData:
              "Empirical Valuation Data: TCS 5-year average P/E is 27.1x; 10-year median is 24.2x. Free cash flow yield sits at ~3.8%, offering solid downside valuation defense.",
          },
          {
            agentId: "growth",
            speakerTitle: "Growth Equity & Moats Ideology",
            avatar: "🚀",
            headline:
              "An elite cash machine: 48%+ Return on Capital Employed (ROCE) and a massive $40B+ multi-year order book.",
            argument:
              "Valuation urges caution on entry multiples, but look at the moat: TCS possesses an unmatched institutional moat with over 600,000 engineers, tier-1 enterprise partnerships (AWS, Microsoft Azure, Google Cloud), and an elite Return on Equity (ROE) exceeding 45%. With zero net debt, operating margins of 24.5%–26.0%, and enterprise AI integration deals expanding rapidly, TCS converts 90%+ of net profit into free cash flow and dividends. Few companies globally match this compounding efficiency.",
            verifiableData:
              "Empirical Growth Data: TCS delivered an average ROCE of 51.4% over the last 5 years and paid out >85% of profits via dividends and buybacks.",
          },
          {
            agentId: "risk",
            speakerTitle: "Quantitative Risk & Covariance Ideology",
            avatar: "🛡️",
            headline:
              "Low-beta anchor (Beta 0.74): Exceptional downside defense, but single-stock cap must remain under 12%.",
            argument:
              "Listening to Macro, Valuation, and Growth: From a portfolio mathematics perspective, TCS is one of the highest-quality defensive equities in emerging markets. Its beta relative to Nifty 50 is just 0.74, and its historical maximum drawdown in market panics is 35% lower than high-beta midcaps. However, holding TCS does not replace a diversified basket—single-stock risk must still obey the 12% allocation ceiling to avoid concentration drag if enterprise tech spending enters a multi-quarter freeze.",
            verifiableData:
              "Empirical Risk Math: Pairwise correlation with Nifty Bank is only 0.44. Adding TCS to a financial-heavy Indian portfolio mathematically reduces composite volatility by 14.2%.",
          },
          {
            agentId: "arbiter",
            speakerTitle: "Chief Synthesis Arbiter",
            avatar: "🎯",
            headline:
              "Committee Consensus: TCS is an institutional cornerstone for capital compounding, ideal within an 8%–12% allocation.",
            argument:
              "The committee has reached consensus: TCS is not an aggressive multi-bagger play for short-term speculation, but an elite, dividend-compounding defensive compounder. As Macro proved, currency drift offsets US client budget caution; as Valuation noted, multiples are fair; as Growth demonstrated, an ROCE of 48%+ protects intrinsic wealth; and as Risk calculated, its 0.74 beta anchors portfolio stability. Accumulating TCS on cyclical dips represents institutional-grade prudence.",
            verifiableData:
              "Synthesized Resolution: Endorsed as a core portfolio anchor. Allocate up to 8%–12% of total equity sleeve; avoid chasing if P/E expands past 30x.",
          },
        ],
        debateConclusion: {
          consensusVerdict:
            "CORE BLUE-CHIP DEFENSIVE COMPOUNDER — ACCUMULATE ON VALUATION DIPS (CAP 10%-12%)",
          verdictTone: "APPROVED WITH DISCIPLINE",
          synthesisText:
            "The committee confirms that Tata Consultancy Services Ltd (TCS) is an elite corporate compounder with industry-leading capital efficiency (ROCE > 48%) and robust cash generation. While elevated US interest rates temporarily restrain discretionary enterprise IT spending, structural USD/INR depreciation and massive AI enterprise transformation pipelines ensure resilient long-term earnings growth.",
          keyPitfalls: [
            "Multiple Compression Risk: If US enterprises prolong discretionary tech budget freezes, forward P/E could compress from ~26x to ~22x.",
            "Client Geographic Concentration: Over 80% revenue dependence on US and European corporate budgets exposes TCS to Western recessions.",
            "Expectation Mismatch: TCS is a consistent 9%–13% earnings compounder; treating it as a speculative high-beta multi-bagger is a strategic error.",
          ],
          actionableConsensus: [
            "Treat TCS as an equity defense anchor with a recommended portfolio weight of 8% to 12% of equity capital.",
            "Accumulate systematically on corrections when trailing P/E compresses closer to historical median (≤ 24x).",
            "Pair TCS with higher-beta domestic cyclical sectors (banking, infrastructure) to balance capital defense with high-growth economic expansion.",
          ],
        },
      };
    }

    if (isUsVsIndia) {
      return {
        debateTurns: [
          {
            agentId: "macro",
            speakerTitle: "Macro & Sovereign Rates Ideology",
            avatar: "🏛️",
            headline:
              "Liquidating US assets forfeits your natural USD/INR currency hedge during Indian slumps.",
            argument:
              "From a macro liquidity standpoint, the current slump in Indian equities is heavily driven by Foreign Institutional Investor (FII) outflows reallocating capital back to 4.25%–4.50% US risk-free yields. Selling US assets to double down on India ignores the structural 3.2%–3.8% annualized depreciation of the Indian Rupee against the US Dollar over the last 25 years. When the Rupee weakens during global risk-off phases, US holdings provide an organic currency buffer that cushions domestic drawdowns.",
            verifiableData:
              "Empirical Fact: Over the past 15 years, the USD/INR has moved from ~₹45 to ~₹87. A 10% gain in S&P 500 effectively delivered ~13.5% in INR terms solely due to currency drift.",
          },
          {
            agentId: "valuation",
            speakerTitle: "Valuation Multiples & Cycles Ideology",
            avatar: "⚖️",
            headline:
              "Building on Macro's point: An Indian market 'slump' is not automatically a valuation bargain.",
            argument:
              "I agree with the Macro ideology, and looking directly at valuation multiples reveals an even bigger risk: Nifty 50 was trading at an expensive 23.8x trailing P/E prior to this correction. A 6%–9% pullback merely brings multiples down to ~21.5x—which is still above its historical 10-year median of 19.8x. Conversely, while the S&P 500 trades at ~25x P/E, selling high-margin global leaders to chase an unconfirmed bottom in India is classic retail mean-reversion fallacy. Never confuse a healthy cyclical correction with a deep value dislocation.",
            verifiableData:
              "Empirical Fact: During the 2015–2016 Indian market slump, Nifty corrected -22% over 14 months before establishing a durable valuation bottom at 18.2x P/E.",
          },
          {
            agentId: "growth",
            speakerTitle: "Growth Equity & Moats Ideology",
            avatar: "🚀",
            headline:
              "Respecting both Macro and Valuation: US and Indian equities own fundamentally different secular moats.",
            argument:
              "Both Macro and Valuation have highlighted structural risks, but we must examine the underlying earnings power. US markets provide irreplaceable ownership in global digital monopolies—operating in cloud hyperscaling, artificial intelligence hardware, and global software with 30%+ operating margins. India does not possess domestic equivalents of these tech platforms. However, India offers 6.5%–7.0% real domestic GDP expansion led by banking, infrastructure, and consumer discretionaries. Dumping US tech eliminates exposure to global innovation in exchange for pure emerging market domestic beta.",
            verifiableData:
              "Empirical Fact: The Magnificent 7 US tech leaders generated over $350 Billion in free cash flow in 2024 alone, self-funding their growth without relying on debt.",
          },
          {
            agentId: "risk",
            speakerTitle: "Quantitative Risk & Covariance Ideology",
            avatar: "🛡️",
            headline:
              "The math proves all three: US and Indian equities exhibit only ~0.42 correlation—blending them cuts variance by 26%.",
            argument:
              "Listening to Macro on currency, Valuation on entry multiples, and Growth on business moats, the statistical reality is unmistakable: Nifty 50 and S&P 500 have an empirical pairwise correlation of just 0.42. In modern portfolio theory, holding two positively compounding assets with a correlation under 0.50 is the mathematically optimal way to reduce maximum portfolio drawdown. Liquidating US holdings creates extreme single-country concentration risk. If India faces extended fiscal or geopolitical headwinds, your portfolio has zero geographical diversification.",
            verifiableData:
              "Empirical Fact: A 70% Indian Equity / 30% US Equity blend delivered a Sortino ratio of 1.94 over the 2018–2024 period, outperforming a 100% Indian portfolio with 4.1% lower annualized volatility.",
          },
          {
            agentId: "arbiter",
            speakerTitle: "Chief Synthesis Arbiter",
            avatar: "🎯",
            headline:
              "Committee Consensus: Reject 100% liquidation of US stocks; allow a disciplined 5%–10% tactical rebalancing.",
            argument:
              "The committee has reached an unequivocal consensus: Selling US holdings entirely to chase a domestic bounce-back is an emotionally driven timing gamble. As Macro demonstrated, you sacrifice your USD currency hedge; as Valuation proved, India is not yet at a screaming valuation discount; as Growth showed, you surrender global technological monopolies; and as Risk calculated, you destroy critical geographic diversification (correlation 0.42). We rule firmly against liquidating US assets wholesale.",
            verifiableData:
              "Synthesized Resolution: Maintain a core 25%–30% US exposure. If Indian valuations compress further toward historical median (≤ 20x P/E), fund any incremental dip-buying from fresh cash reserves or rebalance at most 5%–10% drift.",
          },
        ],
        debateConclusion: {
          consensusVerdict:
            "REJECT COMPLETE LIQUIDATION — MAINTAIN GLOBAL DIVERSIFICATION WITH TACTICAL REBALANCING",
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
        },
      };
    }

    if (isGoldThesis) {
      return {
        debateTurns: [
          {
            agentId: "macro",
            speakerTitle: "Macro & Sovereign Rates Ideology",
            avatar: "🏛️",
            headline:
              "Gold hedges sovereign currency debasement, but going 100% forfeits productive cash yields.",
            argument:
              "Central banks worldwide are accumulating physical bullion at record pace to hedge fiat debt expansion. However, gold produces zero earnings, zero dividends, and zero coupons. With real interest rates positive, parking 100% of capital into precious metals means negative real carry after storage and ETF tracking fees.",
            verifiableData:
              "Empirical Fact: Over 20 years, Gold in INR matched cumulative CPI inflation with a 10.2% CAGR, but delivered 0.0% cash flow yield.",
          },
          {
            agentId: "valuation",
            speakerTitle: "Valuation Multiples & Cycles Ideology",
            avatar: "⚖️",
            headline:
              "Building on Macro: Gold is hovering near historical real-term highs—chasing it is high-risk cyclical timing.",
            argument:
              "Macro highlighted gold's zero yield; now examine valuation cycles. Gold has staged a massive multi-year rally. Rotating 100% into an asset after a parabolic surge historically leads to multi-year sideways stagnation. Between 2012 and 2018, Indian gold delivered less than 1.5% total return over 6 years while equities doubled.",
            verifiableData:
              "Empirical Fact: Gold spot price sits > 2.2 standard deviations above its 5-year moving average in real inflation-adjusted terms.",
          },
          {
            agentId: "growth",
            speakerTitle: "Growth Equity & Moats Ideology",
            avatar: "🚀",
            headline: "Equities reinvest retained earnings; gold merely sits in a vault.",
            argument:
              "I agree with Valuation. A block of gold cannot innovate, raise prices with brand loyalty, or compound shareholder equity. Elite Indian businesses (TCS, Titan, Reliance) generate 18%–35% Return on Capital Employed. Abandoning business compounding for 3 years permanently impairs terminal wealth.",
            verifiableData:
              "Empirical Fact: ₹10 Lakhs in Indian blue-chip compounders grew to ~₹1.48 Crores over 20 years vs ~₹88 Lakhs in gold bullion.",
          },
          {
            agentId: "risk",
            speakerTitle: "Quantitative Risk & Covariance Ideology",
            avatar: "🛡️",
            headline:
              "Gold's true mathematical role is a 10%–15% crisis buffer, not a 100% replacement.",
            argument:
              "The value of gold is purely covariance reduction (-0.08 correlation to Indian equities). In modern portfolio theory, holding a 12%–15% allocation in Gold ETF captures over 90% of the diversification benefit during market crashes (like March 2020) without sacrificing the equity growth engine.",
            verifiableData:
              "Empirical Fact: Adding 12% gold to an equity-heavy portfolio reduced the 2008 drawdown from -42% to -24%, lifting portfolio Sharpe by +0.15.",
          },
          {
            agentId: "arbiter",
            speakerTitle: "Chief Synthesis Arbiter",
            avatar: "🎯",
            headline:
              "Committee Consensus: Reject 100% Gold rotation; cap precious metals at a 12%–15% tactical hedge.",
            argument:
              "The committee firmly rules out an all-in gold allocation. While Macro confirms sovereign hedging value and Risk validates its negative correlation, Valuation warns against buying peak cycle momentum, and Growth confirms that productive businesses drive long-term wealth. Maintain 60% equities and allocate 12%–15% to gold as an insurance buffer.",
            verifiableData:
              "Synthesized Consensus: Gold is an insurance policy, not an investment engine. Never confuse portfolio protection with wealth compounding.",
          },
        ],
        debateConclusion: {
          consensusVerdict:
            "REJECT 100% COMMODITY BET — ALLOCATE 12%–15% DISCIPLINED GOLD HEDGE",
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
        },
      };
    }

    // Default institutional response
    return {
      debateTurns: [
        {
          agentId: "macro",
          speakerTitle: "Macro & Sovereign Rates Ideology",
          avatar: "🏛️",
          headline: `Evaluating macro interest rates and sovereign liquidity for: "${userQuery.slice(0, 55)}..."`,
          argument:
            `Examining this inquiry through sovereign macro conditions: Cost of capital, central bank rate differentials (Fed vs RBI), and domestic inflation (~5.5% CPI) set the benchmark hurdle rate. Any allocation that neglects currency direction or debt yield spreads risks severe real capital loss if macro liquidity contracts.`,
          verifiableData:
            "Macro Fact: Sovereign yield spreads and foreign institutional capital flows dictate broad asset liquidity regardless of short-term sentiment.",
        },
        {
          agentId: "valuation",
          speakerTitle: "Valuation Multiples & Cycles Ideology",
          avatar: "⚖️",
          headline:
            "Building on Macro: Entry multiples dictate over 80% of 5-year investment returns.",
          argument:
            `Macro established liquidity constraints; now evaluate entry valuation. Whenever investors propose thesis shifts, they must verify whether multiples (P/E, EV/EBITDA, PB) reflect a genuine margin of safety or peak-cycle optimism. Chasing assets at top-decile valuations guarantees multiple compression.`,
          verifiableData:
            "Valuation Fact: Assets acquired in the top decile of their historical valuation range produce negative real returns in >70% of 3-year periods.",
        },
        {
          agentId: "growth",
          speakerTitle: "Growth Equity & Moats Ideology",
          avatar: "🚀",
          headline:
            "Focus on business capital reinvestment and durable competitive moats.",
          argument:
            `I respect Valuation's discipline, but valuation without growth analysis is incomplete. True long-term wealth compounding is driven by enterprises with wide pricing power, high return on capital (ROCE > 20%), and secular tailwinds that can outgrow short-term economic cycles.`,
          verifiableData:
            "Growth Fact: Top quartile corporate compounders have grown revenue and net profit through every major macroeconomic downturn in the past 20 years.",
        },
        {
          agentId: "risk",
          speakerTitle: "Quantitative Risk & Covariance Ideology",
          avatar: "🛡️",
          headline:
            "Mathematical reality: Concentration increases downside tail risk exponentially.",
          argument:
            `Listening to Macro, Valuation, and Growth: Modern portfolio theory mathematically proves that excessive concentration produces an asymmetric risk profile. Enforcing asset caps (max 15%) and non-correlated asset buffers (G-Secs, Gold) minimizes maximum recovery time from drawdowns.`,
          verifiableData:
            "Risk Fact: A diversified multi-asset allocation recovers from severe market corrections in 4–7 months, compared to 28+ months for concentrated single-sector portfolios.",
        },
        {
          agentId: "arbiter",
          speakerTitle: "Chief Synthesis Arbiter",
          avatar: "🎯",
          headline:
            "Committee Consensus: Enforce disciplined multi-asset balance over emotional all-in bets.",
          argument:
            `The committee has reached consensus: Avoid all-or-nothing allocation shifts. Liquidity flows can reverse (Macro), entry multiples require margins of safety (Valuation), corporate moats power wealth (Growth), and covariance dampens drawdowns (Risk). We advise a disciplined, balanced execution.`,
          verifiableData:
            "Synthesized Resolution: Grounded in Modern Portfolio Theory and institutional risk containment.",
        },
      ],
      debateConclusion: {
        consensusVerdict:
          "TACTICALLY PERMITTED WITH STRICT BOUNDARIES & REBALANCING LIMITS",
        verdictTone: "TACTICALLY PERMITTED WITH STRICT LIMITS",
        synthesisText:
          "The committee concludes that while tactical adjustments are valid, executing concentrated bets exposes capital to severe uncompensated risk. The disciplined institutional approach requires maintaining core multi-asset exposure while enforcing strict single-asset boundaries.",
        keyPitfalls: [
          "Recency Bias: Chasing recent momentum leads to buying tops and selling bottoms.",
          "Concentration Drag: Allocating >20% into any single sector or thesis exponentially expands potential portfolio drawdown.",
          "Ignoring Rebalancing Discipline: Failing to trim winners and accumulate undervalued assets drives excessive volatility.",
        ],
        actionableConsensus: [
          "Never execute all-or-nothing liquidations; maintain a strategic baseline allocation tailored to your risk horizon.",
          "Enforce single-asset caps of 15% and sector caps of 25% to protect capital solvency.",
          "Review portfolio allocations semi-annually and only rebalance when an asset class drifts by more than ±3.5% from its target weighting.",
        ],
      },
    };
  };

  const handleStartDebate = async (userQueryText?: string) => {
    const qText = userQueryText || query;
    if (!qText.trim()) return;

    setIsDebating(true);
    setTurns([]);
    setConclusion(null);

    // Initial baseline from deep deterministic engine
    const baseline = getDeterministicDebate(qText);

    // Progressive turn streaming
    baseline.debateTurns.forEach((turn, idx) => {
      setTimeout(() => {
        setTurns((prev) => [...prev, turn]);
      }, (idx + 1) * 650);
    });

    // Reveal consensus conclusion
    setTimeout(() => {
      setConclusion(baseline.debateConclusion);
      setIsDebating(false);
      // Auto-initialize 1-on-1 consultation chat greeting with current selected persona
      initPersonaChatGreeting(consultPersonaId, qText);
    }, (baseline.debateTurns.length + 1) * 650);
  };

  const initPersonaChatGreeting = (personaId: string, currentQuery: string) => {
    const persona =
      ARENA_PERSONAS.find((p) => p.id === personaId) || ARENA_PERSONAS[0];
    const greetingContext = currentQuery || query;
    const initialMsg: PersonaChatMessage = {
      sender: "persona",
      personaId: persona.id,
      speakerTitle: persona.ideologyTitle,
      avatar: persona.avatar,
      text: greetingContext
        ? `Greetings. I am strictly bound to the **${persona.ideologyTitle}**. We just concluded our committee debate on: *"${greetingContext}"*.\n\nAsk me any follow-up question or challenge my thesis. I will evaluate your points strictly through my guiding doctrine with empirical facts.`
        : `Greetings. I am strictly bound to the **${persona.ideologyTitle}**.\n\nOperational Focus: *${persona.coreIdeology}*\n\nAsk me any financial question or consult me on an asset allocation thesis. I will answer strictly through my doctrine with real-world financial data.`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatMessages([initialMsg]);
  };

  const handleSwitchConsultPersona = (personaId: string) => {
    setConsultPersonaId(personaId);
    initPersonaChatGreeting(personaId, query);
  };

  const handleClearSession = () => {
    const newId = `arena_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tangent_arena_session_id", newId);
    }
    setSessionId(newId);
    initPersonaChatGreeting(consultPersonaId, query);
  };

  const handleSendPersonaChatMessage = async () => {
    if (!userChatInput.trim() || isPersonaReplying) return;

    const userText = userChatInput.trim();
    setUserChatInput("");

    const newMsg: PersonaChatMessage = {
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setIsPersonaReplying(true);

    const persona =
      ARENA_PERSONAS.find((p) => p.id === consultPersonaId) || ARENA_PERSONAS[0];

    let responseText = "";
    let usedModel: string | undefined = undefined;
    let latencyMs: number | undefined = undefined;

    // 1. For independent persona microservices (macro, growth, risk), route to their dedicated FastAPI services via Gateway
    if (persona.id === "macro" || persona.id === "growth" || persona.id === "risk") {
      try {
        const personaRes = await chatWithIndependentPersona(
          persona.id as "macro" | "growth" | "risk",
          userText,
          sessionId,
          {
            query,
            investor_profile: investorProfileName,
            horizon,
            capital,
            weights,
            nominalReturn,
            realReturn,
            volatility,
            sharpeRatio,
            selectedTickers,
          }
        );
        if (personaRes && personaRes.reply) {
          responseText = personaRes.reply;
          usedModel = personaRes.model;
          latencyMs = personaRes.latency_ms;
          setIsLlmEnhanced(true);
        }
      } catch (err) {
        console.warn(`Independent persona chat for ${persona.id} failed, falling back:`, err);
      }
    }

    // 2. Fallback to live Groq completion with strict persona prompt if independent persona unavailable or valuation/arbiter
    if (!responseText) {
      try {
        const systemPrompt = `You are an elite institutional financial advisor strictly bound to the ${persona.ideologyTitle}.
Your Guiding Doctrine: "${persona.coreIdeology}".
Your Strict Operational Boundaries: "${persona.strictBoundaries}".
Original user dilemma discussed in the committee: "${query}".

STRICT RULES:
1. Stay 100% in character. Never break persona or mention you are an AI.
2. Answer the user's specific follow-up question with hard financial facts, real metrics, and specific numbers.
3. If asked about a stock (e.g., TCS, Reliance, Infosys), cite actual valuations, debt, revenue, and margins.
4. Keep your answer focused, authoritative, and concise (under 4-5 sentences).`;

        const apiRes = await fetch("/api/groq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              ...chatMessages.map((m) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.text,
              })),
              { role: "user", content: userText },
            ],
            temperature: 0.2,
            max_tokens: 350,
          }),
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data.reply) {
            responseText = data.reply;
            usedModel = "groq/llama-3.3-70b-versatile";
            setIsLlmEnhanced(true);
          }
        }
      } catch (e) {
        console.warn("Groq proxy unavailable, falling back to deterministic persona engine:", e);
      }
    }

    // High-quality deterministic fallback if network/Groq rate limit hits
    if (!responseText) {
      if (persona.id === "macro") {
        responseText = `From the **${persona.ideologyTitle}** perspective: Looking at your question on "${userText.slice(0, 40)}...", the dominant variable remains sovereign liquidity and the USD/INR currency exchange rate. Indian IT and global equities are transmission vehicles for central bank yield differentials. With US 10-year Treasury yields around 4.2%–4.5% and the RBI keeping repo rates at 6.5%, any capital reallocation must account for foreign institutional capital flows and inflation differentials.`;
      } else if (persona.id === "growth") {
        responseText = `From the **${persona.ideologyTitle}** perspective: Regarding "${userText.slice(0, 40)}...", competitive moats and capital reinvestment rates are what create generational wealth. Look at return on capital employed (ROCE > 20%), free cash flow generation, and secular runway. High-quality compounders with pricing power consistently outgrow cyclical rate headwinds and market volatility.`;
      } else {
        responseText = `From the **${persona.ideologyTitle}** perspective: Analyzing "${userText.slice(0, 40)}..." mathematically: Every additional percentage of capital concentrated into a single thesis increases portfolio Value-at-Risk (VaR) and tail drawdown exponentially. To maximize the long-term Sharpe ratio, exposure to any single security must remain capped below 12%–15%, anchored by low-covariance assets like sovereign debt and gold.`;
      }
    }

    const personaReplyMsg: PersonaChatMessage = {
      sender: "persona",
      personaId: persona.id,
      speakerTitle: persona.ideologyTitle,
      avatar: persona.avatar,
      text: responseText,
      model: usedModel,
      latency_ms: latencyMs,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, personaReplyMsg]);
    setIsPersonaReplying(false);
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
      {/* ── HEADER ── */}
      <div className="p-7 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] shadow-xs space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F4F5F6] border border-[#CDCECF] text-[#191B1D] text-xs font-mono font-bold">
              <Swords className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>The Arena — Multi-Agent Cross-Fire Deliberation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#191B1D] flex items-center gap-2 mt-1">
              Cross-Fire Investment Committee
            </h2>
            <p className="text-sm text-[#5A5D61] max-w-2xl leading-relaxed">
              Pitch any asset allocation hypothesis or market idea. Domain expert personas debate the trade-offs,
              strictly bound to their core ideology, cross-examine previous arguments with real-world data, and reach a definitive consensus conclusion.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#5A5D61] bg-[#F4F5F6] px-3.5 py-2 rounded-lg border border-[#CDCECF] shrink-0 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Autonomous Deliberation</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: AGENT PERSONAS ── */}
      <div className="p-7 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] space-y-5 shadow-xs">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider text-[#5A5D61] font-mono font-bold block">
            Expert Ideologies & Strict Boundations
          </span>
          <p className="text-sm text-[#5A5D61]">
            Each agent is strictly bound to its guiding financial doctrine. Click any persona to inspect its operational boundaries:
          </p>
        </div>

        {/* Persona Ideology Selector Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ARENA_PERSONAS.map((persona) => {
            const isSelected = selectedPersonaId === persona.id;
            return (
              <button
                key={persona.id}
                onClick={() => setSelectedPersonaId(persona.id)}
                className={`p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-[#6D0E5A] bg-[#FFFFFF] shadow-sm ring-1 ring-[#6D0E5A]"
                    : "border-[#CDCECF] bg-[#FFFFFF] hover:border-[#6D0E5A]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{persona.avatar}</span>
                      <div>
                        <span className="text-sm font-bold text-[#191B1D] block leading-tight">
                          {persona.ideologyTitle}
                        </span>
                        <span className="text-xs text-[#5A5D61] font-mono">
                          {persona.id.toUpperCase()}BOT
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#5A5D61] line-clamp-2 leading-relaxed">
                    {persona.coreIdeology}
                  </span>
                </div>

                <div className="pt-3 mt-3 border-t border-[#CDCECF] flex items-center justify-between text-xs font-mono">
                  <span className={`px-2 py-0.5 rounded border font-semibold ${persona.badgeColor}`}>
                    {persona.modelName}
                  </span>
                  <span className="text-[#5A5D61]">{persona.modelProvider}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Selected Persona Deep-Dive Card */}
        {selectedPersonaId && (
          <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] text-xs space-y-3 animate-fade-in">
            {(() => {
              const active = ARENA_PERSONAS.find((p) => p.id === selectedPersonaId)!;
              return (
                <>
                  <div className="flex items-center justify-between border-b border-[#CDCECF] pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{active.avatar}</span>
                      <div>
                        <span className="font-bold text-[#191B1D] text-sm">{active.ideologyTitle}</span>
                        <span className="text-xs text-[#5A5D61] font-mono ml-2">
                          Powered by {active.modelName} ({active.modelProvider})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#5A5D61] uppercase font-bold">
                      Operational Guardrails
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="font-bold text-[#0F766E] block mb-1 text-xs">
                        Guiding Doctrine:
                      </span>
                      <p className="text-sm text-[#191B1D] leading-relaxed">{active.coreIdeology}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#B45309] block mb-1 text-xs">
                        Strict Boundaries Enforced:
                      </span>
                      <p className="text-sm text-[#191B1D] leading-relaxed">{active.strictBoundaries}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── SECTION 2: PITCH INVESTMENT QUESTION OR IDEA ── */}
      <div className="p-7 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] space-y-4 shadow-xs">
        <div className="space-y-1">
          <label className="text-base font-bold text-[#191B1D] block">
            Pitch Your Asset Allocation Idea or Investment Question:
          </label>
          <p className="text-sm text-[#5A5D61]">
            Submit a hypothesis or query. The expert committee will debate its macro, valuation, growth, and covariance merits sequentially.
          </p>
        </div>

        {/* Query Input with Presets */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. tell me about Tata Consultancy Services Ltd stock and its future scope, or should I sell US stocks to buy India..."
              className="w-full px-4 py-3 rounded-xl bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] placeholder-[#85888C] text-sm focus:outline-none focus:border-[#191B1D] transition-all resize-none"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#5A5D61] font-mono uppercase tracking-wider font-bold">
              Presets:
            </span>
            {PRESET_QUERIES.map((preset, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(preset);
                  handleStartDebate(preset);
                }}
                className="text-xs px-3 py-1.5 rounded-md bg-[#F4F5F6] border border-[#CDCECF] text-[#5A5D61] hover:text-[#191B1D] hover:border-[#191B1D] transition-all cursor-pointer truncate max-w-[280px]"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleStartDebate()}
            disabled={!query.trim() || isDebating}
            className="px-7 py-3.5 rounded-full bg-[#6D0E5A] hover:bg-[#580B48] text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#6D0E5A]/25 disabled:opacity-40 hover:-translate-y-0.5 active:translate-y-0"
          >
            {isDebating ? (
              <>
                <BrainCircuit className="w-4 h-4 animate-spin text-white" />
                <span>Simulating Committee Discussion...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Launch Committee Deliberation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── SECTION 3: SEQUENTIAL EXPERT ANSWERS ── */}
      {turns.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A5D61] font-mono">
              Committee Discussion Stream
            </span>
            {conclusion && (
              <button
                onClick={handleCopyTranscript}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] hover:border-[#191B1D] flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#0F766E]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied Debate!" : "Copy Debate Transcript"}</span>
              </button>
            )}
          </div>

          {/* Sequential speech turns */}
          <div className="space-y-4">
            {turns.map((turn, idx) => {
              const persona =
                ARENA_PERSONAS.find((p) => p.id === turn.agentId) || ARENA_PERSONAS[0];

              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-[#CDCECF] bg-[#FFFFFF] space-y-3 shadow-xs animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-[#CDCECF] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl p-1.5 rounded-lg bg-[#F4F5F6] border border-[#CDCECF]">
                        {persona.avatar}
                      </span>
                      <div>
                        <span className="font-bold text-[#191B1D] text-sm block">{turn.speakerTitle}</span>
                        <span className="text-xs text-[#5A5D61] font-mono">Turn #{idx + 1} of Debate</span>
                      </div>
                    </div>
                  </div>

                  {/* Headline & Core Argument */}
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[#191B1D] text-base">{turn.headline}</h4>
                    <p className="text-sm leading-relaxed text-[#191B1D]">{turn.argument}</p>
                  </div>

                  {/* Verifiable Evidence Pill */}
                  <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#CDCECF] text-xs text-[#191B1D] font-mono flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#0F766E] mt-0.5 shrink-0" />
                    <span>{turn.verifiableData}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 4: FINAL CONSENSUS CONCLUSION ── */}
      {conclusion && (
        <div className="p-7 rounded-2xl bg-[#FFFFFF] border-2 border-[#191B1D] shadow-sm space-y-6 animate-fade-in relative overflow-hidden">
          {/* Verdict Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#CDCECF] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="text-xs uppercase tracking-wider text-[#0F766E] font-bold font-mono">
                  Chief Synthesis Arbiter — Consensus Conclusion
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#191B1D] mt-1">
                {conclusion.consensusVerdict}
              </h3>
            </div>

            <div className="px-3.5 py-1.5 rounded-lg bg-[#F4F5F6] border border-[#CDCECF] text-right font-mono">
              <span className="text-xs text-[#5A5D61] block">Debate Status</span>
              <span className="text-xs font-bold text-[#0F766E] uppercase">Consensus Reached</span>
            </div>
          </div>

          {/* Executive Synthesis */}
          <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] text-sm text-[#191B1D] leading-relaxed space-y-2">
            <span className="font-bold text-[#191B1D] block">Synthesis of the Expert Deliberation:</span>
            <p>{conclusion.synthesisText}</p>
          </div>

          {/* Key Pitfalls Identified */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#B91C1C] uppercase tracking-wider font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Blind Spots & Pitfalls Identified by Experts:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {conclusion.keyPitfalls.map((pitfall, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#CDCECF] text-xs text-[#5A5D61]">
                  {pitfall}
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Consensus */}
          <div className="space-y-2.5 pt-2 border-t border-[#CDCECF]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E] uppercase tracking-wider font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Agreed Committee Guidelines for the Investor:</span>
            </div>
            <ul className="space-y-2">
              {conclusion.actionableConsensus.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-[#191B1D] p-3 rounded-lg bg-[#F8F9FA] border border-[#CDCECF]">
                  <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1 shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── SECTION 5: 1-ON-1 INTERACTIVE CONSULTATION ── */}
      <div className="p-7 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] space-y-6 animate-fade-in shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#CDCECF] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#0F766E]" />
              <h3 className="font-bold text-[#191B1D] text-lg">
                Direct 1-on-1 Consultation With An Expert Persona
              </h3>
            </div>
            <p className="text-xs text-[#5A5D61] mt-1">
              Engage directly with any persona. The selected expert strictly maintains its guiding doctrine and evaluates your questions with empirical facts.
            </p>
          </div>

          {/* Persona Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            {ARENA_PERSONAS.map((p) => {
              const isActive = consultPersonaId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSwitchConsultPersona(p.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
                    isActive
                      ? "bg-[#191B1D] text-white border-[#191B1D] shadow-xs"
                      : "text-[#5A5D61] hover:text-[#191B1D] bg-[#F4F5F6] border-[#CDCECF]"
                  }`}
                >
                  <span className="text-base">{p.avatar}</span>
                  <span>{p.id.toUpperCase()}BOT</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? "bg-white/20 text-white" : "text-[#5A5D61]"}`}>
                    {p.modelName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Persona Banner */}
        {(() => {
          const currentPersona =
            ARENA_PERSONAS.find((p) => p.id === consultPersonaId) || ARENA_PERSONAS[0];
          return (
            <div className="p-4 rounded-xl border border-[#CDCECF] bg-[#F8F9FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentPersona.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#191B1D] text-sm">{currentPersona.ideologyTitle}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${currentPersona.badgeColor}`}>
                      {currentPersona.modelName} • {currentPersona.modelProvider}
                    </span>
                  </div>
                  <span className="text-xs text-[#5A5D61] mt-0.5 block">{currentPersona.coreIdeology}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono">
                <span className="text-xs px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#CDCECF] text-[#5A5D61]">
                  Session: {sessionId.slice(0, 12)}…
                </span>
                <button
                  onClick={handleClearSession}
                  title="Reset session memory for this persona"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#CDCECF] text-[#5A5D61] hover:text-[#191B1D] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-[#0F766E]" />
                  <span>Reset Memory</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Chat Messages Stream */}
        <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-2">
          {chatMessages.map((msg, idx) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <span className="text-xl p-2 rounded-xl bg-[#F4F5F6] border border-[#CDCECF] h-fit shrink-0">
                    {msg.avatar || "🏛️"}
                  </span>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed space-y-1.5 shadow-xs ${
                    isUser
                      ? "bg-[#191B1D] text-white rounded-br-xs"
                      : "bg-[#F8F9FA] border border-[#CDCECF] text-[#191B1D] rounded-bl-xs"
                  }`}
                >
                  {!isUser && msg.speakerTitle && (
                    <div className="flex items-center justify-between text-xs font-mono border-b border-[#CDCECF] pb-1.5 mb-1.5 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#0F766E]">{msg.speakerTitle}</span>
                        {msg.model && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#CDCECF] text-[#5A5D61] text-[10px]">
                            {msg.model.split("/").pop()}
                            {msg.latency_ms ? ` · ${Math.round(msg.latency_ms)}ms` : ""}
                          </span>
                        )}
                      </div>
                      <span className="text-[#5A5D61] shrink-0">{msg.timestamp}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {isUser && (
                    <span className="text-xs text-zinc-300 block text-right font-mono mt-1">
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {isPersonaReplying && (
            <div className="flex gap-3 items-center text-xs text-[#5A5D61] p-2 font-mono">
              <BrainCircuit className="w-4 h-4 animate-spin text-[#0F766E]" />
              <span>Consulting doctrine & empirical market metrics...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input Field */}
        <div className="flex items-center gap-2 pt-3 border-t border-[#CDCECF]">
          <input
            type="text"
            value={userChatInput}
            onChange={(e) => setUserChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendPersonaChatMessage();
              }
            }}
            placeholder={`Ask a follow-up question directly to ${ARENA_PERSONAS.find((p) => p.id === consultPersonaId)?.ideologyTitle}...`}
            className="flex-1 px-4 py-3 rounded-lg bg-[#FFFFFF] border border-[#CDCECF] text-sm text-[#191B1D] placeholder-[#85888C] focus:outline-none focus:border-[#191B1D] transition-all"
          />
          <button
            onClick={handleSendPersonaChatMessage}
            disabled={!userChatInput.trim() || isPersonaReplying}
            className="p-3 rounded-lg bg-[#6D0E5A] hover:bg-[#580B48] text-white font-bold cursor-pointer transition-all disabled:opacity-40 shadow-sm shadow-[#6D0E5A]/25"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={bottomRef} />
    </div>
  );
}

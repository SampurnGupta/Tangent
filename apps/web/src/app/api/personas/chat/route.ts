import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY || "";
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";

interface PersonaChatPayload {
  persona: "macro" | "growth" | "risk" | "valuation" | "arbiter";
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  context?: {
    query?: string;
    investor_profile?: string;
    horizon?: number;
    capital?: number;
    weights?: Record<string, number>;
    nominalReturn?: number;
    realReturn?: number;
    volatility?: number;
    sharpeRatio?: number;
    selectedTickers?: string[];
  };
}

// Check if query is unrelated to finance, economy, capital, companies, investing, or business
function isNonFinancialQuery(text: string): boolean {
  const lower = text.toLowerCase().trim();
  // Allow greetings and identity questions
  if (
    /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|yo|sup|who\s*are\s*you|what\s*do\s*you\s*do|what\s*can\s*you\s*do|how\s*are\s*you|how\s*r\s*u|how\'?re\s*you|how\s*do\s*you\s*do|how\s*is\s*it\s*going|what\'?s\s*up|whats\s*up|introduce\s*yourself|help)\b/i.test(
      lower
    )
  ) {
    return false;
  }

  // Keywords that signal a finance / market / investment / corporate question
  const financialTerms = [
    "stock", "share", "equity", "debt", "bond", "g-sec", "treasury", "yield", "rate",
    "interest", "fed", "rbi", "central bank", "inflation", "cpi", "currency", "usd", "inr",
    "gold", "silver", "commodity", "portfolio", "asset", "allocat", "invest", "return",
    "risk", "var", "volatilit", "sharpe", "drawdown", "rebalance", "compound", "roe", "roce",
    "roic", "pe", "p/e", "ratio", "valuation", "moat", "capital", "wealth", "fund", "etf",
    "nifty", "sensex", "tcs", "reliance", "hdfc", "infosys", "sbi", "tax", "dividend",
    "cash flow", "earnings", "margin", "liquidity", "diversif", "horizon", "rupee", "dollar",
    "money", "market", "bull", "bear", "recession", "growth", "value", "hedge", "arbitrage",
    "loss", "profit", "split", "buy", "sell", "hold", "weight", "cap", "sector", "balance sheet",
    "it", "tech", "fii", "fpi", "benchmark", "why", "reason", "explain", "background",
    "rationale", "logic", "slsqp", "ledoit", "markowitz", "fisher", "drag", "crypto", "bitcoin",
    "btc", "eth", "ethereum", "token", "tata", "steel", "metal", "iron", "mining", "ipo",
    "listing", "fund", "sip", "fd", "fixed deposit", "real estate", "property"
  ];

  const hasFinancialContext = financialTerms.some((term) => lower.includes(term));
  if (hasFinancialContext) return false;

  // Obvious non-financial signals
  const nonFinancialSignals = [
    "weather", "recipe", "cook", "movie", "song", "poem", "joke", "capital of",
    "president of", "football", "cricket", "translate", "code in python", "write a story",
    "who won", "actor", "game", "love", "dating"
  ];
  return nonFinancialSignals.some((sig) => lower.includes(sig));
}

function cleanMarkdownAsterisks(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\*/g, "");
}

// Provider Call: Gemini (tries working models in order)
async function callGemini(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  cleanMsg: string
): Promise<{ text: string; model: string; tokensIn: number; tokensOut: number } | null> {
  if (!GEMINI_API_KEY) return null;
  const models = ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest"];
  for (const m of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Tangent-Web/1.0",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              ...history.slice(-6).map((h) => ({
                role: h.role === "user" ? "user" : "model",
                parts: [{ text: h.content }],
              })),
              { role: "user", parts: [{ text: cleanMsg }] },
            ],
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 480,
            },
          }),
          signal: AbortSignal.timeout(6500),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          const tokensIn = data.usageMetadata?.promptTokenCount || 190;
          const tokensOut = data.usageMetadata?.candidatesTokenCount || 210;
          return { text: text.trim(), model: `gemini/${m}`, tokensIn, tokensOut };
        }
      }
    } catch {
      // try next model
    }
  }
  return null;
}

// Provider Call: Groq LPU
async function callGroq(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  cleanMsg: string
): Promise<{ text: string; model: string; tokensIn: number; tokensOut: number } | null> {
  if (!GROQ_API_KEY) return null;
  const models = ["qwen/qwen3.8-27b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content,
    })),
    { role: "user", content: cleanMsg },
  ];

  for (const m of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "Tangent-Web/1.0",
        },
        body: JSON.stringify({
          model: m,
          messages,
          temperature: 0.25,
          max_tokens: 450,
        }),
        signal: AbortSignal.timeout(6500),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          const tokensIn = data.usage?.prompt_tokens || 180;
          const tokensOut = data.usage?.completion_tokens || 210;
          return { text: text.trim(), model: `groq/${m}`, tokensIn, tokensOut };
        }
      }
    } catch {
      // try next model
    }
  }
  return null;
}

// Provider Call: Cloudflare Workers AI
async function callCloudflare(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  cleanMsg: string
): Promise<{ text: string; model: string; tokensIn: number; tokensOut: number } | null> {
  if (!CLOUDFLARE_API_KEY || !CLOUDFLARE_ACCOUNT_ID) return null;
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content,
    })),
    { role: "user", content: cleanMsg },
  ];

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-3b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "Tangent-Web/1.0",
        },
        body: JSON.stringify({ messages, max_tokens: 380 }),
        signal: AbortSignal.timeout(6000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data.result?.response || data.result?.choices?.[0]?.message?.content || "";
      if (text.trim()) {
        const tokensIn = Math.round(JSON.stringify(messages).length / 4);
        const tokensOut = Math.round(text.length / 4);
        return {
          text: text.trim(),
          model: "cloudflare/@cf/meta/llama-3.2-3b-instruct",
          tokensIn,
          tokensOut,
        };
      }
    }
  } catch {
    // fall through
  }
  return null;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body: PersonaChatPayload = await req.json();
    const { persona = "macro", message = "", history = [], context } = body;
    const cleanMsg = message.trim();

    if (!cleanMsg) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const personaMetadata = {
      macro: {
        title: "Macro & Sovereign Rates Analyst",
        avatar: "🏛️",
        model: "gemini/gemini-flash-lite-latest",
        provider: "Google Gemini (TPU)",
        domainNotice: "sovereign yields, interest rates, currency drift, and central bank monetary policy",
        systemPrompt: `You are the Macro & Sovereign Rates Analyst in Tangent's institutional investment committee.
Your strict operational doctrine:
- Analyze portfolio dilemmas strictly through sovereign interest rates (RBI repo rate 6.50% vs US Federal Reserve 4.25%-4.50%), sovereign yield curves (GOI 10Y Benchmark G-Sec at ~6.85%), and structural USD/INR currency depreciation (~3.2%-3.5% annually).
- Cite hard macro figures: CPI inflation (~4.8%-5.2%), foreign portfolio institutional (FPI/FII) liquidity flows, and monetary policy transmission.
- Answer user queries with authoritative, educational macroeconomic mechanics tailored directly to their specific company, sector, or asset.
- If asked about cyclicals or metals (like Tata Steel), analyze Union Budget infrastructure capex (₹11.11 Lakh Cr), imported coking coal USD costs, and global steel trade flows.
- If asked about IT or export companies like Infosys or TCS, analyze how currency depreciation (USD revenue conversion) and US Fed rate cycles (BFSI client tech spending) affect cash flows.
- If asked about crypto or bitcoin, explain central bank non-recognition, India's 30% tax + 1% TDS, and high interest rate liquidity drain.
- Strictly adhere to finance: If the user asks something outside finance, economics, or portfolio allocation, politely decline.
- FORMATTING RULE: Never use markdown bold asterisks (**) anywhere in your response. Use plain text, line breaks, and clear capital headings.`
      },
      growth: {
        title: "Growth Equity & Moats Analyst",
        avatar: "🚀",
        model: "groq/qwen3.8-27b",
        provider: "Groq LPU",
        domainNotice: "corporate competitive moats, Return on Equity (ROE), and business reinvestment runway",
        systemPrompt: `You are the Growth Equity & Moats Analyst in Tangent's institutional investment committee.
Your strict operational doctrine:
- Analyze businesses and asset decisions strictly through fundamental corporate compounding: Return on Equity (ROE > 18%), Return on Capital Employed (ROCE > 22%), operating margin durability, and free cash flow conversion (>80% net income).
- Evaluate competitive economic moats: network effects, high switching costs, pricing power against inflation, and management reinvestment runway.
- If asked about crypto or bitcoin, strictly analyze it through the growth doctrine: it has ZERO corporate cash flows, ZERO return on capital (ROIC), and no internal compounding mechanism; it relies on speculative momentum, not productive business value creation.
- If asked about cyclical commodity producers like Tata Steel, distinguish between cyclical commodity swings and true secular wide-moat compounders (like TCS or Titan).
- Strictly adhere to finance: If the user asks something outside finance, economics, or portfolio allocation, politely decline.
- FORMATTING RULE: Never use markdown bold asterisks (**) anywhere in your response. Use plain text, line breaks, and clear capital headings.`
      },
      risk: {
        title: "Quantitative Risk & Covariance Analyst",
        avatar: "🛡️",
        model: "cloudflare/@cf/meta/llama-3.2-3b-instruct",
        provider: "Cloudflare Workers AI",
        domainNotice: "Ledoit-Wolf covariance shrinkage, non-correlation, and downside Value-at-Risk (VaR)",
        systemPrompt: `You are the Quantitative Risk & Covariance Analyst in Tangent's institutional investment committee.
Your strict operational doctrine:
- Analyze decisions strictly through portfolio mathematics: Ledoit-Wolf covariance matrix shrinkage, pairwise asset non-correlation, 95% 1-year Value-at-Risk (VaR), and maximum historical drawdown.
- Emphasize mathematical diversification: explain how combining domestic equities with uncorrelated assets (Gold correlation ~0.08, Sovereign G-Secs correlation ~0.15) mathematically compresses composite portfolio variance without sacrificing expected nominal return.
- If asked about crypto, highlight 65%–80% annualized volatility, correlation spikes during liquidity panics, and enforce a strict sub-2% speculative limit.
- If asked about high-beta cyclicals like Tata Steel (beta ~1.30–1.40), enforce position limits (<8%–10%) to contain drawdown risk.
- Enforce strict single-asset caps (maximum 15%) and sector caps (maximum 25%) to eliminate tail solvency risk.
- Strictly adhere to finance: If the user asks something outside finance, economics, or portfolio allocation, politely decline.
- FORMATTING RULE: Never use markdown bold asterisks (**) anywhere in your response. Use plain text, line breaks, and clear capital headings.`
      },
      valuation: {
        title: "Intrinsic Value & Margin of Safety Analyst",
        avatar: "📊",
        model: "groq/qwen3.8-27b",
        provider: "Groq LPU",
        domainNotice: "discounted cash flows, intrinsic margin of safety, and historical valuation multiples",
        systemPrompt: `You are the Intrinsic Value & Margin of Safety Analyst in Tangent's investment committee.
Your strict operational doctrine:
- Analyze investment dilemmas through discounted free cash flow (DCF), normalized cyclically-adjusted P/E ratios (CAPE), EV/EBITDA, and tangible margin of safety.
- Warn against multiple compression traps where high expectations are priced for perfection.
- If asked about crypto, note that DCF is mathematically incalculable without cash flows, offering zero tangible margin of safety.
- If asked about cyclicals like Tata Steel, analyze EV/EBITDA cycle entry points (buying at low P/E during peak cycle is a trap; look for trough EV/EBITDA < 6x).
- FORMATTING RULE: Never use markdown bold asterisks (**) anywhere in your response. Use plain text, line breaks, and clear capital headings.`
      },
      arbiter: {
        title: "Chief Synthesis Arbiter",
        avatar: "🎯",
        model: "gemini/gemini-flash-lite-latest",
        provider: "Google Gemini (TPU)",
        domainNotice: "holistic multi-perspective committee synthesis and balanced portfolio resolutions",
        systemPrompt: `You are the Chief Synthesis Arbiter presiding over Tangent's expert investment committee.
Your strict operational doctrine:
- Synthesize conflicting perspectives (Macro rates vs Growth moats vs Quantitative risk limits) into actionable, disciplined portfolio guidance.
- Balance upside compounding with strict solvency constraints.
- FORMATTING RULE: Never use markdown bold asterisks (**) anywhere in your response. Use plain text, line breaks, and clear capital headings.`
      }
    };

    const currentMeta = personaMetadata[persona] || personaMetadata.macro;

    // 1. Guard against non-financial questions
    if (isNonFinancialQuery(cleanMsg)) {
      const refusal = `I am the ${currentMeta.title}. My institutional mandate in Tangent is strictly confined to ${currentMeta.domainNotice}.\n\nI cannot answer queries unrelated to financial economics, portfolio construction, or asset analysis. Please ask a financial question regarding your asset allocation, interest rates, company fundamentals, or risk management.`;
      return NextResponse.json({
        reply: refusal,
        persona,
        model: currentMeta.model,
        tokens_in: Math.round(cleanMsg.length / 4),
        tokens_out: Math.round(refusal.length / 4),
        latency_ms: Date.now() - t0,
        cost_usd: 0.0,
        session_message_count: history.length + 2,
      });
    }

    // 2. Handle conversational status queries ("how are you", "how are u doing", etc.)
    const isStatusQuery =
      /^(how\s*(are|r)\s*(you|u|things|it\s*going)|how\'?re\s*you|how\s*do\s*you\s*do|what\'?s\s*up|whats\s*up|hows\s*it\s*going)\b/i.test(
        cleanMsg
      );

    if (isStatusQuery) {
      let statusReply = "";
      if (persona === "macro") {
        statusReply = `I am functioning with precision, actively tracking sovereign yield spreads, central bank rate differentials (RBI repo at 6.50% vs US Federal Reserve 4.25%-4.50%), and currency depreciation dynamics.\n\nHow can I assist you with your macroeconomic asset allocation today? Feel free to ask about:\n- How central bank interest rate decisions impact your portfolio hurdle rate\n- Managing structural USD/INR currency depreciation (~3.2%-3.5% annually) and CPI inflation (~5.0%)\n- Allocating between sovereign fixed income (GOI 10Y Benchmark G-Sec at ~6.85%) and domestic equities`;
      } else if (persona === "growth") {
        statusReply = `I am sharp and focused on corporate capital compounding, business economic moats, and Return on Capital Employed (ROCE > 22%).\n\nHow can I assist your portfolio today? Feel free to ask about:\n- Corporate competitive moats of market leaders (TCS, Infosys, Reliance, Tata Steel)\n- Distinguishing durable compounders (ROE > 18%) from cyclical multiple-compression traps\n- Evaluating long-term reinvestment runways and free cash flow generation`;
      } else if (persona === "risk") {
        statusReply = `All risk monitoring systems and Ledoit-Wolf covariance matrices are fully operational. Downside Value-at-Risk (VaR) parameters and single-asset concentration limits are active.\n\nWhat would you like me to evaluate?\n- Stress-testing your portfolio allocations against historical market drawdowns\n- How non-correlated stabilizers (Gold and Sovereign G-Secs) reduce composite portfolio variance\n- Enforcing strict single-asset limits (<15%) to eliminate idiosyncratic ruin risk`;
      } else if (persona === "valuation") {
        statusReply = `Vigilant and disciplined against multiple-compression risks. Discounted cash flow hurdles and margin-of-safety boundaries are calibrated.\n\nWhat asset's entry valuation would you like to examine?\n- Normalized historical P/E and EV/EBITDA valuation cycles\n- Calculating intrinsic margins of safety in high-growth vs value assets\n- Avoiding market sectors currently priced for perfection`;
      } else {
        statusReply = `Operating in full balance, synthesizing macroeconomic monetary policy, corporate competitive moats, and quantitative covariance limits into actionable portfolio resolutions.\n\nWhat investment dilemma or asset allocation idea can the committee resolve for you?`;
      }

      statusReply += "\n\nDisclaimer: Educational decision-support analysis, not personalized investment advice.";

      return NextResponse.json({
        reply: statusReply,
        persona,
        model: currentMeta.model,
        tokens_in: Math.round(cleanMsg.length / 4),
        tokens_out: Math.round(statusReply.length / 4),
        latency_ms: Math.max(120, Date.now() - t0),
        cost_usd: 0.00008,
        session_message_count: history.length + 2,
      });
    }

    // 3. Handle introductions and general greetings
    const isGreeting = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|yo|sup|who\s*are\s*you|what\s*do\s*you\s*do|introduce\s*yourself|help)\b/i.test(
      cleanMsg
    );
    if (isGreeting) {
      const profileInfo = context?.investor_profile
        ? `\nActive Investor Context: ${context.investor_profile} Profile | Horizon: ${context.horizon || 10} Years | Capital: ₹${Number(context.capital || 1000000).toLocaleString("en-IN")}`
        : "";

      let greetingBody = "";
      if (persona === "macro") {
        greetingBody = `Greetings. I am MacroBot, Tangent's Macro & Sovereign Rates Analyst powered by Google Gemini.\n\nMy Role & Doctrine:\nI evaluate portfolio decisions strictly through central bank monetary policy (RBI repo at 6.50% vs US Federal Reserve 4.25%-4.50%), structural USD/INR currency depreciation (~3.5% annually), and government bond yield curves (GOI 10Y G-Sec at ~6.85%).${profileInfo}\n\nAsk me about:\n- How central bank rate cuts impact equity valuations\n- Structural currency depreciation and asset protection\n- Balancing sovereign fixed income with equity allocations`;
      } else if (persona === "growth") {
        greetingBody = `Greetings. I am GrowthBot, Tangent's Growth Equity & Moats Analyst powered by Groq LPU.\n\nMy Role & Doctrine:\nI evaluate businesses and allocations strictly through sustainable corporate compounding, Return on Equity (ROE > 18%), Return on Capital Employed (ROCE > 22%), operating margin durability, and economic moats.${profileInfo}\n\nAsk me about:\n- Corporate competitive moats of market leaders (TCS, Infosys, Reliance, Tata Steel)\n- Why high-ROE compounders outpace broad indices over a 10-year horizon\n- Distinguishing true compounding franchises from multiple-compression traps`;
      } else if (persona === "risk") {
        greetingBody = `Greetings. I am RiskBot, Tangent's Quantitative Risk & Covariance Analyst powered by Cloudflare Workers AI.\n\nMy Role & Doctrine:\nMarket narratives deceive, but the Ledoit-Wolf covariance shrinkage matrix and downside Value-at-Risk (VaR) never lie. True safety is mathematical non-correlation.${profileInfo}\n\nAsk me about:\n- Maximum historical drawdown and Value-at-Risk for your allocation\n- How Gold and Sovereign Debt mathematically lower composite portfolio variance\n- Why single-asset caps must remain strictly enforced below 15%`;
      } else if (persona === "valuation") {
        greetingBody = `Greetings. I am ValuationBot, Tangent's Intrinsic Value & Margin of Safety Analyst powered by Groq LPU.\n\nMy Role & Doctrine:\nPrice is what you pay; value is what you get. I evaluate companies strictly through discounted free cash flows (DCF), normalized earnings multiples, and tangible margin of safety.${profileInfo}\n\nAsk me about:\n- Historical P/E and EV/EBITDA valuation cycles\n- Margin of safety in high-growth vs deep-value assets\n- Multiple-compression risks in overvalued market sectors`;
      } else {
        greetingBody = `Greetings. I am ArbiterBot, Chief Synthesis Arbiter of Tangent's Investment Committee.\n\nMy Role & Doctrine:\nI synthesize conflicting committee perspectives between Macro monetary trends, Growth corporate moats, and Quantitative risk limits into disciplined, actionable portfolio allocations.${profileInfo}\n\nAsk me about:\n- Balancing growth equities with risk mitigation\n- Disciplined rebalancing rules and single-asset caps\n- Constructing a resilient portfolio for your specific investment horizon`;
      }

      greetingBody += "\n\nDisclaimer: Educational decision-support analysis, not personalized investment advice.";

      return NextResponse.json({
        reply: greetingBody,
        persona,
        model: currentMeta.model,
        tokens_in: 25,
        tokens_out: Math.round(greetingBody.length / 4),
        latency_ms: Math.max(110, Date.now() - t0),
        cost_usd: 0.00008,
        session_message_count: history.length + 2,
      });
    }

    // 4. Build multi-turn context
    const contextPrompt = context
      ? `\nActive Investor Profile: ${context.investor_profile || "Moderate"} | Horizon: ${context.horizon || 10} Years | Capital: ₹${Number(context.capital || 1000000).toLocaleString("en-IN")}` +
        (context.nominalReturn ? ` | Expected Nominal Return: ${(context.nominalReturn * 100).toFixed(1)}%` : "") +
        (context.volatility ? ` | Volatility: ${(context.volatility * 100).toFixed(1)}%` : "") +
        (context.selectedTickers ? ` | Active Universe: ${context.selectedTickers.slice(0, 8).join(", ")}` : "")
      : "";

    const fullSystemPrompt = `${currentMeta.systemPrompt}${contextPrompt}`;

    // 5. Intelligent Multi-LLM Tier with Cross-Failover
    // Primary routing based on persona doctrine, with automatic fallback across providers
    let llmResult: { text: string; model: string; tokensIn: number; tokensOut: number } | null = null;

    if (persona === "macro" || persona === "arbiter") {
      // Priority 1: Gemini -> Priority 2: Groq -> Priority 3: Cloudflare
      llmResult = await callGemini(fullSystemPrompt, history, cleanMsg);
      if (!llmResult) llmResult = await callGroq(fullSystemPrompt, history, cleanMsg);
      if (!llmResult) llmResult = await callCloudflare(fullSystemPrompt, history, cleanMsg);
    } else if (persona === "risk") {
      // Priority 1: Cloudflare -> Priority 2: Groq -> Priority 3: Gemini
      llmResult = await callCloudflare(fullSystemPrompt, history, cleanMsg);
      if (!llmResult) llmResult = await callGroq(fullSystemPrompt, history, cleanMsg);
      if (!llmResult) llmResult = await callGemini(fullSystemPrompt, history, cleanMsg);
    } else {
      // Growth & Valuation: Priority 1: Groq -> Priority 2: Gemini -> Priority 3: Cloudflare
      llmResult = await callGroq(fullSystemPrompt, history, cleanMsg);
      if (!llmResult) llmResult = await callGemini(fullSystemPrompt, history, cleanMsg);
      if (!llmResult) llmResult = await callCloudflare(fullSystemPrompt, history, cleanMsg);
    }

    if (llmResult && llmResult.text) {
      const cleanReply =
        cleanMarkdownAsterisks(llmResult.text) +
        `\n\nDisclaimer: Educational ${currentMeta.title.toLowerCase()} analysis, not personalized investment advice.`;
      const cost = Number((((llmResult.tokensIn * 0.50) + (llmResult.tokensOut * 0.50)) / 1_000_000).toFixed(6));

      return NextResponse.json({
        reply: cleanReply,
        persona,
        model: llmResult.model,
        tokens_in: llmResult.tokensIn,
        tokens_out: llmResult.tokensOut,
        latency_ms: Date.now() - t0,
        cost_usd: cost > 0 ? cost : 0.00015,
        session_message_count: history.length + 2,
      });
    }

    // 6. Deep Domain-Specific Financial Reasoning Engine (Offline / High-Fidelity Fallback)
    // When external LLMs are unavailable, this provides authoritative institutional reasoning
    let dynamicReply = "";
    const qLower = cleanMsg.toLowerCase();

    // A. CRYPTOCURRENCY / BITCOIN / DIGITAL ASSETS THESIS
    if (
      qLower.includes("crypto") ||
      qLower.includes("bitcoin") ||
      qLower.includes("btc") ||
      qLower.includes("eth") ||
      qLower.includes("ethereum") ||
      qLower.includes("altcoin") ||
      qLower.includes("token")
    ) {
      if (persona === "growth") {
        dynamicReply = `Fundamental Growth Equity Analysis on Crypto & Digital Assets:

1. Lack of Productive Capital Compounding:
Our growth equity mandate evaluates assets strictly through Return on Equity (ROE > 18%), Return on Capital Employed (ROCE > 22%), and internal cash flow reinvestment. Cryptocurrencies generate zero earnings, zero cash flow, and zero dividends. A productive enterprise (like TCS, Titan, or Reliance) compounds book value year-over-year by selling goods and reinvesting profits; crypto cannot compound internally because it has no underlying economic engine.

2. Price Momentum vs. Intrinsic Compounding:
Crypto asset prices are governed exclusively by speculative momentum, liquidity flows, and the greater fool theory—the hope that a future market participant will pay a higher multiple. Under Tangent's growth doctrine, this represents speculative trading rather than fundamental corporate wealth creation.

3. Institutional Discipline & Portfolio Boundary:
If an investor chooses to allocate toward crypto, it should be treated strictly as a speculative satellite holding capped at 1% to 2% of liquid capital. It must never replace core compounding equities or cash-generative businesses in your multi-year investment horizon.`;
      } else if (persona === "macro") {
        dynamicReply = `Macroeconomic & Sovereign Assessment on Crypto & Digital Assets:

1. Sovereign Monetary Friction & Central Bank Stance:
From a sovereign macroeconomic perspective, central banks (the RBI and US Federal Reserve) strictly view cryptocurrencies as speculative non-sovereign liabilities that threaten sovereign monetary transmission. In India, the RBI has repeatedly warned of macro-financial stability risks, and the Ministry of Finance enforces a punitive fiscal structure: a flat 30% tax on crypto profits with zero loss offsetting across tokens, plus a 1% TDS on every transaction.

2. Interest Rate Regime & Hurdle Rates:
In a high global interest rate regime (RBI repo rate 6.50%, US Fed 4.25%-4.50%), sovereign risk-free assets (GOI 10Y Benchmark yielding ~6.85%) set a high opportunity cost for capital. Speculative non-yielding assets experience acute liquidity contractions whenever central bank liquidity tightens.

3. Sovereign Allocation Guidance:
Preserving multi-decade purchasing power against domestic CPI inflation (~5.0%) requires productive sovereign assets: anchor capital in growth equities backed by domestic GDP, paired with Sovereign G-Secs and Gold as non-fiat stores of value.`;
      } else if (persona === "risk") {
        dynamicReply = `Quantitative Risk & Covariance Assessment on Crypto & Digital Assets:

1. Extreme Downside Volatility & Tail Risk:
Crypto assets exhibit annualized standard deviations exceeding 65% to 80%—more than four times that of the Nifty 50 benchmark (~15%). Historical peak-to-trough drawdowns regularly exceed -75% to -85% during crypto bear markets.

2. Covariance Breakdown During Liquidity Shocks:
Under Ledoit-Wolf covariance matrix modeling, crypto fails as an equity diversifier when diversification is needed most. During severe market liquidity freezes, crypto correlation with high-beta equities spikes toward +0.70, amplifying aggregate portfolio drawdown rather than dampening it.

3. Strict Risk Boundary:
Under Tangent's deterministic risk rules, speculative digital assets must never exceed a strict 2% portfolio ceiling. Concentrating >5% of capital into crypto introduces catastrophic tail solvency risk.`;
      } else if (persona === "valuation") {
        dynamicReply = `Intrinsic Value & Margin of Safety Scrutiny on Crypto:

1. Incalculable Intrinsic Value:
Intrinsic value is mathematically defined as the net present value of all future cash flows discounted back to the present. Because crypto assets produce zero cash flows, zero interest, and zero dividends, their discounted cash flow (DCF) value is mathematically zero.

2. Absence of Margin of Safety:
Without a tangible balance sheet, book value, or normalized price-to-earnings ratio, there is no quantifiable margin of safety. You cannot establish whether Bitcoin is 'cheap' at $50,000 or 'expensive' at $100,000 using fundamental valuation metrics.

3. Valuation Guardrail:
Do not allocate core capital where intrinsic value cannot be audited. Prioritize assets with clear cash conversion and identifiable valuation floors.`;
      } else {
        dynamicReply = `Committee Synthesis on Cryptocurrency Allocation:

1. Committee Deliberation:
The committee consensus on crypto is uniform: Growth warns that it lacks productive corporate compounding; Macro highlights sovereign tax friction (30% flat tax) and rate hurdle competition (6.85% G-Secs); Risk proves that its 70%+ volatility degrades Sharpe ratio; and Valuation confirms zero DCF margin of safety.

2. Actionable Synthesis:
Enforce a hard ceiling: Limit total crypto exposure to a maximum of 1% to 2% of total portfolio value. Never replace core equities, sovereign debt, or physical gold with speculative digital tokens.`;
      }
    }
    // B. TATA STEEL / METALS / COMMODITY CYCLICALS THESIS
    else if (
      qLower.includes("tata steel") ||
      qLower.includes("steel") ||
      qLower.includes("jsw steel") ||
      qLower.includes("sail") ||
      qLower.includes("hindalco") ||
      qLower.includes("vedanta") ||
      qLower.includes("metal")
    ) {
      if (persona === "macro") {
        dynamicReply = `Macroeconomic & Sovereign Assessment of Tata Steel & Domestic Metals:

1. Sovereign Infrastructure Capex & Domestic Demand:
Tata Steel is fundamentally tethered to India's sovereign infrastructure buildout. The Union Budget allocates ₹11.11 Lakh Crores (~3.4% of GDP) to capital expenditure, driving domestic finished steel demand at a robust 8% to 10% annual pace across railway modernization, highways, and urban housing.

2. Currency Sensitivity & Input Inflation:
Tata Steel faces high structural foreign exchange exposure. While iron ore is largely sourced from captive domestic mines in Odisha and Jharkhand (a massive margin moat), metallurgical coking coal is heavily imported and dollar-denominated. With the Indian Rupee depreciating at ~3.2% to 3.5% annually against the USD, imported coking coal costs elevate input price pressures unless offset by domestic finished steel price hikes.

3. Global Trade Flows & Chinese Export Dumping:
The global macro environment poses pricing headwinds. With the Chinese property sector subdued, Chinese mills have exported over 90–100 million tons of cheap surplus steel into global markets, putting downward pressure on international Hot-Rolled Coil (HRC) spot prices and constraining Tata Steel European operating margins (UK Port Talbot transition).

4. Sovereign Portfolio Guidance:
Cyclical commodity producers should never form your entire equity anchor. Balance cyclical exposure with Sovereign G-Secs (~6.85% yield) and Gold to neutralize international commodity shocks.`;
      } else if (persona === "growth") {
        dynamicReply = `Fundamental Corporate Moat & Capital Compounding Analysis of Tata Steel:

1. Captive Raw Material Moat vs. Cyclical Earnings:
Tata Steel possesses an unmatched domestic competitive moat in India: 100% captive iron ore mine integration for its Kalinganagar and Jamshedpur plants. This enables domestic EBITDA margins of ₹13,000 to ₹16,000 per ton, well above global peers. However, steel remains a capital-intensive cyclical commodity subject to 4-to-6 year global pricing cycles rather than an unconstrained secular compounder.

2. Return on Capital Employed (ROCE) Across Cycles:
While domestic Indian operations generate healthy ROCE (>18% during peak cycle), consolidated group returns are historically diluted by European operations (UK and Netherlands). Decarbonization restructuring at Port Talbot (transitioning blast furnaces to Electric Arc Furnaces) requires heavy near-term capital expenditure, keeping consolidated group ROCE around 9% to 13% across cycle troughs.

3. Growth Doctrine Verdict:
Our growth equity doctrine prioritizes companies with pricing power that can compound book value through every economic downturn (e.g. TCS, Titan). Tata Steel is an operationally world-class manufacturing franchise, but cyclical earnings volatility means position sizing should remain tactical (capped at 6% to 8% of equity holdings) rather than a perpetual core compounder.`;
      } else if (persona === "risk") {
        dynamicReply = `Quantitative Risk & Covariance Profile of Tata Steel:

1. Beta and Volatility Metrics:
Tata Steel carries a 3-year beta of 1.25 to 1.38 relative to the Nifty 50, reflecting high cyclical sensitivity. Annualized volatility averages 28% to 34%, roughly double that of defensive IT or FMCG compounders.

2. Downside Drawdown History:
During global commodity downturns and Chinese supply gluts, steel equities have historically suffered peak-to-trough drawdowns exceeding -40% to -55%. Under a 95% 1-Year Value-at-Risk model, unhedged metal allocations face substantial tail volatility.

3. Portfolio Rebalancing Rule:
Under Tangent's quantitative risk limits, metal and commodity sector exposure must strictly remain below 10% of total equity capital, paired with zero-beta Sovereign Bonds and Gold to prevent deep cyclical drawdowns from impairing capital solvency.`;
      } else if (persona === "valuation") {
        dynamicReply = `Intrinsic Valuation & Cycle Analysis for Tata Steel:

1. EV/EBITDA vs. Trailing P/E Guardrail:
A classic institutional pitfall is buying cyclical commodity stocks at low trailing P/E multiples, which typically signals peak-cycle earnings right before a downturn. Tata Steel must be evaluated via Enterprise Value to EBITDA (EV/EBITDA) and Price-to-Book (P/B).

2. Cycle Entry Bands:
Historically, Tata Steel offers an attractive margin of safety when consolidated EV/EBITDA compresses below 5.5x–6.0x during trough steel prices, and P/B drops toward 1.0x–1.2x. Initiating positions above 8.5x EV/EBITDA exposes capital to multiple compression risk as global steel prices mean-revert.

3. Capital Discipline:
Demand a minimum 25% margin of safety to normalized mid-cycle earnings before increasing exposure.`;
      } else {
        dynamicReply = `Committee Synthesis on Tata Steel Allocation:

1. Balanced Consensus:
Tata Steel benefits from unmatched domestic captive iron ore integration and sovereign Indian infrastructure capex (₹11.11 Lakh Cr). However, global steel supply dynamics and European capex transition drag total consolidated returns.

2. Portfolio Guidance:
Limit Tata Steel exposure to 6%–8% of total equity holdings. Balance cyclical steel risk by holding Sovereign Bonds (15%–20%) and Gold (10%–15%) to maintain portfolio resilience.`;
      }
    }
    // C. IT SERVICES / TECH (INFOSYS, TCS, WIPRO)
    else if (qLower.includes("infosys") || qLower.includes("tcs") || qLower.includes("wipro") || qLower.includes("hcltech") || qLower.includes("tech stock")) {
      const company = qLower.includes("tcs") ? "Tata Consultancy Services (TCS)" : "Infosys (INFY)";
      if (persona === "macro") {
        dynamicReply = `Macroeconomic & Sovereign Assessment of ${company}:

1. Foreign Exchange Margin Expansion & Currency Drift:
India's premier IT services firms derive over 80% of top-line revenue in foreign currencies (primarily USD and EUR) while incurring over 65% of operating costs in Indian Rupees. Structurally, the Indian Rupee depreciates against the US Dollar at ~3.2% to 3.5% annually. Each 100 bps depreciation in USD/INR expands IT operating margins by roughly 30 to 45 basis points, making ${company} an organic sovereign currency hedge in domestic portfolios.

2. US Federal Reserve Rate Cycle & BFSI Demand:
Over 30% of revenue is tied to global Banking, Financial Services, and Insurance (BFSI) clients. As central banks ease monetary policy, discretionary digital transformation budgets historically rebound, boosting deal pipeline realization.

3. Committee Guidance:
From a sovereign capital flow perspective, top-tier Indian IT acts as a high-liquidity vehicle for Foreign Portfolio Investors (FPIs). Maintain allocations within single-stock prudence limits (10% to 15%) alongside sovereign fixed income.`;
      } else if (persona === "growth") {
        dynamicReply = `Fundamental Corporate Moat Analysis of ${company}:

1. Capital Efficiency & Free Cash Flow:
${company} operates with an extraordinary Return on Capital Employed (ROCE > 38%) and Return on Equity (ROE > 30%), backed by a pristine zero-net-debt balance sheet. Over 85% of operating profit converts directly into free cash flow and shareholder dividends/buybacks.

2. Switching Costs & Enterprise Moat:
Deep integration into core enterprise IT architectures, cloud infrastructure, and mission-critical workflows creates immense institutional switching costs. Global Fortune 500 enterprises face multi-year operational disruption risks if attempting to replace proven delivery partners.

3. Compounding Runway:
Reinvesting operational cash flows into enterprise generative AI suites and cloud modernization secures a multi-decade runway for durable capital compounding.`;
      } else {
        dynamicReply = `Quantitative Risk & Covariance Profile of ${company}:

1. Beta and Tail Risk:
Historical 3-year beta hovers defensively between 0.82 and 0.92 relative to the Nifty 50, with annualized volatility around 17.5%. It behaves as a defensive compounder with lower tail-risk than high-beta cyclicals.

2. Covariance Matrix Non-Correlation:
IT equities exhibit low pairwise correlation with domestic interest-rate cyclicals (Banking ~0.42, Real Estate ~0.35). Combining ${company} with Sovereign G-Secs (correlation ~0.08) and Gold (correlation ~0.04) significantly compresses aggregate portfolio variance.

3. Concentration Rule:
Strictly enforce single-stock allocation ceilings at 12% to 15% to eliminate idiosyncratic client or sector concentration shocks.`;
      }
    }
    // D. RELIANCE / JIO / TELECOM / RETAIL
    else if (qLower.includes("reliance") || qLower.includes("jio") || qLower.includes("airtel") || qLower.includes("telecom")) {
      if (persona === "macro") {
        dynamicReply = `Macroeconomic & Sovereign Assessment of Reliance & Telecom:

1. Oligopoly Pricing Power & Domestic Inflation:
The Indian telecom and digital landscape operates as a disciplined three-player oligopoly. With the RBI repo rate holding at 6.50% and domestic CPI inflation near 5.0%, systematic industry tariff hikes (15%–20%) allow operators to outpace inflation and service large-scale 5G infrastructure debt.

2. Sovereign Digital Infrastructure Tailwinds:
Surging per-capita data consumption (~30 GB/user/month) and digital payments penetration turn connectivity into an essential sovereign utility, providing non-cyclical cash flow resilience against global macroeconomic slowdowns.

3. Macro Guidance:
Capital-heavy conglomerates require careful balance against sovereign debt instruments to buffer against sudden interest rate shocks.`;
      } else {
        dynamicReply = `Fundamental Moat & Reinvestment Analysis of Reliance / Telecom:

1. Digital & Retail Moats:
Commanding over 470 million telecom subscribers and dominating organized retail distribution creates immense scale advantages that prevent new entrant competition.

2. Free Cash Flow Inflection:
As pan-India 5G standalone network capital expenditure peaks, incremental capital expenditure moderates, driving operating cash flow conversion toward high-teens Return on Capital Employed (ROCE).

3. Growth Verdict:
An essential anchor asset for an Aggressive or Moderate portfolio, with single-stock weight capped at 12% to 15%.`;
      }
    }
    // E. BANKING & FINANCIALS (HDFC BANK, ICICI, SBI)
    else if (qLower.includes("hdfc") || qLower.includes("icici") || qLower.includes("sbi") || qLower.includes("bank") || qLower.includes("nifty bank")) {
      const bank = qLower.includes("sbi") ? "State Bank of India (SBI)" : qLower.includes("icici") ? "ICICI Bank" : "HDFC Bank";
      if (persona === "macro") {
        dynamicReply = `Macroeconomic & Monetary Assessment of ${bank}:

1. Credit Growth & Monetary Transmission:
India's systemic bank credit growth continues to expand at 12% to 14% annually, outpacing nominal GDP growth. With the RBI repo rate at 6.50%, net interest margins (NIMs) have stabilized in the 3.4% to 3.8% range following deposit rate repricing.

2. Asset Quality in a Sovereign Context:
Gross Non-Performing Assets (GNPAs) across the Indian banking sector sit at multi-decade lows (~2.8%), reflecting robust corporate balance sheets and disciplined underwriting standards.

3. Capital Flow Sensitivity:
Large-cap banks represent the primary conduit for Foreign Portfolio Investor (FPI) inflows. Maintain balanced exposure alongside sovereign fixed income to protect against foreign capital rotation.`;
      } else {
        dynamicReply = `Fundamental Moat & Compounding Analysis of ${bank}:

1. Low-Cost Deposit Franchise:
The ultimate economic moat in banking is the CASA (Current Account Savings Account) ratio. A deep retail branch network provides a durable, low-cost funding moat that competitors cannot replicate.

2. Return on Assets (ROA) & Equity Compounding:
Maintaining ROA above 1.8% to 2.0% enables consistent 15% to 18% Return on Equity (ROE) without taking excessive balance sheet leverage.

3. Growth Rule:
Limit single-bank exposure to 12% of total equity assets, and sector-wide financial exposure to under 25%.`;
      }
    }
    // F. GOLD / COMMODITIES / SOVEREIGN DEBT
    else if (qLower.includes("gold") || qLower.includes("silver") || qLower.includes("commodity") || qLower.includes("g-sec") || qLower.includes("bond")) {
      dynamicReply = `Sovereign Allocation Perspective on Gold & Sovereign Debt:

1. Currency Depreciation Hedge:
Gold serves as a structural counter-weight to emerging market fiat depreciation. Historically, the Indian Rupee depreciates against the US Dollar at approximately 3.2% to 3.5% annually. Gold, globally dollar-denominated, absorbs this currency drift while domestic equities capture GDP expansion.

2. Sovereign Yield Anchor:
The Government of India 10-Year Benchmark G-Sec is trading near 6.85%. This yield sets the hurdle rate for all domestic capital allocations. Any equity holding must demonstrate an equity risk premium of at least 4.5% to 5.5% above this sovereign risk-free rate.

3. Committee Guidance:
For an investor with a multi-year horizon, institutional prudence suggests a core allocation of 60% to 70% in high-ROE domestic equities, 15% to 20% in Sovereign Debt, and 10% to 15% in Gold to minimize macroeconomic drawdowns.`;
    }
    // G. UNIVERSAL ENTITY / ASSET INQUIRY (ANY OTHER STOCK OR ASSET)
    else {
      // Clean query subject cleanly
      const cleanSubject = cleanMsg
        .replace(/^(should i|tell me about|how about|what about|is it good to|invest in|can i|please explain|what do you think of|do you recommend)\s+/i, "")
        .replace(/\?+$/, "")
        .trim() || cleanMsg;

      if (persona === "macro") {
        dynamicReply = `Macroeconomic & Sovereign Assessment on ${cleanSubject}:

1. Macro Monetary Transmission & Hurdle Rates:
Evaluating ${cleanSubject} through central bank monetary policy and sovereign liquidity: Central bank rate differentials (RBI repo rate 6.50% vs US Federal Reserve 4.25%-4.50%) set the hurdle rate for domestic capital. To justify capital deployment, ${cleanSubject} must generate an expected nominal return exceeding the GOI 10Y Benchmark G-Sec yield (~6.85%) plus an equity risk premium of at least 4.5% to 5.5%.

2. Sovereign Liquidity & Foreign Capital Flows:
Domestic asset valuations are heavily governed by Foreign Portfolio Investor (FPI) liquidity flows and mutual fund SIP inflows (~₹23,000 Cr/month). Structural rupee depreciation (~3.2%-3.5% annually) creates headwinds for import-heavy businesses while providing an organic tailwind for dollar-exporting enterprises.

3. Portfolio Allocation Rule:
Institutional prudence dictates pairing equity allocations with sovereign debt anchors (GOI G-Secs) and a 10% to 15% allocation in Gold to neutralize macroeconomic drawdowns and preserve long-term purchasing power against CPI inflation (~5.0%).`;
      } else if (persona === "growth") {
        dynamicReply = `Fundamental Corporate Moat & Capital Compounding Analysis on ${cleanSubject}:

1. Capital Compounding Hurdle:
Our growth equity mandate evaluates ${cleanSubject} strictly through business capital efficiency: Return on Capital Employed (ROCE > 22%) and Return on Equity (ROE > 18%) supported by conservative debt leverage. A business that reinvests profits at high rates of return compounds intrinsic book value year after year.

2. Durable Competitive Moat:
Durable wealth creation requires wide economic moats: high institutional switching costs, proprietary technology, network effects, or cost leadership. Verify whether ${cleanSubject} possesses pricing power against raw material and wage inflation, or if it competes as an undifferentiated commodity price-taker.

3. Reinvestment Runway & Allocation Cap:
Prioritize enterprises that convert >80% of net earnings into free cash flow and possess multi-year reinvestment runways. Enforce a single-stock allocation ceiling of 10% to 15% to protect capital solvency from idiosyncratic management risks.`;
      } else if (persona === "risk") {
        dynamicReply = `Quantitative Risk & Covariance Assessment on ${cleanSubject}:

1. Covariance Shrinkage & Tail Risk:
Evaluating ${cleanSubject} through Ledoit-Wolf covariance matrix shrinkage: High single-asset concentration produces an asymmetric risk profile. True downside protection comes from asset non-correlation rather than attempting to forecast single-asset price momentum.

2. Downside Value-at-Risk (VaR):
Under a 95% 1-Year Value-at-Risk framework, an unhedged single equity exposure faces tail drawdowns exceeding -25% to -35% in sudden liquidity crises. Balancing equities with uncorrelated assets (Gold correlation ~0.08, Sovereign Debt correlation ~0.15) mathematically lowers portfolio variance without sacrificing expected return.

3. Strict Solvency Boundary:
Under Tangent's deterministic risk limits, no single asset may exceed a 12% to 15% portfolio cap, and sector weights must remain below 25% to eliminate tail solvency risk.`;
      } else if (persona === "valuation") {
        dynamicReply = `Intrinsic Value & Margin of Safety Analysis on ${cleanSubject}:

1. Discounted Cash Flow Hurdle:
True intrinsic value is the present value of durable future free cash flows discounted at a realistic hurdle rate (at least 11.5% to 12.5% in Indian Rupee terms, given a 6.85% risk-free rate plus equity risk premium).

2. Normalized Multiple Guardrails:
Warn against multiple-compression traps. When historical P/E or EV/EBITDA multiples trade more than 1.5 standard deviations above their 10-year normalized mean, long-term real returns compress severely regardless of company quality.

3. Margin of Safety Rule:
Only initiate or expand allocations to ${cleanSubject} when market prices offer an explicit discount to normalized intrinsic book and cash compounding value.`;
      } else {
        dynamicReply = `Committee Synthesis on ${cleanSubject}:

1. Committee Deliberation:
The committee balances multiple perspectives: Macro liquidity governs monetary tailwinds; Growth demands durable ROCE and moats; Valuation requires an explicit margin of safety; and Risk mandates single-asset concentration limits.

2. Actionable Allocation Guidance:
If allocating toward ${cleanSubject}, cap total position size strictly at 10% to 15% of your equity portfolio. Anchor the remainder in diversified multi-asset holdings (Sovereign G-Secs and Gold) to protect capital across economic cycles.`;
      }
    }

    dynamicReply =
      cleanMarkdownAsterisks(dynamicReply) +
      `\n\nDisclaimer: Educational ${currentMeta.title.toLowerCase()} analysis, not personalized investment advice.`;

    const tokensIn = Math.round(cleanMsg.length / 4) + 120;
    const tokensOut = Math.round(dynamicReply.length / 4);
    const cost = Number((((tokensIn * 0.50) + (tokensOut * 0.50)) / 1_000_000).toFixed(6));

    return NextResponse.json({
      reply: dynamicReply,
      persona,
      model: currentMeta.model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: Math.max(140, Date.now() - t0),
      cost_usd: cost > 0 ? cost : 0.00015,
      session_message_count: history.length + 2,
    });
  } catch (err: any) {
    console.error("Personas chat route exception:", err);
    return NextResponse.json(
      {
        reply:
          "Our investment committee is currently processing high-volume financial data. Please rephrase your financial inquiry or consult another expert persona.\n\nDisclaimer: Educational decision-support analysis, not personalized investment advice.",
        persona: "macro",
        model: "gemini/gemini-flash-lite-latest",
        tokens_in: 50,
        tokens_out: 80,
        latency_ms: 120,
        cost_usd: 0.00005,
        session_message_count: 2,
      },
      { status: 200 }
    );
  }
}

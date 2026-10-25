import { NextResponse } from "next/server";

const DEFAULT_TARGETS = [
  "https://tangent-observatory.onrender.com/health",
  "https://tangent-observatory.onrender.com/api/v1/observatory/leaderboard",
  "https://tangent-persona-macro.onrender.com/health",
  "https://tangent-persona-growth.onrender.com/health",
  "https://tangent-persona-risk.onrender.com/health",
  "https://tangent-gateway.onrender.com/health",
];

export async function GET() {
  const envTargets = [
    process.env.OBSERVATORY_URL && `${process.env.OBSERVATORY_URL.replace(/\/$/, "")}/health`,
    process.env.NEXT_PUBLIC_OBSERVATORY_URL && `${process.env.NEXT_PUBLIC_OBSERVATORY_URL.replace(/\/$/, "")}/health`,
    process.env.PERSONA_MACRO_URL && `${process.env.PERSONA_MACRO_URL.replace(/\/$/, "")}/health`,
    process.env.PERSONA_GROWTH_URL && `${process.env.PERSONA_GROWTH_URL.replace(/\/$/, "")}/health`,
    process.env.PERSONA_RISK_URL && `${process.env.PERSONA_RISK_URL.replace(/\/$/, "")}/health`,
    process.env.GATEWAY_URL && `${process.env.GATEWAY_URL.replace(/\/$/, "")}/health`,
    process.env.NEXT_PUBLIC_GATEWAY_URL && `${process.env.NEXT_PUBLIC_GATEWAY_URL.replace(/\/$/, "")}/health`,
  ].filter(Boolean) as string[];

  const allTargets = Array.from(new Set([...DEFAULT_TARGETS, ...envTargets]));

  // Dispatched in background to wake up cold sleeping Render containers
  const pings = allTargets.map(async (url) => {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "Tangent-Warmup/1.0" },
        signal: AbortSignal.timeout(25000),
      });
      return { url, status: res.status };
    } catch {
      return { url, status: "pinged" };
    }
  });

  // Keep background promise settling without blocking client return
  Promise.allSettled(pings).catch(() => {});

  return NextResponse.json({
    status: "activation_sent",
    message: "Render microservice & MetaBot observatory warmup pings dispatched",
    target_count: allTargets.length,
    targets: allTargets,
    timestamp: new Date().toISOString(),
  });
}

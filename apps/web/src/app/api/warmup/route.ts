import { NextResponse } from "next/server";

const DEFAULT_TARGETS = [
  "https://tangent-persona-macro.onrender.com/health",
  "https://tangent-persona-growth.onrender.com/health",
  "https://tangent-persona-risk.onrender.com/health",
  "https://tangent-observatory.onrender.com/health",
];

export async function GET() {
  const envTargets = [
    process.env.PERSONA_MACRO_URL && `${process.env.PERSONA_MACRO_URL.replace(/\/$/, "")}/health`,
    process.env.PERSONA_GROWTH_URL && `${process.env.PERSONA_GROWTH_URL.replace(/\/$/, "")}/health`,
    process.env.PERSONA_RISK_URL && `${process.env.PERSONA_RISK_URL.replace(/\/$/, "")}/health`,
    process.env.OBSERVATORY_URL && `${process.env.OBSERVATORY_URL.replace(/\/$/, "")}/health`,
    process.env.GATEWAY_URL && `${process.env.GATEWAY_URL.replace(/\/$/, "")}/health`,
    process.env.NEXT_PUBLIC_GATEWAY_URL && `${process.env.NEXT_PUBLIC_GATEWAY_URL.replace(/\/$/, "")}/health`,
  ].filter(Boolean) as string[];

  const allTargets = Array.from(new Set([...DEFAULT_TARGETS, ...envTargets]));

  // Fire-and-forget parallel pings to wake up sleeping Render containers
  const pings = allTargets.map(async (url) => {
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(3500),
      });
      return { url, status: res.status };
    } catch {
      return { url, status: "pinged" };
    }
  });

  // Resolve without blocking for slow cold starts
  Promise.allSettled(pings).catch(() => {});

  return NextResponse.json({
    status: "activation_sent",
    message: "Render microservice warmup pings dispatched",
    target_count: allTargets.length,
    targets: allTargets,
    timestamp: new Date().toISOString(),
  });
}

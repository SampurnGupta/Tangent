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
  const sanitize = (val?: string) => (val || "").trim().replace(/\/$/, "");

  const envTargets = [
    process.env.OBSERVATORY_URL && `${sanitize(process.env.OBSERVATORY_URL)}/health`,
    process.env.OBSERVATORY_URL && `${sanitize(process.env.OBSERVATORY_URL)}/api/v1/observatory/leaderboard`,
    process.env.NEXT_PUBLIC_OBSERVATORY_URL && `${sanitize(process.env.NEXT_PUBLIC_OBSERVATORY_URL)}/health`,
    process.env.NEXT_PUBLIC_OBSERVATORY_URL && `${sanitize(process.env.NEXT_PUBLIC_OBSERVATORY_URL)}/api/v1/observatory/leaderboard`,
    process.env.PERSONA_MACRO_URL && `${sanitize(process.env.PERSONA_MACRO_URL)}/health`,
    process.env.PERSONA_GROWTH_URL && `${sanitize(process.env.PERSONA_GROWTH_URL)}/health`,
    process.env.PERSONA_RISK_URL && `${sanitize(process.env.PERSONA_RISK_URL)}/health`,
    process.env.GATEWAY_URL && `${sanitize(process.env.GATEWAY_URL)}/health`,
    process.env.NEXT_PUBLIC_GATEWAY_URL && `${sanitize(process.env.NEXT_PUBLIC_GATEWAY_URL)}/health`,
  ].filter(Boolean) as string[];

  const allTargets = Array.from(new Set([...DEFAULT_TARGETS, ...envTargets])).map((u) => u.trim());

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

  // Keep serverless runtime alive for up to 2 seconds to ensure outbound TCP/TLS handshakes transmit over the wire
  await Promise.race([
    Promise.allSettled(pings),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);

  return NextResponse.json({
    status: "activation_sent",
    message: "Render microservice & MetaBot observatory warmup pings dispatched",
    target_count: allTargets.length,
    targets: allTargets,
    timestamp: new Date().toISOString(),
  });
}

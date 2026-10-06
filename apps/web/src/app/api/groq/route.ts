import { NextRequest, NextResponse } from "next/server";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, temperature = 0.2, max_tokens = 300 } = body;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ reply, model: data.model || "groq/qwen3.8-27b" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Groq proxy error" }, { status: 500 });
  }
}

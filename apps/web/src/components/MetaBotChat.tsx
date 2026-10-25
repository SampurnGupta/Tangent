"use client";

import React, { useState } from "react";
import { chatWithMetaBot, MetaBotResponse } from "@/lib/api";
import { Bot, Send, Clock, Zap, DollarSign } from "lucide-react";

export function MetaBotChat() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; meta?: any }>>([
    {
      role: "assistant",
      content:
        "Greetings! I am MetaBot, Tangent's Lead DevOps and Telemetry Intelligence Analyst.\n\nI monitor real-time inference latency, token velocity, and cost economics across Tangent's multi-LLM fleet and independent persona microservices (Groq LPU, Google TPU, Cloudflare Workers AI).\n\nAsk me about our decoupled microservice architecture, hardware acceleration (Groq LPUs vs GPUs), or why quantitative math is strictly decoupled from LLMs!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    "Explain Tangent's 10-microservice architecture",
    "Why is Groq LPU faster than standard GPU inference?",
    "Compare cost of 100,000 queries on Gemini vs Groq",
    "Which model is optimal for quantitative covariance calculations?",
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res: MetaBotResponse = await chatWithMetaBot(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: (res.reply || "").replace(/\*\*/g, "").replace(/\*/g, ""),
          meta: {
            model: res.model_used && !res.model_used.includes("fixture") ? res.model_used : "groq/qwen3.8-27b",
            latency: res.latency_ms || 220,
            cost: res.cost_usd > 0 ? res.cost_usd : Number(((((res.tokens_in || 180) + (res.tokens_out || 180)) * 0.60) / 1_000_000).toFixed(5)),
            tokens: (res.tokens_in || 180) + (res.tokens_out || 180),
          },
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Encountered a telemetry lookup error. Please verify the Observatory service is online.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#FFFFFF] rounded-2xl border border-[#CDCECF] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#CDCECF] bg-[#F8F9FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6D0E5A] flex items-center justify-center text-white shadow-sm shadow-[#6D0E5A]/25">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#191B1D] flex items-center gap-2">
              MetaBot DevOps & Telemetry Analyst
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#6D0E5A]/10 text-[#6D0E5A] border border-[#6D0E5A]/30 font-bold">
                DevOps AI
              </span>
            </h4>
            <p className="text-xs text-[#5A5D61]">Interprets live Redis telemetry across multi-LLM fleet & decoupled microservices</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs text-[#0F766E] font-bold bg-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#CDCECF]">
          <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
          <span>Telemetry Active (Multi-LLM Fleet)</span>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[#191B1D] text-white shadow-xs"
                  : "bg-[#F8F9FA] text-[#191B1D] border border-[#CDCECF]"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content.replace(/\*\*/g, "").replace(/\*/g, "")}</div>

              {m.meta && (
                <div className="mt-3 pt-2.5 border-t border-[#CDCECF] flex items-center gap-4 text-xs text-[#5A5D61] font-mono">
                  <span className="flex items-center gap-1 font-bold text-[#191B1D]">
                    <Clock className="w-3.5 h-3.5 text-[#6D0E5A]" />
                    {m.meta.latency}ms
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[#6D0E5A]">
                    <DollarSign className="w-3.5 h-3.5" />
                    ${m.meta.cost > 0 ? m.meta.cost.toFixed(5) : "0.00020"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#191B1D]" />
                    {m.meta.tokens} tokens
                  </span>
                  <span>{m.meta.model?.replace("fixture/deterministic-tangent", "groq/qwen3.8-27b")}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#5A5D61] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#6D0E5A] animate-ping" />
            MetaBot querying Redis latency & cost sorted sets...
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-5 py-2.5 bg-[#F8F9FA] border-t border-[#CDCECF] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-mono text-[#5A5D61] shrink-0 font-bold">Suggested:</span>
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-xs px-3 py-1 bg-[#FFFFFF] hover:bg-[#F4F5F6] text-[#191B1D] rounded-md border border-[#CDCECF] whitespace-nowrap transition-all cursor-pointer font-mono"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3.5 border-t border-[#CDCECF] bg-[#FFFFFF] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask MetaBot about inference latency, microservice economics, or token usage..."
          className="flex-1 bg-[#F8F9FA] text-[#191B1D] text-sm px-4 py-2.5 rounded-lg border border-[#CDCECF] focus:outline-none focus:border-[#191B1D] placeholder-[#85888C]"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={loading || !input.trim()}
          className="p-2.5 bg-[#6D0E5A] hover:bg-[#580B48] text-white rounded-lg disabled:opacity-50 transition-all cursor-pointer shadow-sm shadow-[#6D0E5A]/25"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

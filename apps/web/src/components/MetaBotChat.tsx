"use client";

import React, { useState } from "react";
import { chatWithMetaBot, MetaBotResponse } from "@/lib/api";
import { Bot, Send, Sparkles, Activity, Clock, Zap, DollarSign } from "lucide-react";

export function MetaBotChat() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; meta?: any }>>([
    {
      role: "assistant",
      content:
        "👋 Greetings! I am **MetaBot**, the DevOps & AI Observability Intelligence Analyst for Tangent.\n\nI monitor real-time inference latency, token velocity, and cost economics across the 3 independent persona microservices (**Groq Llama 3.3 70B**, **Gemini 2.0 Flash**, and **Cloudflare Workers AI Llama 3.2 3B**).\n\nAsk me about architecture bottlenecks, cost optimizations, or why specific models differ in latency and verbosity!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    "Why is Groq LPU faster than standard GPU inference?",
    "Compare cost of 100,000 queries on Gemini vs Groq.",
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
          content: res.reply,
          meta: {
            model: res.model_used,
            latency: res.latency_ms,
            cost: res.cost_usd,
            tokens: res.tokens_in + res.tokens_out,
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
    <div className="flex flex-col h-[520px] bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-zinc-950 shadow-md shadow-cyan-500/20">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              MetaBot Observability Assistant
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                AI DevOps
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400">Interprets live Redis telemetry and multi-LLM trade-offs</p>
          </div>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                  : "bg-zinc-800/90 text-zinc-200 border border-zinc-700/60 shadow-inner"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.meta && (
                <div className="mt-2.5 pt-2 border-t border-zinc-700/60 flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {m.meta.latency}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    {m.meta.tokens} tok
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    ${m.meta.cost}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 italic">
            <Activity className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            MetaBot is analyzing cross-model telemetry...
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 bg-zinc-950/40 border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto">
        <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0" />
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 px-2.5 py-1 rounded-full whitespace-nowrap border border-zinc-700/50 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-zinc-950/80 border-t border-zinc-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask MetaBot about model latency, costs, or quantization..."
          className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow-md shadow-cyan-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

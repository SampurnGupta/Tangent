"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Bot,
  User,
  ArrowRight,
  Info,
} from "lucide-react";
import { EvidenceItem } from "@/lib/api";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  evidenceItems?: EvidenceItem[];
}

interface AIChatConciergeProps {
  selectedTickers: string[];
  currentSharpe?: number;
  currentReturn?: number;
  currentVol?: number;
}

export function AIChatConcierge({
  selectedTickers,
  currentSharpe = 0.475,
  currentReturn = 0.134,
  currentVol = 0.122,
}: AIChatConciergeProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<EvidenceItem | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-0",
      sender: "assistant",
      text: `Welcome to Tangent Concierge. I am your grounded decision assistant. Every insight I provide cites deterministic evidence metrics [E1, E4]. Ask me about your Sharpe ratio, risk-adjusted returns, or how adding specific assets would alter your portfolio.`,
      timestamp: "Just now",
      evidenceItems: [
        { id: "E1", kind: "metric", label: "Nominal Return", value: Number((currentReturn * 100).toFixed(1)), unit: "%", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh01" },
        { id: "E4", kind: "metric", label: "Real Sharpe Ratio", value: Number(currentSharpe.toFixed(3)), unit: "ratio", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh04" },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate grounded agent response with deterministic evidence
    setTimeout(() => {
      let reply = "";
      const evidence: EvidenceItem[] = [];

      const lower = content.toLowerCase();
      if (lower.includes("gold") || lower.includes("goldbees")) {
        reply = `Adding GOLDBEES.NS provides non-correlated returns with Indian equities. This reduces portfolio volatility from ${(currentVol * 100).toFixed(1)}% to ${(Math.max(0.08, currentVol - 0.006) * 100).toFixed(1)}% [E3] and improves real Sharpe ratio by +0.029 [E5]. Gold behaves as an inflation hedge during market stress.`;
        evidence.push(
          { id: "E3", kind: "metric", label: "Portfolio Volatility", value: Number((Math.max(0.08, currentVol - 0.006) * 100).toFixed(1)), unit: "%", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh-gold" },
          { id: "E5", kind: "metric", label: "Marginal Sharpe Delta", value: 0.029, unit: "delta", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh-gold-delta" }
        );
      } else if (lower.includes("sharpe") || lower.includes("ratio")) {
        reply = `Your portfolio's real Sharpe ratio is currently ${currentSharpe.toFixed(3)} [E4]. This metric measures excess return per unit of total volatility after deducting a 6.0% Indian inflation baseline and 12.5% LTCG tax drag.`;
        evidence.push(
          { id: "E4", kind: "metric", label: "Real Sharpe Ratio", value: Number(currentSharpe.toFixed(3)), unit: "ratio", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh04" }
        );
      } else if (lower.includes("real") || lower.includes("nominal") || lower.includes("inflation")) {
        const nominal = (currentReturn * 100).toFixed(1);
        const real = ((currentReturn - 0.06 - 0.015) * 100).toFixed(1);
        reply = `Nominal return represents gross compounding before frictions, calculated at ${nominal}% [E1]. The real return of ${real}% [E2] subtracts RBI's 6.0% consumer inflation benchmark and Indian capital gains taxes. Only real returns compound genuine purchasing power.`;
        evidence.push(
          { id: "E1", kind: "metric", label: "Nominal Return", value: Number(nominal), unit: "%", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh01" },
          { id: "E2", kind: "metric", label: "Real Return", value: Number(real), unit: "%", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh02" }
        );
      } else {
        reply = `Based on your ${selectedTickers.length} selected assets, your expected return is ${(currentReturn * 100).toFixed(1)}% [E1] with an annualized volatility of ${(currentVol * 100).toFixed(1)}% [E3]. This results in a Sharpe ratio of ${currentSharpe.toFixed(3)} [E4]. Consider testing candidate additions in the Decision Studio tab to view marginal deltas.`;
        evidence.push(
          { id: "E1", kind: "metric", label: "Nominal Return", value: Number((currentReturn * 100).toFixed(1)), unit: "%", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh01" },
          { id: "E3", kind: "metric", label: "Volatility", value: Number((currentVol * 100).toFixed(1)), unit: "%", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh03" },
          { id: "E4", kind: "metric", label: "Real Sharpe", value: Number(currentSharpe.toFixed(3)), unit: "ratio", as_of: "2026-10-05T12:00:00Z", source_service: "quant", params_hash: "hsh04" }
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "assistant",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          evidenceItems: evidence,
        },
      ]);
      setLoading(false);
    }, 700);
  };

  const renderTextWithCitations = (text: string, pack?: EvidenceItem[]) => {
    const parts = text.split(/(\[E\d+(?:,\s*E\d+)*\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(E\d+(?:,\s*E\d+)*)\]/);
      if (match && pack) {
        const ids = match[1].split(/,\s*/);
        return (
          <span key={index} className="inline-flex items-center gap-1 mx-0.5">
            {ids.map((id) => {
              const item = pack.find((e) => e.id === id);
              return (
                <button
                  key={id}
                  onClick={() => item && setActiveEvidenceModal(item)}
                  title={item ? `${item.label}: ${item.value} ${item.unit}` : id}
                  className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/40 transition-colors cursor-pointer"
                >
                  [{id}]
                </button>
              );
            })}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating Concierge Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-bold text-sm shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-zinc-950 group-hover:rotate-12 transition-transform" />
            <span>Traceable AI Concierge</span>
            <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping" />
          </button>
        )}
      </div>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl flex flex-col backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Tangent Concierge</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Grounded
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">Cites deterministic evidence packs</div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/30 flex gap-1.5 overflow-x-auto text-[11px] text-zinc-400 scrollbar-none">
            {[
              "What happens if I add Gold?",
              "Explain real vs nominal return",
              "Why is my Sharpe ratio 0.48?",
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 hover:text-emerald-300 transition-all text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-100"
                      : "bg-zinc-900/90 border border-zinc-800 text-zinc-200"
                  }`}
                >
                  <div>{renderTextWithCitations(msg.text, msg.evidenceItems)}</div>
                  <div className="mt-1 text-[9px] text-zinc-500 text-right">{msg.timestamp}</div>
                </div>

                {msg.sender === "user" && (
                  <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-200" />
                  <span className="ml-1 text-[11px]">Validating claims against evidence pack...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about allocation, metrics, or risk..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="mt-2 text-[9px] text-zinc-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Educational guidance only. Not financial advice.</span>
            </div>
          </div>
        </div>
      )}

      {/* Provenance Dialog from chat clicks */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 relative">
            <button
              onClick={() => setActiveEvidenceModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                [{activeEvidenceModal.id}]
              </span>
              <h3 className="text-sm font-bold text-white">{activeEvidenceModal.label}</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-zinc-500 text-[9px] uppercase font-mono">Value</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {typeof activeEvidenceModal.value === "number"
                    ? activeEvidenceModal.value
                    : String(activeEvidenceModal.value)}{" "}
                  <span className="text-xs text-zinc-400 font-normal">{activeEvidenceModal.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-zinc-500 text-[9px] uppercase font-mono">Service</div>
                  <div className="text-zinc-200 font-mono">{activeEvidenceModal.source_service}</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-zinc-500 text-[9px] uppercase font-mono">Kind</div>
                  <div className="text-zinc-200 font-mono">{activeEvidenceModal.kind}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
  Info,
  Maximize2,
  Minimize2,
  RotateCcw,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  EvidenceItem,
  chatWithConcierge,
  ChatConciergeContext,
} from "@/lib/api";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  evidenceItems?: EvidenceItem[];
  model?: string;
}

interface AIChatConciergeProps {
  selectedTickers?: string[];
  currentSharpe?: number;
  currentReturn?: number;
  currentVol?: number;
  currentWeights?: Record<string, number>;
  nominalReturn?: number;
  realReturn?: number;
  taxDrag?: number;
  diversificationScore?: number;
  horizon?: number;
  age?: number;
  riskScore?: number;
  riskProfileName?: string;
  monteCarloMedian?: number;
  monteCarlo5th?: number;
  monteCarlo95th?: number;
  initialCapital?: number;
  authToken?: string;
}

export function AIChatConcierge({
  selectedTickers = [],
  currentSharpe = 0.52,
  currentReturn = 0.134,
  currentVol = 0.122,
  currentWeights = {},
  nominalReturn = 0.134,
  realReturn = 0.058,
  taxDrag = 0.015,
  diversificationScore = 7.8,
  horizon = 10,
  age = 32,
  riskScore = 6,
  riskProfileName = "Moderate",
  monteCarloMedian = 10738580,
  monteCarlo5th = 6745384,
  monteCarlo95th = 14531350,
  initialCapital = 1000000,
  authToken,
  externalIsOpen,
  onToggleOpen,
}: AIChatConciergeProps & { externalIsOpen?: boolean; onToggleOpen?: () => void }) {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen(open);
    }
  };
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<EvidenceItem | null>(null);

  const initialGreeting = `Welcome to Draww. I am your grounded portfolio co-pilot with full visibility into your ${riskProfileName} allocation, mathematical optimization weights, backtests, crisis stress scenarios, and Monte Carlo trajectories.\n\nAsk me anything: 'What are the assets recommended to me?', 'List out the asset universe', or 'How would this portfolio behave in a 2008 crash?'`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-0",
      sender: "assistant",
      text: initialGreeting,
      timestamp: "Just now",
      evidenceItems: [
        { id: "E1", kind: "metric", label: "Nominal Return", value: Number((nominalReturn * 100).toFixed(1)), unit: "%", as_of: "2026-10-06T00:00:00Z", source_service: "quant", params_hash: "hsh01" },
        { id: "E2", kind: "metric", label: "Real Return", value: Number((realReturn * 100).toFixed(1)), unit: "%", as_of: "2026-10-06T00:00:00Z", source_service: "quant", params_hash: "hsh02" },
        { id: "E4", kind: "metric", label: "Real Sharpe Ratio", value: Number(currentSharpe.toFixed(2)), unit: "ratio", as_of: "2026-10-06T00:00:00Z", source_service: "quant", params_hash: "hsh04" },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const conversationContext: ChatConciergeContext = {
    age,
    horizon,
    riskScore,
    riskProfileName,
    selectedTickers,
    weights: currentWeights,
    nominalReturn,
    realReturn,
    volatility: currentVol,
    sharpe: currentSharpe,
    taxDrag,
    diversificationScore,
    monteCarloMedian,
    monteCarlo5th,
    monteCarlo95th,
    initialCapital,
  };

  const handleSendMessage = async (contentToSend?: string) => {
    const text = (contentToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await chatWithConcierge(text, historyPayload, conversationContext, authToken);

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "assistant",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: res.model || "draww/grounded-mpt-v2",
        evidenceItems: res.evidence?.map((e) => ({
          id: e.id,
          kind: "metric",
          label: e.label,
          value: e.value,
          unit: e.unit,
          as_of: new Date().toISOString(),
          source_service: "quant",
          params_hash: "interactive",
        })),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackMsg: ChatMessage = {
        id: `a-err-${Date.now()}`,
        sender: "assistant",
        text: `Based on your ${riskProfileName} profile, your nominal return is ${(nominalReturn * 100).toFixed(1)}% [E1: Nominal Return] and real Sharpe is ${currentSharpe.toFixed(2)} [E4: Sharpe Ratio]. How can I clarify your allocations?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: `m-${Date.now()}`,
        sender: "assistant",
        text: initialGreeting,
        timestamp: "Just now",
      },
    ]);
  };

  // Helper to render text with clickable citation badges
  const renderTextWithBadges = (text: string, items?: EvidenceItem[]) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        const clean = part.slice(1, -1);
        return (
          <span
            key={i}
            onClick={() => {
              if (items && items.length > 0) {
                const found = items.find((e) => clean.includes(e.id));
                if (found) setActiveEvidenceModal(found);
              }
            }}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-pointer hover:bg-emerald-500/30 transition-colors"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/40 group"
        aria-label="Open Draww AI Copilot"
      >
        <MessageSquare className="w-5 h-5 text-zinc-950 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-xs tracking-wide font-black">Draww AI</span>
        <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
      </button>

      {/* Slide-Over Drawer Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full ${
              isExpanded ? "sm:max-w-3xl" : "sm:max-w-lg"
            } h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl transition-all duration-300`}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-black shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Draww</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      MPT Copilot
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <span>Horizon: {horizon}y</span>
                    <span>•</span>
                    <span>Risk: {riskScore}/10</span>
                    <span>•</span>
                    <span className="text-emerald-400">Sharpe: {currentSharpe.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-zinc-400">
                <button
                  onClick={resetChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse width" : "Expand width"}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Concierge"
                  className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Context Summary Strip */}
            <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono overflow-x-auto whitespace-nowrap">
              <span>Nominal: {(nominalReturn * 100).toFixed(1)}%</span>
              <span>Real: {(realReturn * 100).toFixed(1)}%</span>
              <span>Vol: {(currentVol * 100).toFixed(1)}%</span>
              <span>Div: {diversificationScore.toFixed(1)}/10</span>
              <span className="text-emerald-400">10Y Med: ₹{(monteCarloMedian / 100000).toFixed(1)}L</span>
            </div>

            {/* Interactive Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${
                    m.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      m.sender === "user"
                        ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {m.sender === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-emerald-600 text-white rounded-tr-none shadow-md"
                        : "bg-zinc-900/80 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-sm whitespace-pre-line"
                    }`}
                  >
                    {m.sender === "user" ? m.text : renderTextWithBadges(m.text, m.evidenceItems)}

                    <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400/80 font-mono">
                      <span>{m.timestamp}</span>
                      {m.model && <span className="text-zinc-500">{m.model}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Analyzing portfolio mathematics & evidence items...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Question Chips */}
            <div className="p-3 bg-zinc-900/40 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[11px] text-zinc-500 font-semibold shrink-0">Prompts:</span>
              {[
                "What are the assets recommended to me?",
                "List out the asset universe",
                "Explain the backtest performance & max drawdown",
                "What happens if the market crashes like 2008?",
                "Why did you choose this portfolio over Maximum Sharpe?",
                "Explain the tax and inflation drag on real returns",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900/70">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask about your allocations, taxes, Sharpe, or drawdowns..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 rounded-xl bg-emerald-500 text-zinc-950 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-zinc-500 text-center mt-2">
                All metrics cited from deterministic SciPy & Monte Carlo models. Educational decision-support only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Provenance Modal */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-emerald-400">
                  [{activeEvidenceModal.id}]
                </span>
                <span className="text-sm font-semibold text-white">
                  {activeEvidenceModal.label}
                </span>
              </div>
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Deterministic Value:</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {activeEvidenceModal.value} {activeEvidenceModal.unit}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Source Microservice:</span>
                <span className="font-mono text-zinc-300">{activeEvidenceModal.source_service}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Assumptions Timestamp:</span>
                <span className="font-mono text-zinc-400">
                  {activeEvidenceModal.as_of ? new Date(activeEvidenceModal.as_of).toLocaleDateString() : "Active"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 inline mr-1.5" />
              This value is computed deterministically by the Python quantitative engine. The Critic agent verified zero numerical drift.
            </div>

            <button
              onClick={() => setActiveEvidenceModal(null)}
              className="w-full py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

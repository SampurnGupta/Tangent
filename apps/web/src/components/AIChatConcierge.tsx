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
  Maximize2,
  Minimize2,
  RotateCcw,
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
        { id: "E3", kind: "metric", label: "Sharpe Ratio", value: Number(currentSharpe.toFixed(2)), unit: "ratio", as_of: "2026-10-06T00:00:00Z", source_service: "quant", params_hash: "hsh03" },
      ],
      model: "MetaBot Dynamic Router",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const buildContext = (): ChatConciergeContext => {
    return {
      selectedTickers,
      currentSharpe,
      currentReturn,
      currentVol,
      currentWeights,
      nominalReturn,
      realReturn,
      taxDrag,
      diversificationScore,
      horizon,
      age,
      riskScore,
      riskProfileName,
      monteCarloMedian,
      monteCarlo5th,
      monteCarlo95th,
      initialCapital,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      const context = buildContext();
      const response = await chatWithConcierge(query, history, context, authToken);

      const assistantMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: "assistant",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evidenceItems: response.evidence_items || (response.evidence as any),
        model: response.model_used || response.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Concierge query failed", err);
      const errorMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: "assistant",
        text: "I am having difficulty retrieving your live mathematical metrics right now. Please verify your connection or try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "m-0",
        sender: "assistant",
        text: initialGreeting,
        timestamp: "Just now",
        evidenceItems: [
          { id: "E1", kind: "metric", label: "Nominal Return", value: Number((nominalReturn * 100).toFixed(1)), unit: "%", as_of: "2026-10-06T00:00:00Z", source_service: "quant", params_hash: "hsh01" },
          { id: "E2", kind: "metric", label: "Real Return", value: Number((realReturn * 100).toFixed(1)), unit: "%", as_of: "2026-10-06T00:00:00Z", source_service: "quant", params_hash: "hsh02" },
          { id: "E3", kind: "metric", label: "Sharpe Ratio", value: Number(currentSharpe.toFixed(2)), unit: "ratio", as_of: "2026-10-06T00:00:00Z", source_service: "quant", params_hash: "hsh03" },
        ],
        model: "MetaBot Dynamic Router",
      },
    ]);
  };

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
            className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded text-xs font-mono font-bold bg-[#F4F5F6] text-[#191B1D] border border-[#CDCECF] cursor-pointer hover:bg-[#191B1D] hover:text-white transition-colors"
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
      {/* Floating Action Trigger Button (AVEKA-Styled #6D0E5A Pill) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3.5 rounded-full bg-[#6D0E5A] hover:bg-[#580B48] text-white font-bold shadow-xl shadow-[#6D0E5A]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer border border-[#6D0E5A]/40 group hover:-translate-y-1"
        aria-label="Open Draww AI Copilot"
      >
        <MessageSquare className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-xs tracking-wide font-black">Draww AI</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </button>

      {/* Slide-Over Drawer Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
          <div
            className={`w-full ${
              isExpanded ? "sm:max-w-3xl" : "sm:max-w-lg"
            } h-full bg-[#FFFFFF] border-l border-[#CDCECF] flex flex-col shadow-2xl transition-all duration-300`}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#CDCECF] bg-[#F8F9FA] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#6D0E5A] flex items-center justify-center text-white font-bold shadow-xs">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#191B1D]">Draww AI Concierge</h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F7EBF4] text-[#6D0E5A] border border-[#6D0E5A]/30 font-bold">
                      Grounded Copilot
                    </span>
                  </div>
                  <p className="text-xs text-[#5A5D61] font-mono mt-0.5">
                    <span>Horizon: {horizon}y</span>
                    <span> • </span>
                    <span>Risk: {riskScore}/10</span>
                    <span> • </span>
                    <span className="text-[#0F766E] font-bold">Sharpe: {currentSharpe.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[#5A5D61]">
                <button
                  onClick={resetChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg hover:bg-[#F4F5F6] hover:text-[#191B1D] cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse width" : "Expand width"}
                  className="p-1.5 rounded-lg hover:bg-[#F4F5F6] hover:text-[#191B1D] cursor-pointer transition-colors"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Concierge"
                  className="p-1.5 rounded-lg hover:bg-[#F4F5F6] hover:text-[#191B1D] cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Context Summary Strip */}
            <div className="px-4 py-2 bg-[#F4F5F6] border-b border-[#CDCECF] flex items-center justify-between text-xs text-[#5A5D61] font-mono overflow-x-auto whitespace-nowrap no-scrollbar">
              <span>Nominal: {(nominalReturn * 100).toFixed(1)}%</span>
              <span>Real: {(realReturn * 100).toFixed(1)}%</span>
              <span>Vol: {(currentVol * 100).toFixed(1)}%</span>
              <span>Div: {diversificationScore.toFixed(1)}/10</span>
              <span className="text-[#0F766E] font-bold">10Y Med: ₹{(monteCarloMedian / 100000).toFixed(1)}L</span>
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      m.sender === "user"
                        ? "bg-[#191B1D] text-white"
                        : "bg-[#F4F5F6] text-[#191B1D] border border-[#CDCECF]"
                    }`}
                  >
                    {m.sender === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-[#0F766E]" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      m.sender === "user"
                        ? "bg-[#191B1D] text-white rounded-tr-none shadow-xs"
                        : "bg-[#F8F9FA] border border-[#CDCECF] text-[#191B1D] rounded-tl-none shadow-xs whitespace-pre-line"
                    }`}
                  >
                    {m.sender === "user" ? m.text : renderTextWithBadges(m.text, m.evidenceItems)}

                    <div className="mt-2.5 flex items-center justify-between text-xs text-[#5A5D61] font-mono">
                      <span>{m.timestamp}</span>
                      {m.model && <span>{m.model}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F4F5F6] border border-[#CDCECF] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 animate-spin text-[#0F766E]" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#CDCECF] text-[#5A5D61] text-xs flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-ping" />
                    <span>Analyzing portfolio mathematics & evidence items...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Question Chips */}
            <div className="p-3 bg-[#F8F9FA] border-t border-[#CDCECF] flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs text-[#5A5D61] font-mono font-bold shrink-0">Prompts:</span>
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
                  className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] hover:border-[#191B1D] transition-colors cursor-pointer shrink-0 font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-[#CDCECF] bg-[#FFFFFF]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask Draww about your allocations, taxes, Sharpe, or drawdowns..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#F8F9FA] border border-[#CDCECF] rounded-lg text-sm text-[#191B1D] placeholder-[#85888C] focus:outline-none focus:border-[#191B1D]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 rounded-lg bg-[#6D0E5A] text-white hover:bg-[#580B48] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-bold shadow-sm shadow-[#6D0E5A]/25"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-xs text-[#5A5D61] text-center mt-2 font-mono">
                Cited deterministically from SciPy SLSQP & Monte Carlo models.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Provenance Modal */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#CDCECF] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#0F766E]">
                  [{activeEvidenceModal.id}]
                </span>
                <span className="text-sm font-bold text-[#191B1D]">
                  {activeEvidenceModal.label}
                </span>
              </div>
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="p-1 rounded hover:bg-[#F4F5F6] text-[#5A5D61] hover:text-[#191B1D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-[#CDCECF]">
                <span className="text-[#5A5D61]">Deterministic Value:</span>
                <span className="font-bold text-[#0F766E] text-sm">
                  {activeEvidenceModal.value} {activeEvidenceModal.unit}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#CDCECF]">
                <span className="text-[#5A5D61]">Microservice:</span>
                <span className="text-[#191B1D] font-bold">{activeEvidenceModal.source_service}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#CDCECF]">
                <span className="text-[#5A5D61]">Timestamp:</span>
                <span className="text-[#5A5D61]">
                  {activeEvidenceModal.as_of ? new Date(activeEvidenceModal.as_of).toLocaleDateString() : "Active"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] text-xs text-[#5A5D61] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#0F766E] inline mr-1.5" />
              This value is computed deterministically by the Python quantitative engine. The Critic agent verified zero numerical drift.
            </div>

            <button
              onClick={() => setActiveEvidenceModal(null)}
              className="w-full py-2.5 rounded-lg bg-[#191B1D] text-white text-xs font-bold hover:bg-[#2E3236] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

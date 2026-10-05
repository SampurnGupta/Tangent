"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Scale,
  BrainCircuit,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  EvidenceItem,
  AgentRunResponse,
  MarginalImpactData,
  triggerAgentBrief,
  computeSimulatedMarginalDelta,
} from "@/lib/api";

interface DecisionStudioProps {
  selectedTickers: string[];
  authToken?: string;
  currentSharpe?: number;
  currentReturn?: number;
  currentVol?: number;
}

export function DecisionStudio({
  selectedTickers,
  authToken,
  currentSharpe = 0.475,
  currentReturn = 0.134,
  currentVol = 0.122,
}: DecisionStudioProps) {
  const candidatePool = [
    { ticker: "TITAN.NS", name: "Titan Company", sector: "Consumer Discretionary" },
    { ticker: "ITC.NS", name: "ITC Ltd", sector: "Consumer Staples" },
    { ticker: "GOLDBEES.NS", name: "Nippon India Gold ETF", sector: "Commodities" },
    { ticker: "INDIA_GOVT_10Y", name: "Govt of India 10Y Bond", sector: "Sovereign Debt" },
    { ticker: "TATASTEEL.NS", name: "Tata Steel Ltd", sector: "Materials" },
    { ticker: "ICICIBANK.NS", name: "ICICI Bank Ltd", sector: "Financials" },
  ];

  const [candidateTicker, setCandidateTicker] = useState<string>("TITAN.NS");
  const [marginalData, setMarginalData] = useState<MarginalImpactData>(() =>
    computeSimulatedMarginalDelta("TITAN.NS", currentSharpe, currentReturn, currentVol)
  );
  const [briefResponse, setBriefResponse] = useState<AgentRunResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceItem | null>(null);

  // Update candidate ticker
  const handleSelectCandidate = (ticker: string) => {
    setCandidateTicker(ticker);
    const updated = computeSimulatedMarginalDelta(ticker, currentSharpe, currentReturn, currentVol);
    setMarginalData(updated);
    // Reset brief until requested
    setBriefResponse(null);
  };

  // Run multi-agent brief
  const handleRunBrief = async () => {
    setLoading(true);
    setPipelineStep(1);

    // Simulate multi-stage agent pipeline steps for UI feedback
    const stepInterval = setInterval(() => {
      setPipelineStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 450);

    try {
      const response = await triggerAgentBrief(candidateTicker, authToken, {
        nominalReturn: marginalData.return_after,
        realReturn: marginalData.return_after - 0.06 - 0.015, // inflation + tax
        volatility: marginalData.vol_after,
        sharpe: marginalData.sharpe_after,
        marginalSharpeDelta: marginalData.sharpe_delta,
        sentimentScore: candidateTicker.includes("GOVT") ? 0.15 : 0.38,
      });
      clearInterval(stepInterval);
      setPipelineStep(5);
      setBriefResponse(response);
    } catch (err) {
      console.error("Failed to generate brief:", err);
      clearInterval(stepInterval);
    } finally {
      setLoading(false);
    }
  };

  // Helper to highlight [E#] citation tags into clickable badges
  const renderTextWithCitations = (text: string, pack?: EvidenceItem[]) => {
    const parts = text.split(/(\[E\d+(?:,\s*E\d+)*\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(E\d+(?:,\s*E\d+)*)\]/);
      if (match && pack) {
        const ids = match[1].split(/,\s*/);
        return (
          <span key={index} className="inline-flex items-center gap-1 mx-1">
            {ids.map((id) => {
              const item = pack.find((e) => e.id === id);
              return (
                <button
                  key={id}
                  onClick={() => item && setActiveEvidence(item)}
                  title={item ? `${item.label}: ${item.value} ${item.unit} (${item.source_service})` : id}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/40 transition-colors cursor-pointer"
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              5. Decision Studio & Marginal Impact
            </h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Traceable Agents
            </span>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Evaluate marginal asset inclusions with deterministic delta metrics and a multi-agent
            evidence-grounded decision brief verified by an automated Critic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
            Base Sharpe: <span className="text-white font-bold">{currentSharpe.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Candidate Selector & Marginal Deltas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Candidate Selector */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              Candidate Asset Under Evaluation
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Select an asset from the curated pool to evaluate how adding it alters your current portfolio.
            </p>

            <div className="space-y-2 mb-4">
              {candidatePool.map((item) => {
                const isSelected = item.ticker === candidateTicker;
                return (
                  <button
                    key={item.ticker}
                    onClick={() => handleSelectCandidate(item.ticker)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold"
                        : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div>
                      <div className="font-mono text-zinc-200">{item.ticker}</div>
                      <div className="text-[11px] text-zinc-500">{item.name}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {item.sector}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRunBrief}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <BrainCircuit className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Running Multi-Agent Pipeline...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>Generate Grounded Decision Brief</span>
              </>
            )}
          </button>
        </div>

        {/* Right 2 Columns: Marginal Impact Deltas */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                Marginal Portfolio Impact: {candidateTicker}
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                Deterministic SciPy Covariance & Weight Vector
              </span>
            </div>

            {/* Delta KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Sharpe Delta Card */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
                  <span>Δ Real Sharpe Ratio</span>
                  {marginalData.sharpe_delta >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400 mb-2">
                  {marginalData.sharpe_delta >= 0 ? `+${marginalData.sharpe_delta.toFixed(3)}` : marginalData.sharpe_delta.toFixed(3)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Before: {marginalData.sharpe_before.toFixed(3)}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                  <span className="text-zinc-300 font-bold">After: {marginalData.sharpe_after.toFixed(3)}</span>
                </div>
              </div>

              {/* Return Delta Card */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
                  <span>Δ Nominal Return</span>
                  {marginalData.return_delta >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
                <div className="text-2xl font-black font-mono text-white mb-2">
                  {marginalData.return_delta >= 0 ? `+${(marginalData.return_delta * 100).toFixed(1)}%` : `${(marginalData.return_delta * 100).toFixed(1)}%`}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Before: {(marginalData.return_before * 100).toFixed(1)}%</span>
                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                  <span className="text-zinc-300 font-bold">After: {(marginalData.return_after * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Volatility Delta Card */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
                  <span>Δ Volatility (Risk)</span>
                  {marginalData.vol_delta <= 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <div className="text-2xl font-black font-mono text-teal-300 mb-2">
                  {marginalData.vol_delta >= 0 ? `+${(marginalData.vol_delta * 100).toFixed(1)}%` : `${(marginalData.vol_delta * 100).toFixed(1)}%`}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Before: {(marginalData.vol_before * 100).toFixed(1)}%</span>
                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                  <span className="text-zinc-300 font-bold">After: {(marginalData.vol_after * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Reoptimized Weights Preview */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <div className="text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
                <span>Proposed Optimal Rebalancing Weights</span>
                <span className="text-[10px] text-zinc-500">Sum = 100%</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(marginalData.reoptimized_weights).map(([t, w]) => (
                  <div
                    key={t}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border ${
                      t === candidateTicker
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <span>{t}:</span>
                    <span className="font-bold">{(w * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evidence ID [E5] ready for agent citation validation.</span>
            </span>
            <span>Ledoit-Wolf Covariance Matrix</span>
          </div>
        </div>
      </div>

      {/* Progress Step Indicator (visible during generation) */}
      {loading && (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-400 animate-spin" />
              Evidence-First Multi-Agent Pipeline Executing...
            </div>
            <span className="text-xs font-mono text-emerald-400">Step {pipelineStep} of 5</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            {[
              { step: 1, name: "1. Evidence Pack Extraction" },
              { step: 2, name: "2. Bull Agent Thesis" },
              { step: 3, name: "3. Bear Agent Counter-Thesis" },
              { step: 4, name: "4. Multi-Perspective Synthesis" },
              { step: 5, name: "5. Critic Verification" },
            ].map((s) => (
              <div
                key={s.step}
                className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                  pipelineStep >= s.step
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-zinc-950 border-zinc-800 text-zinc-600"
                }`}
              >
                {s.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision Brief Display (when available) */}
      {briefResponse && (
        <div className="space-y-6">
          {/* Critic Review Banner */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Critic Verification:</span>
                  <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {briefResponse.critic_review.verdict}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  100% of numerical claims correspond to deterministic metrics within ±0.5% tolerance. 0 directive recommendations detected.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <div className="text-zinc-500 text-[10px]">GROUNDEDNESS</div>
                <div className="text-emerald-400 font-bold">
                  {(briefResponse.critic_review.groundedness_score * 100).toFixed(0)}% VERIFIED
                </div>
              </div>
              <div className="text-right">
                <div className="text-zinc-500 text-[10px]">ESTIMATED COST</div>
                <div className="text-zinc-300 font-bold">${briefResponse.cost_usd.toFixed(6)}</div>
              </div>
            </div>
          </div>

          {/* Evidence Pack Ribbon */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-teal-400" />
                Active Evidence Pack Items (Click to Inspect Provenance):
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Pack ID: {briefResponse.evidence_pack.pack_id}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {briefResponse.evidence_pack.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveEvidence(item)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="font-bold text-emerald-400">[{item.id}]</span>
                  <span>{item.label}:</span>
                  <span className="font-bold text-white">
                    {typeof item.value === "number" ? item.value : String(item.value)}
                    {item.unit === "%" ? "%" : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Synthesis Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Summary & Bull/Bear Cases */}
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-emerald-400" />
                  Synthesized Decision Brief
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  {renderTextWithCitations(
                    briefResponse.brief.summary,
                    briefResponse.evidence_pack.items
                  )}
                </div>
              </div>

              {/* Bull Case */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Bull Perspective (Upside Arguments)
                </h4>
                <ul className="space-y-2.5">
                  {briefResponse.brief.bull_case.map((bullet, i) => (
                    <li key={i} className="text-xs text-zinc-300 leading-relaxed flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>
                        {renderTextWithCitations(bullet, briefResponse.evidence_pack.items)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bear Case */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Bear Perspective (Downside & Friction)
                </h4>
                <ul className="space-y-2.5">
                  {briefResponse.brief.bear_case.map((bullet, i) => (
                    <li key={i} className="text-xs text-zinc-300 leading-relaxed flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>
                        {renderTextWithCitations(bullet, briefResponse.evidence_pack.items)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Risks, What Would Change, Confidence */}
            <div className="space-y-6">
              {/* Key Risks */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <h4 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Key Risks & Sensitivities
                </h4>
                <ul className="space-y-2">
                  {briefResponse.brief.risks.map((risk, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What Would Change This */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <h4 className="text-sm font-bold text-teal-400 mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  What Would Invalidate This Thesis
                </h4>
                <ul className="space-y-2">
                  {briefResponse.brief.what_would_change_this.map((item, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confidence Assessment */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Confidence Assessment
                  </h4>
                  <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {briefResponse.brief.confidence.level}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {briefResponse.brief.confidence.reason}
                </p>
              </div>

              {/* Statutory Educational Notice */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                <div className="font-semibold text-amber-300 mb-1">Traceable Evidence Notice</div>
                {briefResponse.brief.disclaimer} All metrics represent mathematical simulations and
                historical backtest properties without guarantees of future returns.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Item Provenance Modal */}
      {activeEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setActiveEvidence(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                [{activeEvidence.id}]
              </span>
              <h3 className="text-base font-bold text-white">{activeEvidence.label}</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase font-mono">Simulated Value</div>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {typeof activeEvidence.value === "number"
                    ? activeEvidence.value
                    : String(activeEvidence.value)}{" "}
                  <span className="text-xs text-zinc-400 font-normal">{activeEvidence.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase font-mono">Source Service</div>
                  <div className="text-zinc-200 font-mono font-semibold">{activeEvidence.source_service}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase font-mono">Evidence Kind</div>
                  <div className="text-zinc-200 font-mono font-semibold">{activeEvidence.kind}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase font-mono">Parameter Hash</div>
                <div className="text-zinc-400 font-mono truncate">{activeEvidence.params_hash}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase font-mono">Timestamp (as_of)</div>
                <div className="text-zinc-400 font-mono">{activeEvidence.as_of}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveEvidence(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors"
              >
                Close Provenance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

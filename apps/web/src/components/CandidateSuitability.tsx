"use client";

import React, { useState } from "react";
import {
  CandidatePortfolio,
  generateCandidatePortfolios,
  RiskProfile,
  DEFAULT_CURATED_ASSETS,
} from "@/lib/api";
import {
  Award,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sliders,
  Layers,
  Sparkles,
} from "lucide-react";

interface CandidateSuitabilityProps {
  selectedTickers: string[];
  riskProfile: RiskProfile;
  horizon: number;
  initialCapital?: number;
  onSelectPortfolio: (portfolio: CandidatePortfolio) => void;
  onProceed: () => void;
}

export function CandidateSuitability({
  selectedTickers,
  riskProfile,
  horizon,
  initialCapital = 1000000,
  onSelectPortfolio,
  onProceed,
}: CandidateSuitabilityProps) {
  const candidates = generateCandidatePortfolios(
    selectedTickers,
    riskProfile.score,
    horizon,
    initialCapital
  );

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("target_risk");

  const selectedCandidate =
    candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const handleChoose = (candidate: CandidatePortfolio) => {
    setSelectedCandidateId(candidate.id);
    onSelectPortfolio(candidate);
  };

  const getAssetName = (ticker: string) => {
    const found = DEFAULT_CURATED_ASSETS.find((a) => a.ticker === ticker);
    return found ? found.name : ticker;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>Stages 8 & 9: Candidate Portfolios & Suitability Layer</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Multi-Candidate Comparison & Investor Suitability Analysis
        </h2>
        <p className="text-xs text-zinc-400 max-w-2xl">
          We do not automatically recommend the Maximum Sharpe portfolio simply because of mathematical ratio. Our suitability engine compares 4 distinct candidate allocations against your risk capacity, investment horizon, and drawdown limits.
        </p>
      </div>

      {/* 4 Candidate Portfolios Side-by-Side (Stage 8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {candidates.map((cand) => {
          const isSelected = selectedCandidateId === cand.id;
          const isRecommended = cand.verdict === "Recommended";

          return (
            <div
              key={cand.id}
              onClick={() => handleChoose(cand)}
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all cursor-pointer relative ${
                isSelected
                  ? "bg-zinc-900 border-emerald-500/60 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 text-[10px] font-black tracking-wide shadow-md">
                  ★ MOST SUITABLE
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-white">{cand.name}</h3>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{cand.tagline}</p>
                </div>

                {/* Key Metrics */}
                <div className="space-y-2 py-2 border-y border-zinc-800/80 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-[11px]">Nominal Return</span>
                    <span className="font-bold text-emerald-400">
                      {(cand.expectedReturnNominal * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-[11px]">Real Return</span>
                    <span className="font-bold text-teal-400">
                      {(cand.expectedReturnReal * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-[11px]">Volatility (σ)</span>
                    <span className="text-zinc-300">
                      {(cand.annualVolatility * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-[11px]">Sharpe Ratio</span>
                    <span className="font-bold text-cyan-400">{cand.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-[11px]">Max Drawdown</span>
                    <span className="font-bold text-rose-400">
                      -{(cand.maxDrawdown * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Suitability Score Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Suitability Match:</span>
                    <span
                      className={`font-bold font-mono ${
                        cand.suitabilityScore >= 90
                          ? "text-emerald-400"
                          : cand.suitabilityScore >= 70
                          ? "text-teal-400"
                          : "text-amber-400"
                      }`}
                    >
                      {cand.suitabilityScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cand.suitabilityScore >= 90
                          ? "bg-emerald-500"
                          : cand.suitabilityScore >= 70
                          ? "bg-teal-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${cand.suitabilityScore}%` }}
                    />
                  </div>
                </div>

                {/* Asset Class Allocations Breakdown */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                    Asset Class Split
                  </span>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-zinc-900">
                    {Object.entries(cand.assetClassAllocations).map(([cls, share]) => (
                      <div
                        key={cls}
                        style={{ width: `${share * 100}%` }}
                        title={`${cls}: ${(share * 100).toFixed(0)}%`}
                        className={
                          cls === "equity"
                            ? "bg-emerald-500"
                            : cls === "debt"
                            ? "bg-teal-500"
                            : cls === "commodity"
                            ? "bg-amber-500"
                            : "bg-cyan-500"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Selection Button */}
              <button
                type="button"
                onClick={() => handleChoose(cand)}
                className={`w-full mt-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500 text-zinc-950 font-bold"
                    : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {isSelected ? "Selected Candidate ✓" : "Select Candidate"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Stage 9: Deep Suitability Layer Analysis Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="border-b border-zinc-800/80 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Stage 9: Suitability Evaluation Report
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Why the {selectedCandidate.name} is Recommended for You
            </h3>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            Suitability Score: {selectedCandidate.suitabilityScore}/100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Why Suitable */}
          <div className="space-y-3 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Investment Rationale</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {selectedCandidate.rationale}
            </p>
            <div className="pt-2 border-t border-zinc-800/60 space-y-1.5 text-[11px] text-zinc-400">
              <p>• Aligns with investor age ({riskProfile.score > 7 ? "early/growth phase" : "prime accumulation"}) and horizon ({horizon} years).</p>
              <p>• Max drawdown of {(selectedCandidate.maxDrawdown * 100).toFixed(1)}% stays within the psychological panic threshold.</p>
              <p>• Blended tax drag is contained to preserve purchasing power against 6.0% inflation.</p>
            </div>
          </div>

          {/* Rejected / Alternative Comparison */}
          <div className="space-y-3 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Transparent Comparison with Alternatives</span>
            </div>
            <div className="space-y-2 text-xs text-zinc-300">
              {candidates
                .filter((c) => c.id !== selectedCandidate.id)
                .map((alt) => (
                  <div key={alt.id} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/60 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <strong className="text-white">{alt.name}</strong>
                      <span className="text-zinc-500">Suitability: {alt.suitabilityScore}%</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {alt.rejectionReason || "Feasible alternative, but offers less balanced risk-adjusted alignment."}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Selected Portfolio Holdings Snapshot */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-200">
              Holdings Breakdown for {selectedCandidate.name} (Capital: ₹{initialCapital.toLocaleString("en-IN")})
            </span>
            <span className="font-mono text-zinc-400">
              {Object.keys(selectedCandidate.weights).length} Securities
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(selectedCandidate.weights)
              .sort((a, b) => b[1] - a[1])
              .map(([ticker, weight]) => {
                const amt = Math.round(initialCapital * weight);
                return (
                  <div
                    key={ticker}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-white block truncate max-w-[110px]">
                        {ticker}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate block max-w-[110px]">
                        {getAssetName(ticker)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400 block">
                        {(weight * 100).toFixed(1)}%
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400 block">
                        ₹{amt.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Proceed Action Bar */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onProceed}
            className="flex items-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-zinc-950 font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <span>Proceed to 10-Year Monte Carlo Projections</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

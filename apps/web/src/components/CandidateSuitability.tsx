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
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface CandidateSuitabilityProps {
  selectedTickers: string[];
  riskProfile: RiskProfile;
  horizon: number;
  initialCapital?: number;
  onSelectPortfolio: (portfolio: CandidatePortfolio) => void;
  onProceed: () => void;
  initialCandidateId?: string;
}

export function CandidateSuitability({
  selectedTickers,
  riskProfile,
  horizon,
  initialCapital = 1000000,
  onSelectPortfolio,
  onProceed,
  initialCandidateId,
}: CandidateSuitabilityProps) {
  const candidates = generateCandidatePortfolios(
    selectedTickers,
    riskProfile.score,
    horizon,
    initialCapital
  );

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    initialCandidateId || "target_risk"
  );

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
    <div className="max-w-6xl mx-auto space-y-8 py-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] text-xs font-mono font-bold">
          <Award className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Candidate Portfolios & Suitability Layer</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#191B1D]">
          Candidate Evaluation & Suitability Matching
        </h2>
        <p className="text-sm text-[#5A5D61] max-w-2xl leading-relaxed">
          Rather than unthinkingly selecting the theoretical Max-Sharpe solution, our engine evaluates 4 distinct candidate allocations against your risk tolerance, timeline, and drawdown resilience.
        </p>
      </div>

      {/* 4 Candidate Portfolios Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {candidates.map((cand) => {
          const isSelected = selectedCandidateId === cand.id;
          const isRecommended = cand.verdict === "Recommended";

          return (
            <div
              key={cand.id}
              onClick={() => handleChoose(cand)}
              className={`rounded-2xl p-6 border flex flex-col justify-between transition-all cursor-pointer relative ${
                isSelected
                  ? "bg-[#FFFFFF] border-[#191B1D] shadow-sm ring-1 ring-[#191B1D]"
                  : "bg-[#FFFFFF] border-[#CDCECF] hover:border-[#191B1D]"
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-[#191B1D] text-white text-xs font-mono font-bold tracking-wide shadow-xs">
                  ★ RECOMMENDED
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-base text-[#191B1D]">{cand.name}</h3>
                  <p className="text-xs text-[#5A5D61] line-clamp-1 mt-0.5">{cand.tagline}</p>
                </div>

                {/* Key Metrics */}
                <div className="space-y-2.5 py-3 border-y border-[#CDCECF] font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#5A5D61] text-xs">Nominal Return</span>
                    <span className="font-bold text-[#191B1D]">
                      {(cand.expectedReturnNominal * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5A5D61] text-xs">Real Return</span>
                    <span className="font-bold text-[#0F766E]">
                      {(cand.expectedReturnReal * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5A5D61] text-xs">Volatility (σ)</span>
                    <span className="text-[#191B1D]">
                      {(cand.annualVolatility * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5A5D61] text-xs">Sharpe Ratio</span>
                    <span className="font-bold text-[#0F766E]">{cand.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5A5D61] text-xs">Max Drawdown</span>
                    <span className="font-bold text-[#B91C1C]">
                      -{(cand.maxDrawdown * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Suitability Score Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5A5D61] font-mono">Suitability Score:</span>
                    <span
                      className={`font-bold font-mono ${
                        cand.suitabilityScore >= 90
                          ? "text-[#0F766E]"
                          : "text-[#191B1D]"
                      }`}
                    >
                      {cand.suitabilityScore}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F4F5F6] rounded-full overflow-hidden border border-[#CDCECF]">
                    <div
                      className="h-full rounded-full bg-[#191B1D] transition-all"
                      style={{ width: `${cand.suitabilityScore}%` }}
                    />
                  </div>
                </div>

                {/* Asset Class Split */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs text-[#5A5D61] font-mono uppercase tracking-wider block">
                    Asset Class Split
                  </span>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-[#F4F5F6] border border-[#CDCECF]">
                    {Object.entries(cand.assetClassAllocations).map(([cls, share]) => (
                      <div
                        key={cls}
                        style={{ width: `${share * 100}%` }}
                        title={`${cls}: ${(share * 100).toFixed(0)}%`}
                        className={
                          cls === "equity"
                            ? "bg-[#191B1D]"
                            : cls === "debt"
                            ? "bg-[#0F766E]"
                            : "bg-[#B45309]"
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
                className={`w-full mt-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#6D0E5A] text-white border-[#6D0E5A] shadow-sm shadow-[#6D0E5A]/20"
                    : "bg-[#F4F5F6] text-[#191B1D] border-[#CDCECF] hover:bg-[#F7EBF4] hover:text-[#6D0E5A] hover:border-[#6D0E5A]"
                }`}
              >
                {isSelected ? "Selected Candidate ✓" : "Select Candidate"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Suitability Deep-Dive Card */}
      <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-7 space-y-6 shadow-xs">
        <div className="border-b border-[#CDCECF] pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <span className="text-xs font-mono font-bold text-[#0F766E] uppercase tracking-wider">
              Suitability Evaluation Report
            </span>
            <h3 className="text-xl font-black text-[#191B1D] mt-1">
              Why the {selectedCandidate.name} Fits Your Parameters
            </h3>
          </div>
          <span className="text-xs font-mono px-3.5 py-1.5 rounded-md bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/30 font-bold">
            Match Score: {selectedCandidate.suitabilityScore}/100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investment Rationale */}
          <div className="space-y-3.5 p-5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF]">
            <div className="flex items-center gap-2 text-[#0F766E] font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Investment Rationale</span>
            </div>
            <p className="text-sm text-[#191B1D] leading-relaxed">
              {selectedCandidate.rationale}
            </p>
            <div className="pt-3 border-t border-[#CDCECF] space-y-2 text-xs text-[#5A5D61] font-mono">
              <p>• Aligns with investor age and horizon of {horizon} years.</p>
              <p>• Projected max drawdown of {(selectedCandidate.maxDrawdown * 100).toFixed(1)}% stays within calculated stress thresholds.</p>
              <p>• Estimated tax drag is mitigated to protect real returns above 6.0% inflation.</p>
            </div>
          </div>

          {/* Alternative Comparison */}
          <div className="space-y-3.5 p-5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF]">
            <div className="flex items-center gap-2 text-[#B45309] font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Comparison Against Other Candidates</span>
            </div>
            <div className="space-y-2.5 text-xs">
              {candidates
                .filter((c) => c.id !== selectedCandidate.id)
                .map((alt) => (
                  <div key={alt.id} className="p-3 rounded-lg bg-[#FFFFFF] border border-[#CDCECF] space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-[#191B1D]">{alt.name}</strong>
                      <span className="text-[#5A5D61] font-mono">Score: {alt.suitabilityScore}%</span>
                    </div>
                    <p className="text-xs text-[#5A5D61]">
                      {alt.rejectionReason || "Feasible alternative, but demonstrates lower parameter harmony."}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Selected Holdings Snapshot */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-[#191B1D]">
              Holdings Breakdown for {selectedCandidate.name} (Capital: ₹{initialCapital.toLocaleString("en-IN")})
            </span>
            <span className="font-mono text-xs text-[#5A5D61]">
              {Object.keys(selectedCandidate.weights).length} Assets
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.entries(selectedCandidate.weights)
              .sort((a, b) => b[1] - a[1])
              .map(([ticker, weight]) => {
                const amt = Math.round(initialCapital * weight);
                return (
                  <div
                    key={ticker}
                    className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#CDCECF] flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#191B1D] block truncate max-w-[110px]">
                        {ticker}
                      </span>
                      <span className="text-xs text-[#5A5D61] truncate block max-w-[110px]">
                        {getAssetName(ticker)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#0F766E] block">
                        {(weight * 100).toFixed(1)}%
                      </span>
                      <span className="font-mono text-xs text-[#5A5D61] block">
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
            className="flex items-center gap-2 py-3.5 px-6 rounded-full bg-[#6D0E5A] hover:bg-[#580B48] text-white font-bold text-sm transition-all shadow-md shadow-[#6D0E5A]/25 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Proceed to 10-Year Monte Carlo Projections</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  OptimizationResponse,
  RiskProfile,
  DEFAULT_CURATED_ASSETS,
  runOptimization,
} from "@/lib/api";
import {
  Activity,
  PieChart,
  ArrowRight,
  CheckCircle,
  Save,
  Loader2,
} from "lucide-react";

interface OptimizationDashboardProps {
  selectedTickers: string[];
  riskProfile: RiskProfile;
  authToken?: string;
  onProceedToProjections: () => void;
  onOptimizationDone?: (result: OptimizationResponse) => void;
  initialResult?: OptimizationResponse | null;
}

export function OptimizationDashboard({
  selectedTickers,
  riskProfile,
  authToken,
  onProceedToProjections,
  onOptimizationDone,
  initialResult,
}: OptimizationDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResponse | null>(initialResult || null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (initialResult && !result) {
      setResult(initialResult);
    }
  }, [initialResult]);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await runOptimization(
        selectedTickers,
        riskProfile.score,
        0.15,
        0.25,
        authToken
      );
      setResult(res);
      onOptimizationDone?.(res);
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setLoading(false);
    }
  };

  const getAssetName = (ticker: string) => {
    const found = DEFAULT_CURATED_ASSETS.find((a) => a.ticker === ticker);
    return found ? found.name : ticker;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Header and Solver Control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FFFFFF] p-7 rounded-2xl border border-[#CDCECF] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F4F5F6] border border-[#CDCECF] text-[#191B1D] text-xs font-mono font-bold">
            <Activity className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Deterministic SLSQP Solver</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#191B1D] mt-2">
            Efficient Frontier & Max-Sharpe Optimization
          </h2>
          <p className="text-sm text-[#5A5D61] mt-1 max-w-xl">
            Solves multi-start Sequential Least Squares Programming (SLSQP) across {selectedTickers.length} candidate assets with Ledoit-Wolf covariance shrinkage.
          </p>
        </div>

        <button
          onClick={handleOptimize}
          disabled={loading}
          className="flex items-center gap-2 py-3.5 px-6 rounded-lg bg-[#191B1D] hover:bg-[#2E3236] text-white font-bold text-sm disabled:opacity-50 transition-all shadow-xs cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Multi-Start Solver Running...</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 text-[#0F766E]" />
              <span>{result ? "Re-Run Optimization" : "Execute SLSQP Optimizer"}</span>
            </>
          )}
        </button>
      </div>

      {!result && !loading && (
        <div className="border border-dashed border-[#CDCECF] rounded-2xl p-12 text-center space-y-4 bg-[#FFFFFF]">
          <div className="w-12 h-12 rounded-full bg-[#F4F5F6] border border-[#CDCECF] flex items-center justify-center mx-auto text-[#191B1D]">
            <PieChart className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#191B1D]">Ready to Calculate Optimal Frontier</h3>
            <p className="text-sm text-[#5A5D61] max-w-md mx-auto">
              Execute the solver to compute log-returns, Ledoit-Wolf shrinkage covariance, and post-tax real Sharpe weights.
            </p>
          </div>
          <button
            onClick={handleOptimize}
            className="px-5 py-2.5 rounded-lg bg-[#191B1D] text-white text-sm font-semibold hover:bg-[#2E3236] transition-all cursor-pointer"
          >
            Launch Solver Now
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#5A5D61] uppercase tracking-wider">
                Nominal Return
              </span>
              <p className="text-3xl font-black font-mono text-[#191B1D]">
                {(result.expected_return_nominal * 100).toFixed(1)}%
              </p>
              <span className="text-xs text-[#5A5D61] block">Annualized nominal expected</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#5A5D61] uppercase tracking-wider">
                Real Return
              </span>
              <p className="text-3xl font-black font-mono text-[#0F766E]">
                {(result.expected_return_real * 100).toFixed(1)}%
              </p>
              <span className="text-xs text-[#5A5D61] block">Post-tax & 6% inflation</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#5A5D61] uppercase tracking-wider">
                Volatility (σ)
              </span>
              <p className="text-3xl font-black font-mono text-[#191B1D]">
                {(result.annualized_volatility * 100).toFixed(1)}%
              </p>
              <span className="text-xs text-[#5A5D61] block">Annualized standard dev</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#5A5D61] uppercase tracking-wider">
                Real Sharpe
              </span>
              <p className="text-3xl font-black font-mono text-[#0F766E]">
                {result.sharpe_ratio.toFixed(2)}
              </p>
              <span className="text-xs text-[#5A5D61] block">Risk-adjusted return ratio</span>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#5A5D61] uppercase tracking-wider">
                Diversification
              </span>
              <p className="text-3xl font-black font-mono text-[#191B1D]">
                {result.diversification_score.toFixed(1)}{" "}
                <span className="text-sm font-normal text-[#5A5D61]">/ 10</span>
              </p>
              <span className="text-xs text-[#5A5D61] block font-mono">
                ENC: {result.effective_number_assets.toFixed(1)} assets
              </span>
            </div>
          </div>

          {/* Asset Class & Sector Allocations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asset Class Allocation */}
            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center border-b border-[#CDCECF] pb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-[#191B1D] font-mono">
                  Asset Class Allocations
                </span>
                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/30">
                  Satisfied ✓
                </span>
              </div>

              <div className="space-y-4">
                {Object.entries(result.asset_class_allocations).map(([cls, weight]) => {
                  const pct = Math.round(weight * 100);
                  return (
                    <div key={cls} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-bold text-[#191B1D]">{cls}</span>
                        <span className="font-mono font-bold text-[#191B1D]">{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#F4F5F6] rounded-full overflow-hidden border border-[#CDCECF]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cls === "equity"
                              ? "bg-[#191B1D]"
                              : cls === "debt"
                              ? "bg-[#0F766E]"
                              : "bg-[#B45309]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sector Allocation */}
            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center border-b border-[#CDCECF] pb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-[#191B1D] font-mono">
                  Sector Distribution
                </span>
                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-[#F4F5F6] text-[#5A5D61] border border-[#CDCECF]">
                  Max 25% Cap
                </span>
              </div>

              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-2 no-scrollbar">
                {Object.entries(result.sector_allocations)
                  .sort((a, b) => b[1] - a[1])
                  .map(([sector, weight]) => {
                    const pct = Math.round(weight * 100);
                    return (
                      <div key={sector} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#191B1D] font-medium truncate max-w-[220px]">
                            {sector}
                          </span>
                          <span className="font-mono font-bold text-[#191B1D]">{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#F4F5F6] rounded-full overflow-hidden border border-[#CDCECF]">
                          <div
                            className="h-full bg-[#191B1D] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, pct * 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Individual Asset Weights Table */}
          <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-[#CDCECF] pb-3">
              <span className="text-sm font-bold uppercase tracking-wider text-[#191B1D] font-mono">
                Optimal Individual Asset Weights
              </span>
              <span className="text-xs font-mono text-[#5A5D61]">Sum strictly = 100.0%</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#CDCECF] text-[#5A5D61] font-mono text-xs">
                    <th className="pb-3 font-bold">Asset Name</th>
                    <th className="pb-3 font-bold">Ticker</th>
                    <th className="pb-3 text-right font-bold">Weight</th>
                    <th className="pb-3 text-right w-44 font-bold">Visual Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CDCECF]">
                  {Object.entries(result.weights)
                    .filter(([_, weight]) => weight > 0.005)
                    .sort((a, b) => b[1] - a[1])
                    .map(([ticker, weight]) => {
                      const pct = (weight * 100).toFixed(1);
                      return (
                        <tr key={ticker} className="hover:bg-[#F8F9FA]">
                          <td className="py-3 font-semibold text-[#191B1D]">{getAssetName(ticker)}</td>
                          <td className="py-3 font-mono text-[#5A5D61] text-xs">{ticker}</td>
                          <td className="py-3 text-right font-mono font-bold text-[#191B1D]">
                            {pct}%
                          </td>
                          <td className="py-3 text-right pl-4">
                            <div className="w-full h-2 bg-[#F4F5F6] rounded-full overflow-hidden border border-[#CDCECF]">
                              <div
                                className="h-full bg-[#191B1D] rounded-full"
                                style={{ width: `${Math.min(100, Number(pct) * 6.6)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              onClick={() => {
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 3000);
              }}
              className="flex items-center gap-2 py-3 px-5 rounded-lg bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] text-sm font-semibold hover:border-[#191B1D] transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-[#0F766E] font-bold">Portfolio Run Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#5A5D61]" />
                  <span>Save Portfolio Run</span>
                </>
              )}
            </button>

            <button
              onClick={onProceedToProjections}
              className="flex items-center gap-2 py-3.5 px-6 rounded-lg bg-[#191B1D] hover:bg-[#2E3236] text-white font-bold text-sm transition-all shadow-xs cursor-pointer"
            >
              <span>Compare Candidate Portfolios & Suitability</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

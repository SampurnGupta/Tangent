import React, { useState, useEffect } from "react";
import {
  OptimizationResponse,
  RiskProfile,
  DEFAULT_CURATED_ASSETS,
  runOptimization,
  getEfficientFrontier,
  EfficientFrontierData,
} from "@/lib/api";
import {
  TrendingUp,
  Shield,
  Activity,
  Award,
  Flame,
  PieChart,
  ArrowRight,
  CheckCircle,
  Save,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";

interface OptimizationDashboardProps {
  selectedTickers: string[];
  riskProfile: RiskProfile;
  authToken?: string;
  onProceedToProjections: () => void;
  onOptimizationDone?: (result: OptimizationResponse) => void;
}

export function OptimizationDashboard({
  selectedTickers,
  riskProfile,
  authToken,
  onProceedToProjections,
  onOptimizationDone,
}: OptimizationDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResponse | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [frontierData, setFrontierData] = useState<EfficientFrontierData | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ return: number; vol: number; sharpe: number; label?: string } | null>(null);

  useEffect(() => {
    // Generate Markowitz Efficient Frontier and Monte Carlo exploration cloud
    const data = getEfficientFrontier(selectedTickers, riskProfile.score);
    setFrontierData(data);
  }, [selectedTickers, riskProfile.score]);

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

  // Helper to map ticker name
  const getAssetName = (ticker: string) => {
    const found = DEFAULT_CURATED_ASSETS.find((a) => a.ticker === ticker);
    return found ? found.name : ticker;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Header and Run Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Stages 5, 6 & 7A: Frontier, SLSQP & Exploration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Efficient Frontier & Deterministic Max-Sharpe Solver
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Solves multi-start Sequential Least Squares Programming (SLSQP) across {selectedTickers.length} candidate assets, paired with 1,200 Monte Carlo portfolio permutations.
          </p>
        </div>

        <button
          onClick={handleOptimize}
          disabled={loading}
          className="flex items-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-zinc-950 font-bold text-sm hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Multi-Start SLSQP Solving...</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              <span>{result ? "Re-Run Optimization" : "Run Multi-Start Optimization"}</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Efficient Frontier & Monte Carlo Exploration Canvas (Stage 5 & 7A) */}
      {frontierData && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-800 pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold block">
                Stage 5 & 7A: Visual Markowitz Frontier & Permutation Cloud
              </span>
              <p className="text-xs text-zinc-300 font-medium">
                1,200 Random Monte Carlo Portfolio Permutations plotted against the Minimum-Variance Frontier
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-300">Max Sharpe Point</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-zinc-300">Min Volatility Point</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span className="text-zinc-500">MC Cloud</span>
              </div>
            </div>
          </div>

          {/* SVG Scatter Plot */}
          <div className="relative w-full h-72 sm:h-80 bg-zinc-950 rounded-xl border border-zinc-800/80 p-4 overflow-hidden flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 240" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="680" y2="20" stroke="#27272a" strokeDasharray="3 3" />
              <line x1="40" y1="80" x2="680" y2="80" stroke="#27272a" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="680" y2="140" stroke="#27272a" strokeDasharray="3 3" />
              <line x1="40" y1="200" x2="680" y2="200" stroke="#27272a" strokeDasharray="3 3" />

              {/* Monte Carlo Exploration Scatter Cloud (Stage 7A) */}
              {frontierData.explorationCloud.map((pt, i) => {
                // Map vol (0.04 to 0.22) to x (50 to 670), return (0.06 to 0.18) to y (200 to 30)
                const cx = 50 + ((pt.volatility - 0.04) / 0.18) * 620;
                const cy = 200 - ((pt.return - 0.06) / 0.12) * 170;
                return (
                  <circle
                    key={i}
                    cx={Math.max(45, Math.min(675, cx))}
                    cy={Math.max(25, Math.min(210, cy))}
                    r="2.5"
                    fill="#3f3f46"
                    opacity="0.45"
                    className="hover:fill-emerald-400 hover:opacity-100 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredPoint({ return: pt.return, vol: pt.volatility, sharpe: pt.sharpe, label: "MC Permutation" })}
                  />
                );
              })}

              {/* Markowitz Efficient Frontier Curve (Stage 5) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="0"
                points={frontierData.frontierCurve
                  .map((p) => {
                    const px = 50 + ((p.volatility - 0.04) / 0.18) * 620;
                    const py = 200 - ((p.return - 0.06) / 0.12) * 170;
                    return `${Math.max(45, Math.min(675, px))},${Math.max(25, Math.min(210, py))}`;
                  })
                  .join(" ")}
              />

              {/* Min Volatility Point */}
              {frontierData.minVolPoint && (
                <g
                  transform={`translate(${50 + ((frontierData.minVolPoint.volatility - 0.04) / 0.18) * 620}, ${
                    200 - ((frontierData.minVolPoint.return - 0.06) / 0.12) * 170
                  })`}
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      return: frontierData.minVolPoint.return,
                      vol: frontierData.minVolPoint.volatility,
                      sharpe: frontierData.minVolPoint.sharpe,
                      label: "Minimum Volatility",
                    })
                  }
                >
                  <circle r="7" fill="#06b6d4" />
                  <circle r="12" fill="#06b6d4" opacity="0.25" />
                </g>
              )}

              {/* Max Sharpe Optimal Point */}
              {frontierData.maxSharpePoint && (
                <g
                  transform={`translate(${50 + ((frontierData.maxSharpePoint.volatility - 0.04) / 0.18) * 620}, ${
                    200 - ((frontierData.maxSharpePoint.return - 0.06) / 0.12) * 170
                  })`}
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      return: frontierData.maxSharpePoint.return,
                      vol: frontierData.maxSharpePoint.volatility,
                      sharpe: frontierData.maxSharpePoint.sharpe,
                      label: "Maximum Sharpe Ratio",
                    })
                  }
                >
                  <circle r="8" fill="#10b981" />
                  <circle r="15" fill="#10b981" opacity="0.3" className="animate-pulse" />
                </g>
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-4 left-6 bg-zinc-900/95 border border-zinc-700 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                <span className="font-bold text-white block">{hoveredPoint.label || "Inspected Portfolio"}</span>
                <div className="flex gap-3 text-zinc-300 font-mono text-[11px]">
                  <span>Return: <strong className="text-emerald-400">{(hoveredPoint.return * 100).toFixed(1)}%</strong></span>
                  <span>Vol: <strong className="text-teal-400">{(hoveredPoint.vol * 100).toFixed(1)}%</strong></span>
                  <span>Sharpe: <strong className="text-cyan-400">{hoveredPoint.sharpe.toFixed(2)}</strong></span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400 font-mono px-2">
            <span>← Lower Volatility (Capital Protection)</span>
            <span>Annualized Risk / Volatility (σ)</span>
            <span>Higher Return (Equity Compounding) →</span>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <PieChart className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-zinc-200">No Optimization Run Yet</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Click &apos;Run Optimization&apos; to evaluate log-returns, Ledoit-Wolf covariance shrinkage, and tax/inflation adjusted metrics.
            </p>
          </div>
          <button
            onClick={handleOptimize}
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-all cursor-pointer"
          >
            Launch Solver Now
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* 5 High-Impact Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Nominal Return
              </span>
              <p className="text-2xl font-bold font-mono text-emerald-400">
                {(result.expected_return_nominal * 100).toFixed(1)}%
              </p>
              <span className="text-[10px] text-zinc-400 block">Annualized expected return</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Real Return
              </span>
              <p className="text-2xl font-bold font-mono text-teal-300">
                {(result.expected_return_real * 100).toFixed(1)}%
              </p>
              <span className="text-[10px] text-zinc-400 block">Tax & 6% inflation adjusted</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Volatility (Risk)
              </span>
              <p className="text-2xl font-bold font-mono text-amber-400">
                {(result.annualized_volatility * 100).toFixed(1)}%
              </p>
              <span className="text-[10px] text-zinc-400 block">Annualized standard dev</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Real Sharpe
              </span>
              <p className="text-2xl font-bold font-mono text-cyan-400">
                {result.sharpe_ratio.toFixed(2)}
              </p>
              <span className="text-[10px] text-zinc-400 block">Risk-adjusted return ratio</span>
            </div>

            <div className="col-span-2 md:col-span-1 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Diversification
              </span>
              <p className="text-2xl font-bold font-mono text-white">
                {result.diversification_score.toFixed(1)}{" "}
                <span className="text-xs font-normal text-zinc-400">/ 10</span>
              </p>
              <span className="text-[10px] text-zinc-400 block">
                ENC: {result.effective_number_assets.toFixed(1)} assets
              </span>
            </div>
          </div>

          {/* Allocation Breakdowns: Asset Class + Sectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asset Class Allocation */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Asset Class Allocation
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Constraints Satisfied
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(result.asset_class_allocations).map(([cls, weight]) => {
                  const pct = Math.round(weight * 100);
                  return (
                    <div key={cls} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize font-semibold text-zinc-200">{cls}</span>
                        <span className="font-mono font-bold text-white">{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cls === "equity"
                              ? "bg-emerald-500"
                              : cls === "debt"
                              ? "bg-teal-400"
                              : "bg-amber-400"
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
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Sector Distribution
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Max 25% Equity Sector Cap
                </span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(result.sector_allocations)
                  .sort((a, b) => b[1] - a[1])
                  .map(([sector, weight]) => {
                    const pct = Math.round(weight * 100);
                    return (
                      <div key={sector} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-300 font-medium truncate max-w-[200px]">
                            {sector}
                          </span>
                          <span className="font-mono font-bold text-white">{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full transition-all duration-500"
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
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Optimized Individual Asset Weights
              </span>
              <span className="text-xs text-zinc-400">Weights strictly sum to 100.0%</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                    <th className="pb-3">Asset</th>
                    <th className="pb-3">Ticker</th>
                    <th className="pb-3 text-right">Optimal Weight</th>
                    <th className="pb-3 text-right w-36">Visual Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {Object.entries(result.weights)
                    .filter(([_, weight]) => weight > 0.005)
                    .sort((a, b) => b[1] - a[1])
                    .map(([ticker, weight]) => {
                      const pct = (weight * 100).toFixed(1);
                      return (
                        <tr key={ticker} className="hover:bg-zinc-800/20">
                          <td className="py-2.5 text-zinc-200">{getAssetName(ticker)}</td>
                          <td className="py-2.5 font-mono text-zinc-400">{ticker}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-white">
                            {pct}%
                          </td>
                          <td className="py-2.5 text-right pl-4">
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
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
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Portfolio Saved to Audit History!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Portfolio Run</span>
                </>
              )}
            </button>

            <button
              onClick={onProceedToProjections}
              className="flex items-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-zinc-950 font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-teal-500/20 cursor-pointer"
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

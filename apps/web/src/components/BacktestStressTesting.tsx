"use client";

import React, { useState } from "react";
import {
  runBacktest,
  runStressTest,
  BacktestReport,
  StressTestScenario,
} from "@/lib/api";
import {
  ShieldAlert,
  TrendingUp,
  Activity,
  Award,
  AlertTriangle,
  ArrowRight,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";

interface BacktestStressTestingProps {
  weights: Record<string, number>;
  horizon?: number;
  initialCapital?: number;
  onProceed: () => void;
}

export function BacktestStressTesting({
  weights,
  horizon = 10,
  initialCapital = 1000000,
  onProceed,
}: BacktestStressTestingProps) {
  const [activeTab, setActiveTab] = useState<"backtest" | "stress">("backtest");

  const backtest: BacktestReport = runBacktest(weights, horizon);
  const stressScenarios: StressTestScenario[] = runStressTest(weights);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>Stages 10 & 11: Historical Backtest & Crisis Stress Testing</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Historical Walk-Forward Verification & Extreme Macro Shocks
        </h2>
        <p className="text-xs text-zinc-400 max-w-2xl">
          We backtest the exact asset weights against 10 years of market history (2016–2025) and subject the portfolio to 6 extreme macro crises to verify drawdown resilience.
        </p>
      </div>

      {/* Sub-Tabs: Stage 10 vs Stage 11 */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("backtest")}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "backtest"
              ? "border-emerald-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Stage 10: 10-Year Historical Backtest
        </button>
        <button
          onClick={() => setActiveTab("stress")}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "stress"
              ? "border-rose-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Stage 11: 6 Crisis Stress Scenarios
        </button>
      </div>

      {/* Stage 10: Backtest View */}
      {activeTab === "backtest" && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-zinc-400 font-sans uppercase tracking-wider block">CAGR (10Y)</span>
              <p className="text-2xl font-bold text-emerald-400">{(backtest.cagr * 100).toFixed(1)}%</p>
              <span className="text-[10px] text-zinc-500 font-sans">Compounded growth</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-zinc-400 font-sans uppercase tracking-wider block">Annual Volatility</span>
              <p className="text-2xl font-bold text-teal-400">{(backtest.annualizedVolatility * 100).toFixed(1)}%</p>
              <span className="text-[10px] text-zinc-500 font-sans">Realized risk</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-zinc-400 font-sans uppercase tracking-wider block">Sharpe Ratio</span>
              <p className="text-2xl font-bold text-cyan-400">{backtest.sharpeRatio.toFixed(2)}</p>
              <span className="text-[10px] text-zinc-500 font-sans">Excess return / risk</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-zinc-400 font-sans uppercase tracking-wider block">Sortino Ratio</span>
              <p className="text-2xl font-bold text-indigo-400">{backtest.sortinoRatio.toFixed(2)}</p>
              <span className="text-[10px] text-zinc-500 font-sans">Downside risk-adjusted</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-zinc-400 font-sans uppercase tracking-wider block">Max Drawdown</span>
              <p className="text-2xl font-bold text-rose-400">-{(backtest.maxDrawdown * 100).toFixed(1)}%</p>
              <span className="text-[10px] text-zinc-500 font-sans">Peak-to-trough drop</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-zinc-400 font-sans uppercase tracking-wider block">Calmar Ratio</span>
              <p className="text-2xl font-bold text-amber-400">{backtest.calmarRatio.toFixed(2)}</p>
              <span className="text-[10px] text-zinc-500 font-sans">CAGR / Max DD</span>
            </div>
          </div>

          {/* Benchmark Comparison Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Institutional Benchmark Comparison (2016–2025)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] text-zinc-400">
                    <th className="py-2.5 font-medium">Strategy / Benchmark</th>
                    <th className="py-2.5 font-medium">10Y CAGR</th>
                    <th className="py-2.5 font-medium">Max Drawdown</th>
                    <th className="py-2.5 font-medium">Sharpe Ratio</th>
                    <th className="py-2.5 font-medium">Recovery Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  <tr className="bg-emerald-500/5 text-white font-bold">
                    <td className="py-3 font-sans text-emerald-300">★ Your Tangent Portfolio</td>
                    <td className="py-3 text-emerald-400">{(backtest.cagr * 100).toFixed(1)}%</td>
                    <td className="py-3 text-rose-400">-{(backtest.maxDrawdown * 100).toFixed(1)}%</td>
                    <td className="py-3 text-cyan-400">{backtest.sharpeRatio.toFixed(2)}</td>
                    <td className="py-3 font-sans text-emerald-400">{backtest.recoveryPeriodMonths} Months</td>
                  </tr>
                  <tr className="text-zinc-300">
                    <td className="py-3 font-sans">Nifty 50 Index (Pure Indian Equity)</td>
                    <td className="py-3">{(backtest.benchmarkComparison.nifty50.cagr * 100).toFixed(1)}%</td>
                    <td className="py-3 text-rose-400">-{(backtest.benchmarkComparison.nifty50.maxDrawdown * 100).toFixed(1)}%</td>
                    <td className="py-3">{backtest.benchmarkComparison.nifty50.sharpe.toFixed(2)}</td>
                    <td className="py-3 font-sans text-zinc-400">14 Months</td>
                  </tr>
                  <tr className="text-zinc-300">
                    <td className="py-3 font-sans">Traditional 60/40 Equity/Debt Benchmark</td>
                    <td className="py-3">{(backtest.benchmarkComparison.balanced6040.cagr * 100).toFixed(1)}%</td>
                    <td className="py-3 text-rose-400">-{(backtest.benchmarkComparison.balanced6040.maxDrawdown * 100).toFixed(1)}%</td>
                    <td className="py-3">{backtest.benchmarkComparison.balanced6040.sharpe.toFixed(2)}</td>
                    <td className="py-3 font-sans text-zinc-400">9 Months</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Yearly Returns Progression */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Yearly Historical Returns (2016–2025)</span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Portfolio</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-zinc-600" /> Benchmark (60/40)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
              {backtest.yearlyReturns.map((yr) => {
                const isPositive = yr.portfolio >= 0;
                return (
                  <div key={yr.year} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                    <div className="flex justify-between text-zinc-400 text-[11px] font-sans">
                      <span>{yr.year}</span>
                      <span className={yr.portfolio > yr.benchmark ? "text-emerald-400" : "text-zinc-500"}>
                        {yr.portfolio > yr.benchmark ? "Beat ✓" : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {(yr.portfolio * 100).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        bm: {(yr.benchmark * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stage 11: Stress Testing View */}
      {activeTab === "stress" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              Adverse macro scenario stress testing applies historical shocks to evaluate capital drawdown and recovery duration under black swan events.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stressScenarios.map((sc) => (
              <div
                key={sc.id}
                className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-white">{sc.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                      {sc.period}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{sc.description}</p>
                </div>

                <div className="space-y-2 py-2 border-y border-zinc-800/80 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-[11px] font-sans">Portfolio Drawdown</span>
                    <span className="font-bold text-rose-400">{(sc.portfolioDrawdown * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-[11px] font-sans">Unhedged Benchmark</span>
                    <span className="text-zinc-500">{(sc.benchmarkDrawdown * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-[11px] font-sans">Est. Recovery Duration</span>
                    <span className="text-emerald-400 font-sans">{sc.recoveryMonths} Months</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Resilience Rating:</span>
                    <span className="font-bold font-mono text-emerald-400">{sc.resilienceScore}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${sc.resilienceScore}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 italic leading-tight">
                    Protection: {sc.driver}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proceed Action Bar */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onProceed}
          className="flex items-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-zinc-950 font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <span>Proceed to Final Recommendation & Draww AI</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

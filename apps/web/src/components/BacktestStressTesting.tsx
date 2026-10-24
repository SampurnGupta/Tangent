"use client";

import React, { useState } from "react";
import {
  runBacktest,
  runStressTest,
  BacktestReport,
  StressTestScenario,
} from "@/lib/api";
import {
  Activity,
  Award,
  AlertTriangle,
  ArrowRight,
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
    <div className="max-w-6xl mx-auto space-y-8 py-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] text-xs font-mono font-bold">
          <Activity className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Walk-Forward Backtest & Macro Stress Verification</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#191B1D]">
          Historical Verification & Extreme Crisis Stress
        </h2>
        <p className="text-sm text-[#5A5D61] max-w-2xl leading-relaxed">
          Walk-forward backtesting validates portfolio resilience against 10 years of market history (2016–2025) and subjects allocations to historical crisis shocks.
        </p>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-[#CDCECF] gap-4">
        <button
          onClick={() => setActiveTab("backtest")}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "backtest"
              ? "border-[#191B1D] text-[#191B1D]"
              : "border-transparent text-[#5A5D61] hover:text-[#191B1D]"
          }`}
        >
          10-Year Historical Backtest
        </button>
        <button
          onClick={() => setActiveTab("stress")}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "stress"
              ? "border-[#191B1D] text-[#191B1D]"
              : "border-transparent text-[#5A5D61] hover:text-[#191B1D]"
          }`}
        >
          Crisis Stress Scenarios
        </button>
      </div>

      {/* Backtest View */}
      {activeTab === "backtest" && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono">
            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-4 space-y-1 shadow-xs">
              <span className="text-xs text-[#5A5D61] font-mono uppercase tracking-wider block">10Y CAGR</span>
              <p className="text-2xl font-black text-[#0F766E]">{(backtest.cagr * 100).toFixed(1)}%</p>
              <span className="text-xs text-[#5A5D61] font-sans">Compounded growth</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-4 space-y-1 shadow-xs">
              <span className="text-xs text-[#5A5D61] font-mono uppercase tracking-wider block">Volatility</span>
              <p className="text-2xl font-black text-[#191B1D]">{(backtest.annualizedVolatility * 100).toFixed(1)}%</p>
              <span className="text-xs text-[#5A5D61] font-sans">Realized risk</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-4 space-y-1 shadow-xs">
              <span className="text-xs text-[#5A5D61] font-mono uppercase tracking-wider block">Sharpe Ratio</span>
              <p className="text-2xl font-black text-[#0F766E]">{backtest.sharpeRatio.toFixed(2)}</p>
              <span className="text-xs text-[#5A5D61] font-sans">Excess return/risk</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-4 space-y-1 shadow-xs">
              <span className="text-xs text-[#5A5D61] font-mono uppercase tracking-wider block">Sortino Ratio</span>
              <p className="text-2xl font-black text-[#191B1D]">{backtest.sortinoRatio.toFixed(2)}</p>
              <span className="text-xs text-[#5A5D61] font-sans">Downside risk-adj</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-4 space-y-1 shadow-xs">
              <span className="text-xs text-[#5A5D61] font-mono uppercase tracking-wider block">Max Drawdown</span>
              <p className="text-2xl font-black text-[#B91C1C]">-{(backtest.maxDrawdown * 100).toFixed(1)}%</p>
              <span className="text-xs text-[#5A5D61] font-sans">Peak-to-trough</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-xl p-4 space-y-1 shadow-xs">
              <span className="text-xs text-[#5A5D61] font-mono uppercase tracking-wider block">Calmar Ratio</span>
              <p className="text-2xl font-black text-[#191B1D]">{backtest.calmarRatio.toFixed(2)}</p>
              <span className="text-xs text-[#5A5D61] font-sans">CAGR / Max DD</span>
            </div>
          </div>

          {/* Benchmark Comparison Table */}
          <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-[#191B1D] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0F766E]" />
              <span>Benchmark Comparison (2016–2025)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#CDCECF] text-xs font-mono text-[#5A5D61]">
                    <th className="py-3 font-bold">Strategy / Benchmark</th>
                    <th className="py-3 font-bold">10Y CAGR</th>
                    <th className="py-3 font-bold">Max Drawdown</th>
                    <th className="py-3 font-bold">Sharpe Ratio</th>
                    <th className="py-3 font-bold">Recovery Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CDCECF] font-mono">
                  <tr className="bg-[#F8F9FA] text-[#191B1D] font-bold">
                    <td className="py-3 font-sans text-[#0F766E]">★ Your Tangent Portfolio</td>
                    <td className="py-3 text-[#0F766E]">{(backtest.cagr * 100).toFixed(1)}%</td>
                    <td className="py-3 text-[#B91C1C]">-{(backtest.maxDrawdown * 100).toFixed(1)}%</td>
                    <td className="py-3 text-[#0F766E]">{backtest.sharpeRatio.toFixed(2)}</td>
                    <td className="py-3 font-sans">{backtest.recoveryPeriodMonths} Months</td>
                  </tr>
                  <tr className="text-[#191B1D]">
                    <td className="py-3 font-sans">Nifty 50 Index (Pure Indian Equity)</td>
                    <td className="py-3">{(backtest.benchmarkComparison.nifty50.cagr * 100).toFixed(1)}%</td>
                    <td className="py-3 text-[#B91C1C]">-{(backtest.benchmarkComparison.nifty50.maxDrawdown * 100).toFixed(1)}%</td>
                    <td className="py-3">{backtest.benchmarkComparison.nifty50.sharpe.toFixed(2)}</td>
                    <td className="py-3 font-sans text-[#5A5D61]">14 Months</td>
                  </tr>
                  <tr className="text-[#191B1D]">
                    <td className="py-3 font-sans">Traditional 60/40 Equity/Debt Benchmark</td>
                    <td className="py-3">{(backtest.benchmarkComparison.balanced6040.cagr * 100).toFixed(1)}%</td>
                    <td className="py-3 text-[#B91C1C]">-{(backtest.benchmarkComparison.balanced6040.maxDrawdown * 100).toFixed(1)}%</td>
                    <td className="py-3">{backtest.benchmarkComparison.balanced6040.sharpe.toFixed(2)}</td>
                    <td className="py-3 font-sans text-[#5A5D61]">9 Months</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Yearly Returns Progression */}
          <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center text-sm border-b border-[#CDCECF] pb-3">
              <span className="font-bold text-[#191B1D]">Yearly Historical Returns (2016–2025)</span>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#191B1D]" /> Portfolio</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#CDCECF]" /> 60/40 Benchmark</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
              {backtest.yearlyReturns.map((yr) => {
                const isPositive = yr.portfolio >= 0;
                return (
                  <div key={yr.year} className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] space-y-1.5">
                    <div className="flex justify-between text-[#5A5D61] text-xs font-sans">
                      <span className="font-bold text-[#191B1D]">{yr.year}</span>
                      <span className={yr.portfolio > yr.benchmark ? "text-[#0F766E] font-bold" : "text-[#5A5D61]"}>
                        {yr.portfolio > yr.benchmark ? "Beat ✓" : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className={`text-sm font-bold ${isPositive ? "text-[#0F766E]" : "text-[#B91C1C]"}`}>
                        {(yr.portfolio * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-[#5A5D61]">
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

      {/* Stress Testing View */}
      {activeTab === "stress" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] text-xs text-[#5A5D61] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#B45309]" />
            <span>
              Adverse macro scenario stress testing applies historical shocks to evaluate capital drawdown and recovery duration under black swan crises.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stressScenarios.map((sc) => (
              <div
                key={sc.id}
                className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] space-y-4 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-base text-[#191B1D]">{sc.name}</h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F4F5F6] border border-[#CDCECF] text-[#5A5D61]">
                      {sc.period}
                    </span>
                  </div>
                  <p className="text-xs text-[#5A5D61] leading-relaxed">{sc.description}</p>
                </div>

                <div className="space-y-2.5 py-3 border-y border-[#CDCECF] font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#5A5D61] text-xs font-sans">Portfolio Drawdown</span>
                    <span className="font-bold text-[#B91C1C]">{(sc.portfolioDrawdown * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5A5D61] text-xs font-sans">Unhedged Benchmark</span>
                    <span className="text-[#5A5D61]">{(sc.benchmarkDrawdown * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5A5D61] text-xs font-sans">Recovery Duration</span>
                    <span className="text-[#0F766E] font-sans font-bold">{sc.recoveryMonths} Months</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5A5D61]">Resilience Rating:</span>
                    <span className="font-bold font-mono text-[#0F766E]">{sc.resilienceScore}/100</span>
                  </div>
                  <div className="w-full h-2 bg-[#F4F5F6] rounded-full overflow-hidden border border-[#CDCECF]">
                    <div
                      className="h-full bg-[#191B1D] rounded-full"
                      style={{ width: `${sc.resilienceScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#5A5D61] mt-1.5 italic leading-tight">
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
          className="flex items-center gap-2 py-3.5 px-6 rounded-full bg-[#6D0E5A] hover:bg-[#580B48] text-white font-bold text-sm transition-all shadow-md shadow-[#6D0E5A]/25 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Proceed to Decision Studio & Audit Pack</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

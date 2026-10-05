"use client";

import React, { useState } from "react";
import { MonteCarloResponse, runMonteCarlo } from "@/lib/api";
import { TrendingUp, ShieldAlert, DollarSign, Calendar, RefreshCw, BarChart2 } from "lucide-react";

interface MonteCarloProjectionProps {
  expectedReturn?: number;
  volatility?: number;
  horizonYears?: number;
  authToken?: string;
  onProceedToStudio?: () => void;
}

export function MonteCarloProjection({
  expectedReturn = 0.12,
  volatility = 0.14,
  horizonYears = 10,
  authToken,
  onProceedToStudio,
}: MonteCarloProjectionProps) {
  const [initialInvestment, setInitialInvestment] = useState<number>(500000);
  const [monthlySip, setMonthlySip] = useState<number>(25000);
  const [horizon, setHorizon] = useState<number>(horizonYears);
  const [loading, setLoading] = useState<boolean>(false);
  const [projection, setProjection] = useState<MonteCarloResponse | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await runMonteCarlo(
        initialInvestment,
        monthlySip,
        horizon,
        expectedReturn,
        volatility,
        42,
        authToken
      );
      setProjection(res);
    } catch (err) {
      console.error("Monte carlo failed", err);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Step 4: Seeded Monte Carlo Simulation</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
          Wealth Projections & SIP Goal Planning
        </h2>
        <p className="text-xs text-zinc-400 max-w-xl">
          Simulates 5,000 geometric Brownian motion paths under your optimized expected return and volatility to derive 95% confidence intervals and worst-case drawdowns.
        </p>
      </div>

      {/* Simulator Inputs Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Initial Lump Sum (₹)</label>
            <input
              type="number"
              step="10000"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Monthly SIP Contribution (₹)</label>
            <input
              type="number"
              step="5000"
              value={monthlySip}
              onChange={(e) => setMonthlySip(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Simulation Horizon (Years)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>
              Expected Return: <strong className="text-emerald-400">{(expectedReturn * 100).toFixed(1)}% p.a.</strong>
            </span>
            <span>
              Volatility: <strong className="text-amber-400">{(volatility * 100).toFixed(1)}% p.a.</strong>
            </span>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-xs hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
          >
            {loading ? "Simulating 5,000 Paths..." : "Run 10-Year Monte Carlo"}
          </button>
        </div>
      </div>

      {projection && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Key Terminal Percentile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Worst-Case (5th Percentile)
              </span>
              <p className="text-2xl font-bold font-mono text-amber-400">
                {formatINR(projection.terminal_worst_case_5th)}
              </p>
              <span className="text-[10px] text-zinc-400 block">Severe adverse market conditions</span>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Median Outcome (50th Percentile)
              </span>
              <p className="text-2xl font-bold font-mono text-emerald-300">
                {formatINR(projection.terminal_median)}
              </p>
              <span className="text-[10px] text-emerald-400/80 block">Most probable terminal wealth</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Optimistic (95th Percentile)
              </span>
              <p className="text-2xl font-bold font-mono text-cyan-400">
                {formatINR(projection.terminal_ci_upper_95)}
              </p>
              <span className="text-[10px] text-zinc-400 block">Sustained bull market conditions</span>
            </div>
          </div>

          {/* Trajectory Table */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Year-by-Year Wealth Trajectory (INR)
              </span>
              <span className="text-xs text-zinc-400">Fixed monthly compounding</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                    <th className="pb-3">Year</th>
                    <th className="pb-3 text-right">Total Invested</th>
                    <th className="pb-3 text-right">5th %-ile (Low)</th>
                    <th className="pb-3 text-right">50th %-ile (Median)</th>
                    <th className="pb-3 text-right">95th %-ile (High)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {projection.trajectory.map((row) => (
                    <tr key={row.year} className="hover:bg-zinc-800/20">
                      <td className="py-2.5 font-sans font-semibold text-zinc-300">Year {row.year}</td>
                      <td className="py-2.5 text-right text-zinc-400">{formatINR(row.invested_capital)}</td>
                      <td className="py-2.5 text-right text-amber-400">{formatINR(row.worst_case_5th)}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-300">{formatINR(row.median)}</td>
                      <td className="py-2.5 text-right text-cyan-400">{formatINR(row.ci_upper_95)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {onProceedToStudio && (
            <div className="flex justify-end pt-4">
              <button
                onClick={onProceedToStudio}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Proceed to Decision Studio</span>
                <span className="text-base">→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { MonteCarloResponse, runMonteCarlo } from "@/lib/api";
import { BarChart2, ArrowRight } from "lucide-react";

interface MonteCarloProjectionProps {
  expectedReturn?: number;
  volatility?: number;
  horizonYears?: number;
  initialCapital?: number;
  monthlySip?: number;
  authToken?: string;
  onProceedToStudio?: () => void;
}

export function MonteCarloProjection({
  expectedReturn = 0.12,
  volatility = 0.14,
  horizonYears = 10,
  initialCapital = 1000000,
  monthlySip: passedMonthlySip = 25000,
  authToken,
  onProceedToStudio,
}: MonteCarloProjectionProps) {
  const [initialInvestment, setInitialInvestment] = useState<number>(initialCapital);
  const [monthlySip, setMonthlySip] = useState<number>(passedMonthlySip);
  const [horizon, setHorizon] = useState<number>(horizonYears);
  const [loading, setLoading] = useState<boolean>(false);
  const [projection, setProjection] = useState<MonteCarloResponse | null>(null);

  // Synchronize state when earlier step inputs are updated
  React.useEffect(() => {
    if (initialCapital !== undefined) {
      setInitialInvestment(initialCapital);
    }
  }, [initialCapital]);

  React.useEffect(() => {
    if (passedMonthlySip !== undefined) {
      setMonthlySip(passedMonthlySip);
    }
  }, [passedMonthlySip]);

  React.useEffect(() => {
    if (horizonYears !== undefined) {
      setHorizon(horizonYears);
    }
  }, [horizonYears]);

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
    <div className="max-w-5xl mx-auto space-y-8 py-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] text-xs font-mono font-bold">
          <BarChart2 className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Wealth Trajectory Simulation (5,000 Paths)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#191B1D]">
          Monte Carlo Probability & Wealth Projections
        </h2>
        <p className="text-sm text-[#5A5D61] max-w-xl leading-relaxed">
          Simulates 5,000 geometric Brownian motion paths under your expected return and volatility to determine percentile distributions and worst-case drawdowns.
        </p>
      </div>

      {/* Simulator Inputs Card */}
      <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-7 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#191B1D]">Initial Lump Sum (₹)</label>
            <input
              type="number"
              step="10000"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#CDCECF] rounded-lg text-sm font-mono font-bold text-[#191B1D] focus:outline-none focus:border-[#191B1D]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#191B1D]">Monthly SIP (₹)</label>
            <input
              type="number"
              step="5000"
              value={monthlySip}
              onChange={(e) => setMonthlySip(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#CDCECF] rounded-lg text-sm font-mono font-bold text-[#191B1D] focus:outline-none focus:border-[#191B1D]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#191B1D]">Horizon (Years)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#CDCECF] rounded-lg text-sm font-mono font-bold text-[#191B1D] focus:outline-none focus:border-[#191B1D]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-[#CDCECF]">
          <div className="flex items-center gap-5 text-sm text-[#5A5D61] font-mono">
            <span>
              Expected Return: <strong className="text-[#191B1D]">{(expectedReturn * 100).toFixed(1)}% p.a.</strong>
            </span>
            <span>
              Volatility: <strong className="text-[#191B1D]">{(volatility * 100).toFixed(1)}% p.a.</strong>
            </span>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#6D0E5A] hover:bg-[#580B48] text-white font-bold text-sm disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-[#6D0E5A]/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? "Simulating 5,000 Paths..." : "Run 10-Year Monte Carlo"}
          </button>
        </div>
      </div>

      {projection && (
        <div className="space-y-6 animate-fade-in">
          {/* Key Terminal Percentile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-6 space-y-2 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#5A5D61] uppercase tracking-wider">
                Worst-Case (5th Percentile)
              </span>
              <p className="text-3xl font-black font-mono text-[#B45309]">
                {formatINR(projection.terminal_worst_case_5th)}
              </p>
              <span className="text-xs text-[#5A5D61] block">Adverse market environment</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#0F766E] rounded-2xl p-6 space-y-2 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#0F766E] uppercase tracking-wider">
                Median Outcome (50th Percentile)
              </span>
              <p className="text-3xl font-black font-mono text-[#0F766E]">
                {formatINR(projection.terminal_median)}
              </p>
              <span className="text-xs text-[#5A5D61] block">Expected median terminal wealth</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-6 space-y-2 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#5A5D61] uppercase tracking-wider">
                Optimistic (95th Percentile)
              </span>
              <p className="text-3xl font-black font-mono text-[#191B1D]">
                {formatINR(projection.terminal_ci_upper_95)}
              </p>
              <span className="text-xs text-[#5A5D61] block">Sustained secular bull cycle</span>
            </div>
          </div>

          {/* Trajectory Table */}
          <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-[#CDCECF] pb-3">
              <span className="text-sm font-bold uppercase tracking-wider text-[#191B1D] font-mono">
                Year-by-Year Capital Trajectory (INR)
              </span>
              <span className="text-xs text-[#5A5D61] font-mono">Monthly continuous compounding</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#CDCECF] text-xs font-mono text-[#5A5D61]">
                    <th className="pb-3 font-bold">Horizon</th>
                    <th className="pb-3 text-right font-bold">Total Capital Contributed</th>
                    <th className="pb-3 text-right font-bold">5th %-ile (Conservative)</th>
                    <th className="pb-3 text-right font-bold">50th %-ile (Median)</th>
                    <th className="pb-3 text-right font-bold">95th %-ile (Optimistic)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CDCECF] font-mono">
                  {projection.trajectory.map((row) => (
                    <tr key={row.year} className="hover:bg-[#F8F9FA]">
                      <td className="py-3 font-sans font-bold text-[#191B1D]">Year {row.year}</td>
                      <td className="py-3 text-right text-[#5A5D61]">{formatINR(row.invested_capital)}</td>
                      <td className="py-3 text-right text-[#B45309] font-semibold">{formatINR(row.worst_case_5th)}</td>
                      <td className="py-3 text-right font-bold text-[#0F766E]">{formatINR(row.median)}</td>
                      <td className="py-3 text-right font-semibold text-[#191B1D]">{formatINR(row.ci_upper_95)}</td>
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
                className="py-3.5 px-6 rounded-full bg-[#6D0E5A] hover:bg-[#580B48] text-white font-bold text-sm shadow-md shadow-[#6D0E5A]/25 transition-all cursor-pointer flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Proceed to Crisis Stress Testing & Backtest</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

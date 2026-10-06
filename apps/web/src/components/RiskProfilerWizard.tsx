"use client";

import React from "react";
import { getRiskProfile, RiskProfile } from "@/lib/api";
import { Gauge, ArrowRight, CheckCircle2, TrendingUp, ShieldAlert, Award } from "lucide-react";

interface RiskProfilerWizardProps {
  age: number;
  setAge: (age: number) => void;
  horizon: number;
  setHorizon: (horizon: number) => void;
  riskScore: number;
  setRiskScore: (score: number) => void;
  initialCapital?: number;
  setInitialCapital?: (val: number) => void;
  monthlySip?: number;
  setMonthlySip?: (val: number) => void;
  liquidityTier?: string;
  setLiquidityTier?: (val: string) => void;
  onProceed: () => void;
}

export function RiskProfilerWizard({
  age,
  setAge,
  horizon,
  setHorizon,
  riskScore,
  setRiskScore,
  initialCapital = 1000000,
  setInitialCapital,
  monthlySip = 25000,
  setMonthlySip,
  liquidityTier = "medium",
  setLiquidityTier,
  onProceed,
}: RiskProfilerWizardProps) {
  const profile: RiskProfile = getRiskProfile(riskScore, horizon);

  const getProfileBadgeColor = (name: string) => {
    switch (name) {
      case "Very Conservative":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "Conservative":
        return "bg-teal-500/10 text-teal-400 border-teal-500/30";
      case "Moderate":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Aggressive":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Step Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Gauge className="w-3.5 h-3.5" />
          <span>Stage 1 & 3: Investor Profile & Portfolio Constraints</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Investor Profile, Capital Sizing & Optimization Bounds
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl">
          We collect your risk tolerance, timeline, liquidity needs, and capital to construct deterministic mathematical boundaries for the SLSQP optimizer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Card (Stage 1) */}
        <div className="lg:col-span-7 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl backdrop-blur-sm">
          <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>1. Investor Persona & Demographics</span>
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">Stage 1 of 12</span>
          </div>

          {/* Age Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="age-slider" className="font-semibold text-zinc-200">Investor Age</label>
              <span className="font-mono text-emerald-400 font-bold bg-zinc-950 px-2.5 py-0.5 rounded-lg border border-zinc-800 text-xs">
                {age} Years
              </span>
            </div>
            <input
              id="age-slider"
              type="range"
              min="18"
              max="80"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
              <span>18 (Early career)</span>
              <span>45 (Prime savings)</span>
              <span>80 (Preservation)</span>
            </div>
          </div>

          {/* Horizon Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="horizon-slider" className="font-semibold text-zinc-200">Investment Horizon</label>
              <span className="font-mono text-teal-400 font-bold bg-zinc-950 px-2.5 py-0.5 rounded-lg border border-zinc-800 text-xs">
                {horizon} Years
              </span>
            </div>
            <input
              id="horizon-slider"
              type="range"
              min="1"
              max="30"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
              <span>1 Year (Short)</span>
              <span>10 Years (Medium)</span>
              <span>30 Years (Long Term)</span>
            </div>
          </div>

          {/* Risk Score Selector */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="risk-slider" className="font-semibold text-zinc-200">Risk Tolerance Score</label>
              <span className="font-mono text-cyan-400 font-bold bg-zinc-950 px-2.5 py-0.5 rounded-lg border border-zinc-800 text-xs">
                Score: {riskScore} / 10
              </span>
            </div>
            <input
              id="risk-slider"
              type="range"
              min="1"
              max="10"
              value={riskScore}
              onChange={(e) => setRiskScore(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { label: "1-2 Min", score: 2 },
                { label: "3-4 Low", score: 4 },
                { label: "5-6 Med", score: 6 },
                { label: "7-8 High", score: 8 },
                { label: "9-10 Max", score: 10 },
              ].map((btn) => (
                <button
                  key={btn.score}
                  onClick={() => setRiskScore(btn.score)}
                  className={`py-1 rounded text-[11px] font-semibold transition-all ${
                    riskScore === btn.score
                      ? "bg-zinc-700 text-white border border-zinc-600 shadow-sm"
                      : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Capital & SIP Contributions */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Initial Investment Capital (₹)</label>
                <input
                  type="number"
                  step="50000"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital?.(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500/60"
                />
                <div className="flex gap-1 pt-1">
                  {[500000, 1000000, 2500000, 10000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInitialCapital?.(amt)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
                        initialCapital === amt
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      ₹{amt >= 10000000 ? `${amt / 10000000}Cr` : `${amt / 100000}L`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Monthly Contribution SIP (₹)</label>
                <input
                  type="number"
                  step="5000"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip?.(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500/60"
                />
                <div className="flex gap-1 pt-1">
                  {[10000, 25000, 50000, 100000].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setMonthlySip?.(s)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
                        monthlySip === s
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      ₹{s >= 100000 ? `${s / 100000}L` : `${s / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Liquidity Requirement Tier */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-zinc-300">Liquidity & Cash Flow Needs</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "low", label: "Low (Locked-in)", desc: "Long compounding, low withdrawals" },
                  { id: "medium", label: "Moderate (Standard)", desc: "Quarterly rebalancing buffer" },
                  { id: "high", label: "High (Liquid Focus)", desc: "Immediate 25%+ liquid buffer" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setLiquidityTier?.(tier.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      liquidityTier === tier.id
                        ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-[11px] font-bold block text-zinc-200">{tier.label}</span>
                    <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">{tier.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Derived Constraints Card (Stage 3) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">3. Portfolio Constraints</h3>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${getProfileBadgeColor(
                  profile.name
                )}`}
              >
                {profile.name}
              </span>
            </div>

            {/* Asset Bounds Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Calculated Asset Class Limits
              </span>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-200 font-medium">Equities Range</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {(profile.equity_min * 100).toFixed(0)}% – {(profile.equity_max * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-zinc-200 font-medium">Fixed Income / Bonds</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {(profile.debt_min * 100).toFixed(0)}% – {(profile.debt_max * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-zinc-200 font-medium">Gold / Commodities / REITs</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    Max {(profile.commodity_max * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Specific Optimization Rules */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deterministic Safety Rules</span>
              </div>
              <ul className="space-y-1 text-zinc-400 text-[11px] list-disc list-inside">
                <li>Single Asset Maximum Cap: <strong className="text-zinc-200">15.0%</strong></li>
                <li>Single Sector Concentration Limit: <strong className="text-zinc-200">25.0%</strong></li>
                <li>Long-Only Constraint Enforced: <strong className="text-zinc-200">Weights ≥ 0, Sum = 1.0</strong></li>
                <li>No micro-weight dust allocations: <strong className="text-zinc-200">Min 2.5% or 0%</strong></li>
              </ul>
            </div>
          </div>

          <button
            onClick={onProceed}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-zinc-950 font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <span>Proceed to Investment Universe</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

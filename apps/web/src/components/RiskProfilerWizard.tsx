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
  onProceed: () => void;
}

export function RiskProfilerWizard({
  age,
  setAge,
  horizon,
  setHorizon,
  riskScore,
  setRiskScore,
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
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Step Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Gauge className="w-3.5 h-3.5" />
          <span>Step 1: Investor Profiling</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Determine Your Risk Profile & Asset Bounds
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Deterministic mathematical boundaries guide the SLSQP optimizer to prevent allocations incompatible with your investment timeline and volatility tolerance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Controls Card */}
        <div className="md:col-span-7 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl backdrop-blur-sm">
          {/* Age Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="age-slider" className="font-semibold text-zinc-200">Investor Age</label>
              <span className="font-mono text-emerald-400 font-bold bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                {age} Years
              </span>
            </div>
            <input
              id="age-slider"
              aria-label="Investor Age"
              type="range"
              min="18"
              max="80"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
              <span>18 (Early career)</span>
              <span>45 (Prime saving)</span>
              <span>80 (Preservation)</span>
            </div>
          </div>

          {/* Horizon Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="horizon-slider" className="font-semibold text-zinc-200">Investment Horizon</label>
              <span className="font-mono text-teal-400 font-bold bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                {horizon} Years
              </span>
            </div>
            <input
              id="horizon-slider"
              aria-label="Investment Horizon"
              type="range"
              min="1"
              max="30"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
              <span>1 Year (Short)</span>
              <span>10 Years (Medium)</span>
              <span>30 Years (Long Term)</span>
            </div>
          </div>

          {/* Risk Score Selector */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="risk-slider" className="font-semibold text-zinc-200">Risk Tolerance Score</label>
              <span className="font-mono text-cyan-400 font-bold bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                Score: {riskScore} / 10
              </span>
            </div>
            <input
              id="risk-slider"
              aria-label="Risk Tolerance Score"
              type="range"
              min="1"
              max="10"
              value={riskScore}
              onChange={(e) => setRiskScore(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { label: "1-2 Min", score: 2 },
                { label: "3-4 Low", score: 4 },
                { label: "5-6 Mid", score: 6 },
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
        </div>

        {/* Derived Constraints Card */}
        <div className="md:col-span-5 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Active Profile</span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${getProfileBadgeColor(
                  profile.name
                )}`}
              >
                {profile.name}
              </span>
            </div>

            {/* Asset Bounds Preview */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-300">Mandatory Asset-Class Bounds</span>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-200 font-medium">Equity Allocation</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {(profile.equity_min * 100).toFixed(0)}% – {(profile.equity_max * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-zinc-200 font-medium">Debt / Fixed Income</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {(profile.debt_min * 100).toFixed(0)}% – {(profile.debt_max * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-zinc-200 font-medium">Precious Metals / Alt</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    Max {(profile.commodity_max * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Safety Caps Note */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Regulatory Concentration Caps</span>
              </div>
              <p>Per-asset cap enforced at 15.0%. Per-equity sector cap enforced at 25.0%.</p>
            </div>
          </div>

          <button
            onClick={onProceed}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <span>Proceed to Asset Universe</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

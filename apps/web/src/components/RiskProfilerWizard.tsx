"use client";

import React from "react";
import { getRiskProfile, RiskProfile } from "@/lib/api";
import { Gauge, ArrowRight, CheckCircle2, Award, ShieldCheck } from "lucide-react";

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

  const getProfileBadgeStyle = (name: string) => {
    switch (name) {
      case "Very Conservative":
      case "Conservative":
        return "bg-[#F4F5F6] text-[#191B1D] border-[#CDCECF]";
      case "Moderate":
        return "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/30";
      case "Aggressive":
        return "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/30";
      default:
        return "bg-[#F4F5F6] text-[#191B1D] border-[#CDCECF]";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Section Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] text-xs font-mono font-bold">
          <Gauge className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Profile & Capital Allocation Calibration</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#191B1D]">
          Calibrate Profile & Optimizer Constraints
        </h2>
        <p className="text-base text-[#5A5D61] max-w-2xl leading-relaxed">
          Define risk tolerance, investment timeline, and capital size to parameterize deterministic boundaries for the SLSQP optimizer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Investor Profile Controls Card */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-7 space-y-7 shadow-xs">
          <div className="border-b border-[#CDCECF] pb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#191B1D] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0F766E]" />
              <span>Demographics & Risk Parameters</span>
            </h3>
            <span className="text-xs text-[#5A5D61] font-mono">Calibrated Bounds</span>
          </div>

          {/* Age Slider */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="age-slider" className="font-bold text-[#191B1D]">
                Investor Age
              </label>
              <span className="font-mono text-[#191B1D] font-bold bg-[#F4F5F6] px-3 py-1 rounded-md border border-[#CDCECF] text-sm">
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
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-[#5A5D61] font-mono">
              <span>18 (Early Career)</span>
              <span>45 (Prime Wealth Accrual)</span>
              <span>80 (Preservation)</span>
            </div>
          </div>

          {/* Horizon Slider */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="horizon-slider" className="font-bold text-[#191B1D]">
                Investment Horizon
              </label>
              <span className="font-mono text-[#191B1D] font-bold bg-[#F4F5F6] px-3 py-1 rounded-md border border-[#CDCECF] text-sm">
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
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-[#5A5D61] font-mono">
              <span>1 Year (Short)</span>
              <span>10 Years (Medium)</span>
              <span>30 Years (Long Multi-Cycle)</span>
            </div>
          </div>

          {/* Risk Tolerance Score */}
          <div className="space-y-2.5 pt-2 border-t border-[#CDCECF]">
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="risk-slider" className="font-bold text-[#191B1D]">
                Risk Tolerance Level
              </label>
              <span className="font-mono text-[#0F766E] font-bold bg-[#0F766E]/10 px-3 py-1 rounded-md border border-[#0F766E]/30 text-sm">
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
              className="w-full cursor-pointer"
            />
            <div className="grid grid-cols-5 gap-2 pt-1">
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
                  className={`py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border cursor-pointer ${
                    riskScore === btn.score
                      ? "bg-[#191B1D] text-white border-[#191B1D] shadow-xs"
                      : "bg-[#F4F5F6] text-[#5A5D61] border-[#CDCECF] hover:text-[#191B1D] hover:border-[#191B1D]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Capital Sizing & Monthly SIP */}
          <div className="space-y-4 pt-3 border-t border-[#CDCECF]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#191B1D]">Initial Capital (₹)</label>
                <input
                  type="number"
                  step="50000"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital?.(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#CDCECF] rounded-lg text-sm font-mono font-bold text-[#191B1D] focus:outline-none focus:border-[#191B1D]"
                />
                <div className="flex gap-1.5 pt-1">
                  {[500000, 1000000, 2500000, 10000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInitialCapital?.(amt)}
                      className={`px-2 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
                        initialCapital === amt
                          ? "bg-[#191B1D] text-white border-[#191B1D] font-bold"
                          : "bg-[#F4F5F6] text-[#5A5D61] border-[#CDCECF] hover:text-[#191B1D]"
                      }`}
                    >
                      ₹{amt >= 10000000 ? `${amt / 10000000}Cr` : `${amt / 100000}L`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#191B1D]">Monthly SIP (₹)</label>
                <input
                  type="number"
                  step="5000"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip?.(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#CDCECF] rounded-lg text-sm font-mono font-bold text-[#191B1D] focus:outline-none focus:border-[#191B1D]"
                />
                <div className="flex gap-1.5 pt-1">
                  {[10000, 25000, 50000, 100000].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setMonthlySip?.(s)}
                      className={`px-2 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
                        monthlySip === s
                          ? "bg-[#191B1D] text-white border-[#191B1D] font-bold"
                          : "bg-[#F4F5F6] text-[#5A5D61] border-[#CDCECF] hover:text-[#191B1D]"
                      }`}
                    >
                      ₹{s >= 100000 ? `${s / 100000}L` : `${s / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Liquidity Requirement Tier */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-bold text-[#191B1D]">Liquidity & Cash Flow Requirement</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "low", label: "Low", desc: "Long compounding, minimal withdrawals" },
                  { id: "medium", label: "Moderate", desc: "Periodic quarterly buffer" },
                  { id: "high", label: "High", desc: "Active 25%+ liquid reserves" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setLiquidityTier?.(tier.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      liquidityTier === tier.id
                        ? "bg-[#191B1D] text-white border-[#191B1D] shadow-xs"
                        : "bg-[#FFFFFF] border-[#CDCECF] text-[#5A5D61] hover:border-[#191B1D]"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold block ${
                        liquidityTier === tier.id ? "text-white" : "text-[#191B1D]"
                      }`}
                    >
                      {tier.label}
                    </span>
                    <span
                      className={`text-xs block leading-tight mt-1 ${
                        liquidityTier === tier.id ? "text-zinc-300" : "text-[#5A5D61]"
                      }`}
                    >
                      {tier.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Derived Constraints Card */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-7 space-y-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#CDCECF] pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
                <h3 className="text-base font-bold text-[#191B1D]">Portfolio Constraints</h3>
              </div>
              <span
                className={`text-xs font-bold font-mono px-3 py-1 rounded-md border ${getProfileBadgeStyle(
                  profile.name
                )}`}
              >
                {profile.name}
              </span>
            </div>

            {/* Calculated Bounds */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#5A5D61] uppercase tracking-wider block font-mono">
                Asset Allocation Range Bounds
              </span>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#191B1D]" />
                    <span className="text-[#191B1D] font-semibold">Equities Range</span>
                  </div>
                  <span className="font-mono font-bold text-[#191B1D]">
                    {(profile.equity_min * 100).toFixed(0)}% – {(profile.equity_max * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#0F766E]" />
                    <span className="text-[#191B1D] font-semibold">Fixed Income / Bonds</span>
                  </div>
                  <span className="font-mono font-bold text-[#191B1D]">
                    {(profile.debt_min * 100).toFixed(0)}% – {(profile.debt_max * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#CDCECF] flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#B45309]" />
                    <span className="text-[#191B1D] font-semibold">Gold & Commodities</span>
                  </div>
                  <span className="font-mono font-bold text-[#191B1D]">
                    Max {(profile.commodity_max * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Optimization Rules */}
            <div className="p-4 rounded-xl bg-[#F4F5F6] border border-[#CDCECF] text-xs text-[#5A5D61] space-y-2">
              <div className="flex items-center gap-2 text-[#191B1D] font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                <span>Deterministic Rules</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#5A5D61] font-mono">
                <li>• Single Asset Cap: <strong className="text-[#191B1D]">15.0%</strong></li>
                <li>• Sector Concentration Limit: <strong className="text-[#191B1D]">25.0%</strong></li>
                <li>• Long-Only: <strong className="text-[#191B1D]">Sum = 100.0%, Weights ≥ 0</strong></li>
                <li>• Dust Filter: <strong className="text-[#191B1D]">Allocations ≥ 2.5% or 0%</strong></li>
              </ul>
            </div>
          </div>

          <button
            onClick={onProceed}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-5 rounded-full bg-[#6D0E5A] hover:bg-[#580B48] text-white font-bold text-sm transition-all shadow-md shadow-[#6D0E5A]/25 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Proceed to Investment Universe</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

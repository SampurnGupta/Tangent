"use client";

import React, { useState } from "react";
import { RiskProfilerWizard } from "@/components/RiskProfilerWizard";
import { AssetSelector } from "@/components/AssetSelector";
import { OptimizationDashboard } from "@/components/OptimizationDashboard";
import { CandidateSuitability } from "@/components/CandidateSuitability";
import { MonteCarloProjection } from "@/components/MonteCarloProjection";
import { BacktestStressTesting } from "@/components/BacktestStressTesting";
import { DecisionStudio } from "@/components/DecisionStudio";
import {
  CandidatePortfolio,
  OptimizationResponse,
  RiskProfile,
} from "@/lib/api";
import {
  UserCheck,
  Layers,
  Cpu,
  Target,
  LineChart,
  ShieldAlert,
  FileCheck2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export type PortfolioWorkflowStep =
  | "profile"
  | "universe"
  | "solver"
  | "suitability"
  | "projections"
  | "stresstest"
  | "studio";

interface YourPortfolioViewProps {
  age: number;
  setAge: (v: number) => void;
  horizon: number;
  setHorizon: (v: number) => void;
  riskScore: number;
  setRiskScore: (v: number) => void;
  initialCapital: number;
  setInitialCapital: (v: number) => void;
  monthlySip: number;
  setMonthlySip: (v: number) => void;
  liquidityTier: string;
  setLiquidityTier: (v: string) => void;
  selectedTickers: string[];
  setSelectedTickers: React.Dispatch<React.SetStateAction<string[]>>;
  authToken?: string;
  riskProfile: RiskProfile;
  optimizationResult: OptimizationResponse | null;
  setOptimizationResult: (res: OptimizationResponse) => void;
  selectedCandidate: CandidatePortfolio | null;
  setSelectedCandidate: (cand: CandidatePortfolio) => void;
  activeWeights: Record<string, number>;
  activeSharpe: number;
  activeNominalReturn: number;
  activeRealReturn: number;
  activeVol: number;
  initialStep?: PortfolioWorkflowStep;
}

const STEPS: Array<{
  id: PortfolioWorkflowStep;
  title: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "profile", title: "Profile", shortDesc: "Risk Calibration", icon: UserCheck },
  { id: "universe", title: "Universe", shortDesc: "74 Multi-Asset Pool", icon: Layers },
  { id: "solver", title: "Solver", shortDesc: "SLSQP Frontier", icon: Cpu },
  { id: "suitability", title: "Suitability", shortDesc: "Candidate Matching", icon: Target },
  { id: "projections", title: "Projections", shortDesc: "5,000 Path MC", icon: LineChart },
  { id: "stresstest", title: "Stress Test", shortDesc: "Crisis Drawdowns", icon: ShieldAlert },
  { id: "studio", title: "Studio", shortDesc: "Briefs & Export", icon: FileCheck2 },
];

export function YourPortfolioView({
  age,
  setAge,
  horizon,
  setHorizon,
  riskScore,
  setRiskScore,
  initialCapital,
  setInitialCapital,
  monthlySip,
  setMonthlySip,
  liquidityTier,
  setLiquidityTier,
  selectedTickers,
  setSelectedTickers,
  authToken,
  riskProfile,
  optimizationResult,
  setOptimizationResult,
  selectedCandidate,
  setSelectedCandidate,
  activeWeights,
  activeSharpe,
  activeNominalReturn,
  activeRealReturn,
  activeVol,
  initialStep = "profile",
}: YourPortfolioViewProps) {
  const [currentStep, setCurrentStep] = useState<PortfolioWorkflowStep>(initialStep);

  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="space-y-6">
      {/* ── TOP SEQUENTIAL WORKFLOW STEPPER BAR ── */}
      <section className="bg-[#FFFFFF] rounded-2xl p-5 sm:p-6 border border-[#CDCECF] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#CDCECF]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6D0E5A] font-mono">
                Sequential Portfolio Workflow
              </span>
              <span className="text-[11px] bg-[#F7EBF4] border border-[#6D0E5A]/30 text-[#6D0E5A] px-2.5 py-0.5 rounded-full font-mono font-bold">
                Step {currentIndex + 1} of {STEPS.length}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#191B1D] mt-1">
              Your Portfolio Construction Journey
            </h2>
          </div>

          <div className="flex items-center gap-3 text-sm font-mono text-[#5A5D61] bg-[#F8F9FA] px-4 py-2 rounded-xl border border-[#CDCECF]">
            <span>Profile: <strong className="text-[#191B1D]">{riskProfile.name}</strong></span>
            <span>•</span>
            <span>Capital: <strong className="text-[#191B1D]">₹{initialCapital.toLocaleString("en-IN")}</strong></span>
            <span>•</span>
            <span>Sharpe: <strong className="text-[#6D0E5A] font-bold">{activeSharpe.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Stepper Navigation Pills (AVEKA-Style Active Indicator & #6D0E5A Accents) */}
        <div className="pt-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2.5 min-w-max">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = idx < currentIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer border hover:-translate-y-0.5 active:translate-y-0 ${
                    isActive
                      ? "bg-[#6D0E5A] text-white font-bold border-[#6D0E5A] shadow-md shadow-[#6D0E5A]/25"
                      : isPast
                      ? "bg-[#FFFFFF] text-[#191B1D] border-[#CDCECF] hover:border-[#6D0E5A] hover:text-[#6D0E5A]"
                      : "bg-[#F8F9FA] text-[#5A5D61] border-[#CDCECF] hover:text-[#191B1D] hover:border-[#A6A8AA]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-[#580B48] text-white"
                        : isPast
                        ? "bg-[#F7EBF4] text-[#6D0E5A]"
                        : "bg-[#EAEBED] text-[#5A5D61]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm block leading-tight">{step.title}</span>
                    <span
                      className={`text-xs block leading-tight font-mono ${
                        isActive ? "text-purple-200 font-medium" : "text-[#5A5D61]"
                      }`}
                    >
                      {step.shortDesc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PERSISTENT STEP CONTAINERS (NEVER UNMOUNT DATA) ── */}
      <div>
        {/* Step 1: Profile & Constraints */}
        <div className={currentStep === "profile" ? "block animate-fade-in" : "hidden"}>
          <RiskProfilerWizard
            age={age}
            setAge={setAge}
            horizon={horizon}
            setHorizon={setHorizon}
            riskScore={riskScore}
            setRiskScore={setRiskScore}
            initialCapital={initialCapital}
            setInitialCapital={setInitialCapital}
            monthlySip={monthlySip}
            setMonthlySip={setMonthlySip}
            liquidityTier={liquidityTier}
            setLiquidityTier={setLiquidityTier}
            onProceed={() => setCurrentStep("universe")}
          />
        </div>

        {/* Step 2: Asset Universe & Statistical Inputs */}
        <div className={currentStep === "universe" ? "block animate-fade-in" : "hidden"}>
          <AssetSelector
            selectedTickers={selectedTickers}
            setSelectedTickers={setSelectedTickers}
            onProceed={() => setCurrentStep("solver")}
          />
        </div>

        {/* Step 3: Efficient Frontier & SLSQP Solver */}
        <div className={currentStep === "solver" ? "block animate-fade-in" : "hidden"}>
          <OptimizationDashboard
            selectedTickers={selectedTickers}
            riskProfile={riskProfile}
            authToken={authToken}
            initialResult={optimizationResult}
            onOptimizationDone={(res) => setOptimizationResult(res)}
            onProceedToProjections={() => setCurrentStep("suitability")}
          />
        </div>

        {/* Step 4: Candidate Portfolios & Suitability */}
        <div className={currentStep === "suitability" ? "block animate-fade-in" : "hidden"}>
          <CandidateSuitability
            selectedTickers={selectedTickers}
            riskProfile={riskProfile}
            horizon={horizon}
            initialCapital={initialCapital}
            initialCandidateId={selectedCandidate?.id}
            onSelectPortfolio={(cand) => setSelectedCandidate(cand)}
            onProceed={() => setCurrentStep("projections")}
          />
        </div>

        {/* Step 5: Monte Carlo Wealth Simulations */}
        <div className={currentStep === "projections" ? "block animate-fade-in" : "hidden"}>
          <MonteCarloProjection
            expectedReturn={activeNominalReturn}
            volatility={activeVol}
            horizonYears={horizon}
            authToken={authToken}
            onProceedToStudio={() => setCurrentStep("stresstest")}
          />
        </div>

        {/* Step 6: 10-Year Backtest & Crisis Stress Testing */}
        <div className={currentStep === "stresstest" ? "block animate-fade-in" : "hidden"}>
          <BacktestStressTesting
            weights={activeWeights}
            horizon={horizon}
            initialCapital={initialCapital}
            onProceed={() => setCurrentStep("studio")}
          />
        </div>

        {/* Step 7: Decision Studio, Multi-Agent Briefs & Investor Export */}
        <div className={currentStep === "studio" ? "block animate-fade-in" : "hidden"}>
          <DecisionStudio
            selectedTickers={selectedTickers}
            authToken={authToken}
            currentSharpe={activeSharpe}
            currentReturn={activeNominalReturn}
            currentVol={activeVol}
            currentWeights={activeWeights}
            nominalReturn={activeNominalReturn}
            realReturn={activeRealReturn}
            horizon={horizon}
            riskScore={riskScore}
          />
        </div>
      </div>
    </div>
  );
}

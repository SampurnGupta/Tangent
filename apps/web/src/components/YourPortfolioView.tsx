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
      <section className="bg-zinc-900/50 rounded-2xl p-4 sm:p-5 border border-zinc-800/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                Sequential Portfolio Workflow
              </span>
              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                Step {currentIndex + 1} of {STEPS.length}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
              Your Portfolio Construction Journey
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Profile: <strong className="text-white">{riskProfile.name}</strong></span>
            <span>•</span>
            <span>Capital: <strong className="text-white">₹{initialCapital.toLocaleString("en-IN")}</strong></span>
            <span>•</span>
            <span>Sharpe: <strong className="text-emerald-400">{activeSharpe.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Stepper Navigation Pills */}
        <div className="pt-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = idx < currentIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                    isActive
                      ? "bg-zinc-100 text-zinc-950 font-bold border-white shadow-md shadow-white/5"
                      : isPast
                      ? "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                      : "bg-zinc-950/60 text-zinc-500 border-zinc-900 hover:text-zinc-400"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-zinc-950 text-white"
                        : isPast
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-900 text-zinc-600"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs block leading-tight">{step.title}</span>
                    <span
                      className={`text-[10px] block leading-tight font-mono ${
                        isActive ? "text-zinc-600 font-semibold" : "text-zinc-500"
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

"use client";

import React, { useState, useEffect } from "react";
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
  Lock,
  AlertTriangle,
  RotateCcw,
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
  setOptimizationResult: (res: OptimizationResponse | null) => void;
  selectedCandidate: CandidatePortfolio | null;
  setSelectedCandidate: (cand: CandidatePortfolio | null) => void;
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
}: YourPortfolioViewProps) {
  // Always begin sequentially from Profile
  const [currentStep, setCurrentStep] = useState<PortfolioWorkflowStep>("profile");

  // Furthest step unlocked by running previous steps sequentially
  const [unlockedIndex, setUnlockedIndex] = useState<number>(() => {
    if (optimizationResult && selectedCandidate) return 6;
    if (optimizationResult) return 3;
    return 0;
  });

  // Confirmed snapshot of inputs at the time the user progressed past each step
  const [confirmedStep1, setConfirmedStep1] = useState<{
    age: number;
    horizon: number;
    riskScore: number;
    initialCapital: number;
    monthlySip: number;
    liquidityTier: string;
  }>({
    age,
    horizon,
    riskScore,
    initialCapital,
    monthlySip,
    liquidityTier,
  });

  const [confirmedStep2, setConfirmedStep2] = useState<{
    selectedTickers: string[];
  }>({
    selectedTickers: [...selectedTickers].sort(),
  });

  const [invalidatedNotice, setInvalidatedNotice] = useState<{
    step: number;
    stepName: string;
    message: string;
  } | null>(null);

  // 1. Detect changes made to Step 1 (Profile) parameters when user navigates back
  useEffect(() => {
    if (unlockedIndex > 0) {
      const isChanged =
        confirmedStep1.age !== age ||
        confirmedStep1.horizon !== horizon ||
        confirmedStep1.riskScore !== riskScore ||
        confirmedStep1.initialCapital !== initialCapital ||
        confirmedStep1.monthlySip !== monthlySip ||
        confirmedStep1.liquidityTier !== liquidityTier;

      if (isChanged) {
        // Reset unlocked progress and wipe downstream calculations
        setUnlockedIndex(0);
        setOptimizationResult(null);
        setSelectedCandidate(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("tangent_opt_result");
          localStorage.removeItem("tangent_selected_candidate");
        }
        setInvalidatedNotice({
          step: 1,
          stepName: "Profile & Risk Calibration",
          message:
            "You modified demographic, risk tolerance, or capital inputs. All downstream optimization, solver allocations, candidate portfolios, and wealth projections have been reset to guarantee mathematical integrity. Please click 'Proceed to Asset Universe' to restart your sequential run.",
        });
      }
    }
  }, [
    age,
    horizon,
    riskScore,
    initialCapital,
    monthlySip,
    liquidityTier,
    confirmedStep1,
    unlockedIndex,
    setOptimizationResult,
    setSelectedCandidate,
  ]);

  // 2. Detect changes made to Step 2 (Asset Universe) when user navigates back
  useEffect(() => {
    if (unlockedIndex > 1) {
      const curList = [...selectedTickers].sort().join(",");
      const confList = [...confirmedStep2.selectedTickers].sort().join(",");

      if (curList !== confList) {
        // Reset unlocked progress from Solver onwards
        setUnlockedIndex(1);
        setOptimizationResult(null);
        setSelectedCandidate(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("tangent_opt_result");
          localStorage.removeItem("tangent_selected_candidate");
        }
        setInvalidatedNotice({
          step: 2,
          stepName: "Asset Universe",
          message:
            "You modified the candidate asset universe. Downstream SLSQP optimization weights, candidate portfolios, and simulations have been reset. Please click 'Proceed to SLSQP Solver' and re-execute the optimizer on your new asset selection.",
        });
      }
    }
  }, [
    selectedTickers,
    confirmedStep2,
    unlockedIndex,
    setOptimizationResult,
    setSelectedCandidate,
  ]);

  // 3. Handler when solver re-optimizes in Step 3
  const handleOptimizationDone = (res: OptimizationResponse) => {
    setOptimizationResult(res);
    // If user previously reached Suitability or further, invalidate downstream steps
    if (unlockedIndex > 2) {
      setUnlockedIndex(2);
      setSelectedCandidate(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("tangent_selected_candidate");
      }
      setInvalidatedNotice({
        step: 3,
        stepName: "SLSQP Frontier Solver",
        message:
          "New optimization computed. Downstream suitability, projections, and studio briefs have been reset. Click 'Compare Candidate Portfolios & Suitability' to update your allocation.",
      });
    }
  };

  // 4. Handler when candidate portfolio is selected in Step 4
  const handleSelectCandidate = (cand: CandidatePortfolio) => {
    setSelectedCandidate(cand);
    // If user previously reached Projections or further, invalidate downstream steps
    if (unlockedIndex > 3) {
      setUnlockedIndex(3);
      setInvalidatedNotice({
        step: 4,
        stepName: "Candidate Suitability",
        message:
          `Portfolio candidate switched to ${cand.name}. Downstream Monte Carlo wealth projections and crisis stress tests have been reset. Click 'Proceed to 10-Year Monte Carlo Projections'.`,
      });
    }
  };

  // Step Progression Actions
  const handleProceedFromProfile = () => {
    setConfirmedStep1({
      age,
      horizon,
      riskScore,
      initialCapital,
      monthlySip,
      liquidityTier,
    });
    setInvalidatedNotice(null);
    setUnlockedIndex((prev) => Math.max(prev, 1));
    setCurrentStep("universe");
  };

  const handleProceedFromUniverse = () => {
    setConfirmedStep2({
      selectedTickers: [...selectedTickers].sort(),
    });
    setInvalidatedNotice(null);
    setUnlockedIndex((prev) => Math.max(prev, 2));
    setCurrentStep("solver");
  };

  const handleProceedFromSolver = () => {
    setInvalidatedNotice(null);
    setUnlockedIndex((prev) => Math.max(prev, 3));
    setCurrentStep("suitability");
  };

  const handleProceedFromSuitability = () => {
    setInvalidatedNotice(null);
    setUnlockedIndex((prev) => Math.max(prev, 4));
    setCurrentStep("projections");
  };

  const handleProceedFromProjections = () => {
    setInvalidatedNotice(null);
    setUnlockedIndex((prev) => Math.max(prev, 5));
    setCurrentStep("stresstest");
  };

  const handleProceedFromStressTest = () => {
    setInvalidatedNotice(null);
    setUnlockedIndex((prev) => Math.max(prev, 6));
    setCurrentStep("studio");
  };

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

        {/* Stepper Navigation Pills (Strict Sequential Enforcement: Future Steps Locked) */}
        <div className="pt-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2.5 min-w-max">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isLocked = idx > unlockedIndex;

              if (isLocked) {
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-[#F8F9FA] text-[#85888C] border-[#CDCECF] opacity-55 cursor-not-allowed select-none"
                    title={`Step locked. Complete Step ${idx} first to unlock.`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#EAEBED] text-[#85888C]">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-sm block leading-tight font-medium text-[#85888C]">{step.title}</span>
                      <span className="text-xs block leading-tight font-mono text-[#85888C]">
                        Locked 🔒
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer border hover:-translate-y-0.5 active:translate-y-0 ${
                    isActive
                      ? "bg-[#6D0E5A] text-white font-bold border-[#6D0E5A] shadow-md shadow-[#6D0E5A]/25"
                      : "bg-[#FFFFFF] text-[#191B1D] border-[#CDCECF] hover:border-[#6D0E5A] hover:text-[#6D0E5A]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-[#580B48] text-white"
                        : "bg-[#F7EBF4] text-[#6D0E5A]"
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

      {/* ── PARAMETER INVALIDATION ALERT BANNER ── */}
      {invalidatedNotice && (
        <div className="bg-[#FFFBEB] border-2 border-[#F59E0B]/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#B45309] flex items-center justify-center shrink-0 mt-0.5 border border-[#F59E0B]/30">
              <AlertTriangle className="w-5 h-5 text-[#B45309]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-[#92400E]">
                  Earlier Parameter Change Detected — Downstream Run Required
                </h4>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#92400E] font-bold border border-[#F59E0B]/30">
                  Step {invalidatedNotice.step}: {invalidatedNotice.stepName}
                </span>
              </div>
              <p className="text-xs text-[#78350F] mt-1 leading-relaxed max-w-3xl">
                {invalidatedNotice.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setInvalidatedNotice(null)}
            className="text-xs font-mono font-bold text-[#92400E] hover:text-[#78350F] px-3 py-1.5 rounded-lg border border-[#F59E0B]/40 hover:bg-[#F59E0B]/10 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Acknowledge & Continue
          </button>
        </div>
      )}

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
            onProceed={handleProceedFromProfile}
          />
        </div>

        {/* Step 2: Asset Universe & Statistical Inputs */}
        <div className={currentStep === "universe" ? "block animate-fade-in" : "hidden"}>
          <AssetSelector
            selectedTickers={selectedTickers}
            setSelectedTickers={setSelectedTickers}
            onProceed={handleProceedFromUniverse}
          />
        </div>

        {/* Step 3: Efficient Frontier & SLSQP Solver */}
        <div className={currentStep === "solver" ? "block animate-fade-in" : "hidden"}>
          <OptimizationDashboard
            selectedTickers={selectedTickers}
            riskProfile={riskProfile}
            authToken={authToken}
            initialResult={optimizationResult}
            onOptimizationDone={handleOptimizationDone}
            onProceedToProjections={handleProceedFromSolver}
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
            onSelectPortfolio={handleSelectCandidate}
            onProceed={handleProceedFromSuitability}
          />
        </div>

        {/* Step 5: Monte Carlo Wealth Simulations */}
        <div className={currentStep === "projections" ? "block animate-fade-in" : "hidden"}>
          <MonteCarloProjection
            expectedReturn={activeNominalReturn}
            volatility={activeVol}
            horizonYears={horizon}
            initialCapital={initialCapital}
            monthlySip={monthlySip}
            authToken={authToken}
            onProceedToStudio={handleProceedFromProjections}
          />
        </div>

        {/* Step 6: 10-Year Backtest & Crisis Stress Testing */}
        <div className={currentStep === "stresstest" ? "block animate-fade-in" : "hidden"}>
          <BacktestStressTesting
            weights={activeWeights}
            horizon={horizon}
            initialCapital={initialCapital}
            onProceed={handleProceedFromStressTest}
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

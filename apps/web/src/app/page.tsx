"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { RiskProfilerWizard } from "@/components/RiskProfilerWizard";
import { AssetSelector } from "@/components/AssetSelector";
import { OptimizationDashboard } from "@/components/OptimizationDashboard";
import { MonteCarloProjection } from "@/components/MonteCarloProjection";
import { DecisionStudio } from "@/components/DecisionStudio";
import { AIChatConcierge } from "@/components/AIChatConcierge";
import { CandidateSuitability } from "@/components/CandidateSuitability";
import { BacktestStressTesting } from "@/components/BacktestStressTesting";
import { ArenaView } from "@/components/ArenaView";
import { HeroHomepage } from "@/components/HeroHomepage";
import { ModelObservatory } from "@/components/ModelObservatory";
import { CandidatePortfolio, fetchGuestSession, getRiskProfile, OptimizationResponse } from "@/lib/api";
import { ShieldCheck, Database, Cpu } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [userId, setUserId] = useState<string>("");
  const [authToken, setAuthToken] = useState<string>("");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Profiler state (Stage 1 & 3)
  const [age, setAge] = useState<number>(32);
  const [horizon, setHorizon] = useState<number>(10);
  const [riskScore, setRiskScore] = useState<number>(6);
  const [initialCapital, setInitialCapital] = useState<number>(1000000);
  const [monthlySip, setMonthlySip] = useState<number>(25000);
  const [liquidityTier, setLiquidityTier] = useState<string>("medium");

  // Asset state (default curated multi-asset universe - Stage 2)
  const [selectedTickers, setSelectedTickers] = useState<string[]>([
    "RELIANCE.NS",
    "TCS.NS",
    "HDFCBANK.NS",
    "INFY.NS",
    "SBI_FD",
    "INDIA_GOVT_10Y",
    "GOLDBEES.NS",
    "EMBASSY_REIT",
  ]);

  // Solver optimization result state (bubbled from Optimizer step)
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);

  // Selected candidate portfolio (bubbled from Stage 8 & 9)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatePortfolio | null>(null);

  // Authenticate guest and restore persistent state on mount
  useEffect(() => {
    async function initGuest() {
      const session = await fetchGuestSession();
      setUserId(session.user_id);
      setAuthToken(session.access_token);
    }
    initGuest();

    if (typeof window !== "undefined") {
      try {
        const savedAge = localStorage.getItem("tangent_age");
        if (savedAge) setAge(Number(savedAge));
        const savedHorizon = localStorage.getItem("tangent_horizon");
        if (savedHorizon) setHorizon(Number(savedHorizon));
        const savedRisk = localStorage.getItem("tangent_risk_score");
        if (savedRisk) setRiskScore(Number(savedRisk));
        const savedCapital = localStorage.getItem("tangent_capital");
        if (savedCapital) setInitialCapital(Number(savedCapital));
        const savedSip = localStorage.getItem("tangent_monthly_sip");
        if (savedSip) setMonthlySip(Number(savedSip));
        const savedLiquidity = localStorage.getItem("tangent_liquidity_tier");
        if (savedLiquidity) setLiquidityTier(savedLiquidity);
        const savedTickers = localStorage.getItem("tangent_selected_tickers");
        if (savedTickers) setSelectedTickers(JSON.parse(savedTickers));
        const savedOpt = localStorage.getItem("tangent_opt_result");
        if (savedOpt) setOptimizationResult(JSON.parse(savedOpt));
        const savedCand = localStorage.getItem("tangent_selected_candidate");
        if (savedCand) setSelectedCandidate(JSON.parse(savedCand));
      } catch (err) {
        console.warn("Could not restore session from localStorage:", err);
      }
    }
  }, []);

  // Sync state to localStorage so hard refresh or navigation preserves user data
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("tangent_age", String(age));
      localStorage.setItem("tangent_horizon", String(horizon));
      localStorage.setItem("tangent_risk_score", String(riskScore));
      localStorage.setItem("tangent_capital", String(initialCapital));
      localStorage.setItem("tangent_monthly_sip", String(monthlySip));
      localStorage.setItem("tangent_liquidity_tier", liquidityTier);
      localStorage.setItem("tangent_selected_tickers", JSON.stringify(selectedTickers));
      if (optimizationResult) {
        localStorage.setItem("tangent_opt_result", JSON.stringify(optimizationResult));
      }
      if (selectedCandidate) {
        localStorage.setItem("tangent_selected_candidate", JSON.stringify(selectedCandidate));
      }
    } catch {
      // quota or private browsing
    }
  }, [age, horizon, riskScore, initialCapital, monthlySip, liquidityTier, selectedTickers, optimizationResult, selectedCandidate]);

  const riskProfile = getRiskProfile(riskScore, horizon);

  const activeSharpe =
    selectedCandidate?.sharpeRatio ?? optimizationResult?.sharpe_ratio ?? 0.52;
  const activeNominalReturn =
    selectedCandidate?.expectedReturnNominal ??
    optimizationResult?.expected_return_nominal ??
    0.134;
  const activeRealReturn =
    selectedCandidate?.expectedReturnReal ??
    optimizationResult?.expected_return_real ??
    0.058;
  const activeVol =
    selectedCandidate?.annualVolatility ??
    optimizationResult?.annualized_volatility ??
    0.122;
  const activeWeights =
    selectedCandidate?.weights ??
    optimizationResult?.weights ?? {
      "RELIANCE.NS": 0.14,
      "TCS.NS": 0.12,
      "HDFCBANK.NS": 0.12,
      "INDIA_GOVT_10Y": 0.18,
      "SBI_FD": 0.16,
      "GOLDBEES.NS": 0.10,
      "SPY": 0.10,
      "EMBASSY_REIT": 0.08,
    };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-x-hidden">
      {/* Dynamic Animated Ambient Mesh Backdrop */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 left-1/4 w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-[130px] animate-float-slow" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-cyan-500/8 blur-[140px] animate-float-reverse" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-teal-500/8 blur-[120px] animate-pulse-subtle" />
      </div>

      <Header userId={userId} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        {/* Tab 0: Modern Swiss Grid Fintech Dashboard */}
        <div className={activeTab === "home" ? "block animate-fade-in" : "hidden"}>
          <HeroHomepage
            onNavigate={(tabId) => setActiveTab(tabId)}
            onOpenChat={() => setIsChatOpen(true)}
            investorProfileName={riskProfile.name}
            capital={initialCapital}
            nominalReturn={activeNominalReturn}
            realReturn={activeRealReturn}
            sharpeRatio={activeSharpe}
            weights={activeWeights}
          />
        </div>

        {/* Tab 1: Stage 1 (Profile) + Stage 3 (Constraints) */}
        <div className={activeTab === "profile" ? "block animate-fade-in" : "hidden"}>
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
            onProceed={() => setActiveTab("universe")}
          />
        </div>

        {/* Tab 2: Stage 2 (Universe) + Stage 4 (Market Data Stats) */}
        <div className={activeTab === "universe" ? "block animate-fade-in" : "hidden"}>
          <AssetSelector
            selectedTickers={selectedTickers}
            setSelectedTickers={setSelectedTickers}
            onProceed={() => setActiveTab("frontier")}
          />
        </div>

        {/* Tab 3: Stage 5 (Frontier) + Stage 6 (SLSQP) + Stage 7A (MC Exploration) */}
        <div className={activeTab === "frontier" ? "block animate-fade-in" : "hidden"}>
          <OptimizationDashboard
            selectedTickers={selectedTickers}
            riskProfile={riskProfile}
            authToken={authToken}
            initialResult={optimizationResult}
            onOptimizationDone={(res) => setOptimizationResult(res)}
            onProceedToProjections={() => setActiveTab("candidates")}
          />
        </div>

        {/* Tab 4: Stage 8 (Candidates) + Stage 9 (Suitability Layer) */}
        <div className={activeTab === "candidates" ? "block animate-fade-in" : "hidden"}>
          <CandidateSuitability
            selectedTickers={selectedTickers}
            riskProfile={riskProfile}
            horizon={horizon}
            initialCapital={initialCapital}
            initialCandidateId={selectedCandidate?.id}
            onSelectPortfolio={(cand) => setSelectedCandidate(cand)}
            onProceed={() => setActiveTab("projections")}
          />
        </div>

        {/* Tab 5: Stage 7B (Future Projections 5,000 Paths) */}
        <div className={activeTab === "projections" ? "block animate-fade-in" : "hidden"}>
          <MonteCarloProjection
            expectedReturn={activeNominalReturn}
            volatility={activeVol}
            horizonYears={horizon}
            authToken={authToken}
            onProceedToStudio={() => setActiveTab("backtest")}
          />
        </div>

        {/* Tab 6: Stage 10 (Backtesting) + Stage 11 (Crisis Stress Testing) */}
        <div className={activeTab === "backtest" ? "block animate-fade-in" : "hidden"}>
          <BacktestStressTesting
            weights={activeWeights}
            horizon={horizon}
            initialCapital={initialCapital}
            onProceed={() => setActiveTab("decision")}
          />
        </div>

        {/* Tab 7: Stage 12 (Final Recommendation, Multi-Agent & Export) */}
        <div className={activeTab === "decision" ? "block animate-fade-in" : "hidden"}>
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

        {/* Tab 8: Feature 8 (The Arena: Multi-Agent Cross-Fire Deliberation) */}
        <div className={activeTab === "arena" ? "block animate-fade-in" : "hidden"}>
          <ArenaView
            investorProfileName={riskProfile.name}
            horizon={horizon}
            capital={initialCapital}
            weights={activeWeights}
            nominalReturn={activeNominalReturn}
            realReturn={activeRealReturn}
            volatility={activeVol}
            sharpeRatio={activeSharpe}
            selectedTickers={selectedTickers}
          />
        </div>

        {/* Tab 9: Feature 9 (LLM Observatory & MetaBot DevOps Intelligence) */}
        <div className={activeTab === "observatory" ? "block animate-fade-in" : "hidden"}>
          <ModelObservatory />
        </div>
      </main>

      {/* Grounded Interactive Draww AI Copilot Drawer with Full Context */}
      <AIChatConcierge
        selectedTickers={selectedTickers}
        currentSharpe={activeSharpe}
        currentReturn={activeNominalReturn}
        currentVol={activeVol}
        currentWeights={activeWeights}
        nominalReturn={activeNominalReturn}
        realReturn={activeRealReturn}
        taxDrag={optimizationResult?.tax_drag ?? 0.015}
        diversificationScore={optimizationResult?.diversification_score ?? 7.8}
        horizon={horizon}
        age={age}
        riskScore={riskScore}
        riskProfileName={riskProfile.name}
        initialCapital={initialCapital}
        authToken={authToken}
        externalIsOpen={isChatOpen}
        onToggleOpen={() => setIsChatOpen((prev) => !prev)}
      />

      {/* Bottom Legal Disclaimer (Visible only when scrolled down) */}
      <div className="relative z-10 mt-16">
        <DisclaimerBanner />
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">Tangent</span>
            <span>—</span>
            <span>Portfolio decisions you can trace.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deterministic Python Microservices</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span>SciPy SLSQP Optimizer</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Alembic Migrations</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

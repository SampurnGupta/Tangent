"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { YourPortfolioView } from "@/components/YourPortfolioView";
import { ArenaView } from "@/components/ArenaView";
import { HeroHomepage } from "@/components/HeroHomepage";
import { ModelObservatory } from "@/components/ModelObservatory";
import { AIChatConcierge } from "@/components/AIChatConcierge";
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

  // Authenticate guest, restore persistent state, and wake sleeping microservices on mount
  useEffect(() => {
    // Non-blocking activation request to wake sleeping Render microservices
    try {
      fetch("/api/warmup").catch(() => {});
    } catch {}

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
      } else {
        localStorage.removeItem("tangent_opt_result");
      }
      if (selectedCandidate) {
        localStorage.setItem("tangent_selected_candidate", JSON.stringify(selectedCandidate));
      } else {
        localStorage.removeItem("tangent_selected_candidate");
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
    <div className="min-h-screen bg-[#F4F5F6] text-[#191B1D] flex flex-col font-sans selection:bg-[#191B1D] selection:text-white relative overflow-x-hidden">
      <Header userId={userId} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        {/* Tab 1: Product Homepage */}
        <div className={activeTab === "home" ? "block animate-fade-in" : "hidden"}>
          <HeroHomepage
            onNavigate={(tabId) => setActiveTab(tabId === "home" ? "home" : tabId === "arena" ? "arena" : tabId === "observatory" ? "observatory" : "portfolio")}
            onOpenChat={() => setIsChatOpen(true)}
            investorProfileName={riskProfile.name}
            capital={initialCapital}
            nominalReturn={activeNominalReturn}
            realReturn={activeRealReturn}
            sharpeRatio={activeSharpe}
            weights={activeWeights}
          />
        </div>

        {/* Tab 2: Your Portfolio (Unified 7-Step Sequential Construction Workflow) */}
        <div
          className={
            activeTab === "portfolio" ||
            activeTab === "profile" ||
            activeTab === "universe" ||
            activeTab === "frontier" ||
            activeTab === "candidates" ||
            activeTab === "projections" ||
            activeTab === "backtest" ||
            activeTab === "decision"
              ? "block animate-fade-in"
              : "hidden"
          }
        >
          <YourPortfolioView
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
            selectedTickers={selectedTickers}
            setSelectedTickers={setSelectedTickers}
            authToken={authToken}
            riskProfile={riskProfile}
            optimizationResult={optimizationResult}
            setOptimizationResult={(res) => setOptimizationResult(res)}
            selectedCandidate={selectedCandidate}
            setSelectedCandidate={(cand) => setSelectedCandidate(cand)}
            activeWeights={activeWeights}
            activeSharpe={activeSharpe}
            activeNominalReturn={activeNominalReturn}
            activeRealReturn={activeRealReturn}
            activeVol={activeVol}
          />
        </div>

        {/* Tab 3: The Arena (Multi-Agent Cross-Fire Deliberation) */}
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

        {/* Tab 4: LLM Observatory & MetaBot DevOps Intelligence */}
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
      <footer className="border-t border-[#CDCECF] bg-[#FFFFFF] py-8 px-4 sm:px-6 lg:px-8 text-sm text-[#5A5D61] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#191B1D]">Tangent</span>
            <span>—</span>
            <span>Portfolio decisions you can trace.</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#5A5D61]">
              <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
              <span>Deterministic Python Services</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#5A5D61]">
              <Cpu className="w-4 h-4 text-[#191B1D]" />
              <span>SciPy SLSQP Solver</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#5A5D61]">
              <Database className="w-4 h-4 text-[#5A5D61]" />
              <span>Alembic Migrations</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

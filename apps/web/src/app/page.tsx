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
import { fetchGuestSession, getRiskProfile } from "@/lib/api";
import { ShieldCheck, Database, Cpu } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("wizard");
  const [userId, setUserId] = useState<string>("");
  const [authToken, setAuthToken] = useState<string>("");

  // Profiler state
  const [age, setAge] = useState<number>(32);
  const [horizon, setHorizon] = useState<number>(10);
  const [riskScore, setRiskScore] = useState<number>(6);

  // Asset state (default curated 8-asset universe)
  const [selectedTickers, setSelectedTickers] = useState<string[]>([
    "RELIANCE.NS",
    "TCS.NS",
    "HDFCBANK.NS",
    "INFY.NS",
    "SBI_FD",
    "INDIA_GOVT_10Y",
    "INDIA_CORP_AAA",
    "GOLDBEES.NS",
  ]);

  // Authenticate guest on mount
  useEffect(() => {
    async function initGuest() {
      const session = await fetchGuestSession();
      setUserId(session.user_id);
      setAuthToken(session.access_token);
    }
    initGuest();
  }, []);

  const riskProfile = getRiskProfile(riskScore, horizon);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      <DisclaimerBanner />
      <Header userId={userId} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === "wizard" && (
          <RiskProfilerWizard
            age={age}
            setAge={setAge}
            horizon={horizon}
            setHorizon={setHorizon}
            riskScore={riskScore}
            setRiskScore={setRiskScore}
            onProceed={() => setActiveTab("assets")}
          />
        )}

        {activeTab === "assets" && (
          <AssetSelector
            selectedTickers={selectedTickers}
            setSelectedTickers={setSelectedTickers}
            onProceed={() => setActiveTab("optimizer")}
          />
        )}

        {activeTab === "optimizer" && (
          <OptimizationDashboard
            selectedTickers={selectedTickers}
            riskProfile={riskProfile}
            authToken={authToken}
            onProceedToProjections={() => setActiveTab("projections")}
          />
        )}

        {activeTab === "projections" && (
          <MonteCarloProjection
            expectedReturn={0.128}
            volatility={0.122}
            horizonYears={horizon}
            authToken={authToken}
            onProceedToStudio={() => setActiveTab("studio")}
          />
        )}

        {activeTab === "studio" && (
          <DecisionStudio
            selectedTickers={selectedTickers}
            authToken={authToken}
            currentSharpe={0.475}
            currentReturn={0.134}
            currentVol={0.122}
          />
        )}
      </main>

      {/* Grounded AI Concierge Chat Drawer */}
      <AIChatConcierge
        selectedTickers={selectedTickers}
        currentSharpe={0.475}
        currentReturn={0.134}
        currentVol={0.122}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-zinc-500">
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

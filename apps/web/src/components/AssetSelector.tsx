"use client";

import React, { useState } from "react";
import { AssetItem, DEFAULT_CURATED_ASSETS } from "@/lib/api";
import {
  Search,
  Plus,
  Check,
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Coins,
  Building,
  PiggyBank,
  TrendingUp,
  Shield,
} from "lucide-react";

interface AssetSelectorProps {
  selectedTickers: string[];
  setSelectedTickers: (tickers: string[]) => void;
  onProceed: () => void;
}

export function AssetSelector({
  selectedTickers,
  setSelectedTickers,
  onProceed,
}: AssetSelectorProps) {
  const [filterClass, setFilterClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUnbiasedMode, setIsUnbiasedMode] = useState<boolean>(false);

  const toggleTicker = (ticker: string) => {
    if (selectedTickers.includes(ticker)) {
      if (selectedTickers.length <= 2) {
        alert("Portfolio requires at least 2 candidate assets for optimization.");
        return;
      }
      setSelectedTickers(selectedTickers.filter((t) => t !== ticker));
    } else {
      setSelectedTickers([...selectedTickers, ticker]);
    }
  };

  const applyPreset = (presetName: string) => {
    setIsUnbiasedMode(false);
    if (presetName === "balanced") {
      setSelectedTickers([
        "RELIANCE.NS",
        "TCS.NS",
        "HDFCBANK.NS",
        "INFY.NS",
        "SBI_FD",
        "INDIA_GOVT_10Y",
        "INDIA_CORP_AAA",
        "GOLDBEES.NS",
      ]);
    } else if (presetName === "allweather") {
      setSelectedTickers([
        "RELIANCE.NS",
        "HDFCBANK.NS",
        "SPY",
        "QQQ",
        "INDIA_GOVT_10Y",
        "SBI_FD",
        "GOLDBEES.NS",
        "SILVERBEES.NS",
        "EMBASSY_REIT",
      ]);
    } else if (presetName === "growth") {
      setSelectedTickers([
        "TCS.NS",
        "INFY.NS",
        "WIPRO.NS",
        "RELIANCE.NS",
        "QQQ",
        "BTC-USD",
        "INDIA_GOVT_10Y",
        "INDIA_CORP_AAA",
      ]);
    } else if (presetName === "nifty50_core") {
      setSelectedTickers(
        DEFAULT_CURATED_ASSETS.filter((a) => a.ticker.endsWith(".NS") && a.asset_class === "equity")
          .slice(0, 20)
          .map((a) => a.ticker)
      );
    }
  };

  // Unbiased full universe mode: selects all assets across all 8 domains without bias
  const handleEnableUnbiasedMode = () => {
    setIsUnbiasedMode(true);
    setSelectedTickers(DEFAULT_CURATED_ASSETS.map((a) => a.ticker));
  };

  const handleSelectAllVisible = () => {
    const visibleTickers = filteredAssets.map((a) => a.ticker);
    const merged = Array.from(new Set([...selectedTickers, ...visibleTickers]));
    setSelectedTickers(merged);
  };

  const filteredAssets = DEFAULT_CURATED_ASSETS.filter((asset) => {
    const isNiftyEquity = asset.ticker.endsWith(".NS") && asset.asset_class === "equity";
    const isDebt = asset.asset_class === "debt";
    const isFdSavings = ["SBI_FD", "HDFC_FD", "SAVINGS_ACCOUNT", "TREASURY_BILL_91D"].includes(asset.ticker);
    const isCommodity = asset.asset_class === "commodity";
    const isReit = asset.sector === "Real Estate" || asset.sector === "Global Real Estate";
    const isGlobalEtf = asset.currency === "USD" && asset.sector !== "Cryptocurrency";
    const isCrypto = asset.sector === "Cryptocurrency";

    let matchesCategory = true;
    if (filterClass === "nifty50") matchesCategory = isNiftyEquity;
    else if (filterClass === "bonds") matchesCategory = isDebt && !isFdSavings;
    else if (filterClass === "fds") matchesCategory = isFdSavings;
    else if (filterClass === "commodity") matchesCategory = isCommodity;
    else if (filterClass === "reit") matchesCategory = isReit;
    else if (filterClass === "global") matchesCategory = isGlobalEtf;
    else if (filterClass === "crypto") matchesCategory = isCrypto;

    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.sector.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 animate-fade-in">
      {/* Header & Unbiased Mode Highlight Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Step 2: Universal Multi-Asset Universe</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Candidate Assets & Domains
          </h2>
          <p className="text-xs text-zinc-400">
            Nifty 50 Equities, Sovereign Debt, FDs & Savings, REITs, Global ETFs, Commodities, and Crypto.
          </p>
        </div>

        {/* Unbiased Mode Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnableUnbiasedMode}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-lg cursor-pointer ${
              isUnbiasedMode
                ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-emerald-500/20"
                : "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50"
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>✨ Unbiased Auto-Universe ({DEFAULT_CURATED_ASSETS.length} Assets)</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <span className="text-xs text-zinc-400 font-semibold mr-1">Curated Strategies:</span>
        <button
          onClick={() => applyPreset("balanced")}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer border border-zinc-700"
        >
          Balanced 60/40
        </button>
        <button
          onClick={() => applyPreset("allweather")}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer border border-zinc-700"
        >
          All-Weather (Bonds + Gold + REITs)
        </button>
        <button
          onClick={() => applyPreset("nifty50_core")}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer border border-zinc-700"
        >
          Top 20 Nifty 50
        </button>
        <button
          onClick={() => applyPreset("growth")}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer border border-zinc-700"
        >
          Tech & Crypto Alpha
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/70 p-3 rounded-2xl border border-zinc-800 backdrop-blur-md">
        {/* Category Pills across all requested domains */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: `All Domains (${DEFAULT_CURATED_ASSETS.length})`, icon: Layers },
            { id: "nifty50", label: "Nifty 50 (50)", icon: TrendingUp },
            { id: "bonds", label: "Govt Bonds & Debt (4)", icon: Shield },
            { id: "fds", label: "FDs & Savings (4)", icon: PiggyBank },
            { id: "reit", label: "REITs (4)", icon: Building },
            { id: "commodity", label: "Commodities (4)", icon: Sparkles },
            { id: "global", label: "US & Global ETFs (5)", icon: Globe },
            { id: "crypto", label: "Crypto (3)", icon: Coins },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterClass(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterClass === cat.id
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search 70+ assets or tickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/60"
          />
        </div>
      </div>

      {/* Quick Select / Deselect Bar */}
      <div className="flex items-center justify-between text-xs px-1 text-zinc-400">
        <span>Showing {filteredAssets.length} assets in this view</span>
        <button
          onClick={handleSelectAllVisible}
          className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
        >
          + Select All {filteredAssets.length} Visible
        </button>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[560px] overflow-y-auto p-1 pr-2">
        {filteredAssets.map((asset) => {
          const isSelected = selectedTickers.includes(asset.ticker);
          const isCrypto = asset.sector === "Cryptocurrency";
          const isDebt = asset.asset_class === "debt";
          const isReit = asset.sector?.includes("Real Estate");
          const isComm = asset.asset_class === "commodity";

          return (
            <div
              key={asset.ticker}
              onClick={() => toggleTicker(asset.ticker)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                isSelected
                  ? "bg-teal-950/40 border-teal-500/60 shadow-lg shadow-teal-500/5 ring-1 ring-teal-500/30"
                  : "bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs text-white truncate">{asset.ticker}</span>
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                      isCrypto
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : isComm
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : isReit
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : isDebt
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {asset.asset_class}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-medium line-clamp-1">{asset.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span className="truncate">{asset.sector}</span>
                  <span>•</span>
                  <span>{asset.currency}</span>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? "bg-teal-500 text-zinc-950 font-bold"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Floating Action Bar */}
      <div className="sticky bottom-4 z-40 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">Active Universe:</span>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            {selectedTickers.length} Assets Selected
          </span>
          {isUnbiasedMode && (
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Unbiased Mode Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() =>
              setSelectedTickers([
                "RELIANCE.NS",
                "TCS.NS",
                "HDFCBANK.NS",
                "SBI_FD",
                "INDIA_GOVT_10Y",
                "GOLDBEES.NS",
                "SPY",
                "EMBASSY_REIT",
              ])
            }
            className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-2 cursor-pointer"
          >
            Reset Default
          </button>
          <button
            onClick={onProceed}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-zinc-950 font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <span>Proceed to Optimization ({selectedTickers.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

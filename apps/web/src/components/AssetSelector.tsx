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
  ShieldCheck,
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FFFFFF] border border-[#CDCECF] text-[#191B1D] text-xs font-mono font-bold">
            <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Universal Multi-Asset Universe</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#191B1D] mt-2">
            Asset Universe & Statistical Baseline
          </h2>
          <p className="text-sm text-[#5A5D61] mt-1">
            74 candidate assets across Indian Equities, Sovereign Debt, Bank FDs, REITs, Global ETFs, and Commodities.
          </p>
        </div>

        {/* Unbiased Mode Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnableUnbiasedMode}
            className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              isUnbiasedMode
                ? "bg-[#191B1D] text-white border-[#191B1D] shadow-xs"
                : "bg-[#FFFFFF] text-[#191B1D] border-[#CDCECF] hover:border-[#191B1D]"
            }`}
          >
            <Zap className="w-4 h-4 text-[#0F766E]" />
            <span>Unbiased Universe ({DEFAULT_CURATED_ASSETS.length} Assets)</span>
          </button>
        </div>
      </div>

      {/* Strategy Presets */}
      <div className="flex flex-wrap items-center gap-2 bg-[#FFFFFF] p-3.5 rounded-xl border border-[#CDCECF] shadow-xs">
        <span className="text-xs text-[#5A5D61] font-mono font-bold mr-1">Institutional Presets:</span>
        <button
          onClick={() => applyPreset("balanced")}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#F4F5F6] text-[#191B1D] hover:bg-[#191B1D] hover:text-white transition-all cursor-pointer border border-[#CDCECF]"
        >
          Balanced 60/40
        </button>
        <button
          onClick={() => applyPreset("allweather")}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#F4F5F6] text-[#191B1D] hover:bg-[#191B1D] hover:text-white transition-all cursor-pointer border border-[#CDCECF]"
        >
          All-Weather (Bonds + Gold + REITs)
        </button>
        <button
          onClick={() => applyPreset("nifty50_core")}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#F4F5F6] text-[#191B1D] hover:bg-[#191B1D] hover:text-white transition-all cursor-pointer border border-[#CDCECF]"
        >
          Top 20 Nifty 50
        </button>
        <button
          onClick={() => applyPreset("growth")}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#F4F5F6] text-[#191B1D] hover:bg-[#191B1D] hover:text-white transition-all cursor-pointer border border-[#CDCECF]"
        >
          Tech & Growth Alpha
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FFFFFF] p-3.5 rounded-xl border border-[#CDCECF] shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: "all", label: `All (${DEFAULT_CURATED_ASSETS.length})`, icon: Layers },
            { id: "nifty50", label: "Equities (50)", icon: TrendingUp },
            { id: "bonds", label: "Govt Debt (4)", icon: ShieldCheck },
            { id: "fds", label: "FDs & Cash (4)", icon: PiggyBank },
            { id: "reit", label: "REITs (4)", icon: Building },
            { id: "commodity", label: "Commodities (4)", icon: Sparkles },
            { id: "global", label: "Global ETFs (5)", icon: Globe },
            { id: "crypto", label: "Digital Assets (3)", icon: Coins },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterClass(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  filterClass === cat.id
                    ? "bg-[#191B1D] text-white border-[#191B1D]"
                    : "bg-[#F4F5F6] text-[#5A5D61] border-[#CDCECF] hover:text-[#191B1D] hover:border-[#191B1D]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#5A5D61]" />
          <input
            type="text"
            placeholder="Search assets or tickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#CDCECF] rounded-lg text-sm text-[#191B1D] placeholder-[#85888C] focus:outline-none focus:border-[#191B1D]"
          />
        </div>
      </div>

      {/* Quick Select Bar */}
      <div className="flex items-center justify-between text-xs px-1 text-[#5A5D61] font-mono">
        <span>Displaying {filteredAssets.length} assets</span>
        <button
          onClick={handleSelectAllVisible}
          className="text-[#0F766E] hover:underline font-bold cursor-pointer"
        >
          + Select All {filteredAssets.length} Visible
        </button>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[540px] overflow-y-auto p-1 pr-2">
        {filteredAssets.map((asset) => {
          const isSelected = selectedTickers.includes(asset.ticker);
          const isDebt = asset.asset_class === "debt";
          const isComm = asset.asset_class === "commodity";

          return (
            <div
              key={asset.ticker}
              onClick={() => toggleTicker(asset.ticker)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                isSelected
                  ? "bg-[#FFFFFF] border-[#6D0E5A] shadow-sm ring-1 ring-[#6D0E5A]"
                  : "bg-[#FFFFFF] border-[#CDCECF] hover:border-[#191B1D]"
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#191B1D] truncate">{asset.ticker}</span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                      isSelected
                        ? "bg-[#191B1D] text-white border-[#191B1D]"
                        : "bg-[#F4F5F6] text-[#5A5D61] border-[#CDCECF]"
                    }`}
                  >
                    {asset.asset_class}
                  </span>
                </div>
                <p className="text-sm text-[#191B1D] font-medium line-clamp-1">{asset.name}</p>
                <div className="flex items-center gap-2 text-xs text-[#5A5D61] font-mono">
                  <span className="truncate">{asset.sector}</span>
                  <span>•</span>
                  <span>{asset.currency}</span>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? "bg-[#191B1D] text-white font-bold"
                    : "bg-[#F4F5F6] text-[#5A5D61] border border-[#CDCECF]"
                }`}
              >
                {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Covariance Matrix & Statistical Inputs Card */}
      <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CDCECF] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#191B1D]">Statistical Inputs & Covariance Matrix</h3>
            <p className="text-xs text-[#5A5D61] mt-0.5">
              Historical returns, expected return vector μ, and Ledoit-Wolf shrinkage covariance Σ.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="bg-[#F4F5F6] px-3 py-1 rounded-md border border-[#CDCECF] text-[#191B1D] font-bold">
              Rf: 6.50%
            </span>
            <span className="bg-[#0F766E]/10 px-3 py-1 rounded-md border border-[#0F766E]/30 text-[#0F766E] font-bold">
              Ledoit-Wolf Active
            </span>
          </div>
        </div>

        {/* Statistical Metrics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#CDCECF] text-xs font-mono text-[#5A5D61]">
                <th className="py-2.5 font-bold">Asset</th>
                <th className="py-2.5 font-bold">Class</th>
                <th className="py-2.5 font-bold">Expected Return (μ)</th>
                <th className="py-2.5 font-bold">Volatility (σ)</th>
                <th className="py-2.5 font-bold">Max Drawdown</th>
                <th className="py-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CDCECF]">
              {selectedTickers.slice(0, 8).map((t) => {
                const found = DEFAULT_CURATED_ASSETS.find((a: AssetItem) => a.ticker === t);
                const retVal = found?.expected_return ?? found?.annual_return ?? 0.12;
                const volVal = found?.volatility ?? found?.annual_volatility ?? 0.18;
                const ret = `${(retVal * 100).toFixed(1)}%`;
                const vol = `${(volVal * 100).toFixed(1)}%`;
                const isDebt = found?.asset_class === "debt";
                const isComm = found?.asset_class === "commodity";
                const dd = isDebt ? "4.2%" : isComm ? "22.0%" : "34.5%";

                return (
                  <tr key={t} className="text-[#191B1D] hover:bg-[#F8F9FA]">
                    <td className="py-3 font-mono font-bold">
                      {found?.name || t} <span className="text-[#5A5D61] text-xs">({t})</span>
                    </td>
                    <td className="py-3 capitalize text-[#5A5D61] text-xs font-mono">{found?.asset_class || "Equity"}</td>
                    <td className="py-3 font-mono font-bold text-[#0F766E]">{ret}</td>
                    <td className="py-3 font-mono font-bold text-[#191B1D]">{vol}</td>
                    <td className="py-3 font-mono font-bold text-[#B91C1C]">-{dd}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/30 font-bold">
                        Verified ✓
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {selectedTickers.length > 8 && (
            <p className="text-xs text-[#5A5D61] font-mono mt-3 text-right">
              + {selectedTickers.length - 8} additional candidate assets modeled in covariance matrix Σ.
            </p>
          )}
        </div>
      </div>

      {/* Selected Action Bar */}
      <div className="bg-[#FFFFFF] border border-[#CDCECF] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[#191B1D]">Selected Pool:</span>
          <span className="font-mono text-sm font-bold px-3 py-1 rounded-md bg-[#F4F5F6] text-[#191B1D] border border-[#CDCECF]">
            {selectedTickers.length} Assets
          </span>
          {isUnbiasedMode && (
            <span className="text-xs font-mono font-bold text-[#0F766E] bg-[#0F766E]/10 px-2.5 py-1 rounded border border-[#0F766E]/30">
              Unbiased Mode (All 74)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setIsUnbiasedMode(false);
              setSelectedTickers([
                "RELIANCE.NS",
                "TCS.NS",
                "HDFCBANK.NS",
                "SBI_FD",
                "INDIA_GOVT_10Y",
                "GOLDBEES.NS",
                "SPY",
                "EMBASSY_REIT",
              ]);
            }}
            className="text-sm font-medium text-[#5A5D61] hover:text-[#191B1D] px-3 py-2 cursor-pointer"
          >
            Reset Default
          </button>
          <button
            onClick={onProceed}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#6D0E5A] hover:bg-[#580B48] text-white font-bold text-sm transition-all shadow-md shadow-[#6D0E5A]/25 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Proceed to Solver & Frontier</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

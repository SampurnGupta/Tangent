"use client";

import React, { useState } from "react";
import { AssetItem, DEFAULT_CURATED_ASSETS } from "@/lib/api";
import { Search, Plus, Check, ArrowRight, RotateCcw, Layers, Sparkles } from "lucide-react";

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
      ]);
    } else if (presetName === "growth") {
      setSelectedTickers([
        "TCS.NS",
        "INFY.NS",
        "WIPRO.NS",
        "RELIANCE.NS",
        "QQQ",
        "INDIA_GOVT_10Y",
        "INDIA_CORP_AAA",
      ]);
    }
  };

  const filteredAssets = DEFAULT_CURATED_ASSETS.filter((asset) => {
    const matchesCategory =
      filterClass === "all" ||
      (filterClass === "equity" && asset.asset_class === "equity") ||
      (filterClass === "debt" && asset.asset_class === "debt") ||
      (filterClass === "commodity" && asset.asset_class === "commodity") ||
      (filterClass === "global" && asset.currency === "USD");

    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.sector.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      {/* Header & Presets */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Step 2: Candidate Universe</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Select Portfolio Candidate Assets
          </h2>
          <p className="text-xs text-zinc-400">
            Selected assets will be evaluated and weighted by the SciPy SLSQP solver.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Presets:</span>
          <button
            onClick={() => applyPreset("balanced")}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer border border-zinc-700"
          >
            Balanced 60/40
          </button>
          <button
            onClick={() => applyPreset("allweather")}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer border border-zinc-700"
          >
            All-Weather
          </button>
          <button
            onClick={() => applyPreset("growth")}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer border border-zinc-700"
          >
            Tech Growth
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Assets" },
            { id: "equity", label: "Indian Equities" },
            { id: "debt", label: "Fixed Income & Debt" },
            { id: "commodity", label: "Commodities" },
            { id: "global", label: "US ETFs (USD)" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterClass(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterClass === cat.id
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search name or ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/60"
          />
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredAssets.map((asset) => {
          const isSelected = selectedTickers.includes(asset.ticker);
          return (
            <div
              key={asset.ticker}
              onClick={() => toggleTicker(asset.ticker)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                isSelected
                  ? "bg-teal-950/30 border-teal-500/50 shadow-md shadow-teal-500/5"
                  : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-white">{asset.ticker}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      asset.asset_class === "equity"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : asset.asset_class === "debt"
                        ? "bg-teal-500/10 text-teal-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {asset.asset_class}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-medium line-clamp-1">{asset.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span>{asset.sector}</span>
                  <span>•</span>
                  <span>{asset.currency}</span>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
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
          <span className="text-xs font-semibold text-zinc-300">Selected Universe:</span>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            {selectedTickers.length} Assets
          </span>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            (Includes equity, debt, and real-return assets)
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setSelectedTickers(["RELIANCE.NS", "TCS.NS", "SBI_FD", "INDIA_GOVT_10Y"])}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-2 cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={onProceed}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-zinc-950 font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <span>Proceed to Optimization</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

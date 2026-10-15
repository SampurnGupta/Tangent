"use client";

import React, { useState, useEffect } from "react";
import { fetchObservatoryLeaderboard, ModelLeaderboardItem } from "@/lib/api";
import { MetaBotChat } from "./MetaBotChat";
import {
  Activity,
  Zap,
  Clock,
  DollarSign,
  Cpu,
  RefreshCw,
  TrendingDown,
  Layers,
  Sparkles,
} from "lucide-react";

export function ModelObservatory() {
  const [leaderboard, setLeaderboard] = useState<ModelLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeSubTab, setActiveSubTab] = useState<"leaderboard" | "metabot">("leaderboard");

  const loadData = async () => {
    setLoading(true);
    const data = await fetchObservatoryLeaderboard();
    setLeaderboard(data);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const totalInferences = leaderboard.reduce((acc, item) => acc + item.call_count, 0);
  const totalCost = leaderboard.reduce((acc, item) => acc + item.total_cost_usd, 0);
  const fastestModel = [...leaderboard].sort((a, b) => a.p50_latency_ms - b.p50_latency_ms)[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[11px] font-mono text-cyan-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            DevOps AI Observatory & Multi-LLM Telemetry
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Model Performance Leaderboard
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Real-time inference profiling across independently deployed expert personas. Monitored in
            Redis via sub-millisecond sorted sets and token counters.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-700/60 transition-all hover:border-cyan-500/50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            Refresh
          </button>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 block">Updated: {lastRefreshed.toLocaleTimeString()}</span>
            <span className="text-[10px] text-emerald-400 font-mono">● 30s live sync</span>
          </div>
        </div>
      </div>

      {/* Metric High-Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span>Fastest Inference</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {fastestModel ? `${fastestModel.p50_latency_ms} ms` : "—"}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {fastestModel ? `${fastestModel.display_name} (p50)` : "Analyzing..."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span>Total Tracked Inferences</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {totalInferences.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Across 4 models in Redis</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span>Cumulative API Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            ${totalCost.toFixed(5)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Input + Output token billing</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span>Active Deployments</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">4 Services</div>
          <p className="text-[11px] text-zinc-500 mt-1">3 Personas + MetaBot</p>
        </div>
      </div>

      {/* Sub Tab Navigation: Leaderboard vs MetaBot Chat */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubTab("leaderboard")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === "leaderboard"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Model Leaderboard
        </button>
        <button
          onClick={() => setActiveSubTab("metabot")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === "metabot"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Ask MetaBot (DevOps AI)
        </button>
      </div>

      {/* Content based on sub-tab */}
      {activeSubTab === "leaderboard" ? (
        <div className="space-y-6">
          {/* Detailed Leaderboard Table */}
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Cross-Model Latency & Cost Matrix</h3>
                <p className="text-[11px] text-zinc-400">Comparing inference times, token usage, and unit economics</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-[11px] text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Model & Provider</th>
                    <th className="py-3.5 px-4">Persona</th>
                    <th className="py-3.5 px-4">p50 Latency</th>
                    <th className="py-3.5 px-4">p95 Latency</th>
                    <th className="py-3.5 px-4">Avg Tokens/Reply</th>
                    <th className="py-3.5 px-4">Cost / 1k Calls</th>
                    <th className="py-3.5 px-4">Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {leaderboard.map((item, idx) => {
                    const personaLabel =
                      item.model.includes("gemini")
                        ? "MacroBot 🏛️"
                        : item.model.includes("llama-3.3")
                        ? "GrowthBot 🚀"
                        : item.model.includes("mistral")
                        ? "RiskBot 🛡️"
                        : "Self-Hosted 💻";

                    return (
                      <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            {item.display_name}
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                              {item.provider}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-sans block">{item.model}</span>
                        </td>
                        <td className="py-3.5 px-4 font-sans text-zinc-200">{personaLabel}</td>
                        <td className="py-3.5 px-4 font-bold text-amber-400">{item.p50_latency_ms} ms</td>
                        <td className="py-3.5 px-4 text-zinc-400">{item.p95_latency_ms} ms</td>
                        <td className="py-3.5 px-4 text-cyan-400">{item.avg_tokens_per_response}</td>
                        <td className="py-3.5 px-4 text-emerald-400">
                          {item.cost_per_1k_calls === 0 ? "FREE" : `$${item.cost_per_1k_calls.toFixed(4)}`}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">{item.call_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparative Latency Visualization Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Median Response Latency (p50)
                </h4>
                <span className="text-[10px] text-zinc-500">Lower is faster</span>
              </div>
              <div className="space-y-3">
                {leaderboard.map((m, i) => {
                  const maxLat = Math.max(...leaderboard.map((x) => x.p50_latency_ms), 1000);
                  const pct = Math.min(100, Math.max(10, (m.p50_latency_ms / maxLat) * 100));
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-300 font-medium">{m.display_name}</span>
                        <span className="font-mono text-amber-400">{m.p50_latency_ms} ms</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Estimated Cost Per 1,000 Queries
                </h4>
                <span className="text-[10px] text-zinc-500">Lower is cheaper</span>
              </div>
              <div className="space-y-3">
                {leaderboard.map((m, i) => {
                  const maxCost = Math.max(...leaderboard.map((x) => x.cost_per_1k_calls), 0.60);
                  const pct = Math.min(100, Math.max(5, (m.cost_per_1k_calls / maxCost) * 100));
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-300 font-medium">{m.display_name}</span>
                        <span className="font-mono text-emerald-400">
                          {m.cost_per_1k_calls === 0 ? "$0.00 (Self-Hosted)" : `$${m.cost_per_1k_calls.toFixed(4)}`}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MetaBot Chat sub-tab */
        <MetaBotChat />
      )}
    </div>
  );
}

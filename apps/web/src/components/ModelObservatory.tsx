"use client";

import React, { useState, useEffect } from "react";
import {
  fetchObservatoryLeaderboard,
  clearObservatoryTelemetryCache,
  ModelLeaderboardItem,
  triggerMicroserviceWarmup,
  OBSERVATORY_BASE_URL,
  fetchMicroserviceMetrics,
  MicroserviceMetricItem,
} from "@/lib/api";
import { MetaBotChat } from "./MetaBotChat";
import {
  Activity,
  Zap,
  Clock,
  DollarSign,
  Cpu,
  RefreshCw,
  RotateCcw,
  Layers,
  Sparkles,
  Bot,
  ArrowRight,
  Server,
  ArrowUpDown,
} from "lucide-react";

export function ModelObservatory() {
  const [leaderboard, setLeaderboard] = useState<ModelLeaderboardItem[]>([]);
  const [microservices, setMicroservices] = useState<MicroserviceMetricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [syncingMicroservices, setSyncingMicroservices] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeSubTab, setActiveSubTab] = useState<"leaderboard" | "microservices" | "metabot">("leaderboard");

  const loadData = async () => {
    setLoading(true);
    const [boardData, msData] = await Promise.all([
      fetchObservatoryLeaderboard(),
      fetchMicroserviceMetrics(),
    ]);
    setLeaderboard(boardData);
    setMicroservices(msData);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  const handleSyncMicroservices = async () => {
    setSyncingMicroservices(true);
    const data = await fetchMicroserviceMetrics();
    setMicroservices(data);
    setLastRefreshed(new Date());
    setSyncingMicroservices(false);
  };

  const handleClearCache = async () => {
    setClearing(true);
    clearObservatoryTelemetryCache();
    try {
      await fetch(`${OBSERVATORY_BASE_URL}/api/v1/observatory/reset`, {
        method: "POST",
      }).catch(() => {});
    } catch {
      // Ignore network errors on local reset
    }
    await loadData();
    setClearing(false);
  };

  useEffect(() => {
    triggerMicroserviceWarmup();
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalInferences = leaderboard.reduce((acc, item) => acc + item.call_count, 0);
  const totalCost = leaderboard.reduce((acc, item) => acc + item.total_cost_usd, 0);
  const fastestModel =
    [...leaderboard].filter((x) => x.p50_latency_ms > 0).sort((a, b) => a.p50_latency_ms - b.p50_latency_ms)[0] ||
    leaderboard[0];
  const upServicesCount = microservices.filter((m) => m.status === "Up").length;
  const totalClusterPayloadKb = microservices.reduce((acc, m) => acc + m.payload_transfer_kb, 0);
  const totalMicroservicesHits = microservices.reduce((acc, m) => acc + m.request_hits, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-7 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F4F5F6] border border-[#CDCECF] text-xs font-mono font-bold text-[#191B1D]">
            <Activity className="w-3.5 h-3.5 text-[#6D0E5A]" />
            <span>DevOps Telemetry & Dynamic Model Routing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#191B1D] tracking-tight mt-1">
            LLM Observatory & MetaBot
          </h2>
          <p className="text-sm text-[#5A5D61] max-w-2xl leading-relaxed">
            Real-time inference profiling across independent persona microservices. Monitored via sub-millisecond sorted sets and token velocity counters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearCache}
            disabled={loading || clearing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFFFF] hover:bg-[#F4F5F6] text-[#5A5D61] hover:text-[#191B1D] rounded-lg text-xs font-mono font-bold border border-[#CDCECF] transition-all cursor-pointer shadow-2xs"
            title="Clear cached matrix data and purge cold-start latency records"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[#6D0E5A] ${clearing ? "animate-spin" : ""}`} />
            <span>Clear Matrix Cache</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] hover:bg-[#F4F5F6] text-[#191B1D] rounded-lg text-xs font-mono font-bold border border-[#CDCECF] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#6D0E5A] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="text-right font-mono text-xs text-[#5A5D61]">
            <span suppressHydrationWarning className="block">Synced: {lastRefreshed.toLocaleTimeString()}</span>
            <span className="text-[#6D0E5A] font-bold">● 30s auto-sync</span>
          </div>
        </div>
      </div>

      {/* Cluster & Model Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#CDCECF] shadow-xs">
          <div className="flex items-center justify-between text-[#5A5D61] mb-2 text-xs font-mono">
            <span>Core Microservices</span>
            <Server className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="text-2xl font-black text-[#0F766E] font-mono">
            {microservices.length > 0 ? `${upServicesCount}/${microservices.length} Up` : "6/6 Up"}
          </div>
          <p className="text-xs text-[#5A5D61] mt-1">Deterministic cluster</p>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#CDCECF] shadow-xs">
          <div className="flex items-center justify-between text-[#5A5D61] mb-2 text-xs font-mono">
            <span>Cluster Data Transfer</span>
            <ArrowUpDown className="w-4 h-4 text-[#6D0E5A]" />
          </div>
          <div className="text-2xl font-black text-[#191B1D] font-mono">
            {totalClusterPayloadKb.toFixed(1)} KB
          </div>
          <p className="text-xs text-[#5A5D61] mt-1">{totalMicroservicesHits} cluster requests</p>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#CDCECF] shadow-xs">
          <div className="flex items-center justify-between text-[#5A5D61] mb-2 text-xs font-mono">
            <span>Fastest Inference</span>
            <Zap className="w-4 h-4 text-[#6D0E5A]" />
          </div>
          <div className="text-2xl font-black text-[#191B1D] font-mono">
            {fastestModel ? `${fastestModel.p50_latency_ms} ms` : "—"}
          </div>
          <p className="text-xs text-[#5A5D61] mt-1">
            {fastestModel ? `${fastestModel.display_name} (p50)` : "Analyzing..."}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#CDCECF] shadow-xs">
          <div className="flex items-center justify-between text-[#5A5D61] mb-2 text-xs font-mono">
            <span>Tracked Inferences</span>
            <Layers className="w-4 h-4 text-[#191B1D]" />
          </div>
          <div className="text-2xl font-black text-[#191B1D] font-mono">
            {totalInferences.toLocaleString()}
          </div>
          <p className="text-xs text-[#5A5D61] mt-1">Across 3 Persona LLMs</p>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#CDCECF] shadow-xs">
          <div className="flex items-center justify-between text-[#5A5D61] mb-2 text-xs font-mono">
            <span>Cumulative API Cost</span>
            <DollarSign className="w-4 h-4 text-[#6D0E5A]" />
          </div>
          <div className="text-2xl font-black text-[#6D0E5A] font-mono">
            ${totalCost.toFixed(5)}
          </div>
          <p className="text-xs text-[#5A5D61] mt-1">Enterprise scaling projection</p>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#CDCECF] shadow-xs">
          <div className="flex items-center justify-between text-[#5A5D61] mb-2 text-xs font-mono">
            <span>Monitored Fleet</span>
            <Cpu className="w-4 h-4 text-[#191B1D]" />
          </div>
          <div className="text-2xl font-black text-[#191B1D] font-mono">10 Services</div>
          <p className="text-xs text-[#5A5D61] mt-1">6 Core + 3 Personas + MetaBot</p>
        </div>
      </div>

      {/* ── METABOT PROMINENT SPOTLIGHT BANNER ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#FFFFFF] via-[#FDF8FC] to-[#FFFFFF] border-2 border-[#6D0E5A]/30 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6D0E5A]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#6D0E5A] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#6D0E5A]/25">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-black text-lg text-[#191B1D]">MetaBot DevOps & Telemetry Analyst</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#6D0E5A]/10 text-[#6D0E5A] border border-[#6D0E5A]/30 text-xs font-mono font-bold">
                  Interactive AI Observer
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono text-[#0F766E] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
                  Live Redis Telemetry Active
                </span>
              </div>
              <p className="text-xs text-[#5A5D61] mt-1 leading-relaxed max-w-2xl">
                Have questions about inference latency, Groq LPU vs GPU memory bandwidth, or how our decoupled microservices communicate? MetaBot analyzes live Redis sorted sets, multi-LLM telemetry, and architectural trade-offs in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => setActiveSubTab("metabot")}
              className={`w-full lg:w-auto px-5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                activeSubTab === "metabot"
                  ? "bg-[#6D0E5A] text-white shadow-[#6D0E5A]/30"
                  : "bg-[#191B1D] hover:bg-[#6D0E5A] text-white shadow-xs"
              }`}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{activeSubTab === "metabot" ? "Viewing MetaBot Chat" : "Consult MetaBot Analyst"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="mt-4 pt-3.5 border-t border-[#CDCECF]/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-mono font-bold text-[#5A5D61] shrink-0">Quick Consult:</span>
          {[
            "Explain Tangent's 10-microservice architecture",
            "Why is Groq LPU faster than standard GPU inference?",
            "Compare cost of 100,000 queries on Gemini vs Groq",
            "Which model is optimal for quantitative covariance calculations?",
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveSubTab("metabot");
              }}
              className="text-[11px] px-3 py-1 bg-[#FFFFFF] hover:bg-[#F4F5F6] text-[#191B1D] hover:text-[#6D0E5A] rounded-md border border-[#CDCECF] whitespace-nowrap transition-all cursor-pointer font-mono shrink-0 shadow-2xs"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-[#CDCECF] pb-2">
        <button
          onClick={() => setActiveSubTab("leaderboard")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            activeSubTab === "leaderboard"
              ? "bg-[#191B1D] text-white border-[#191B1D] shadow-xs"
              : "bg-[#FFFFFF] text-[#5A5D61] border-[#CDCECF] hover:text-[#191B1D]"
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Model Leaderboard
        </button>
        <button
          onClick={() => setActiveSubTab("microservices")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            activeSubTab === "microservices"
              ? "bg-[#191B1D] text-white border-[#191B1D] shadow-xs"
              : "bg-[#FFFFFF] text-[#5A5D61] border-[#CDCECF] hover:text-[#191B1D]"
          }`}
        >
          <Server className="w-4 h-4" />
          Microservices
        </button>
        <button
          onClick={() => setActiveSubTab("metabot")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            activeSubTab === "metabot"
              ? "bg-[#6D0E5A] text-white border-[#6D0E5A] shadow-sm shadow-[#6D0E5A]/25"
              : "bg-[#FFFFFF] text-[#6D0E5A] border-[#6D0E5A]/40 hover:bg-[#6D0E5A]/5 font-black"
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#6D0E5A]" />
          <span>Ask MetaBot (DevOps AI)</span>
          <span className="px-1.5 py-0.5 rounded bg-[#6D0E5A]/15 text-[10px] font-bold">Featured</span>
        </button>
      </div>

      {/* Content based on sub-tab */}
      <div className={activeSubTab === "leaderboard" ? "space-y-6" : "hidden"}>
          {/* Detailed Leaderboard Table */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#CDCECF] bg-[#F8F9FA] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#191B1D]">Cross-Model Latency & Economics Matrix</h3>
                <p className="text-xs text-[#5A5D61]">Warm inference benchmarks and commercial scaling unit economics</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#191B1D]">
                <thead className="bg-[#FFFFFF] text-xs text-[#5A5D61] uppercase font-mono tracking-wider border-b border-[#CDCECF]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Model & Provider</th>
                    <th className="py-3.5 px-4 font-bold">Persona</th>
                    <th className="py-3.5 px-4 font-bold">p50 Latency</th>
                    <th className="py-3.5 px-4 font-bold">p95 Latency</th>
                    <th className="py-3.5 px-4 font-bold">Avg. Tokens/Response</th>
                    <th className="py-3.5 px-4 font-bold">Cost / 1k Calls</th>
                    <th className="py-3.5 px-4 font-bold">Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CDCECF] font-mono">
                  {leaderboard.map((item, idx) => {
                    const personaLabel =
                      item.model.includes("gemini")
                        ? "MacroBot 🏛️"
                        : item.model.includes("llama-3.3")
                        ? "GrowthBot 🚀"
                        : item.model.includes("llama-3.2") || item.model.includes("cloudflare") || item.model.includes("mistral")
                        ? "RiskBot 🛡️"
                        : "DevOps AI 🤖";

                    return (
                      <tr key={idx} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#191B1D] flex items-center gap-2">
                            {item.display_name}
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4F5F6] text-[#5A5D61] border border-[#CDCECF]">
                              {item.provider}
                            </span>
                          </div>
                          <span className="text-xs text-[#5A5D61] font-mono block mt-0.5">{item.model}</span>
                        </td>
                        <td className="py-3.5 px-4 font-sans text-xs text-[#191B1D] font-medium">{personaLabel}</td>
                        <td className="py-3.5 px-4 font-bold text-[#191B1D]">{item.p50_latency_ms} ms</td>
                        <td className="py-3.5 px-4 text-[#5A5D61]">{item.p95_latency_ms} ms</td>
                        <td className="py-3.5 px-4 text-[#191B1D]">{item.avg_tokens_per_response}</td>
                        <td className="py-3.5 px-4 text-[#6D0E5A] font-bold">
                          ${item.cost_per_1k_calls.toFixed(4)}
                        </td>
                        <td className="py-3.5 px-4 text-[#5A5D61]">{item.call_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparative Latency Visualization Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#CDCECF] pb-3">
                <h4 className="text-sm font-bold text-[#191B1D] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6D0E5A]" />
                  <span>Median Response Latency (p50)</span>
                </h4>
                <span className="text-xs font-mono text-[#5A5D61]">Lower is faster</span>
              </div>
              <div className="space-y-3.5">
                {leaderboard.map((m, i) => {
                  const maxLat = Math.max(...leaderboard.map((x) => x.p50_latency_ms), 1000);
                  const pct = Math.min(100, Math.max(10, (m.p50_latency_ms / maxLat) * 100));
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#191B1D] font-medium">{m.display_name}</span>
                        <span className="font-mono font-bold text-[#191B1D]">{m.p50_latency_ms} ms</span>
                      </div>
                      <div className="w-full bg-[#F4F5F6] rounded-full h-2 overflow-hidden border border-[#CDCECF]">
                        <div
                          className="bg-[#191B1D] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#CDCECF] pb-3">
                <h4 className="text-sm font-bold text-[#191B1D] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#6D0E5A]" />
                  <span>Estimated Cost Per 1,000 Inferences</span>
                </h4>
                <span className="text-xs font-mono text-[#5A5D61]">Lower is cheaper</span>
              </div>
              <div className="space-y-3.5">
                {leaderboard.map((m, i) => {
                  const maxCost = Math.max(...leaderboard.map((x) => x.cost_per_1k_calls), 0.60);
                  const pct = Math.min(100, Math.max(5, (m.cost_per_1k_calls / maxCost) * 100));
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#191B1D] font-medium">{m.display_name}</span>
                        <span className="font-mono font-bold text-[#6D0E5A]">
                          ${m.cost_per_1k_calls.toFixed(4)}
                        </span>
                      </div>
                      <div className="w-full bg-[#F4F5F6] rounded-full h-2 overflow-hidden border border-[#CDCECF]">
                        <div
                          className="bg-[#6D0E5A] h-2 rounded-full transition-all duration-500"
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

      {/* Microservices Sub-Dashboard */}
      <div className={activeSubTab === "microservices" ? "space-y-6" : "hidden"}>
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#CDCECF] overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-[#CDCECF] bg-[#F8F9FA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-sm font-bold text-[#191B1D]">Core Deterministic Microservices</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  6 Monitored
                </span>
              </div>
              <p className="text-xs text-[#5A5D61] mt-0.5">
                Deterministic cluster latency, request hits, and payload transfer across dedicated ports
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncMicroservices}
                disabled={syncingMicroservices}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F4F5F6] text-[#191B1D] rounded-lg text-xs font-mono font-bold border border-[#CDCECF] transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#6D0E5A] ${syncingMicroservices ? "animate-spin" : ""}`} />
                <span>{syncingMicroservices ? "Syncing..." : "Sync Metrics"}</span>
              </button>
              <span className="text-[11px] font-mono text-[#5A5D61]" suppressHydrationWarning>
                {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#191B1D]">
              <thead className="bg-[#FFFFFF] text-xs text-[#5A5D61] uppercase font-mono tracking-wider border-b border-[#CDCECF]">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Microservice</th>
                  <th className="py-3.5 px-6 font-bold">Status</th>
                  <th className="py-3.5 px-6 font-bold">Response Latency</th>
                  <th className="py-3.5 px-6 font-bold">Request Hits</th>
                  <th className="py-3.5 px-6 font-bold">Payload Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CDCECF] font-mono">
                {microservices.map((svc) => {
                  const statusConfig = {
                    Up: {
                      badge: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
                      dot: "bg-[#059669]",
                      label: "Up",
                    },
                    Starting: {
                      badge: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]",
                      dot: "bg-[#D97706] animate-pulse",
                      label: "Starting",
                    },
                    Down: {
                      badge: "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]",
                      dot: "bg-[#DC2626]",
                      label: "Down",
                    },
                  }[svc.status] || {
                    badge: "bg-[#F4F5F6] text-[#5A5D61] border-[#CDCECF]",
                    dot: "bg-[#9CA3AF]",
                    label: svc.status,
                  };

                  return (
                    <tr key={svc.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-[#191B1D] flex items-center gap-2">
                          <span>{svc.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F5F6] text-[#5A5D61] border border-[#CDCECF]">
                            :{svc.port}
                          </span>
                        </div>
                        <span className="text-xs text-[#5A5D61] font-sans block mt-0.5">{svc.description}</span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.badge}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-[#191B1D]">
                          {svc.status === "Down" ? "—" : `${svc.response_latency_ms.toFixed(1)} ms`}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-[#191B1D]">
                        <span className="font-bold">{svc.request_hits.toLocaleString()}</span>
                        <span className="text-xs text-[#5A5D61] ml-1">hits</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#6D0E5A] font-bold">
                        {svc.payload_transfer_kb >= 1024
                          ? `${(svc.payload_transfer_kb / 1024).toFixed(2)} MB`
                          : `${svc.payload_transfer_kb.toFixed(1)} KB`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={activeSubTab === "metabot" ? "block" : "hidden"}>
        <MetaBotChat />
      </div>
    </div>
  );
}

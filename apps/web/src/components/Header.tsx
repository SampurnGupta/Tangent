"use client";

import React from "react";

interface HeaderProps {
  userId?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ userId, activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="border-b border-[#CDCECF] bg-[#F4F5F6]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between relative">
        {/* Left: Logo & Wordmark (Clicking navigates to Home / Overview) */}
        <button
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3 text-left cursor-pointer group focus:outline-none shrink-0"
          title="Tangent — Return to Overview"
        >
          <div className="w-10 h-10 rounded-lg bg-[#191B1D] text-white flex items-center justify-center font-bold text-xl tracking-tight transition-transform group-hover:scale-105 shadow-xs">
            T
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#191B1D] group-hover:text-black block leading-tight">
              Tangent
            </span>
            <p className="text-xs text-[#5A5D61] font-medium leading-none mt-0.5">
              Portfolio decisions you can trace.
            </p>
          </div>
        </button>

        {/* Center: Strictly Centralized Navbar (Only 3 Options, Overview moved to Logo) */}
        <nav className="flex md:absolute md:left-1/2 md:-translate-x-1/2 items-center gap-1.5 bg-[#FFFFFF] p-1.5 rounded-xl border border-[#CDCECF] shadow-xs z-20">
          {[
            { id: "portfolio", label: "Your Portfolio" },
            { id: "arena", label: "Arena" },
            { id: "observatory", label: "Observatory" },
          ].map((tab) => {
            const isActive =
              activeTab === tab.id ||
              (tab.id === "portfolio" &&
                (activeTab === "profile" ||
                  activeTab === "universe" ||
                  activeTab === "frontier" ||
                  activeTab === "candidates" ||
                  activeTab === "projections" ||
                  activeTab === "backtest" ||
                  activeTab === "decision"));

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#191B1D] text-white shadow-xs"
                    : "text-[#5A5D61] hover:text-[#191B1D] hover:bg-[#F4F5F6]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Operational Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#5A5D61] bg-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#CDCECF]">
          <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
          <span className="font-medium text-[#191B1D]">Verified Deterministic</span>
        </div>
      </div>
    </header>
  );
}

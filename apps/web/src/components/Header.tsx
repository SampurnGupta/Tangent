"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface HeaderProps {
  userId?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenChat?: () => void;
}

export function Header({ userId, activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="border-b border-[#CDCECF] bg-[#FFFFFF]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between relative">
        {/* Left: Logo & Wordmark with Divider & Subtitle (Clicking navigates to Home / Overview) */}
        <button
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3 text-left cursor-pointer group focus:outline-none shrink-0"
          title="Tangent — Return to Overview"
        >
          <div className="w-9 h-9 rounded-lg bg-[#6D0E5A] text-white flex items-center justify-center font-black text-lg tracking-tight transition-transform group-hover:scale-105 shadow-sm shadow-[#6D0E5A]/25">
            T
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-black text-2xl tracking-tight text-[#191B1D] group-hover:text-[#6D0E5A] transition-colors block leading-tight">
              Tangent
            </span>
            <div className="hidden sm:block h-4 w-[1px] bg-[#CDCECF]" />
            <p className="text-xs text-[#5A5D61] font-medium leading-none hidden sm:block">
              Portfolio decisions you can trace.
            </p>
          </div>
        </button>

        {/* Center: Strictly Centralized Navbar (3 core options styled with #6D0E5A) */}
        <nav className="flex md:absolute md:left-1/2 md:-translate-x-1/2 items-center gap-1 bg-[#FFFFFF] p-1.5 rounded-full border border-[#CDCECF] shadow-xs z-20">
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
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#6D0E5A] text-white shadow-sm shadow-[#6D0E5A]/25 font-bold"
                    : "text-[#5A5D61] hover:text-[#6D0E5A] hover:bg-[#F7EBF4]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Operational Status & Quick Action (Replaces Verified Deterministic) */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#5A5D61] bg-[#F8F9FA] px-3.5 py-1.5 rounded-full border border-[#CDCECF]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-[#191B1D]">10 Services Active</span>
          </div>

          <button
            onClick={() => setActiveTab("portfolio")}
            className="px-4 py-2 rounded-full bg-[#191B1D] hover:bg-[#6D0E5A] text-white text-xs font-bold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Build Portfolio</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#CDCECF]" />
          </button>
        </div>
      </div>
    </header>
  );
}

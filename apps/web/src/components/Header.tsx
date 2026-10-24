"use client";

import React from "react";

interface HeaderProps {
  userId?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenChat?: () => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="border-b border-[#CDCECF] bg-[#FFFFFF]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between relative">
        {/* Left: Prominent Logo & Wordmark (Returns to Overview / Home) */}
        <button
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3.5 text-left cursor-pointer group focus:outline-none shrink-0"
          title="Tangent — Return to Overview"
        >
          <div className="w-11 h-11 rounded-xl bg-[#6D0E5A] text-white flex items-center justify-center font-black text-2xl tracking-tight transition-transform group-hover:scale-105 shadow-sm shadow-[#6D0E5A]/25">
            T
          </div>
          <span className="font-black text-3xl tracking-tight text-[#191B1D] group-hover:text-[#6D0E5A] transition-colors block leading-none">
            Tangent
          </span>
        </button>

        {/* Center: Strictly Centralized Navbar (3 core options) */}
        <nav className="flex md:absolute md:left-1/2 md:-translate-x-1/2 items-center gap-1.5 bg-[#FFFFFF] p-1.5 rounded-full border border-[#CDCECF] shadow-xs z-20">
          {[
            { id: "portfolio", label: "Your Portfolio" },
            { id: "arena", label: "Investment Committee" },
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
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
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

        {/* Right: Balanced Spacer for Desktop Geometry */}
        <div className="hidden md:block w-32 shrink-0" />
      </div>
    </header>
  );
}

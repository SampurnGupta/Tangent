"use client";

import React, { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

export function DisclaimerBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Legal Disclaimer" className="bg-[#FFFFFF] border-t border-[#CDCECF] text-[#5A5D61] text-xs py-3.5 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
          <span>
            <strong className="font-bold text-[#191B1D]">Important Disclaimer:</strong> Tangent is an educational quantitative decision-support tool, not registered investment advice. Numbers are derived from historical deterministic mathematical models.
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-mono font-bold text-[#191B1D] hover:underline underline-offset-2 shrink-0 self-end md:self-auto cursor-pointer"
        >
          <span>{expanded ? "Hide Details" : "View Full Terms"}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-[#CDCECF] text-xs leading-relaxed text-[#5A5D61] grid grid-cols-1 md:grid-cols-2 gap-4 pb-1">
          <div>
            <p className="font-bold text-[#191B1D] mb-1">Historical Data & Model Assumptions</p>
            <p>
              All return and risk estimates are based on historical price series. Past performance does not guarantee future results. Calculations incorporate tax rates (LTCG 12.5%, Debt slab 30%) and standard 6.0% inflation assumptions under Finance Act 2024.
            </p>
          </div>
          <div>
            <p className="font-bold text-[#191B1D] mb-1">Decision Support Only</p>
            <p>
              This platform does not provide directive buy/sell recommendations or guaranteed outcomes. Always consult a certified SEBI-registered advisor for tailored financial planning.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

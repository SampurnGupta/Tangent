"use client";

import React, { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

export function DisclaimerBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Legal Disclaimer" className="bg-amber-950/20 border-b border-amber-500/20 text-amber-200 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-300">Important Disclaimer:</strong> Tangent is an educational decision-support tool, not investment advice. Numbers are derived from historical deterministic models.
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2 shrink-0 self-end md:self-auto cursor-pointer"
        >
          <span>{expanded ? "Hide Details" : "View Full Terms"}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-amber-500/20 text-[11px] leading-relaxed text-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 pb-1">
          <div>
            <p className="font-medium text-amber-300 mb-1">Historical Data & Model Assumptions</p>
            <p>
              All return and risk estimates are based on historical data. Past performance does not guarantee future results. Calculations incorporate tax rates (LTCG 12.5%, Debt slab 30%) and standard 6.0% inflation assumptions.
            </p>
          </div>
          <div>
            <p className="font-medium text-amber-300 mb-1">Decision Support Only</p>
            <p>
              This tool does not provide directive recommendations ("you should buy", "guaranteed"). Always consult a certified financial planner for personalized advice. Developers accept no liability for financial actions taken.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

import React, { useState, useMemo } from "react";
import { Match } from "../types";
import { 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  BarChart3, 
  Sparkles, 
  X, 
  ExternalLink,
  ShieldCheck,
  Scale
} from "lucide-react";

interface SlipComparisonModalProps {
  slipA: any;
  slipB: any;
  matches: Match[];
  onClose: () => void;
  onLoadSlip: (slip: any) => void;
}

export const SlipComparisonModal: React.FC<SlipComparisonModalProps> = ({
  slipA,
  slipB,
  matches,
  onClose,
  onLoadSlip
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "overlap" | "conflict">("all");

  // Calculate statistics for Slip A vs Slip B
  const comparisonData = useMemo(() => {
    if (!slipA || !slipB) return null;

    let exactMatches = 0;
    let partialOverlaps = 0;
    let conflicts = 0;
    let activeEvaluated = 0;

    // Distribution counters
    const distA = { "1": 0, "X": 0, "2": 0 };
    const distB = { "1": 0, "X": 0, "2": 0 };

    const matrix = matches.map((m) => {
      const picksA: string[] = slipA.selections?.[m.match_no] || [];
      const picksB: string[] = slipB.selections?.[m.match_no] || [];

      // Update distributions
      picksA.forEach((p) => {
        if (p in distA) distA[p as keyof typeof distA]++;
      });
      picksB.forEach((p) => {
        if (p in distB) distB[p as keyof typeof distB]++;
      });

      const isActiveInA = picksA.length > 0;
      const isActiveInB = picksB.length > 0;

      if (isActiveInA || isActiveInB) {
        activeEvaluated++;
      }

      // Check intersection
      const intersection = picksA.filter((p) => picksB.includes(p));
      const areExact =
        picksA.length === picksB.length &&
        picksA.every((p) => picksB.includes(p)) &&
        picksA.length > 0;

      let status: "exact" | "partial" | "conflict" | "none" = "none";

      if (areExact) {
        status = "exact";
        exactMatches++;
      } else if (intersection.length > 0) {
        status = "partial";
        partialOverlaps++;
      } else if (isActiveInA && isActiveInB) {
        status = "conflict";
        conflicts++;
      }

      return {
        match: m,
        picksA,
        picksB,
        intersection,
        status,
        isActiveInA,
        isActiveInB
      };
    });

    const totalASelections = Object.values(distA).reduce((acc, c) => acc + c, 0);
    const totalBSelections = Object.values(distB).reduce((acc, c) => acc + c, 0);

    const overlapPercentage = activeEvaluated > 0 
      ? Math.round(((exactMatches + partialOverlaps) / activeEvaluated) * 100) 
      : 0;

    return {
      matrix,
      exactMatches,
      partialOverlaps,
      conflicts,
      activeEvaluated,
      distA,
      distB,
      totalASelections,
      totalBSelections,
      overlapPercentage
    };
  }, [slipA, slipB, matches]);

  if (!comparisonData) return null;

  const filteredMatrix = comparisonData.matrix.filter((item) => {
    if (filterMode === "overlap") {
      return item.status === "exact" || item.status === "partial";
    }
    if (filterMode === "conflict") {
      return item.status === "conflict";
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-zoom-in my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 md:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base md:text-lg tracking-tight text-white">
                  Slip Outcome Comparison
                </h3>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold uppercase tracking-wider">
                  Side-by-Side Analysis
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Comparing distributions, overlapping picks, and conflicting legs between 2 saved slips
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 text-slate-800">
          
          {/* Slips Overview Side-by-Side Header Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Slip A Card */}
            <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 p-4 rounded-xl border border-indigo-200/80 relative">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded border border-indigo-200">
                    Slip A (Reference)
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base mt-2">
                    {slipA.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                    <span className="font-mono font-bold text-indigo-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      MJP {slipA.subJackpotSize || 17}
                    </span>
                    <span className="bg-slate-200/70 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {slipA.strategy || "Custom Picks"}
                    </span>
                    <span className="font-mono font-black text-emerald-700">
                      Ksh {slipA.cost ? slipA.cost.toLocaleString() : "99"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onLoadSlip(slipA)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  Load Slip A <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Outcome Distribution Bar Slip A */}
              <div className="mt-4 pt-3 border-t border-indigo-100">
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Outcome Distribution (1 / X / 2):</span>
                  <span className="font-mono">
                    1: {comparisonData.distA["1"]} | X: {comparisonData.distA["X"]} | 2: {comparisonData.distA["2"]}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  {comparisonData.totalASelections > 0 && (
                    <>
                      <div 
                        style={{ width: `${(comparisonData.distA["1"] / comparisonData.totalASelections) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Home (1): ${comparisonData.distA["1"]}`}
                      />
                      <div 
                        style={{ width: `${(comparisonData.distA["X"] / comparisonData.totalASelections) * 100}%` }}
                        className="bg-amber-500 h-full"
                        title={`Draw (X): ${comparisonData.distA["X"]}`}
                      />
                      <div 
                        style={{ width: `${(comparisonData.distA["2"] / comparisonData.totalASelections) * 100}%` }}
                        className="bg-blue-500 h-full"
                        title={`Away (2): ${comparisonData.distA["2"]}`}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Slip B Card */}
            <div className="bg-gradient-to-br from-purple-50/80 to-slate-50 p-4 rounded-xl border border-purple-200/80 relative">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100/90 px-2 py-0.5 rounded border border-purple-200">
                    Slip B (Comparison)
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base mt-2">
                    {slipB.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                    <span className="font-mono font-bold text-purple-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      MJP {slipB.subJackpotSize || 17}
                    </span>
                    <span className="bg-slate-200/70 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {slipB.strategy || "Custom Picks"}
                    </span>
                    <span className="font-mono font-black text-emerald-700">
                      Ksh {slipB.cost ? slipB.cost.toLocaleString() : "99"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onLoadSlip(slipB)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  Load Slip B <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Outcome Distribution Bar Slip B */}
              <div className="mt-4 pt-3 border-t border-purple-100">
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Outcome Distribution (1 / X / 2):</span>
                  <span className="font-mono">
                    1: {comparisonData.distB["1"]} | X: {comparisonData.distB["X"]} | 2: {comparisonData.distB["2"]}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  {comparisonData.totalBSelections > 0 && (
                    <>
                      <div 
                        style={{ width: `${(comparisonData.distB["1"] / comparisonData.totalBSelections) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Home (1): ${comparisonData.distB["1"]}`}
                      />
                      <div 
                        style={{ width: `${(comparisonData.distB["X"] / comparisonData.totalBSelections) * 100}%` }}
                        className="bg-amber-500 h-full"
                        title={`Draw (X): ${comparisonData.distB["X"]}`}
                      />
                      <div 
                        style={{ width: `${(comparisonData.distB["2"] / comparisonData.totalBSelections) * 100}%` }}
                        className="bg-blue-500 h-full"
                        title={`Away (2): ${comparisonData.distB["2"]}`}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Key Metrics KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-indigo-600" /> Alignment Score
              </div>
              <div className="text-xl md:text-2xl font-black text-slate-900 font-mono mt-1">
                {comparisonData.overlapPercentage}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {comparisonData.exactMatches + comparisonData.partialOverlaps} of {comparisonData.activeEvaluated} games share picks
              </p>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
              <div className="text-[10px] font-extrabold uppercase text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Identical Picks
              </div>
              <div className="text-xl md:text-2xl font-black text-emerald-900 font-mono mt-1">
                {comparisonData.exactMatches}
              </div>
              <p className="text-[10px] text-emerald-700 mt-0.5">Exact same predictions in both</p>
            </div>

            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
              <div className="text-[10px] font-extrabold uppercase text-blue-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Shared / Double
              </div>
              <div className="text-xl md:text-2xl font-black text-blue-900 font-mono mt-1">
                {comparisonData.partialOverlaps}
              </div>
              <p className="text-[10px] text-blue-700 mt-0.5">Shared pick + extra coverage</p>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
              <div className="text-[10px] font-extrabold uppercase text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Conflicts (Hedge)
              </div>
              <div className="text-xl md:text-2xl font-black text-rose-900 font-mono mt-1">
                {comparisonData.conflicts}
              </div>
              <p className="text-[10px] text-rose-700 mt-0.5">Zero overlapping outcomes</p>
            </div>
          </div>

          {/* Table Section with Filter Controls */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Leg-by-Leg Selection Matrix ({filteredMatrix.length} Games)
                </h4>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    filterMode === "all"
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({comparisonData.matrix.length})
                </button>
                <button
                  onClick={() => setFilterMode("overlap")}
                  className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    filterMode === "overlap"
                      ? "bg-white text-emerald-800 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-emerald-700"
                  }`}
                >
                  Overlapping ({comparisonData.exactMatches + comparisonData.partialOverlaps})
                </button>
                <button
                  onClick={() => setFilterMode("conflict")}
                  className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    filterMode === "conflict"
                      ? "bg-white text-rose-800 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-rose-700"
                  }`}
                >
                  Conflicts ({comparisonData.conflicts})
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 select-none text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-16 text-center">Match</th>
                    <th className="py-2.5 px-4">Fixture / Teams</th>
                    <th className="py-2.5 px-3 text-center w-36 bg-indigo-50/50 text-indigo-950 font-black border-x border-indigo-100">
                      Slip A Picks
                    </th>
                    <th className="py-2.5 px-3 text-center w-32">Alignment</th>
                    <th className="py-2.5 px-3 text-center w-36 bg-purple-50/50 text-purple-950 font-black border-x border-purple-100">
                      Slip B Picks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        No matches found for the selected filter mode.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrix.map((item) => {
                      const { match, picksA, picksB, status } = item;
                      
                      return (
                        <tr key={match.match_no} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                            #{match.match_no}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900">
                              {match.home} <span className="text-slate-400 font-normal">vs</span> {match.away}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {match.kickoff || "Upcoming"} • {match.league || "SportPesa MJP"}
                            </div>
                          </td>

                          {/* Slip A Picks */}
                          <td className="py-3 px-3 text-center bg-indigo-50/20 border-x border-indigo-100/60 font-mono">
                            {picksA.length === 0 ? (
                              <span className="text-slate-300 italic text-[10px]">—</span>
                            ) : (
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {picksA.map((p) => (
                                  <span
                                    key={p}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs shadow-2xs ${
                                      p === "1"
                                        ? "bg-emerald-600 text-white"
                                        : p === "X"
                                        ? "bg-amber-500 text-white"
                                        : "bg-blue-600 text-white"
                                    }`}
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Comparison Status Badge */}
                          <td className="py-3 px-3 text-center">
                            {status === "exact" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-black text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Identical
                              </span>
                            )}
                            {status === "partial" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded-full font-black text-[10px]">
                                <Layers className="w-3 h-3 text-blue-600" /> Overlap
                              </span>
                            )}
                            {status === "conflict" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full font-black text-[10px]">
                                <AlertTriangle className="w-3 h-3 text-rose-600" /> Conflict
                              </span>
                            )}
                            {status === "none" && (
                              <span className="text-slate-300 font-mono text-[10px]">Unselected</span>
                            )}
                          </td>

                          {/* Slip B Picks */}
                          <td className="py-3 px-3 text-center bg-purple-50/20 border-x border-purple-100/60 font-mono">
                            {picksB.length === 0 ? (
                              <span className="text-slate-300 italic text-[10px]">—</span>
                            ) : (
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {picksB.map((p) => (
                                  <span
                                    key={p}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs shadow-2xs ${
                                      p === "1"
                                        ? "bg-emerald-600 text-white"
                                        : p === "X"
                                        ? "bg-amber-500 text-white"
                                        : "bg-blue-600 text-white"
                                    }`}
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 1 = Home
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> X = Draw
            </span>
            <span className="flex items-center gap-1 text-blue-700 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> 2 = Away
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Match } from "../types";
import { Sparkles, BrainCircuit, BarChart3, HelpCircle, ArrowRight, LineChart } from "lucide-react";
import { get24hDrop } from "./D3LineChart";
import TeamNameH2HCard from "./TeamNameH2HCard";
import FormSparkline from "./FormSparkline";

interface JackpotTableProps {
  matches: Match[];
  onSelectOutcome: (matchNo: string, outcome: string) => void;
  selections: Record<string, string[]>;
  onAnalyzeMatch: (match: Match) => void;
  activeAnalysisMatchNo: string | null;
  onOpenOddsTracker?: (matchNo?: string) => void;
}

export default function JackpotTable({
  matches,
  onSelectOutcome,
  selections,
  onAnalyzeMatch,
  activeAnalysisMatchNo,
  onOpenOddsTracker,
}: JackpotTableProps) {
  const getOutcomeClass = (matchNo: string, outcome: string, isSharp: boolean) => {
    const isSelected = selections[matchNo]?.includes(outcome);
    if (isSelected) {
      if (outcome === "1") {
        return "bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold border-emerald-700 shadow-md transform scale-102";
      } else if (outcome === "X") {
        return "bg-slate-700 hover:bg-slate-600 text-white font-extrabold border-slate-800 shadow-md transform scale-102";
      } else {
        return "bg-blue-600 hover:bg-blue-500 text-white font-extrabold border-blue-700 shadow-md transform scale-102";
      }
    }
    if (isSharp) {
      return "bg-amber-50/40 hover:bg-amber-100/60 text-slate-800 border-amber-300 shadow-3xs";
    }
    return "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/80";
  };

  const renderFormBadge = (formString: string) => {
    if (!formString) return null;
    return (
      <div className="flex gap-1 items-center">
        {formString.split("-").map((res, i) => {
          let bColor = "bg-slate-200 text-slate-600";
          if (res === "W") bColor = "bg-emerald-100 text-emerald-800 font-bold text-[10px]";
          if (res === "D") bColor = "bg-amber-100 text-amber-800 font-bold text-[10px]";
          if (res === "L") bColor = "bg-rose-100 text-rose-800 font-bold text-[10px]";
          return (
            <span
              key={i}
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-sans ${bColor}`}
              title={res === "W" ? "Win" : res === "D" ? "Draw" : "Loss"}
            >
              {res}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Table Header */}
      <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              17-Match Selection Grid
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Select outcomes below. Double click to play multiple results per match for compound slip coverage.
            </p>
          </div>
        </div>

        {/* Sharp Money Legend and Info */}
        <div className="flex items-center gap-2.5 bg-amber-50/70 border border-amber-200/60 px-3 py-1.5 rounded-lg text-left self-start sm:self-center shrink-0">
          <div className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-amber-800 text-[9px] uppercase block tracking-wider">Sharp Market Alert</span>
            <span className="text-[10px] text-amber-700 font-medium">Outcomes with &gt;10% odds drop in last 24h.</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="py-3 px-4 w-12 text-center">No.</th>
              <th className="py-3 px-4 w-44">Match & Schedule</th>
              <th className="py-3 px-4 min-w-[280px]">Teams & Form Guide</th>
              <th className="py-3 px-4 w-72 text-center">Prediction Outcomes (1, X, 2)</th>
              <th className="py-3 px-4 w-32 text-center">Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {matches.map((match) => {
              const isAnalyzing = activeAnalysisMatchNo === match.match_no;
              const hasSelections = selections[match.match_no]?.length > 0;

              // Check 24-hour historical odds drop for visual highlighting
              const d1 = get24hDrop(match.id, "1");
              const dX = get24hDrop(match.id, "X");
              const d2 = get24hDrop(match.id, "2");

              return (
                <tr
                  key={match.id}
                  className={`hover:bg-slate-50/50 transition-colors duration-150 ${
                    isAnalyzing ? "bg-emerald-50/30" : ""
                  }`}
                >
                  {/* Match Number */}
                  <td className="py-5 px-4 text-center">
                    <span className="inline-flex w-7 h-7 bg-slate-100 text-slate-700 rounded-full items-center justify-center font-mono text-xs font-bold border border-slate-200">
                      {match.match_no}
                    </span>
                  </td>

                  {/* Kickoff / League */}
                  <td className="py-5 px-4">
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded inline-block mb-1">
                      {match.league}
                    </div>
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      {match.kickoff}
                    </div>
                  </td>

                  {/* Teams / Rank / Form */}
                  <td className="py-5 px-4">
                    <div className="flex flex-col gap-2">
                      {/* Home Team */}
                      <div className="flex items-center justify-between md:justify-start gap-3">
                        <TeamNameH2HCard
                          teamName={match.home}
                          opponentName={match.away}
                          isHome={true}
                          h2hText={match.h2hText}
                          rank={match.homeRank}
                        />
                        <div className="flex items-center gap-2">
                          {match.homeRank && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                              Rank {match.homeRank}
                            </span>
                          )}
                          {match.homeForm && renderFormBadge(match.homeForm)}
                          {match.homeForm && (
                            <FormSparkline
                              formString={match.homeForm}
                              teamName={match.home}
                              strokeColor="#10b981"
                              width={64}
                              height={18}
                            />
                          )}
                        </div>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-between md:justify-start gap-3">
                        <TeamNameH2HCard
                          teamName={match.away}
                          opponentName={match.home}
                          isHome={false}
                          h2hText={match.h2hText}
                          rank={match.awayRank}
                        />
                        <div className="flex items-center gap-2">
                          {match.awayRank && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                              Rank {match.awayRank}
                            </span>
                          )}
                          {match.awayForm && renderFormBadge(match.awayForm)}
                          {match.awayForm && (
                            <FormSparkline
                              formString={match.awayForm}
                              teamName={match.away}
                              strokeColor="#6366f1"
                              width={64}
                              height={18}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Miniature stats bar */}
                    {match.predictionStats && (
                      <div className="mt-3 bg-slate-100/70 p-2 rounded-lg border border-slate-200/30 flex items-center gap-2 max-w-sm">
                        <BarChart3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono shrink-0">
                          Consensus
                        </span>
                        <div className="w-full flex h-2 rounded overflow-hidden text-[9px] font-mono font-bold text-white text-center select-none shadow-sm">
                          <div
                            style={{ width: `${match.predictionStats["1"]}%` }}
                            className="bg-emerald-500 flex items-center justify-center"
                            title={`Home Win: ${match.predictionStats["1"]}%`}
                          >
                            H
                          </div>
                          <div
                            style={{ width: `${match.predictionStats["X"]}%` }}
                            className="bg-slate-400 flex items-center justify-center"
                            title={`Draw: ${match.predictionStats["X"]}%`}
                          >
                            D
                          </div>
                          <div
                            style={{ width: `${match.predictionStats["2"]}%` }}
                            className="bg-blue-500 flex items-center justify-center"
                            title={`Away Win: ${match.predictionStats["2"]}%`}
                          >
                            A
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0">
                          {match.predictionStats["1"]}% | {match.predictionStats["X"]}% | {match.predictionStats["2"]}%
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Prediction Outcomes Buttons */}
                  <td className="py-5 px-4 text-center">
                    <div className="inline-grid grid-cols-3 gap-2.5 w-full max-w-xs justify-center mx-auto">
                      {/* Home Win (1) */}
                      <button
                        onClick={() => onSelectOutcome(match.match_no, "1")}
                        id={`outcome-btn-1-${match.match_no}`}
                        className={`relative py-3.5 px-2 border rounded-xl transition-all duration-150 min-h-[58px] cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
                          selections[match.match_no]?.includes("1")
                            ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white border-emerald-750 shadow-md shadow-emerald-600/10 scale-[1.03]"
                            : d1.isSharp
                            ? "bg-amber-50/65 hover:bg-amber-100/80 text-slate-800 border-amber-300 shadow-3xs"
                            : "bg-slate-50/60 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200"
                        }`}
                      >
                        <span className={`text-[9.5px] uppercase tracking-wider font-extrabold ${
                          selections[match.match_no]?.includes("1") ? "text-emerald-100" : "text-emerald-750 font-black"
                        }`}>
                          Home (1)
                        </span>
                        <span className={`text-sm font-mono font-black mt-0.5 ${
                          selections[match.match_no]?.includes("1") ? "text-white" : "text-slate-900"
                        }`}>
                          {match.odds["1"].toFixed(2)}
                        </span>
                        {d1.isSharp && (
                          <>
                            <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            <div className={`text-[8px] font-black px-1.5 py-0.2 rounded mt-0.5 scale-90 ${
                              selections[match.match_no]?.includes("1")
                                ? "text-white bg-emerald-800/80 border border-emerald-500/20"
                                : "text-amber-800 bg-amber-150 border border-amber-200"
                            }`}>
                              ▼{d1.percent.toFixed(1)}%
                            </div>
                          </>
                        )}
                      </button>

                      {/* Draw (X) */}
                      <button
                        onClick={() => onSelectOutcome(match.match_no, "X")}
                        id={`outcome-btn-X-${match.match_no}`}
                        className={`relative py-3.5 px-2 border rounded-xl transition-all duration-150 min-h-[58px] cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
                          selections[match.match_no]?.includes("X")
                            ? "bg-gradient-to-b from-slate-700 to-slate-800 text-white border-slate-850 shadow-md shadow-slate-650/10 scale-[1.03]"
                            : dX.isSharp
                            ? "bg-amber-50/65 hover:bg-amber-100/80 text-slate-800 border-amber-300 shadow-3xs"
                            : "bg-slate-50/60 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200"
                        }`}
                      >
                        <span className={`text-[9.5px] uppercase tracking-wider font-extrabold ${
                          selections[match.match_no]?.includes("X") ? "text-slate-200" : "text-slate-500 font-black"
                        }`}>
                          Draw (X)
                        </span>
                        <span className={`text-sm font-mono font-black mt-0.5 ${
                          selections[match.match_no]?.includes("X") ? "text-white" : "text-slate-900"
                        }`}>
                          {match.odds["X"].toFixed(2)}
                        </span>
                        {dX.isSharp && (
                          <>
                            <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            <div className={`text-[8px] font-black px-1.5 py-0.2 rounded mt-0.5 scale-90 ${
                              selections[match.match_no]?.includes("X")
                                ? "text-white bg-slate-900/80 border border-slate-700/20"
                                : "text-amber-850 bg-amber-150 border border-amber-200"
                            }`}>
                              ▼{dX.percent.toFixed(1)}%
                            </div>
                          </>
                        )}
                      </button>

                      {/* Away Win (2) */}
                      <button
                        onClick={() => onSelectOutcome(match.match_no, "2")}
                        id={`outcome-btn-2-${match.match_no}`}
                        className={`relative py-3.5 px-2 border rounded-xl transition-all duration-150 min-h-[58px] cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
                          selections[match.match_no]?.includes("2")
                            ? "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-750 shadow-md shadow-indigo-600/10 scale-[1.03]"
                            : d2.isSharp
                            ? "bg-amber-50/65 hover:bg-amber-100/80 text-slate-800 border-amber-300 shadow-3xs"
                            : "bg-slate-50/60 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200"
                        }`}
                      >
                        <span className={`text-[9.5px] uppercase tracking-wider font-extrabold ${
                          selections[match.match_no]?.includes("2") ? "text-indigo-150" : "text-indigo-600 font-black"
                        }`}>
                          Away (2)
                        </span>
                        <span className={`text-sm font-mono font-black mt-0.5 ${
                          selections[match.match_no]?.includes("2") ? "text-white" : "text-slate-900"
                        }`}>
                          {match.odds["2"].toFixed(2)}
                        </span>
                        {d2.isSharp && (
                          <>
                            <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            <div className={`text-[8px] font-black px-1.5 py-0.2 rounded mt-0.5 scale-90 ${
                              selections[match.match_no]?.includes("2")
                                ? "text-white bg-indigo-900/80 border border-indigo-500/20"
                                : "text-amber-850 bg-amber-150 border border-amber-200"
                            }`}>
                              ▼{d2.percent.toFixed(1)}%
                            </div>
                          </>
                        )}
                      </button>
                    </div>
                  </td>

                  {/* AI Analysis trigger & Odds Tracker */}
                  <td className="py-5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onAnalyzeMatch(match)}
                        id={`analyze-btn-${match.match_no}`}
                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 shadow-xs border cursor-pointer ${
                          isAnalyzing
                            ? "bg-slate-900 border-slate-900 text-white font-black"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200/50"
                        }`}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "text-amber-400 animate-pulse" : "text-emerald-600"}`} />
                        {isAnalyzing ? "Viewing" : "AI Intel"}
                      </button>

                      {onOpenOddsTracker && (
                        <button
                          onClick={() => onOpenOddsTracker(match.match_no)}
                          id={`odds-track-btn-${match.match_no}`}
                          className="inline-flex items-center gap-1 px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100/90 text-indigo-700 border border-indigo-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                          title={`Track publication to kickoff odds movement for Match #${match.match_no}`}
                        >
                          <LineChart className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="hidden xl:inline">Odds Flow</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Flame, Info, Check, Shield } from "lucide-react";

interface TeamStrengthHeatmapProps {
  homeTeam: string;
  awayTeam: string;
  homeRank?: number;
  awayRank?: number;
  standings?: Array<{
    position: number;
    team: string;
    played: number;
    points: number;
    form: string[];
  }>;
}

export const TeamStrengthHeatmap: React.FC<TeamStrengthHeatmapProps> = ({
  homeTeam,
  awayTeam,
  homeRank = 10,
  awayRank = 10,
  standings = [],
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  // 1. Attacking and Defensive tier descriptions
  const attackTiers = [
    { label: "Ultra Overload", desc: "Top 4 scoring capability (>2.2 goals/match)" },
    { label: "Potent Attack", desc: "Upper half attacking capability (1.5 - 2.2 goals/match)" },
    { label: "Normal Average", desc: "Balanced attacking capability (1.0 - 1.5 goals/match)" },
    { label: "Struggling", desc: "Lower half attacking threat (0.7 - 1.0 goals/match)" },
    { label: "Anaemic threat", desc: "Struggling to score (<0.7 goals/match)" },
  ];

  const defenceTiers = [
    { label: "Ironclad Lock", desc: "Conceding under 0.8 goals/match on average" },
    { label: "Resolute Unit", desc: "Conceding 0.8 - 1.2 goals/match on average" },
    { label: "Normal Middle", desc: "Conceding 1.2 - 1.6 goals/match on average" },
    { label: "Vulnerable", desc: "Conceding 1.6 - 2.0 goals/match on average" },
    { label: "Porous Defense", desc: "High leak rate (>2.0 goals/match)" },
  ];

  // 2. Map rank/form to attacking (row index 0-4) and defensive (col index 0-4)
  // Lower ranks (high team position e.g., 1-4) map to higher attack index 0, defensive index 0
  const getHomeAttackIndex = (rank: number): number => {
    if (rank <= 4) return 0; // Ultra Overload
    if (rank <= 8) return 1; // Potent Attack
    if (rank <= 13) return 2; // Normal
    if (rank <= 17) return 3; // Struggling
    return 4; // Anaemic
  };

  const getAwayDefenceIndex = (rank: number): number => {
    if (rank <= 4) return 0; // Ironclad
    if (rank <= 8) return 1; // Resolute
    if (rank <= 13) return 2; // Normal
    if (rank <= 17) return 3; // Vulnerable
    return 4; // Porous
  };

  const homeIdx = getHomeAttackIndex(homeRank || 10);
  const awayIdx = getAwayDefenceIndex(awayRank || 10);

  // 3. Grid cell values: predicted total goal potential, scoring style description, percentage
  const getCellStats = (r: number, c: number) => {
    // Attack levels: 0=High to 4=Low. Defence levels: 0=Strong to 4=Weak.
    // Combinations (r=attack, c=defense)
    const attackVal = 5 - r; // 5 (high) down to 1 (low)
    const defenceVal = c + 1; // 1 (strong defense) up to 5 (weak defense)
    
    // Joint parameter for scoring probability
    const composite = (attackVal * 1.1 + defenceVal * 0.9) / 2;
    // Expected goals
    const expectedGoals = (composite * 0.7).toFixed(2);
    
    // Label categories
    let style = "Low Scoring Edge";
    let colorClass = "bg-slate-50 text-slate-700";
    let badgeColor = "bg-slate-100 text-slate-500";

    if (composite >= 4.0) {
      style = "High Scoring Fest";
      colorClass = "bg-emerald-500 text-white hover:bg-emerald-600";
      badgeColor = "bg-emerald-100 text-emerald-800";
    } else if (composite >= 3.2) {
      style = "Moderate Attacking Advantage";
      colorClass = "bg-emerald-300 text-emerald-950 hover:bg-emerald-400";
      badgeColor = "bg-emerald-100/50 text-emerald-800";
    } else if (composite >= 2.4) {
      style = "Tactical Balanced Play";
      colorClass = "bg-amber-100 text-amber-900 hover:bg-amber-200";
      badgeColor = "bg-amber-200/50 text-amber-800";
    } else if (composite >= 1.6) {
      style = "Low Scoring Edge";
      colorClass = "bg-rose-100 text-rose-800 hover:bg-rose-200";
      badgeColor = "bg-rose-200/50 text-rose-950";
    } else {
      style = "Defensive Standoff";
      colorClass = "bg-rose-300 text-rose-950 hover:bg-rose-400";
      badgeColor = "bg-rose-200 text-rose-900";
    }

    return {
      expectedGoals,
      style,
      colorClass,
      badgeColor,
    };
  };

  const currentMatchCellDetails = getCellStats(homeIdx, awayIdx);

  return (
    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150 text-left font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">
            Team Strength heat map
          </span>
        </div>
        <span className="text-[8px] bg-emerald-50 text-emerald-700 font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
          Standings Correlation matrix
        </span>
      </div>

      <p className="text-[10px] text-slate-500 leading-normal">
        Displays attacking potency (Home) vs defensive leakage (Away) derived from active league rankings. Emerald blocks denote high goal combinations, while rose represents low scoring matchups.
      </p>

      {/* Actual Selected Match Position Display */}
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-3xs flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div>
          <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-700 block">
            MATCH FIXTURE CORRELATION
          </span>
          <p className="font-bold text-slate-800 text-2xs mt-0.5">
            {homeTeam} (Rank #{homeRank}) vs {awayTeam} (Rank #{awayRank})
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono text-2xs font-extrabold text-emerald-800">
              {currentMatchCellDetails.expectedGoals} Exp. Goals
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono block mt-1">
            ({currentMatchCellDetails.style})
          </span>
        </div>
      </div>

      {/* The 5x5 Grid */}
      <div className="space-y-2">
        {/* Columns Header (Away Defensive resistance) */}
        <div className="grid grid-cols-6 gap-1 group">
          <div className="text-[9px] font-extrabold text-slate-400 font-mono pr-1 flex items-center justify-end select-none">
            Attack / Def
          </div>
          {defenceTiers.map((t, idx) => (
            <div 
              key={idx} 
              className={`text-[8.5px] font-bold text-slate-600 text-center truncate py-1 rounded transition-all select-none ${
                idx === awayIdx ? "bg-indigo-50 text-indigo-700 border border-indigo-200/50" : "text-slate-400"
              }`}
              title={t.desc}
            >
              Def {idx + 1}
            </div>
          ))}
        </div>

        {/* Rows with grid data */}
        <div className="space-y-1">
          {attackTiers.map((rowTier, r) => {
            const isHomeSelectedRow = r === homeIdx;
            return (
              <div key={r} className="grid grid-cols-6 gap-1">
                {/* Row Header (Home Attacking Potential) */}
                <div 
                  className={`text-[8.5px] font-bold text-right pr-2 flex items-center justify-end select-none ${
                    isHomeSelectedRow ? "text-emerald-700 font-extrabold" : "text-slate-400"
                  }`}
                  title={rowTier.desc}
                >
                  Atk {r + 1}
                </div>

                {/* The 5 cells */}
                {[0, 1, 2, 3, 4].map((c) => {
                  const stats = getCellStats(r, c);
                  const isCurrentMatchCell = r === homeIdx && c === awayIdx;
                  const isHovered = hoveredCell && hoveredCell.r === r && hoveredCell.c === c;

                  return (
                    <button
                      key={c}
                      type="button"
                      onMouseEnter={() => setHoveredCell({ r, c })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-9 font-mono text-[10px] rounded transition-all duration-150 flex flex-col items-center justify-center p-0.5 border cursor-pointer select-none ${
                        stats.colorClass
                      } ${
                        isCurrentMatchCell
                          ? "ring-2 ring-indigo-600/80 ring-offset-2 scale-103 z-10 border-indigo-700"
                          : "border-transparent"
                      } ${isHovered ? "brightness-95 scale-102" : ""}`}
                      title={`${attackTiers[r].label} vs ${defenceTiers[c].label}: ${stats.expectedGoals} Exp Goals`}
                    >
                      <span className="font-extrabold">{stats.expectedGoals}</span>
                      {isCurrentMatchCell && (
                        <span className="text-[7px] uppercase font-black tracking-tight leading-none text-indigo-900 bg-white/70 px-0.5 rounded mt-0.5">
                          LIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row / Col Definitions Details Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[8.5px] text-slate-400 font-mono bg-white p-2 border border-slate-150 rounded">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded inline-block" />
          <span>Atk Potent vs Port Def (Overs/High Goals)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-rose-300 rounded inline-block" />
          <span>Atk Anaemic vs Port Lock (Standoff/Low Goals)</span>
        </div>
      </div>

      {/* Active Heatmap Details Box */}
      {hoveredCell !== null && (
        <div className="bg-indigo-950 text-white rounded-lg p-3 text-[10px] space-y-1.5 animate-fade-in border border-indigo-900">
          <div className="flex justify-between font-bold text-indigo-200">
            <span>Cell Correlation: Atk {hoveredCell.r + 1} × Def {hoveredCell.c + 1}</span>
            <span className="font-mono text-emerald-400">
              {getCellStats(hoveredCell.r, hoveredCell.c).expectedGoals} Expected Goals
            </span>
          </div>
          <p className="text-slate-300">
            <strong>Matchup Potency Style:</strong> {getCellStats(hoveredCell.r, hoveredCell.c).style}
          </p>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400 pt-1.5 border-t border-indigo-800">
            <div>
              <span className="block text-indigo-300 font-bold uppercase">HOME ATTACK TIER</span>
              <span>{attackTiers[hoveredCell.r].label}</span>
            </div>
            <div>
              <span className="block text-indigo-300 font-bold uppercase">AWAY DEF TIER</span>
              <span>{defenceTiers[hoveredCell.c].label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
